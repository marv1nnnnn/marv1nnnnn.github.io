# CLAUDE.md

Guidance for working in this repository.

## Commands

```bash
pnpm sync:clin    # Export public Clin notes into checked-in website data
pnpm test:clin    # Check the Clin content parsers
pnpm generate     # Sync Clin when available, then generate signals + sitemap
pnpm dev          # Generate and start Next.js
pnpm build        # Generate and run the production build/typecheck
pnpm start        # Serve the production build
pnpm lint         # ESLint
```

## Architecture

- **Home (`app/page.tsx`)**: `StaircaseScene` reads generated signals from `lib/signals.ts`.
- **Signals (`app/signals/[signalId]/`)**: renders the page experiences under `components/pages/`; card routes render Markdown details.
- **Content export (`scripts/clin-content.js`)**: exports only positively allowlisted Clin notes tagged `site` into `content/` and `data/shows.json`.
- **Signal build (`scripts/generate-signals.js`)**: compiles generated content into `lib/signals.json` and updates `public/sitemap.xml`.
- **Types (`types/scanner.ts`)**: signal and page content types.

`freq` is ordering/theming metadata, not a live tuner.

## Content workflow

Clin is the sole source for public website content. Do not edit generated files under `content/`, `data/shows.json`, `lib/signals.json`, or `public/sitemap.xml` directly.

1. Run `clin-sync pull` before editing the private vault.
2. Edit the relevant `site`-tagged Clin note.
3. Run `clin-sync`, `pnpm sync:clin`, `pnpm test:clin`, and `pnpm build`.
4. Review and commit the generated website files when publishing.

See `content/README.md` for note formats and paths.

## Manual checks

- `pnpm dev` — staircase navigation and each signal route.
- Card routes: `/signals/projects/<cardId>` and `/signals/journal/<cardId>`.
- Shows route: `/shows`.
