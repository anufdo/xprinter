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
