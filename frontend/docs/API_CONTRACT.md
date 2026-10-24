# NOVA frontend API contract

This document defines the HTTP interface consumed by the frontend. The frontend expects JSON unless an endpoint is explicitly marked SSE or multipart. All IDs are opaque strings; timestamps are ISO 8601 UTC strings.

## Common conventions

- Base URL: `NEXT_PUBLIC_API_URL` (set in the frontend environment; the API origin is not embedded in application code).
- All routes below are prefixed with `/api`.
- Authenticated routes require the session cookie described under Authentication. `POST /auth/login`, `POST /auth/register`, and `GET /auth/me` are used to establish/check the current session; logout requires the session.
- JSON request and response bodies use `Content-Type: application/json` and UTF-8.
- Lists are plain JSON arrays, not `{ "items": [...] }` wrappers.
- Empty successful responses use `204 No Content`.
- The frontend reads errors as `{ "detail": "Human-readable message", "code": "optional_stable_code" }`; `detail` may also be an object containing `message`. Use the HTTP status as the authoritative classification. Validation errors may be `422`.
- All endpoints must enforce resource ownership/authorization server-side. Do not trust IDs, agent/model/tool selections, file IDs, connector state, or approval values from the browser.

## Authentication and current user

### `POST /auth/register`

Creates the account and establishes a session.

