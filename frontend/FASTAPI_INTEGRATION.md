# FastAPI integration

Configure `NEXT_PUBLIC_API_URL` in `.env.local` using the API origin for the current environment. `.env.example` contains the local development value. There is no mock-data mode; the frontend requires a working API.

Implement the endpoints, JSON shapes, cookie session, and SSE event protocol in [docs/API_CONTRACT.md](./docs/API_CONTRACT.md). The shared request client is in `lib/api/client.ts`; typed domain operations are in `lib/api/`; chat events use the existing SSE adapter under `services/streaming/`.

## CORS and sessions

- Allow the exact frontend origins and `allow_credentials=True`; do not combine credentials with wildcard origins.
- Set an `HttpOnly` session cookie on login and registration; clear it on logout. Use `Secure` in HTTPS deployments and an appropriate `SameSite` policy.
- The browser sends cookies on API requests and the SSE connection. No access token is stored in browser storage.
- Protect cookie-authenticated mutations against CSRF (for example, validate `Origin` and/or use a CSRF token).
- Return `401` for an expired or missing session and a JSON error body for API errors.

## Event streaming

`GET /api/chat/{chat_id}/stream` emits UTF-8 `text/event-stream`. Each SSE `data:` payload is a JSON `AgentEvent` described in the contract. Include `run_id` on every event. Send `run_complete` when execution ends; emit `error` for a user-safe failure. The browser reconnects on transient SSE interruptions and closes the stream when a run completes or the user stops it.
