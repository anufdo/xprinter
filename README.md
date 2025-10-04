# XPrinter ESC/POS Cloud-to-LAN Demo

End-to-end reference showing how a cloud-hosted Next.js 14 app can trigger receipt prints on a LAN-connected XPrinter 801C via a lightweight local agent.

## Structure

- `app/` – Next.js front end with `/print` UI and `/api/print` proxy
- `printer-agent/` – Node.js TypeScript service that translates JSON payloads into ESC/POS bytes sent over TCP

## Quick Start

```bash
# Terminal A – local print agent
cd printer-agent
cp .env.example .env   # set PRINTER_IP / PRINTER_PORT (usually 9100)
pnpm install
pnpm dev

# Terminal B – Next.js app (cloud mirror)
cd app
cp .env.local.example .env.local   # set NEXT_PUBLIC_AGENT_URL if agent not on localhost
pnpm install
pnpm dev
```

Then open http://localhost:3000/print and click **Print Test Receipt**.

## Troubleshooting

- Confirm the printer IP/port and that the POS machine can reach it over the network.
- If printouts show garbled characters, adjust the code page (`ESC t n`) or encoding in the agent.
- Start with plain ASCII receipts before layering on formatting.
- Extend the agent for advanced features (columns, barcodes `GS k`, QR `GS ( k`, raster images) as needed.

## Acceptance

- `GET http://localhost:3001/health` returns `{ "ok": true }` with printer target info.
- Clicking **Print Test Receipt** produces a bold, centered "Triton POS" header, "Hello XPrinter 801C", and a partial cut.
- UI surfaces any agent/printer errors clearly.
