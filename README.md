# The Anomaly Scanner

A mysterious vertical signal scanner device that tunes into fragmented case files from a parallel dimension.

## 🎯 Project Status

### ✅ **Completed (Phase 1-4)**

**Foundation & Core Mechanics:**
- ✅ Next.js 15 + TypeScript setup
- ✅ Zustand state management
- ✅ Two-column scanner interface layout
- ✅ Vertical frequency slider (88.0 - 108.0 MHz)
- ✅ Signal configuration system
- ✅ Tuning logic with clarity calculation
- ✅ Signal state detection (NOISE/APPROACHING/LOCKED_ON)

**Visual Effects:**
- ✅ Industrial Decay aesthetic (phosphor glow, noise textures, scanlines)
- ✅ 1-Bit StaticEffect canvas with Bayer dithering
- ✅ Organic swirling noise patterns
- ✅ VT323 monospace font integration
- ✅ Custom color palette

**Audio System:**
- ✅ Web Audio API integration
- ✅ 50Hz electrical hum oscillator
- ✅ Dynamic noise generation
- ✅ Clarity-based audio mixing
- ✅ User interaction-based initialization

**Polish Features:**
- ✅ Framer Motion page transitions
- ✅ Overdrive detection (1s at frequency extremes)
- ✅ Overdrive visual warnings (red theme)
- ✅ Diegetic navigation controls ([PREV]/[NEXT])
- ✅ Signal strength indicator bars
- ✅ Real-time frequency display

### 📋 **Next Steps (Phase 5)**

**Content Creation:**
- [ ] Design zine pages in Figma with redaction/stamp aesthetics
- [ ] Export zine pages as PNG images
- [ ] Create 4 zines:
  - **88.1 MHz**: ABOUT - Personal introduction (3-4 pages)
  - **94.5 MHz**: PROJECTS - Case files for projects (5-7 pages each)
  - **101.2 MHz**: LOG - Blog entries as redacted reports (4+ pages)
  - **107.8 MHz**: CONTACT - Communication protocols (2 pages)

**Audio Assets:**
- [ ] Create/source ambient tracks for each signal
- [ ] Generate noise cacophony soundscape
- [ ] Add UI sound effects (slider drag, page flip)

**Advanced Polish:**
- [ ] Implement Signal Ghosting (3s fade-out on signal change)
- [ ] Boot-up sequence animation
- [ ] Easter eggs in noise patterns
- [ ] Accessibility (prefers-reduced-motion)
- [ ] Mobile responsiveness considerations

**Testing & Optimization:**
- [ ] Cross-browser testing
- [ ] Canvas performance optimization
- [ ] Audio loading states
- [ ] Error handling

## 🎨 Design Philosophy

Three aesthetic pillars guide this project:

1. **Industrial Decay** - A Cold War-era device with phosphor screens and worn metal
2. **1-Bit Cosmic Horror** - Procedural dithered noise representing a hostile dimension
3. **The Redacted Manuscript** - Case files with stamps, annotations, and damage

## 🚀 Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles & aesthetic
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main scanner interface
├── components/
│   ├── scanner/           # Scanner UI components
│   │   ├── ScannerPanel.tsx    # Frequency slider
│   │   ├── DisplayScreen.tsx   # Main display logic
│   │   ├── StaticEffect.tsx    # 1-bit canvas noise
│   │   └── ZineViewer.tsx      # Zine page renderer
│   └── audio/
│       └── AudioEngine.tsx     # Web Audio API manager
├── store/
│   └── scanner.ts         # Zustand global state
├── lib/
│   └── signals.ts         # Signal configuration & utilities
├── types/
│   └── scanner.ts         # TypeScript definitions
└── public/
    ├── zines/            # Zine page images (to be created)
    ├── audio/            # Audio files (to be created)
    └── textures/         # Noise/scratch textures
```

## 🎛️ Key Features

- **Tuning System**: Drag the vertical slider to scan frequencies
- **Clarity Calculation**: Signal strength based on distance (1.5 MHz falloff)
- **Three Signal States**:
  - `NOISE` (clarity < 30%): Pure static
  - `APPROACHING` (30% - 95%): Blurred zine + fading noise
  - `LOCKED_ON` (≥ 95%): Clear zine + ambient audio
- **Overdrive Mode**: Hold at 88.0 or 108.0 MHz for 1 second
- **Procedural Graphics**: Real-time Bayer-dithered organic patterns

## 🔧 Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State**: Zustand
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **Graphics**: HTML Canvas 2D
- **Audio**: Web Audio API

## 📝 Notes

- Audio requires user interaction to initialize (browser autoplay policy)
- All frequencies are in MHz (88.0 - 108.0 range)
- Zine content is currently placeholder text
- Canvas uses pixelated rendering for retro aesthetic

---

**Generated with Claude Code** 🤖
