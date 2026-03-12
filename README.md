**Project Overview**

This repo implements a small Node.js service that exposes an SSE chat-style endpoint (`/stream/ask`) which answers owner queries about an upstream gold-store application (https://tkmputri.goldstore.id). The server fetches structured reports from upstream APIs, formats answers in Indonesian, and streams them to the client. When backend data is not available the server falls back to a model (Ollama) stream.

**Architecture**

- **Server:** Express-based Node.js app (root `server.js`) that:
  - Detects question intent (stock, penjualan, pembelian, hutang, service, cash/non-cash, margin, marketplace, per-sales)
  - Calls small function modules (`function_*.js`) which wrap upstream API calls and aggregation logic
  - Builds server-side final answers when backend data is available, and otherwise falls back to the model stream
  - Exposes diagnostic endpoints (`/test/all`, `/debug/call`)

- **Functions:** `func_declaration.js` registers functions implemented in files such as `function_get.js`, `function_penjualan.js`, `function_hutang.js`, `function_pembelian.js`, `function_penjualan_sales.js`, `function_reportcash.js`, `function_reportnoncash.js`, `function_service.js`, `function_margin.js`.

- **Frontend:** `nava-fe` contains a Vite React app. The chat component uses EventSource to connect to `/stream/ask` and may append a `?token=` query param from `localStorage.TKM_TOKEN`.

**Important Endpoints (server)**

- `POST /getitem` — programmatic single-call for stock (calls `getItem`).
- `POST /getpenjualan` — programmatic penjualan totals (calls `getPenjualanAnnual`).
- `GET /stream/ask` — SSE chat endpoint (primary interface for chatbot clients).
- `GET /test/all` — diagnostic endpoint that invokes all `get*` functions once (useful for verifying token/session).
- `GET /debug/call?fn=...` — call a single registered function for debugging and view full result or error stack.

**Upstream API mappings (summary)**

- `getItem`         -> `/api/v1/barang/get/saldobarang`
- `getPenjualanAnnual` -> `/api/v1/penjualan/get/report`
- `getMarginPenjualan` -> `/api/v1/penjualan/reports-margin-penjualan`
- `getPenjualanMarketplace` -> `/api/v1/penjualan/report-marketplaces`
- `getPenjualanSales` -> `/api/v1/penjualan/get/reportsales` or related
- `getPembelian` / `getPembelianSales` -> `/api/v1/pembelian/get/report` and `/get/reportsales`
- `getService` -> `/api/v1/service/get/report`
- `getHutang` / `getHutangLunas` -> `/api/v1/hutang/get/report` and `/get/reportlunas`
- `getReportCash` -> `/api/v1/reportcash/rekap`
- `getReportNonCash` -> `/api/v1/report-non-cash`

**Token & Auth Rules**

- Upstream accepts authentication in multiple forms. Current server behavior (resolution order):
  1. `x-auth-token` HTTP header (preferred if present)
  2. `?token=` query parameter
  3. Environment variable `TKM_TOKEN` (fallback; useful for local dev/CI)
- The server forwards relevant request headers where possible: `cookie`, `referer`, and `origin` to preserve session context.
- Recommendation: prefer passing the token from the client (either `?token=` or `x-auth-token`) so the server uses the same session as the logged-in browser. If you set `TKM_TOKEN` in `.env` the server will use it automatically after restart.

How to extract a valid token from the browser after login to https://tkmputri.goldstore.id:

- Open DevTools → Network → perform an API call and inspect request query or headers for `token=` or `x-auth-token`.
- Or DevTools → Application → Local Storage / Cookies — look for `TKM_TOKEN`, `token`, `userdata` etc.

Security note: do not share tokens in public places; prefer ephemeral tokens or revoke them after debugging.

**SSE and Model Streaming — Behavior & Warnings**

- SSE (`/stream/ask`) streams events to the client. The server will try to answer from backend data first — if structured data is available the server now sends a single deterministic final sentence and ends the SSE stream without calling the model.
- If backend data is not available the server falls back to the model (Ollama) and streams model tokens via SSE.
- Partial token issue: If the server both forwards model streams and writes server-side answers, partial model tokens (e.g., `Ma`, `S`) may interleave before the server writes the final line, producing stray fragments. To avoid this we implemented:
  - Server-side final-answer-first policy for known report types (stock, penjualan, pembelian, hutang, hutang_lunas, service, report_cash, report_non_cash, margin_penjualan, penjualan_marketplace, penjualan_sales).
  - `safeCall` wrapper: if upstream returns 400/401 the server writes a clear SSE error message and ends the stream.
- If you want a model-based paraphrase of the backend answer, change flow to: 1) server sends backend answer, 2) client requests a paraphrase (separate action), or 3) buffer the model output server-side and forward only complete segments — buffering increases complexity and latency.

**Debugging & Logs**

- Server debug log: `/tmp/sse_debug.log` (masked token previews). Contains per-function request/result entries and forwarded-header summaries.
- Use `GET /test/all?token=PASTE_TOKEN` to exercise all functions with a valid token.
- Use `GET /debug/call?fn=getItem` to call a single function and inspect full JSON.
- Restart server after updating `.env` or related code:

```bash
lsof -ti tcp:3001 | xargs -r kill -9 || true
node server.js
```

**Frontend notes**

- `nava-fe/src/components/ChatContainer.tsx` creates an `EventSource` to `/stream/ask`. Because browsers cannot set custom headers on EventSource, the frontend app appends `?token=` (from `localStorage.TKM_TOKEN`) and uses `withCredentials` for cookies.
- If you prefer header-based tokens, use an XHR/Fetch proxy or server-sent-to-server approach.

**Run & Verify quickly**

1. Set `TKM_TOKEN` in `.env` or pass `?token=PASTE_TOKEN`.
2. Start server: `node server.js` (or `npm run dev` if configured).
3. Diagnostic: `curl -sS "http://localhost:3001/test/all?token=PASTE_TOKEN" | jq` (install `jq` for pretty JSON).
4. SSE sample: `curl -sN -G --data-urlencode "question=berapa penjualan kemarin" "http://localhost:3001/stream/ask?token=PASTE_TOKEN"`

**Where to edit next**

- Toggle env fallback: remove `process.env.TKM_TOKEN` as fallback in `server.js` if you want to strictly require client tokens.
- Buffering model output: implement server-side buffering if you want to stream model paraphrases reliably.

---
Generated by the project maintainer tools — keep this README in sync with `server.js` and `function_*.js`.
