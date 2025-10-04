"use client";

import { useState } from "react";

type PrintStatus = "idle" | "sending" | "printed" | "error";

export default function PrintPage() {
  const [status, setStatus] = useState<PrintStatus>("idle");
  const [error, setError] = useState<string>("");

  async function printTest() {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: [
            { text: "Triton POS", align: "center", bold: true, doubleSize: true },
            { text: "Hello XPrinter 801C", align: "center" },
            { text: "" },
            { text: "Thank you!", align: "center" }
          ],
          cut: true
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json.error || res.statusText);
        return;
      }
      setStatus("printed");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus("error");
      setError(message);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Print Test</h1>
      <p style={{ marginTop: 8 }}>
        This sends a print job to the <code>printer-agent</code> running on the LAN device.
      </p>
      <button onClick={printTest} style={{ padding: "8px 12px", marginTop: 12 }}>
        Print Test Receipt
      </button>
      <div style={{ marginTop: 12 }}>Status: {status}</div>
      {error && <pre style={{ marginTop: 8, color: "crimson" }}>{error}</pre>}
    </main>
  );
}
