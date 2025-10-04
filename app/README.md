# Next.js ESC/POS Demo

Front-end for triggering LAN receipt prints via a local printer agent.

## Getting Started

```bash
cp .env.local.example .env.local
pnpm install
pnpm dev
```

Visit http://localhost:3000/print and click **Print Test Receipt** to send a job through the proxy API route. Any errors from the agent (offline printer, network issues, etc.) are displayed inline on the page.
