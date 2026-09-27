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

| Command           | Description               |
| ----------------- | ------------------------- |
| `bun run dev`     | Start dev server          |
| `bun run build`   | Build for production      |
| `bun run preview` | Preview production build  |
| `bun run check`   | Type-check the project    |
| `bun run lint`    | Run linting               |
| `bun run format`  | Format code with Prettier |

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

The production build is served by `serve.js`, a minimal Node.js static file server. It sets security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) and reads `PUBLIC_POCKETBASE_URL` at runtime to configure the `connect-src` CSP directive.
