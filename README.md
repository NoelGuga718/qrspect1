# QRspect

QRspect is a React and Vite application for checking links and scanning QR codes. The main site opens at `/`; the scanner dashboard is at `/dashboard`.

## Run on your PC

Requirements: Node.js 20 or newer and npm.

```powershell
npm install
Copy-Item .env.local.example .env.local
Copy-Item .env.server.example .env.server
npm run dev:all
```

Open `http://localhost:5173`. Camera scanning requires HTTPS or localhost.

The app works without API keys: built-in URL checks run in the browser, and scan history is stored in that browser. Firebase sign-in/cloud history and Gemini analysis are optional.

## Optional Gemini analysis

The Gemini key must stay server-side:

1. Put your key in `.env.server` after `GEMINI_API_KEY=`.
2. Set `VITE_GEMINI_ENABLED=true` in `.env.local`.
3. Restart `npm run dev:all`.

Never put this key in a `VITE_` variable, source file, GitHub secret file, or browser code. The key is read by the local Express server. A Netlify static deploy does not run that Express server, so its scanner uses built-in checks unless a separate server-side Gemini function is deliberately deployed and configured.

## Optional Firebase

Firebase web configuration is a client-side identifier, not a private secret. Add your own `VITE_FIREBASE_*` settings to `.env.local` to enable Firebase features. Restrict its API key by HTTP referrer and configure Firestore security rules. Without Firebase configuration, the app uses local guest mode.

## Deploy to Netlify

The repository includes `netlify.toml`. Connect the repository in Netlify and use:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20

No API key or environment variable is required for the built-in scanner. Do not configure `VITE_GEMINI_ENABLED=true` on Netlify unless you also deploy a secure server-side endpoint.

## Keep local files private

`.env.local` and `.env.server` are ignored by Git. Before pushing, verify:

```powershell
git status --short
git check-ignore -v .env.local .env.server
```

Only the `.example` templates belong in GitHub. Firebase web keys are not secrets, but Gemini API keys and other server credentials are.
