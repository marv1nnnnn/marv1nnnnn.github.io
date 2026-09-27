# marv1nnnnn.github.io

Personal site built as one wearing tape: a single interactive flow field shared by every page, where older recordings visibly wear. Content is file-based in `content/` and compiled to `lib/signals.json` at build time.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Canvas 2D flow field in `components/tape/engine.ts` (no WebGL required)

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
| `app/page.tsx` | Home: the interactive tape |
| `app/make`, `app/think`, `app/input`, `app/about` | Sections; `make/[id]` and `think/[id]` are Markdown detail pages |
| `components/tape/` | Tape engine, provider, page parts, article and redirect components |
| `lib/tape.ts` | Content selectors used by the pages |
| `app/signals/**`, `app/shows` | Redirects from the old URLs |
| `content/<signal>/` | `signal.json` + page JSON / `cards/*.md` |
| `lib/signals.json` | Generated — do not edit by hand |
| `public/` | Static assets (`audio/`, `images/`, `resume/`, etc.) |

## Content

See **`content/README.md`** for signal folders, `pageType` values, and how to add or edit pages.
