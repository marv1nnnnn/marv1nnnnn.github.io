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

The site is one "tape": a single interactive flow field that every page shares. Pages only change its parameters.

- **Tape engine (`components/tape/engine.ts`)**: canvas flow field, pointer and touch interaction (stir, hold to gather, release to scatter, double-tap to erase a strip), palettes, wear, brightness following the visitor's clock, and the fast-forward/rewind played on page changes.
- **`components/tape/TapeProvider.tsx`**: mounted once in `app/layout.tsx`, so the canvas survives navigation. "new tape" picks a random palette plus a fresh field; the choice is saved in `localStorage` and applied as CSS variables.
- **`components/tape/parts.tsx`**: `TapeScene` (each page sets seed, density and age), `Worn` (older items fade and drop characters), `TopNav`, `HomeControls` (the new tape button).
- **Routes**: `/` home, `/make` (writing, tools, talks, shows; + `/make/[id]`, essays at `/think/[id]`), `/input` (the canon reel), `/log` (filterable log), `/about`. `/think` redirects to `/make#writing`. Detail pages render Markdown through `components/tape/Article.tsx`.
- **Old URLs**: `/signals/*`, `/shows` and `/draft` are static redirect pages (`components/tape/Redirect.tsx`).
- **Data (`lib/tape.ts`)**: selectors over `lib/signals.json` and `data/shows.json`. Talks vs tools is a hard-coded id list until Clin carries a `kind` field.
- **Content export (`scripts/clin-content.js`)**: exports only positively allowlisted Clin notes tagged `site` into `content/` and `data/shows.json`.
- **Signal build (`scripts/generate-signals.js`)**: compiles generated content into `lib/signals.json` and updates `public/sitemap.xml`.
- **Types (`types/scanner.ts`)**: signal and page content types.

## Content workflow

Clin is the sole source for public website content. Do not edit generated files under `content/`, `data/shows.json`, `lib/signals.json`, or `public/sitemap.xml` directly.

1. Run `clin-sync pull` before editing the private vault.
2. Edit the relevant `site`-tagged Clin note.
3. Run `clin-sync`, `pnpm sync:clin`, `pnpm test:clin`, and `pnpm build`.
4. Review and commit the generated website files when publishing.

See `content/README.md` for note formats and paths.

## Manual checks

- `pnpm dev`, then click through `/`, `/make`, an essay, `/input`, `/log`, `/about`: the canvas should keep running and play fast-forward/rewind between pages.
- Check desktop and phone, touch interaction on the home page, a few presses of "new tape", and `prefers-reduced-motion` (the field renders still and moves only while the pointer moves).
- Old URLs such as `/signals/journal/<id>` and `/shows` should land on their new pages.
- `pnpm test:e2e` covers these routes on desktop and mobile viewports.
