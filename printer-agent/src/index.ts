import "dotenv/config";
import express from "express";
import cors from "cors";
import net from "net";
import https from "https";
import fs from "fs";

const app = express();

// allow your cloud origin + local dev
const allowed = [
  "http://localhost:3000",
  "https://xprinterlocalagent.netlify.app", // <-- your Netlify site
];
app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin/no-origin (e.g. curl or Postman)
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin));
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.123";
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100);
const AGENT_PORT = Number(process.env.AGENT_PORT || 3001);

function loadPEM(source: string) {
  if (fs.existsSync(source)) {
    return fs.readFileSync(source);
  }
  return source;
}

// --- ESC/POS byte helpers ---
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

type Line = {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  doubleSize?: boolean;
};

function pushAlign(buf: number[], a: Line["align"]) {
  const n = a === "center" ? 1 : a === "right" ? 2 : 0;
  buf.push(ESC, 0x61, n);
}

function pushBold(buf: number[], on: boolean) {
  buf.push(ESC, 0x45, on ? 1 : 0);
}

function pushDoubleSize(buf: number[], on: boolean) {
  // GS ! n ; n=0 normal; 0x11 => double width+height
  buf.push(GS, 0x21, on ? 0x11 : 0x00);
}

function textToBytes(s: string) {
  // Basic UTF-8 support; adjust encoding if printer expects a specific code page
  return Buffer.from(s, "utf8");
}

function buildReceipt(lines: Line[], opts?: { cut?: boolean }): Buffer {
  const out: number[] = [];

  // Initialize & default codepage
  out.push(ESC, 0x40); // init command
  out.push(ESC, 0x74, 0x00); // codepage 0 (CP437)

  for (const ln of lines) {
    pushAlign(out, ln.align);
    pushBold(out, !!ln.bold);
    pushDoubleSize(out, !!ln.doubleSize);

    const bytes = textToBytes(ln.text);
    for (const byte of bytes) out.push(byte);
    out.push(LF);

    // reset style after each line
    pushBold(out, false);
    pushDoubleSize(out, false);
  }

  // feed a bit
  out.push(LF, LF);

  if (opts?.cut !== false) {
    out.push(GS, 0x56, 0x01); // partial cut
  }

  return Buffer.from(out);
}

async function sendToPrinter(ip: string, port: number, payload: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    sock
      .once("error", (err) => {
        sock.destroy();
        reject(err);
      })
      .once("close", resolve)
      .connect(port, ip, () => {
        sock.write(payload);
        sock.end();
      });
  });
}

app.post("/print", async (req, res) => {
  try {
    const { lines, cut } = req.body as { lines?: Line[]; cut?: boolean };
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: "lines[] required" });
    }

    const payload = buildReceipt(lines, { cut });
    await sendToPrinter(PRINTER_IP, PRINTER_PORT, payload);

    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, printer: { ip: PRINTER_IP, port: PRINTER_PORT } });
});

const tlsCert = process.env.AGENT_TLS_CERT;
const tlsKey = process.env.AGENT_TLS_KEY;

if (tlsCert && tlsKey) {
  try {
    const server = https.createServer(
      {
        cert: loadPEM(tlsCert),
        key: loadPEM(tlsKey),
      },
      app
    );

    server.listen(AGENT_PORT, () => {
      console.log(
        `[agent] listening on https://localhost:${AGENT_PORT} → ${PRINTER_IP}:${PRINTER_PORT}`
      );
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[agent] Failed to start HTTPS server: ${message}`);
    process.exit(1);
  }
} else {
  app.listen(AGENT_PORT, () => {
    console.log(
      `[agent] listening on http://localhost:${AGENT_PORT} → ${PRINTER_IP}:${PRINTER_PORT}`
    );
  });
}
