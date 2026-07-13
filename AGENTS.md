# Repository Guidelines

## Project structure

- **`app/`** — Next.js App Router: `layout.tsx` (global styles, `CustomCursor`), `page.tsx` (home index), `signals/` for signal and card routes.
- **`components/`** — `StaircaseScene.tsx`, `CustomCursor.tsx`, and **`components/pages/`** for signal-specific full-page experiences (About, Projects, Listening, Influences, Journal).
- **`lib/`** — `signals.ts` loads generated `signals.json`; helpers `getSignalById`, `getSignalCard`, `getAllSignalCards`.
- **`types/scanner.ts`** — Signal and page content types; update when extending content shape.
- **`scripts/clin-content.js`** — Exports positively allowlisted `site` notes from the private Clin vault.
- **`content/`** and **`data/shows.json`** — Generated website data; edit their Clin sources, not these files directly.
- **`public/`** — Audio, images, resume PDFs, OG image, favicons.

## Commands

- `pnpm dev` — Regenerate signals, then Next dev with HMR.
- `pnpm build` — Regenerate signals, then production build.
- `pnpm lint` — Next/ESLint.

## Conventions

- TypeScript, functional components, `'use client'` only where needed.
- Tailwind for layout; global aesthetic tokens in `app/globals.css`.
- Prefer extending existing `components/pages/*` patterns for new signal layouts.

## Tests

Run `pnpm test:clin` for content parser changes; smoke-test with `pnpm dev` after content or routing changes.

## Commits & PRs

Imperative commit messages; PRs should describe behavior, list manual test steps, and attach screenshots for visible UI changes.
