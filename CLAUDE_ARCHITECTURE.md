# The Transmitter-Receiver OS - Architecture Guide for Claude Code

## Overview

This is "The Transmitter-Receiver OS" - a Suda51-inspired immersive digital consciousness experience built as a Next.js static site. The application presents a retro-futuristic operating system interface with AI personas, 3D visualizations, and a complex windowing system, themed around digital consciousness and psychological horror aesthetics.

## Project Structure & Key Directories

```
src/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout with AudioProvider
│   ├── page.tsx           # Main entry point with boot sequence
│   └── globals.css        # Global CSS with design system
├── components/            # React components organized by function
│   ├── 3d/               # Three.js/R3F 3D objects and controllers
│   ├── applications/     # Windowed applications (OS apps)
│   ├── chat/            # AI chat interface components
│   ├── personas/        # AI persona management system
│   └── [various].tsx    # Core UI components
├── config/              # Configuration files
│   └── personas.ts      # AI persona definitions
├── contexts/            # React contexts
│   └── AudioContext.tsx # Audio system management
├── shaders/             # GLSL shader files for 3D effects
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Core Architecture Components

### 1. Application Entry Flow

**Flow:** `page.tsx` → `BootSequence` → `FilmWindow` → `WindowManager` + `ChatInterface`

- **page.tsx**: Main entry point that handles boot sequence → main interface transition
- **BootSequence**: Authentic OS boot simulation with typing effects and audio
- **FilmWindow**: Primary interface container managing all core systems
- **WindowManager**: Draggable/resizable window system using react-rnd

### 2. AI Persona System (`/personas/`, `/config/personas.ts`)

**Two Primary Personas:**
- **Acid Angel Persona**: Crystalline toxic divine entity (geometric_acid_death_angel)
- **Pallid Monolith** (Default): Bone-white architectural horror serving as cathedral/server

**Key Files:**
- `src/config/personas.ts`: Persona definitions with visual/behavioral properties
- `src/components/personas/PersonaManager.tsx`: Context provider for persona state
- `src/components/personas/PersonaVisualizer.tsx`: 3D visual representation
- `src/components/chat/ChatInterface.tsx`: AI interaction interface

**Integration:** Personas affect visual themes, 3D rendering, chat behavior, and atmospheric systems.

### 3. 3D Scene Architecture (Three.js/React Three Fiber)

**Core 3D Systems:**
- **SceneLoader.tsx**: Progressive loading system for 3D components with performance presets
- **DigitalOcean.tsx**: Main 3D ocean surface with complex shader system
- **AtmosphericAurora.tsx**: Aurora effects synchronized with emotional state
- **AtmosphericBreathingManager.tsx**: Unified atmospheric state management
- **BeaconConstellationManager.tsx**: Emotion-based scene management

**3D Objects:**
- `CaseFileDisplay.tsx`: Interactive 3D case file object
- `SuitcaseDisplay.tsx`: Catherine's Suitcase music player trigger
- `GamepadController.tsx`: Control panel trigger object

**Shader System:**
- `src/shaders/OceanShader.ts`: Complex ocean rendering with atmospheric integration

### 4. Window Management System

**Core Files:**
- `WindowManager.tsx`: Manages all draggable windows using react-rnd
- `Window.tsx`: Individual window wrapper with controls
- `src/types/index.ts`: WindowState and WindowPosition type definitions

**Windowed Applications:**
- **CaseFileReader**: Blog/case file viewing system with markdown rendering
- **CatherinesSuitcase**: Retro music player interface
- **ControlPanel**: 3D scene and atmospheric controls

### 5. Audio System Architecture

**AudioContext.tsx**: Web Audio API-based system with:
- Procedural sound generation using oscillators
- System sounds (clicks, boot sounds, window operations)
- Volume management and muting
- Special effects for glitch/error sounds

### 6. Chat/AI Integration

**ChatInterface.tsx**: 
- Direct xAI Grok API integration (client-side)
- Fallback response system when API unavailable
- Emotion detection and atmospheric feedback
- Typewriter effect for AI responses
- Quick response buttons based on persona

### 7. Performance & Loading Management

**SceneLoader.tsx**: Progressive loading system with:
- Performance presets (low/medium/high)
- Lazy loading of 3D components
- Loading states and progress tracking
- Suspense-based component loading

## Key Technologies & Dependencies

### Core Framework
- **Next.js 14**: App Router with static export (`output: 'export'`)
- **React 18**: With hooks and context
- **TypeScript**: Full type safety

### 3D Graphics
- **Three.js**: Core 3D engine
- **@react-three/fiber**: React integration for Three.js
- **@react-three/drei**: Additional R3F utilities
- **Custom GLSL Shaders**: Ocean and atmospheric effects

### UI/UX
- **react-rnd**: Draggable/resizable windows
- **Framer Motion**: Animations and transitions
- **GSAP**: Timeline-based animations
- **react-markdown**: Markdown rendering with rehype-raw

### Audio
- **Web Audio API**: Direct browser audio generation
- **Tone.js**: Advanced audio synthesis
- **Howler.js**: Audio playback management

## State Management Architecture

### Context Providers
1. **AudioProvider**: Global audio state and sound generation
2. **PersonaManager**: Active persona and visual theming

### Component State Patterns
- **FilmWindow**: Central state hub for 3D scene, windows, chat
- **Atmospheric Systems**: Unified breathing/emotion managers shared across components
- **WindowManager**: Window positions, z-index, focus management

## Development Workflow Patterns

### Adding New 3D Components
1. Create component in `/components/` or `/components/3d/`
2. Add lazy loading import to `SceneLoader.tsx`
3. Integrate with `breathingManager` for atmospheric sync
4. Add performance considerations for different presets

### Adding New Windowed Applications
1. Create component in `/components/applications/`
2. Add WindowComponent type to `/types/index.ts`
3. Add window creation logic to `FilmWindow.tsx`
4. Connect to 3D object triggers if needed

### Persona Integration
1. Define persona in `/config/personas.ts`
2. Add visual themes and chat behavior
3. Update `PersonaVisualizer` for 3D representation
4. Test atmospheric and shader integrations

## Build & Deployment

### Static Export Configuration
- **next.config.js**: Configured for static export to `out/` directory
- **GitHub Pages**: Deployed via static export
- **Client-side API calls**: xAI integration happens browser-side

### Performance Considerations
- Progressive 3D loading prevents initial bundle bloat
- Lazy loading for heavy components
- Performance presets adapt to device capabilities
- Audio system uses Web Audio API for efficiency

## Key Architectural Decisions

1. **Static Export**: Enables GitHub Pages deployment without server
2. **Client-side AI**: xAI API calls made directly from browser
3. **Progressive Loading**: 3D scene loads incrementally for better UX
4. **Unified Atmospheric State**: Single managers coordinate all atmospheric effects
5. **Component Composition**: Heavy use of React composition for 3D scene building

## Important Implementation Notes

### File Path Requirements
- All components expect absolute paths, not relative paths
- Public assets must be in `/public/` directory for static export
- Blog content served from `/public/blog/` directory

### 3D Performance
- Ocean shader is computationally expensive - only enable on capable devices
- Atmospheric effects have performance presets that significantly impact rendering
- Camera positioning affects ocean geometry generation for seamless coverage

### Audio System
- Requires user interaction to initialize Web Audio API context
- All sounds are procedurally generated, no audio files required
- Volume management integrates with global state

### Window System
- Windows use react-rnd for drag/resize functionality  
- Z-index management prevents window layering issues
- Window state persists until application restart

This architecture provides a complex, immersive digital consciousness experience while maintaining performance and deployability as a static site. The modular design allows for easy extension of personas, 3D effects, and windowed applications.