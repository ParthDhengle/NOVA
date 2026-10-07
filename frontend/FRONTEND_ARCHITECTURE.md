# Frontend architecture

## Runtime

`app/page.tsx` composes the workspace and handles client-side navigation for chat, projects, connectors, personalization, and settings. The authenticated workspace is gated by `AuthProvider` and `AuthGate` in `components/auth/AuthProvider.tsx`.

## Boundaries

- `app/`: App Router entry point, root layout, global styles.
- `components/`: UI and user interactions; components call API services, not `fetch`.
- `lib/api/`: cookie-authenticated HTTP client, centralized request/response types, and domain services.
- `services/streaming/`: the shared agent-event parser and SSE/WebSocket transports.
- `docs/API_CONTRACT.md`: FastAPI request and response requirements.

All API calls use `NEXT_PUBLIC_API_URL`; session cookies are included centrally by the client. Streaming events are parsed before reaching the chat UI.

## Local development

Copy `.env.example` to `.env.local`, start the FastAPI service, and allow the frontend origin through credentialed CORS. Mock data and simulated responses are not included. See [FASTAPI_INTEGRATION.md](./FASTAPI_INTEGRATION.md) and [docs/API_CONTRACT.md](./docs/API_CONTRACT.md).
