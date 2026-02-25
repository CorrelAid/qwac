# QWAC

A web application for exploring studies and research variables. Built with SvelteKit 2 and PocketBase, deployed as a static site.

## Tech Stack

- **SvelteKit** (static adapter) with Svelte 5
- **PocketBase** as the backend
- **Terrazzo** for design token management
- **Fuse.js** for client-side search
- **Zod** for validation
- **Bun** as the package manager

## Getting Started

```sh
bun install
bun run dev
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run check` | Type-check the project |
| `bun run lint` | Run linting |
| `bun run format` | Format code with Prettier |
| `bun run test` | Run unit tests |

## Requirements

- Categories
    - Conducted, Sample
    - Types
        - Bedarfserfassung, Wirkungsmessung
- Scales are another item (e.g. standard likert scale, net promoter)
- Copy to XLSForm section per question (two sheets for multiple choice)
- Download as XML (DDI Codebook) option
