# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the Next.js app router entrypoints; `app/page.tsx` renders the tuner UI, while `app/layout.tsx` wires global styles.
- `components/` contains feature modules: `scanner/` holds UI for the dial, display, and media effects; `audio/` houses playback logic; shared widgets (e.g., `RotatingBillboard.tsx`) live at the root.
- `store/` exposes the Zustand state container, and `lib/` stores signal metadata plus helpers. Static assets reside in `public/` with subfolders for `audio/`, `textures/`, and `zines/`.
- Type definitions are centralized in `types/`; update them before expanding store or signal schemas.

## Build, Test, and Development Commands
- `pnpm dev` — launches the local Next.js dev server with hot reload.
- `pnpm build` — compiles the production bundle and verifies type safety.
- `pnpm start` — serves the production build locally for smoke testing.
- `pnpm lint` — runs Next.js/ESLint; on first run, follow the interactive prompt to scaffold `.eslintrc` if it is missing.

## Coding Style & Naming Conventions
- Use TypeScript with ES module syntax; prefer functional React components with `use client` directives where required.
- Keep files and directories kebab-case (`rotating-billboard`) or PascalCase for components (`RotatingBillboard.tsx`).
- Favor Tailwind utility classes for styling; when adding custom CSS, extend `app/globals.css` and respect existing brutalist aesthetic.
- Maintain accessibility: ensure interactive controls expose `aria` attributes and keyboard paths (see `ScannerPanel`).

## Testing Guidelines
- No automated test harness exists yet. When introducing tests, prefer Playwright for UX flows or Vitest/Jest for logic in `lib/`.
- Co-locate test files beside the source (`component.test.tsx`) and wire new scripts (e.g., `pnpm test`) into `package.json`.
- Validate interactive affordances manually in `pnpm dev` after tuning new features (dial rotation, scrolling panels, audio lock).

## Commit & Pull Request Guidelines
- Write commits in imperative mood (`Add brutalist billboard header`). Group related changes; avoid bundling refactors with feature work.
- Pull requests must summarize the feature, list testing steps (`pnpm dev`, manual scenarios), and attach visuals (GIF or screenshot) for UI shifts.
- Reference related issues or tracking tickets in the PR description, and call out any follow-up work to keep reviewers aligned.
