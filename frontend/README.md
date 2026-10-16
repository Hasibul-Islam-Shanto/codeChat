# CodeChat frontend

Static HTML/JS client for the CodeChat API. Serve this folder over HTTP (do not open `index.html` as a `file://` URL).

## Local development

1. Start the backend on port **5001** (see `backend/`).
2. Serve the frontend from any local port, for example:

   ```bash
   npx --yes serve frontend -p 5500
   ```

3. Open `http://localhost:5500` (or `http://127.0.0.1:5500`).

The API client defaults to `http://<same-hostname-as-page>:5001/api`. If the API runs elsewhere, set this before loading the app:

```html
<script>window.CODECHAT_API_URL = 'http://localhost:5001/api';</script>
```

## CORS and cookies

The backend must allow your frontend origin with credentials:

- In **development**, any `http://localhost:*` or `http://127.0.0.1:*` origin is accepted automatically.
- In **production**, set `CORS_ORIGIN` in the backend `.env` to the exact frontend URL (scheme, host, and port), for example `https://app.example.com`.

`CORS_ORIGIN` in `.env.example` is only a default; change it to match wherever you serve this folder.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Main chat workspace (requires session cookie) |
| `auth.html` | Sign in / sign up |
| `preview.html` | Markdown rendering checks (dev) |
