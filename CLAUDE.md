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

The site is one cassette on a desk. Its sections are the tracks on the tape; the home page is the cassette itself, and every other page is the booklet that came with it.

- **The desk (`components/tape/engine.ts`, `body::before` in `app/globals.css`)**: a dark mat with grain and a lamp (CSS), and on it iron filings over a slow field (canvas). Each tape has its own world (`WORLDS`): how the filings lie (loops, rain, rings round the middle, glitching tears), their weight and pulse, and the lamp's colour and place (CSS variables); the booklets print in each tape's type (`html[data-tape]` in globals.css). Tapes were renamed in 2026-09 (oxide→haze, lain→3am, phosphor→nightbus, uv→ritual, mono→pressure, noise→bent); `RENAMED` carries a visitor's saved choice over. The pointer is a magnet: filings turn to it, gather under a hold, scatter on release; a double-tap erases a strip; winding slides them sideways. Palettes, wear and brightness following the visitor's clock live here too.
- **`components/tape/TapeProvider.tsx`**: mounted once in `app/layout.tsx`, so the canvas survives navigation. Choosing a tape (`newTape(name)`) switches the palette, the pattern and the field; the choice is saved in `localStorage` and applied as CSS variables.
- **`components/tape/parts.tsx`**: `TapeScene` (each page sets seed, density and age), `Worn` (older items fade and drop characters), `TopNav`, `HomeControls` (the tape shelf: one case spine per tape; pick one to swap it in).
- **The cassette (`components/tape/Cassette.tsx`, `components/tape/cassette3d.ts`, `scripts/blender/cassette.py`)**: one 3D cassette on every page (mounted by `TapeProvider`), with a pencil in the take-up hub. The model is built by a Blender script (`pip install bpy==4.2.0` on Python 3.11, then `python scripts/blender/cassette.py`) into `public/models/cassette.glb`, and rendered with three.js. On the home page it lies on the desk; on any other page it flies into the `.deck-dock` slot in the top bar (and loads only once the page is idle). Turning the pencil clockwise winds forward, anticlockwise back: inside the page's own stretch of tape it scrolls the page (turns the booklet's pages) and the music plays on; past either end the tape winds, and letting go (after it coasts) lands on the track under the head. A tap on the docked cassette goes home. The canvas never takes pointer events; Cassette.tsx claims touches that land on the model, never those on links or buttons. Software WebGL (no GPU) draws small, without shadows, only on change. The label is drawn in the browser: the tape's name, mood and influences, the counter, and the tracks with the current one circled. Each tape has its own look (`components/tape/tapes.ts`: shell, hubs, paper, stripe, oxide), and choosing another on the shelf ejects the cassette and puts that one in.
- **The booklet (`components/tape/Booklet.tsx`, `components/tape/Pages.tsx`)**: every page past home. Pages takes the page's content as a list of blocks and fills fixed pages with them (a class steers each block: `keep` stays with the next, `own` gets a page, `brk` starts one): a spread of two on a wide screen, one page on a phone, a title page first (track number, title, lede, "words & music") and running heads and folios (page number, the counter at that page) on the rest. The pages turn in 3D as the page scrolls (0.8 of a screen per turn, settling on the nearest page); the pencil and ← → turn them too, and past the last page the tape winds on. `#id` links open at the page holding that id. Without script or with reduced motion it stays one column. make is the songs and the tracklist, input a photo page per work, log the thanks list (LogDeck renders its own Pages, as its blocks change with the filter), about the cover art and the credits; essays are the words (`Article.tsx` splits the Markdown into blocks).
- **The deck (`components/tape/Deck.tsx`, `components/tape/tracks.ts`)**: the site is one cassette and each section is a track (01 intro, 02 make, 03 input, 04 log, 05 about) on a 000–999 counter. The top bar is the deck: the docked cassette (a drawn one until the 3D one loads), the counter, the tracks on a strip with the play head, and the transport. ◀◀/▶▶ skip a track, holding them winds until let go and lands on the track under the head; ← and → turn the booklet's pages, then skip. Scrolling a page plays through its track; detail pages sit inside theirs (`spanOf`). Every page change winds the tape from where it was to the new page (`TapeProvider`: longer the further it goes; the page drops away and the track being passed is called out). ▶ play is the sound, plus `{ }` to show the playing pattern.
- **Sound (`components/tape/sound.ts`)**: opt-in, loaded only when ▶ play is pressed. One Strudel tape per palette (`TAPES`), each a different kind of music from the canon and the log, with its own instruments, tempo and idea of what the pointer is: haze (Basinski, Boards of Canada, OPN: a piano loop that wears away over six minutes, the pointer scrubs a pad like a hand on the reel, a hold freezes it), 3am (HTRK, Badalamenti, Fishmans: brushes, FM piano ninths, a walking bass that starts when the pointer moves, a kalimba skank into dub echo, the organ on a hold), night bus, key `nightbus` (Autechre, Burial: MPC 2-step, pitched ghost vocal chops, bleeps whose euclidean rhythm follows the pointer), ritual (Coil, Xiu Xiu: organ pedal and didgeridoo drone, gongs and tubular bells, a stiff Minipops, noise that breaks out when pushed hard, bowed vibraphone clusters on a hold), pressure (The Bug, Swans, Source Direct: an 808 3-3-2 into the red, a Swans chord that grows with the stir, a dub siren on a hold), bent (fRUITYSPACE, Beijing 2016–2021: a circuit-bent Casio the pointer bends, toys, a drum machine losing its clock, harsh noise from the moving hand, feedback on a hold). Samples load at runtime from the projects' GitHub repositories (Dirt-Samples, tidal-drum-machines, VCSL, the Salamander piano via felixroos/dough-samples), as strudel.cc does; nothing is vendored. Melody and harmony evolve on their own: a `Composer` per tape (`Evolve`) mutates a motif every cycle (faster when stirred), moves the chord along the tape's own table, remembers phrases and returns to them, and drifts density and register; the patterns read `tape.motif`, `tape.chord`, `tape.density`, `tape.drift` and add Strudel's own chance (`sometimesBy`, `off`, `jux`, `rev`, `hurry`). Each pattern reads the pointer through `ref(() => tape.stir)` etc.; releasing a hold scatters notes in the tape's voice (`superdough` one-shots). Strudel's output is rerouted through a small Web Audio "deck", coloured per tape (`DeckProfile`: wow, hiss, drive into a tanh stage, top end): wow/flutter, hiss and crackle growing with page age, a dropout on double-tap erase, and on a wind the music lifts off the head, the spool spins, and the tape comes back up to speed when it lands. Sub-pages play the same tape quieter and darker, and each track is a section of the piece: every layer's velocity follows its orbit's share of the arrangement for the track under the head (`ARRANGEMENT`: intro sparse, make full, input melody, log rhythm, about air). The engine reports bursts, erases, seeks, scans and landings through `Tape.onEvent` and the pointer through `Tape.listen()`. `@strudel/web` is AGPL-3.0.
- **Routes**: `/` home, `/make` (writing, tools, talks, shows; + `/make/[id]`, essays at `/think/[id]`), `/input` (the canon), `/log` (filterable log), `/about`. `/think` redirects to `/make#writing`. Detail pages render Markdown through `components/tape/Article.tsx`.
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

- `pnpm dev`, then click through `/`, `/make`, an essay, `/input`, `/log`, `/about`: the desk should stay, the cassette should fly into the top bar and back, the tape should wind between pages, and each booklet should turn its pages (scroll, ← →, the page corners, the docked pencil).
- Check desktop and phone, touch interaction on the home page, swapping tapes on the shelf, turning the pencil (slow, fast and flicked), and `prefers-reduced-motion` (the field renders still and moves only while the pointer moves).
- The deck: tap ◀◀/▶▶, hold them, click tracks on the strip, and scroll a long page; the counter and reels should follow, and the wind should land on the right page.
- Sound: press ▶ play, then stir, hold and release, double-tap, pick another tape on the shelf (new key and a clunk) and wind between tracks (music drops, the spool spins, the tape comes back up to speed). Switching tabs pauses it; a returning visitor who left it on gets it back at their first touch.
- Old URLs such as `/signals/journal/<id>` and `/shows` should land on their new pages.
- `pnpm test:e2e` covers these routes on desktop and mobile viewports.
