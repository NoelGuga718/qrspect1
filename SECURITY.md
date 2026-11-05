# Security and configuration

## API keys

- The app has no required API keys.
- Gemini analysis is optional and disabled by default.
- For local Gemini use, store `GEMINI_API_KEY` in the ignored `.env.server`; it is read only by the Express server.
- Never prefix a Gemini key with `VITE_`. Vite variables are embedded in browser JavaScript.
- The static Netlify build has no Gemini backend by default. Keep `VITE_GEMINI_ENABLED=false` there.

## Firebase

Firebase web API keys identify a client project; they are not server secrets. Keep configuration in local `.env.local` if desired, restrict the key to your domains, and secure Firestore with rules. Without Firebase configuration, guest authentication and scan history work locally in the browser.

## Before making a repository public

1. Confirm `.env.local` and `.env.server` are ignored:
   ```powershell
   git check-ignore -v .env.local .env.server
   ```
2. Check both staged and unstaged changes:
   ```powershell
   git status --short
   git diff --cached --check
   ```
3. Search the current source for accidental credentials. A clean current tree does not erase credentials from earlier commits; revoke any real secret that was ever committed.

No scanner can guarantee a URL is safe. Treat results as guidance and avoid opening suspicious links.
