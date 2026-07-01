# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single product: `joepatbob.com`, a static Vite 8 + React 18 + TypeScript
portfolio site (Three.js / react-three-fiber for the 3D content). There is no database
and no other backend service. Package manager is npm (`package-lock.json`).

Standard commands live in `package.json` `scripts` and `README.md`; the notes below only
cover non-obvious caveats.

### Run / dev
- `npm run dev` serves the SPA on `http://localhost:3000` (Vite, `strictPort: true` — the
  port is fixed; if 3000 is taken the server fails rather than picking another port).
- This is the whole product in dev mode; no other process is needed to view/interact with
  the site.

### Lint / build
- `npm run lint` is type-check only (`tsc --noEmit`); there is no ESLint.
- `npm run build` runs `vite build` then `scripts/prerender.mjs` (post-build SEO prerender
  of the homepage into `dist/index.html`).
- Prerender browser selection: it uses local Google Chrome by default, OR the bundled
  `@sparticuz/chromium` when `CI` or `VERCEL` env is set. On this VM Chrome is not the
  `chrome` channel, so build with `CI=1 npm run build` to use the bundled Chromium.
- Gotcha: with the current Node (22.14) — below `@sparticuz/chromium`'s required
  `^22.17.0` (npm prints an EBADENGINE warning) — the prerender finishes and writes a valid
  `dist/index.html` (verify by grepping for anchor strings like `complex systems`,
  `12,608,066`, `thermostat`, `Kelvin`), but the node/`vite preview` processes hang on
  browser teardown. The build artifact is correct; terminate the leftover `node` /
  `vite preview` processes by PID if the command does not exit on its own.

### Contact form / `/api`
- `api/contact.ts` is a Vercel serverless function. Plain `vite dev` does NOT serve `/api`
  routes — use `npx vercel dev` and set `RESEND_API_KEY` + `CONTACT_TO_EMAIL` (see
  `.env.example`) to exercise email sending. Without keys the function returns 503; the rest
  of the site is unaffected.
- The `ContactDialog` / `ContactFormProvider` components exist but are not wired into the
  homepage in the current code — the persistent "Contact" button only exposes
  `mailto:` and LinkedIn links. Do not assume an in-page contact form dialog is reachable.
- `vercel dev` requires interactive Vercel auth (device login), so it cannot run unattended
  here. To exercise the handler without Vercel, bundle `api/contact.ts` with the
  esbuild that ships inside Vite (`node_modules/.bin/esbuild`, platform `node`) and drive it
  from a tiny `http` server that adds Vercel-style `res.status().json()` helpers and a parsed
  `req.body`. Note the handler enforces an allowed `Origin`/`Referer` (`http://localhost:3000`
  is allowed), a 5-requests/minute/IP limiter, honeypot + timing checks, and returns `503`
  ("not configured") until `RESEND_API_KEY` + `CONTACT_TO_EMAIL` are set; a real `200`
  needs valid Resend credentials.

### Fonts / images
- Required fonts and images are already committed under `public/fonts/` and `public/images/`.
