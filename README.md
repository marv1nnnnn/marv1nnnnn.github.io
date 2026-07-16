# marv1nnnnn.github.io

Personal site and experimental archive built around the shared **Machine Ghost** visual system. Content is file-based in `content/` and compiled to `lib/signals.json` at build time.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Three.js for the shared progressive-enhancement scene in `components/MachineGhostScene.tsx`

## Commands

```bash
pnpm install   # dependencies
pnpm dev       # generate signals + Next dev server
pnpm build     # generate + production build
pnpm start     # run production build locally
pnpm lint      # ESLint
```

`pnpm dev` and `pnpm build` run `scripts/generate-signals.js` first.

## Layout

| Path | Role |
|------|------|
| `app/page.tsx` | Home: scroll-assembled Machine Ghost index |
| `components/SiteShell.tsx` | Global navigation, parent context, and sound state interface |
| `components/MachineGhostScene.tsx` | Shared Home/About/Projects/Influences WebGL enhancement and fallback |
| `app/signals/[signalId]/SignalClientPage.tsx` | Chooses the stable DOM layout by `page.type` |
| `app/signals/[signalId]/[cardId]/` | Markdown card pages for `cards`-type signals |
| `content/<signal>/` | `signal.json` + page JSON / `cards/*.md` |
| `lib/signals.json` | Generated — do not edit by hand |
| `public/` | Static assets (`audio/`, `images/`, `resume/`, etc.) |

## Content

See **`content/README.md`** for signal folders, `pageType` values, and how to add or edit pages.
