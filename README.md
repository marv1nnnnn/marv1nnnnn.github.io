# marv1nnnnn.github.io

Personal site: a 3D **index** (spiral staircase) on `/` that links to **signal** routes under `/signals/[id]`. Content is file-based in `content/` and compiled to `lib/signals.json` at build time.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- Three.js for `StaircaseScene` and per-signal page scenes (`components/pages/*`)

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
| `app/page.tsx` | Home: staircase index, navigates to `/signals/:id` |
| `app/signals/[signalId]/SignalClientPage.tsx` | Chooses layout by `page.type` (profile, cards, list, influences) |
| `app/signals/[signalId]/[cardId]/` | Markdown card pages for `cards`-type signals |
| `content/<signal>/` | `signal.json` + page JSON / `cards/*.md` |
| `lib/signals.json` | Generated — do not edit by hand |
| `public/` | Static assets (`audio/`, `images/`, `resume/`, etc.) |

## Content

See **`content/README.md`** for signal folders, `pageType` values, and how to add or edit pages.