Request:

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "..." }
```

Response `201`:

```json
{ "id": "user_123", "name": "Ada Lovelace", "email": "ada@example.com", "avatar_url": null }
```

### `POST /auth/login`

Authenticates and establishes a session. Request is `{ "email": "...", "password": "..." }`. Response `200` is the `User` object above.

### `POST /auth/logout`

Invalidates the session and clears the cookie. Response `204`.

### `GET /auth/me`

Returns the authenticated `User`: `{ "id": "...", "name": "...", "email": "...", "avatar_url": null }`. Return `401` if no valid session exists. The frontend uses this during protected-route startup and does not treat network errors as signed-out sessions.

**Session requirements:** set an `HttpOnly` cookie, use `Secure` in HTTPS deployments, choose a suitable `SameSite` setting, and scope it to `/`. API requests and EventSource connections include cookies. Do not require a browser-readable long-lived token. Protect cookie-authenticated mutations from CSRF (Origin validation and/or a CSRF token). Credentialed CORS must allow explicit frontend origins, not `*`.

## Chat, history, agent events, and approvals

### `GET /chats`

Lists the authenticated user's non-archived conversations, sorted by `updated_at` descending. Response is `Chat[]`:

```json
[
  {
    "id": "chat_123",
    "title": "Architecture review",
    "created_at": "2026-09-28T12:00:00Z",
    "updated_at": "2026-09-28T12:05:00Z",
    "pinned": false,
    "archived": false
  }
]
```

### `GET /chats/{chat_id}`

Returns `ChatDetail`: the `Chat` fields above plus `"messages": ChatMessage[]` and optional `"active_run_id"` (`null` when no run is active). A `ChatMessage` is `{ "id": "...", "role": "user" | "assistant", "content": "...", "created_at": "ISO-8601", "sources": [Source] }`; `sources` may be omitted. A `Source` is `{ "id": "...", "title": "...", "meta": "optional display text", "url": "optional URL" }`. Return `404` for an unknown or unauthorized conversation. If a run is still active, provide its ID so the frontend can reconnect to its event stream.

### `POST /chat`

Starts a run, creates a conversation if `chat_id` is omitted, and stores the user message. Request:

```json
{
  "message": "Summarize these documents",
  "chat_id": "optional_chat_id",
  "project_id": "optional_project_id (for a new project conversation)",
  "agent_id": "optional_agent_id",
  "model_id": "optional_model_id",
  "mode": "Chat",
  "tool_ids": ["tool_id"],
  "connector_ids": ["connector_id"],
  "file_ids": ["file_id"]
}
```

`mode` is `"Chat"` or `"Research"`; optional IDs may be omitted. `project_id` is used only when creating a new conversation and associates it with that owned project. Response `202`:

```json
{ "chat_id": "chat_123", "run_id": "run_456" }
```

Validate that the selected agent, model, tools, connectors, and uploaded files are available to this user.

### `GET /chat/{chat_id}/stream?run_id={run_id}` (SSE)

Returns `200 text/event-stream`; each event is sent as an SSE `data:` line containing one JSON `AgentEvent`. The requested `run_id` must belong to `chat_id`. Give each SSE event a monotonically increasing `id:` and honor `Last-Event-ID` so browser reconnects do not lose or duplicate deltas. Send a `run_complete` event before ending a successful run; send `error` and then close for a terminal run failure. The browser authenticates this endpoint using the session cookie.

Every event has `"type"` and `"run_id"`. Supported event objects:

```json
{ "type": "run_start", "run_id": "run_456", "message": "Run started" }
{ "type": "agent_start", "run_id": "run_456", "agent": "Planner", "message": "Planning" }
{ "type": "agent_end", "run_id": "run_456", "agent": "Planner", "message": "Finished" }
{ "type": "tool_start", "run_id": "run_456", "agent": "Research", "tool": "web_search", "message": "Searching" }
{ "type": "tool_end", "run_id": "run_456", "agent": "Research", "tool": "web_search", "message": "Search finished" }
{ "type": "message_delta", "run_id": "run_456", "delta": "response text" }
{
  "type": "human_approval_required",
  "run_id": "run_456",
  "approval": {
    "id": "approval_789",
    "title": "Approve action",
    "description": "Review the requested action.",
    "action": "Create issue",
    "fields": [{ "label": "Issue title", "type": "text" }]
  }
}
{ "type": "error", "run_id": "run_456", "message": "Safe user-facing error" }
{ "type": "run_complete", "run_id": "run_456", "message": "Run complete" }
```

Approval `fields` is optional; each field has a `label`, `type` (`"text"` or `"select"`), and optional string-array `options`.

### `POST /chat/{chat_id}/cancel`

Requests cancellation of a run for this conversation. Request `{ "run_id": "run_456" }`. Response `204`. Emit a terminal stream event when cancellation has completed.

### `POST /approvals/{approval_id}`

Submits the user's decision and resumes/cancels the associated run. Request:

```json
{ "approved": true, "values": { "Issue title": "Fix sign-in" } }
```

`values` maps approval field labels to strings and may be empty. Response `204`. Reject stale, already-resolved, or unauthorized approvals with an appropriate `409` or `404`.

## Agents, models, tools, and connectors

### `GET /agents`

Returns `Agent[]`: `{ "id": "...", "name": "...", "description": "optional" }`.

### `GET /models`

Returns `Model[]` with the same shape as `Agent`.

### `GET /tools`

Returns `Tool[]`: `{ "id": "...", "name": "...", "description": "optional", "enabled": true }`.

### `GET /connectors`

Returns the user's configured/available `Connector[]`:

```json
{
  "id": "connector_123",
  "name": "Git provider",
  "description": "Repository access",
  "status": "connected",
  "enabled": true,
  "tools": ["search_repositories"],
  "permissions": ["Read repositories"],
  "authorization_url": null
}
```

Allowed status values: `"connected"`, `"disconnected"`, `"connecting"`, `"error"`. `authorization_url` is optional and non-null when the user must complete an external OAuth flow.

### `GET /connectors/catalog`

Returns `Connector[]` entries that can be added/connected. Same shape as above.

### `POST /connectors/{connector_id}/connect`

Starts a connector connection. Request `{}`. Response `200` is the updated `Connector`; include `authorization_url` when browser redirection is needed.

### `POST /connectors/{connector_id}/disconnect`

Disconnects an existing connection. Request `{}`. Response `200` is the updated `Connector`.

### `PATCH /connectors/{connector_id}`

Updates whether a connected connector is enabled for agent use. Request `{ "enabled": true }`. Response `200` is the updated `Connector`.

### `DELETE /connectors/{connector_id}`

Removes the user's connector configuration. Response `204`.

## Projects and files

### `GET /projects`

Returns `Project[]`: `{ "id": "...", "name": "...", "description": "...", "chats": 2, "files": 3, "instructions": "..." }`. `chats` and `files` are counts for this user's project.

### `POST /projects`

Creates a project. Request: `{ "name": "...", "description": "...", "instructions": "..." }`. Response `201` is a `Project`.

### `PATCH /projects/{project_id}`

Updates project metadata/instructions. The request may contain any subset of `{ "name": "...", "description": "...", "instructions": "..." }`. Response `200` is the updated `Project`.

### `POST /projects/{project_id}/chats`

Adds a conversation to a project. Request `{ "chat_id": "chat_123" }`. Response `204`.

### `GET /projects/{project_id}/chats`

Returns the project's `Chat[]`, using the same `Chat` response shape as `GET /chats`.

### `GET /projects/{project_id}/files`

Returns the project's `UploadedFile[]`, using the same response shape as `POST /files/upload`.

### `GET /projects/{project_id}/memory`

Returns the project's `Memory[]`, using the same response shape as `GET /memory`.

### `POST /files/upload` (multipart)

Uploads one file using multipart field `file`; optional multipart field `project_id` associates it with a project. Enforce size/type limits and authorize the project. Response `201`:

```json
{ "id": "file_123", "name": "notes.pdf", "size": 12345, "content_type": "application/pdf" }
```

The returned `id` is passed in a subsequent chat request's `file_ids`.

## Personalization and settings

### `GET /personalization`

Returns `Personalization`:

```json
{
  "instructions": "",
  "memory_enabled": true,
  "response_length": "Balanced",
  "tone": "Professional",
  "technical_depth": "Advanced",
  "language": "English"
}
```

Supported response-length values: `"Concise"`, `"Balanced"`, `"Detailed"`; tone: `"Professional"`, `"Friendly"`, `"Direct"`; technical depth: `"Simple"`, `"Advanced"`, `"Expert"`.

### `PUT /personalization`

Replaces the personalization object above. Request and response are both `Personalization`.

### `GET /memory`

Returns `Memory[]`: `{ "id": "...", "text": "...", "created_at": "ISO-8601" }`.

### `POST /memory`

Adds a memory. Request `{ "text": "..." }`. Response `201` is a `Memory`.

### `PATCH /memory/{memory_id}`

Updates a memory. Request `{ "text": "..." }`. Response `200` is the updated `Memory`.

### `DELETE /memory/{memory_id}`

Deletes one memory. Response `204`.

### `DELETE /memory`

Clears the current user's memories. Response `204`.

### `GET /settings`

Returns `AppSettings`:

```json
{
  "theme": "Dark",
  "accent_color": "#8ed8ff",
  "enter_to_send": true,
  "default_agent_id": null,
  "default_model_id": null,
  "chat_history_enabled": true,
  "product_improvement_enabled": false,
  "source_citations_enabled": true
}
```

Theme is `"Dark"`, `"Light"`, or `"System"`. Agent/model IDs may be `null`.

### `PUT /settings`

Replaces the settings object above. Request and response are both `AppSettings`. Validate selected agent/model IDs for the current user.

## Search

### `GET /search?q={query}`

Searches the authenticated user's accessible conversations, projects, and connectors. Response is `SearchResult[]`: `{ "id": "...", "title": "...", "type": "chat", "resource_id": "chat_123" }`. `type` is `"chat"`, `"project"`, or `"connector"`; `resource_id` is the ID the frontend uses to open the result. Empty queries are not submitted by the frontend.

## Endpoints not used

There is no separate activity-list endpoint: the activity panel renders the agent events from the chat SSE stream. Password reset/change, user-profile editing, file listing/downloading, and standalone approval listing are not exposed by the current UI and are not required by this contract.
