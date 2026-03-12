nava-expert-nagagold

Run locally
---------

1. Copy env examples:

```bash
cp .env.example .env
cp nava-be/.env.example nava-be/.env
```

2. Install dependencies (root will install FE deps; backend has its own):

```bash
npm install
npm --prefix nava-be install
```

3. Run both frontend and backend concurrently (development):

```bash
npm run dev
```

Notes
- Frontend reads backend base URL from `VITE_API_URL` (default in .env.example is http://localhost:3000).
- Backend exposes SSE streaming endpoint at `/stream/ask` and POST endpoint at `/ask`.

Backend remote API integration
- New env vars available for configuring remote API and optional auto-login (add to `nava-be/.env`):
	- `REMOTE_DOMAIN` — base URL for remote API (e.g. https://api.example.com). Defaults to legacy IP if unset.
	- `REMOTE_LOGIN_PATH` — optional login endpoint path (e.g. `/api/v1/auth/login`).
	- `REMOTE_USERNAME` / `REMOTE_PASSWORD` — credentials used for optional auto-login at server start.

The backend now centralizes remote domain and authentication in `nava-be/config/domains.js` and `nava-be/apiClient.js`.
If `REMOTE_LOGIN_PATH`/credentials are provided, the server attempts a non-blocking auto-login at startup. The login endpoint should either return a JSON `{ token: '...' }` or set an auth cookie; the client will use the token as `Authorization: Bearer <token>` if present and will send cookies when applicable.

Background image
- To use the Freepik robot background, download the image and place it at public/robot.png.
- Make sure you comply with Freepik's license and include attribution if required. Source: https://www.freepik.com/free-vector/graident-ai-robot-vectorart_125887871.htm
