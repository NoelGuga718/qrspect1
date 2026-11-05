# Quick start

In PowerShell, from the project folder:

```powershell
npm install
Copy-Item .env.local.example .env.local
Copy-Item .env.server.example .env.server
npm run dev:all
```

Open `http://localhost:5173`. No API key is needed for link checks, QR scanning, guest mode, or browser-local scan history.

To opt into local Gemini analysis, enter the key only in `.env.server`, set `VITE_GEMINI_ENABLED=true` in `.env.local`, and restart the app. Never commit either local environment file.

For Netlify, deploy with `npm run build` and publish `dist`; built-in scanning works without secrets.
