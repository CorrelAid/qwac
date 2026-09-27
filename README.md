# QWAC

[![AI-Assisted](https://img.shields.io/badge/AI--assisted-Claude%20Code-blueviolet?logo=anthropic&logoColor=white)](./AI_DISCLOSURE.md)

**Questions Worth Asking Continuously** — a web application for exploring survey instruments (questions and answer options) from previously conducted studies. Built with SvelteKit and backed by [qwacback](https://github.com/CorrelAid/qwacback).

## Tech Stack

- **SvelteKit** (static adapter, SPA mode) with Svelte 5
- **qwacback** — Go/PocketBase backend providing the REST API
- **@correlaid/cdl-design** — Civic Data Lab design system (tokens, components)
- **Fuse.js** — client-side fuzzy search
- **Zod** — input validation
- **Bun** — package manager

## Getting Started

```sh
bun install
bun run dev
```

Requires a running [qwacback](https://github.com/CorrelAid/qwacback) instance. Set the URL in `.env`:

```sh
cp .env.example .env
# edit PUBLIC_POCKETBASE_URL to point to your backend
```

## Environment Variables

| Variable                | Required | Description                                                          |
| ----------------------- | -------- | -------------------------------------------------------------------- |
| `PUBLIC_POCKETBASE_URL` | Yes      | URL of the qwacback/PocketBase backend                               |
| `GITHUB_TOKEN`          | No       | GitHub PAT to avoid rate limits when fetching snippets at build time |

## Scripts

| Command            | Description               |
| ------------------ | ------------------------- |
| `bun run dev`      | Start dev server          |
| `bun run build`    | Build for production      |
| `bun run preview`  | Preview production build  |
| `bun run check`    | Type-check the project    |
| `bun run lint`     | Run linting               |
| `bun run format`   | Format code with Prettier |
| `bun run test`     | Run all tests             |
| `bun run test:e2e` | Run the end-to-end tests  |

## Tests

`bun run test` runs two Vitest projects:

- **server** (Node): unit tests, `src/**/*.test.ts` and `serve.test.js`
- **client** (Chromium via Playwright): component tests, `src/**/*.svelte.test.ts`

The component tests need Playwright's Chromium once:

```sh
bunx playwright install chromium-headless-shell
```

Where Playwright can't install its browser (e.g. an unsupported Linux distribution), use a local Chromium instead:

```sh
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium bun run test
```

Run one project with `bun run test -- --project server` (or `client`).

`bun run test:e2e` runs the Playwright tests in `e2e/`. It builds the app, serves it with `serve.js` on port 4173 and answers the API calls from the fixtures in `e2e/backend.ts`, so no qwacback is needed. `PLAYWRIGHT_CHROMIUM_PATH` works here too.

## Architecture

The app is a fully static SPA served by `serve.js`. All data comes from the qwacback API:

- `GET /api/questions` — list of all questions (home page)
- `GET /api/questions/{id}` — full question detail including variables, group, and study (question detail page)
- `GET /api/questions/{id}/xml` — DDI XML export
- `GET /api/questions/{id}/xlsform` — XLSForm JSON
- `GET /api/studies/{id}/questions` — questions for a study
- `GET /api/studies/{id}/export` — DDI XML export of a full study

The About and Imprint pages fetch HTML snippets from the [cdl-wp-eins](https://github.com/CorrelAid/cdl-wp-eins) repository at build time (prerendered).

## Deployment

Built and started with Bun (`nixpacks.toml`): `bun install --frozen-lockfile`, `bun run build`, `bun serve.js`. `bun.lock` is the only lockfile.

`serve.js` is a small static file server for `build/`:

- **Security headers** (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) come from `security-headers.js`. The Vite dev and preview servers use the same file, so all three send the same headers. `PUBLIC_POCKETBASE_URL` is read at runtime for the CSP's `connect-src` and `img-src`.
- **Caching**: `/_app/immutable/*` gets `Cache-Control: public, max-age=31536000, immutable`; HTML gets `no-cache`; other files one hour.
- **Compression**: the adapter writes `.br` and `.gz` next to each file (`precompress`), and `serve.js` sends them to clients that accept them.
- **SPA fallback**: unknown page routes get `index.html`; missing assets get a 404.
- Health checks at `/health` and `/healthz`.
