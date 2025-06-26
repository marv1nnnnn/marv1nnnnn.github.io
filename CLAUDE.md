# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**"The Transmitter-Receiver OS"** is a Suda51-inspired interactive digital consciousness experience. It simulates a retro-futuristic operating system with AI personas, immersive 3D visualization, and a windowed application environment. The project is built as a Next.js static site deployed to GitHub Pages.

## Essential Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production (static export)
npm run start        # Start production server
npm run lint         # Run ESLint

# Development shortcuts
localStorage.setItem('skip-boot', 'true')  # Skip boot sequence in dev mode
```

## Architecture Overview

### Core Application Flow
1. **Boot Sequence** (`BootSequence.tsx`) - Retro-futuristic startup animation
2. **Main Interface** (`FilmWindow.tsx`) - Primary container with layered 3D scene
3. **AI Chat System** - Direct xAI Grok API integration with persona-driven responses
4. **Window Manager** - Draggable/resizable applications using react-rnd

### Multi-layered 3D Scene Architecture

The 3D scene uses a sophisticated layered approach:

```
FilmWindow (Main Container)
├── DigitalOceanBackground (2D Canvas Layer)
├── Ocean Scene (React Three Fiber Canvas)
│   ├── SceneLoader (Progressive loading system)
│   ├── DigitalOcean (Shader-based ocean with GLSL)
│   ├── AtmosphericAurora/Particles/Rain
│   └── Interactive Objects (GamepadController, CaseFiles, Suitcase)
├── PersonaVisualizer (Separate 3D Canvas)
│   ├── Massive-scale 3D personas (50-80x larger than normal)
│   ├── Cosmic starfield background
│   └── NGE-inspired dramatic lighting
└── ChatInterface (Overlay)
```

### AI Persona System

Two distinct AI personalities with complete visual/behavioral themes:

- **The Pallid Monolith** (`GHOST_PERSONA`) - Bone-white architectural horror with cyan corruption
- **Geometric Acid Death Angel** (`ACID_ANGEL_PERSONA`) - Crystalline divine entity with acid green/magenta

Each persona affects:
- 3D model appearance and materials
- Chat response style and personality
- Color themes and visual effects
- Audio tone and glitch effects

## Key Components & Systems

### 3D Rendering (`src/components/`)
- **`DigitalOcean.tsx`** - Complex shader-based ocean with noise-driven waves
- **`SceneLoader.tsx`** - Progressive loading with performance presets (low/medium/high)
- **`PersonaVisualizer.tsx`** - Massive-scale persona models with cosmic backgrounds
- **`AtmosphericBreathingManager.tsx`** - Unified emotion system affecting all visuals

### 3D Effects (`src/components/3d/`)
- **`Persona3D.tsx`** - Core 3D persona component with hover interactions
- **`ParticleEffects.tsx`** - Persona-specific particle systems (crystalline, ethereal mist, warm orbs)
- **`GeometricEffects.tsx`** - Hoverable geometric overlays (hexagonal rings, monolithic pillars, flowing ribbons)

### Chat & AI Integration (`src/components/chat/`)
- **`ChatInterface.tsx`** - Main chat UI with minimization and styling
- **Direct xAI API calls** - No server-side proxy, client-side integration
- **Fallback responses** - Graceful degradation when API unavailable
- **Emotion detection** - Simple keyword-based emotion analysis

### Window Management (`src/components/applications/`)
- **`WindowManager.tsx`** - Handles dragging, resizing, focus management
- **`CaseFileReader.tsx`** - Blog/markdown viewer with glitch effects
- **`CatherinesSuitcase.tsx`** - Retro music player with vinyl aesthetics
- **`ControlPanel.tsx`** - 3D scene controls and system settings

### Audio System (`src/contexts/AudioContext.tsx`)
- **Procedural audio generation** using Web Audio API
- **System sounds** - boot, window open/close, glitch effects
- **Ambient atmosphere** - Ocean sounds and background hum
- **Dynamic mixing** based on system state and persona

## Custom Shaders & Effects

### Ocean Shader (`src/shaders/OceanShader.ts`)
- **Multi-layer Perlin noise** for realistic wave generation
- **Dynamic color mixing** between deep/surface colors
- **Scrolling code texture** overlays for "data flow" effect
- **Time-based animation** with breathing manager integration

### Visual Effects
- **Post-processing pipeline** using @react-three/postprocessing
- **Bloom effects** for ethereal glow
- **Glitch shaders** for digital corruption
- **Atmospheric fog** for depth and mystery

## Configuration & Content

### Static Content (`public/`)
- **Blog posts** - Markdown files for case file reader
- **Music playlist** - JSON configuration for Catherine's Suitcase
- **Audio assets** - System sounds and ambient tracks

### Performance Management
- **Three performance presets** with automatic detection
- **Progressive scene loading** to prevent blocking
- **Lazy loading** of 3D components
- **Asset optimization** for static deployment

## Development Patterns

### State Management
- **React Context** for audio and global state
- **Local component state** for UI interactions
- **Unified atmospheric management** for 3D scene coordination
- **Window state management** with react-rnd integration

### 3D Development
- **React Three Fiber** declarative 3D scenes
- **Drei helpers** for cameras, controls, and effects
- **Custom hooks** for frame-based animations (`useFrame`)
- **Ref-based** 3D object manipulation

### AI Integration
- **Environment variables** for API keys (client-side)
- **Graceful fallbacks** for API failures
- **Persona-driven** response modification
- **Emotion analysis** affecting atmospheric systems

## Deployment

- **Static export** via Next.js for GitHub Pages compatibility
- **No server-side** API routes (all client-side)
- **Asset optimization** with unoptimized images flag
- **Trailing slash** configuration for proper routing

## Important Files

### Core Architecture
- `src/app/page.tsx` - Main application entry point with boot logic
- `src/components/FilmWindow.tsx` - Primary scene container and orchestrator
- `src/config/personas.ts` - AI personality definitions and themes
- `src/types/index.ts` - Complete type system for OS simulation

### 3D Scene
- `src/components/SceneLoader.tsx` - Progressive loading and performance management
- `src/components/personas/PersonaVisualizer.tsx` - Massive-scale persona models
- `src/shaders/OceanShader.ts` - Custom GLSL shader code

### Chat System
- `src/components/chat/ChatInterface.tsx` - AI chat with persona integration
- `src/contexts/AudioContext.tsx` - Audio management and procedural generation

## Special Considerations

### Performance
- **3D scenes are demanding** - use performance presets appropriately
- **Progressive loading** prevents initial blocking
- **Shader complexity** can impact older devices

### AI API Usage
- **Client-side API calls** mean keys are exposed (use environment variables)
- **Fallback responses** ensure functionality without API access
- **Rate limiting** may affect chat responsiveness

### Static Deployment
- **No server-side features** - all dynamic content is client-side
- **Asset paths** must be relative for GitHub Pages
- **Build artifacts** in `out/` directory for deployment

## Development Tips

### Debugging 3D Scenes
- Use browser DevTools for Three.js inspection
- Performance presets help isolate performance issues
- Console logging is extensive for atmospheric systems

### Adding New Personas
1. Define in `src/config/personas.ts` with complete theme
2. Add 3D model case in `PersonaVisualizer.tsx`
3. Update color schemes and audio tones
4. Test chat integration and visual effects

### Extending Window Applications
1. Create component in `src/components/applications/`
2. Add to window manager type system
3. Register click handlers in `FilmWindow.tsx`
4. Define default window properties

The project represents a sophisticated fusion of AI, 3D graphics, and interactive design - treat it as both a technical showcase and an artistic expression.