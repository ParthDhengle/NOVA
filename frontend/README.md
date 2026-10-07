# NOVA agentic workspace

A Next.js + TypeScript frontend for authenticated agentic chat, projects, connectors, personalization, settings, search, approvals, and file uploads.

## Run locally

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` (copy `.env.example`) and run the FastAPI service separately. The frontend has no demo-data mode and requires backend authentication and API endpoints.

## API architecture

- `lib/api/client.ts` centralizes credentialed requests and API errors.
- `lib/api/` contains typed services and contracts by domain.
- `services/streaming/` parses and transports agent events over SSE (with a reusable WebSocket adapter).
- `docs/API_CONTRACT.md` is the complete backend contract.
- `FASTAPI_INTEGRATION.md` describes session and CORS setup.

## Build

```bash
npm run build
```
