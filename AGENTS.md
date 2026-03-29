# Repository Guidelines

## Project structure

- **`app/`** — Next.js App Router: `layout.tsx` (global styles, `CustomCursor`), `page.tsx` (home index), `signals/` for signal and card routes.
- **`components/`** — `StaircaseScene.tsx`, `CustomCursor.tsx`, and **`components/pages/`** for signal-specific full-page experiences (About, Projects, Listening, Influences, Journal).
- **`lib/`** — `signals.ts` loads generated `signals.json`; helpers `getSignalById`, `getSignalCard`, `getAllSignalCards`.
- **`types/scanner.ts`** — Signal and page content types; update when extending content shape.
- **`content/`** — Source of truth for site copy; compiled by `scripts/generate-signals.js`.
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

No automated E2E/unit suite yet; smoke-test with `pnpm dev` after content or routing changes.

## Commits & PRs

Imperative commit messages; PRs should describe behavior, list manual test steps, and attach screenshots for visible UI changes.
