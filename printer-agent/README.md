# Printer Agent

Node.js + TypeScript ESC/POS proxy for an XPrinter 801C (or compatible) on the local LAN. Accepts JSON receipts over HTTP and streams ESC/POS bytes via raw TCP to the printer.

## Setup

```bash
cp .env.example .env
# update PRINTER_IP / PRINTER_PORT for your printer
pnpm install
pnpm dev
```

The agent listens on `AGENT_PORT` (default `3001`).

### Enabling HTTPS on your LAN

Some browsers require HTTPS to access LAN devices. You can secure the agent by
providing TLS certificate and key files via the `AGENT_TLS_CERT` and
`AGENT_TLS_KEY` environment variables. Each value can either be the filesystem
path to the PEM file or the PEM contents themselves. When both variables are
present the agent automatically serves over HTTPS on `AGENT_PORT`.

You can obtain a trusted certificate in a few different ways:

- **Self-signed for your LAN** – create a root CA (`openssl req -x509 ...`),
  install it on your devices, then generate a certificate for the agent's LAN
  hostname/IP signed by that CA.
- **[mkcert](https://github.com/FiloSottile/mkcert)** – installs a local CA and
  generates trusted certificates with a single command,
  e.g. `mkcert 192.168.1.50 localhost`.
- **HTTPS tunnel/reverse proxy** – use a tool like
  [ngrok](https://ngrok.com/) or Cloudflare Tunnel to terminate HTTPS remotely
  and forward traffic to the agent.

After you have certificate files, update `printer-agent/.env` (or environment
variables in your process manager) with:

```
AGENT_TLS_CERT=/path/to/agent-cert.pem
AGENT_TLS_KEY=/path/to/agent-key.pem
```

Finally, point any clients (e.g. the Next.js app) at the secure endpoint by
setting `NEXT_PUBLIC_AGENT_URL=https://<LAN_IP>:<port>/print` in the frontend's
environment configuration.

## Endpoints

- `GET /health` – quick status check and configured printer target.
- `POST /print` – send a receipt. Payload:

```json
{
  "lines": [
    { "text": "Hello", "align": "center", "bold": true, "doubleSize": true },
    { "text": "Thank you!" }
  ],
  "cut": true
}
```

### Test from CLI

```bash
curl -X POST http://localhost:3001/print \
  -H "Content-Type: application/json" \
  -d '{"lines":[{"text":"Hello XPrinter 801C","align":"center","bold":true,"doubleSize":true},{"text":"Thank you!"}],"cut":true}'
```

If the printer rejects extended characters, adjust the code page or encoding in `src/index.ts`.
