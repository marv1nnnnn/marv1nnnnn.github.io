# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm dev         # Generate signals + start Next.js dev server
pnpm build       # Generate signals + production build with type checking
pnpm generate    # Generate lib/signals.json from content/ folder
pnpm start       # Run production build locally
pnpm lint        # Run ESLint (follows interactive setup on first run)
```

## Project Architecture

**The Anomaly Scanner** is a portfolio/personal site disguised as a radio frequency scanner that "tunes into" fragmented case files. Users drag a vertical frequency slider (88.0-108.0 MHz) to discover content rendered as redacted zine pages.

### State Management (Zustand)

The single source of truth is `store/scanner.ts`, which manages:
- `currentFrequency`: Live slider position (88.0-108.0)
- `isTuning`: Whether the user is actively dragging
- `lockedOnSignalId`: Currently locked signal ID or null
- `isOverdrive`: Whether frequency is held at extremes (88.0/108.0)

All UI components consume this store via the `useScannerStore` hook.

### Signal System

Signals are loaded from the `content/` directory and compiled at build time:
- **Content Structure**: Each signal lives in `content/<signal-id>/` with a `signal.json` metadata file
- **Signal Array**: Dynamically generated from content folder via `scripts/generate-signals.js`
- **Clarity Calculation**: Uses `findClosestSignal()` to compute distance-based clarity (1.0 at exact frequency, 0.0 at 1.5 MHz falloff)
- **State Detection**: `getSignalState()` determines three states:
  - `NOISE` (clarity < 30%): Pure static
  - `APPROACHING` (30-95%): Blurred zine + fading noise
  - `LOCKED_ON` (≥95%): Clear zine + ambient audio

**Adding new signals**: Create a folder in `content/` with `signal.json` and page content (see `content/README.md` for details).

### Component Structure

- **`app/page.tsx`**: Main scanner interface with two-column layout
- **`components/scanner/`**:
  - `ScannerPanel.tsx`: Vertical frequency slider with overdrive detection
  - `DisplayScreen.tsx`: Main content renderer, orchestrates signal state
  - `ZineViewer.tsx`: Renders zine pages with blur effects based on clarity
  - `StaticEffect.tsx`: Canvas-based 1-bit dithered noise patterns
- **`components/audio/`**:
  - `AudioEngine.tsx`: Web Audio API manager for 50Hz hum + noise mix

### Audio System

Audio requires user interaction to initialize (browser autoplay policy). The system:
1. Initializes AudioContext on first user click
2. Generates a 50Hz electrical hum oscillator
3. Mixes dynamic noise based on signal clarity
4. Loads signal-specific ambient tracks from `public/audio/`

### Visual Effects

The "Industrial Decay" aesthetic uses:
- **Tailwind CSS**: Utility classes for layout (defined in `tailwind.config.ts`)
- **Custom CSS**: Phosphor glow, scanlines, and noise textures in `app/globals.css`
- **VT323 Font**: Monospace retro font for all text
- **Canvas Effects**: `StaticEffect.tsx` implements real-time Bayer dithering for organic 1-bit noise
- **Framer Motion**: Page transitions and animations (configured in `app/layout.tsx`)

### Type System

All scanner-related types live in `types/scanner.ts`:
- `Signal`: Frequency metadata structure
- `SignalState`: Union type for signal states
- `ScannerStore`: Zustand store interface

When extending functionality, update types first to ensure type safety across the codebase.

## Key Technical Constraints

1. **Frequency Range**: Always 88.0-108.0 MHz (FM radio band)
2. **Clarity Threshold**: 1.5 MHz falloff distance is hardcoded in `lib/signals.ts` as `FALLOFF_DISTANCE`
3. **Overdrive Detection**: Triggers after 1 second at 88.0 or 108.0 MHz (see `ScannerPanel.tsx`)
4. **Canvas Rendering**: Uses `image-rendering: pixelated` CSS for retro aesthetic
5. **Audio Context**: Must be initialized via user gesture; check `AudioEngine.tsx` for implementation

## Content Management System

Content is file-based and lives in the `content/` directory. Each signal has its own folder with JSON metadata and markdown/JSON content files.

### Content Structure

```
content/
├── <signal-id>/
│   ├── signal.json          # Signal metadata (freq, title, colors, etc.)
│   ├── profile.json         # For profile pages
│   ├── items.json           # For list pages
│   └── cards/               # For card pages
│       └── *.md             # Markdown files with frontmatter
```

### Page Types

1. **Profile** (`pageType: "profile"`): Hero section + contact info (see `content/about/`)
2. **Cards** (`pageType: "cards"`): Grid of project cards with markdown content (see `content/projects/`)
3. **List** (`pageType: "list"`): Categorized list of items (see `content/listening/`)

### Editing Content

1. Edit files in `content/<signal-id>/`
2. Run `pnpm generate` (or `pnpm dev`/`pnpm build` which auto-generate)
3. Content automatically appears on the site

**Important**: Always quote YAML frontmatter values in markdown files to avoid parsing errors.

See `content/README.md` for detailed documentation on adding signals and content.

## Testing Approach

No automated testing exists yet. Manual validation:
1. Run `pnpm dev` and test in browser
2. Verify slider interaction (drag, release, overdrive)
3. Check signal locking at configured frequencies
4. Test audio initialization after user click
5. Validate accessibility (keyboard navigation, ARIA labels)

## Special Rules (from .cursorrules)

This project follows the **Mouse Protocol** workflow:
- All file modifications must be tracked as formal Mouse Tasks in `.mouse/tasks/`
- Tasks use sequential IDs (`MOUSE#TASK_0001.md`) with YAML frontmatter
- State transitions and file operations must be logged in `Task.HistoryLog`
- Standards/conventions in `@mouse/standards/` (if present) must be applied

When performing work:
1. Check if `.mouse/` directory exists
2. If it does, follow Mouse Protocol for task formalization
3. If not, proceed with standard development workflow
