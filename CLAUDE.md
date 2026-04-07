# CLAUDE.md

Guidance for working in this repository.

## Commands

```bash
pnpm dev         # Generate lib/signals.json + start Next.js dev server
pnpm build       # Generate + production build (typecheck)
pnpm generate    # Regenerate knowledge graph + lib/signals.json from content/
pnpm start       # Serve production build
pnpm lint        # ESLint
```

## Architecture (current)

- **Home (`app/page.tsx`)**: Client page with `StaircaseScene` (Three.js). Reads `SIGNALS` from `lib/signals.ts` (generated). Hover themes use `document.body` class `theme-${signalId}`.
- **Signals (`app/signals/[signalId]/`)**: `SignalClientPage` renders one of `components/pages/AboutFluid`, `ProjectsRiver`, `ListeningRipples`, `InfluencesVortex`, `JournalSmoke`, or legacy `StaircaseScene` for some types. Card detail: `SignalCardClientPage` + React Markdown.
- **Data**: `scripts/generate-signals.js` walks `content/*/`, merges `signal.json` with profile/items/cards/influences JSON, outputs `lib/signals.json` and updates `public/sitemap.xml`. `scripts/generate-knowledge.js` builds `public/knowledge/` (graph.json, nodes/*.md, sources/*.md) from `content/knowledge/nodes/*.json` and `content/knowledge/sources/*.md`.
- **Types**: `types/scanner.ts` — `Signal`, `SignalPage` variants, `SignalCardContent`, `VinylRecord`, etc.

There is **no** Zustand store or FM tuner UI in the current app; `freq` on signals is metadata for ordering/theming only.

## Content workflow

1. Edit files under `content/<signal-id>/`.
2. Run `pnpm generate` (or `pnpm dev` / `pnpm build`).
3. Quote YAML frontmatter values in markdown cards.

Details: `content/README.md`.

## Knowledge graph workflow

Source of truth lives in `content/knowledge/`. The build script (`scripts/generate-knowledge.js`) generates all files under `public/knowledge/` — never hand-edit those.

**To add a node:** create `content/knowledge/nodes/<id>.json`:
```json
{
  "id": "<slug>",
  "name": "Human Name",
  "type": "concept|technology|person|company|product|language",
  "description": "One-line description.",
  "sources": ["https://..."],
  "createdAt": <epoch-ms>,
  "updatedAt": <epoch-ms>,
  "edges": [
    { "to": "<target-node-id>", "quote": "quote from source", "source": "https://..." }
  ]
}
```

**To add a source article:** save the fetched markdown to `content/knowledge/sources/<url-slug>.md`.

Then run `pnpm generate`.

## Manual checks

- `pnpm dev` — staircase navigation and each signal route.
- Card routes: `/signals/projects/<cardId>` etc.
