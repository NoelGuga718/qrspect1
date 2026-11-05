# Optional Gemini setup

Gemini analysis is disabled by default. The application remains usable with its built-in URL checks and does not need an API key.

For local development only:

1. Add your Gemini API key to `.env.server` as `GEMINI_API_KEY=your_key`.
2. Set `VITE_GEMINI_ENABLED=true` in `.env.local`.
3. Run `npm run dev:all` (or restart it if already running).

The Express proxy reads the key on the server. Never use `VITE_GEMINI_API_KEY`, paste the key into source code, or commit `.env.server`. The static Netlify deployment does not include this local Express server; leave Gemini disabled there unless you separately deploy a protected server-side endpoint.

If a key has ever been committed, revoke it in Google AI Studio and create a replacement.
