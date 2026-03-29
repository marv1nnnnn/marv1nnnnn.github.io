# CLAUDE.md

Guidance for working in this repository.

## Commands

```bash
pnpm dev         # Generate lib/signals.json + start Next.js dev server
pnpm build       # Generate + production build (typecheck)
pnpm generate    # Only regenerate lib/signals.json from content/
pnpm start       # Serve production build
pnpm lint        # ESLint
```

## Architecture (current)

- **Home (`app/page.tsx`)**: Client page with `StaircaseScene` (Three.js). Reads `SIGNALS` from `lib/signals.ts` (generated). Hover themes use `document.body` class `theme-${signalId}`.
- **Signals (`app/signals/[signalId]/`)**: `SignalClientPage` renders one of `components/pages/AboutFluid`, `ProjectsRiver`, `ListeningRipples`, `InfluencesVortex`, `JournalSmoke`, or legacy `StaircaseScene` for some types. Card detail: `SignalCardClientPage` + React Markdown.
- **Data**: `scripts/generate-signals.js` walks `content/*/`, merges `signal.json` with profile/items/cards/influences JSON, outputs `lib/signals.json` and updates `public/sitemap.xml`.
- **Types**: `types/scanner.ts` — `Signal`, `SignalPage` variants, `SignalCardContent`, `VinylRecord`, etc.

There is **no** Zustand store or FM tuner UI in the current app; `freq` on signals is metadata for ordering/theming only.

## Content workflow

1. Edit files under `content/<signal-id>/`.
2. Run `pnpm generate` (or `pnpm dev` / `pnpm build`).
3. Quote YAML frontmatter values in markdown cards.

Details: `content/README.md`.

## Manual checks

- `pnpm dev` — staircase navigation and each signal route.
- Card routes: `/signals/projects/<cardId>` etc.
