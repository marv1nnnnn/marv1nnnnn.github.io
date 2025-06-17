# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Chaotic Early-Web OS" - a Next.js 14 application that recreates a nostalgic desktop environment celebrating early web aesthetics. It features draggable windows, retro games, AI chat personalities, a 3D brain visualization, and chaotic visual effects reminiscent of 90s/Y2K web design.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Key Dependencies

**3D Graphics and Visualization:**
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `@react-three/postprocessing` - Post-processing effects
- `three` - Core 3D library for brain visualization

**Animation and Effects:**
- `framer-motion` - Advanced animations and transitions
- `@tweenjs/tween.js` - Smooth value interpolation

**Audio Processing:**
- `howler` - Audio library for sound effects
- `tone` - Audio synthesis and effects
- `use-sound` - React hook for audio
- `web-audio-beat-detector` - Audio analysis for reactive effects

**UI and Interaction:**
- `react-draggable` - Draggable window functionality
- `react-rnd` - Resizable and draggable components
- `react-spring` - Spring-physics based animations
- `canvas-confetti` - Particle effects

## Architecture Overview

### Core Application Structure

The app uses a multi-provider architecture where all functionality flows through nested React contexts:

1. **AIChatProvider** - Manages AI personality chat system
2. **WindowManagerProvider** - Handles draggable window system
3. **ChaosProvider** - Central orchestrator for all system state, effects, and audio
4. **AudioVisualProvider** - Audio processing and visual effects

### Key Architectural Components

**Desktop Environment (`src/components/Desktop.tsx`)**
- Main desktop interface with draggable icons in a grid layout
- Integrates 3D brain visualization toggle
- Handles program launching and window creation
- Responsive design with mobile/desktop modes

**Window Management (`src/hooks/useWindowManager.tsx`)**
- Complete window lifecycle management (create, focus, minimize, maximize, close)
- Z-index management and positioning
- State persistence and responsive sizing

**Chaos System (`src/contexts/ChaosProvider.tsx`)**
- Central state management for system chaos level, performance, and effects
- Audio-reactive visual effects
- Real-time performance monitoring and adaptive quality
- Mobile device detection and responsive behavior

**Program Registry (`src/config/programRegistry.ts`)**
- Centralized registry of all launchable programs
- Auto-launch program configuration
- Dynamic component loading with React.lazy()
- Program size, positioning, and icon management

### 3D Brain Visualization

The 3D brain system is a sophisticated Three.js implementation located in `src/components/brain/`:

**Core Components:**
- `Brain.tsx` - Procedurally generated brain mesh with vertex coloring for region identification
- `BrainDashboard.tsx` - Main UI orchestrator with scene setup and overlays  
- `ModuleGrid.tsx` - Program launcher interface when brain regions are clicked

**Interaction System:**
- `useBrainCamera.tsx` - State-based camera control with smooth transitions
- `useBrainRaycasting.tsx` - Mouse-to-3D interaction using color-based region detection
- Brain regions map to specific programs via `src/config/brainMapping.ts`

**Data Flow:**
1. User clicks on 3D brain mesh
2. Raycasting detects vertex color at intersection point
3. Color maps to brain region ID via `src/utils/colorUtils.ts`
4. Camera transitions to focus on region
5. ModuleGrid displays available programs for that region

### AI Personalities System

**Configuration (`src/config/personalities.ts`)**
- Multiple AI personalities with distinct styles and prompts
- Each personality has unique visual theming and behavioral traits
- Integrated into Terminal.exe program

**Implementation:**
- Personalities are dynamically loaded as separate terminal instances
- Each has custom styling, icons, and interaction patterns
- Managed through the AI chat context system

## File Structure Guidelines

**Component Organization:**
- Main components in `src/components/`
- Brain-specific components in `src/components/brain/`
- Hooks in `src/hooks/` with brain-specific hooks in `src/hooks/brain/`
- Configuration files in `src/config/`
- Utilities in `src/utils/`

**Blog System:**
- Blog posts as Markdown files in `public/blog/`
- Metadata managed in `public/blog/blog-metadata.json`
- BlogReader component handles rendering

**Standards Application:**
- This project follows Mouse Protocol conventions in `.cursor/rules/`
- Always apply relevant standards from the rules directory
- Focus on maintaining the chaotic/retro aesthetic while ensuring code quality

## Key Technical Patterns

**Component Lazy Loading:**
All programs use React.lazy() for code splitting and performance

**State Management Pattern:**
Context providers handle domain-specific state, with ChaosProvider as the central coordinator

**Effects and Animation:**
Heavy use of CSS animations, Framer Motion, and Three.js for the retro aesthetic

**Responsive Design:**
Mobile-first approach with adaptive layouts and touch-friendly interfaces

**Performance Optimization:**
Real-time FPS monitoring with automatic quality adjustment based on device capabilities

## Integration Patterns

### Adding New Programs
1. **Create Component**: Build your program component in `src/components/`
2. **Register Program**: Add entry to `PROGRAM_REGISTRY` in `src/config/programRegistry.ts`
3. **Set Properties**: Define size, icon, auto-launch behavior, and integration points
4. **Lazy Loading**: Use `React.lazy()` for code splitting

### Connecting to Chaos System
```typescript
// Access chaos context in components
const { 
  systemState, 
  triggerSystemWideEffect, 
  setChaosLevel 
} = useChaos()

// Trigger effects on user interaction
const handleUserAction = () => {
  triggerSystemWideEffect('rainbow-cascade')
  // Your action logic
}
```

### Audio-Reactive Components
```typescript
// Listen to audio data for reactive effects
useEffect(() => {
  if (audio.isPlaying) {
    const { visualizerData } = audio
    // React to audio energy levels
    const energy = visualizerData.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8
    if (energy > 0.6) {
      // Trigger visual effects
    }
  }
}, [audio.visualizerData])
```

### Window Integration
```typescript
// Create windows through ChaosProvider
const { createWindow } = useChaos()

createWindow({
  title: 'My Program',
  component: <MyComponent />,
  size: { width: 400, height: 300 },
  icon: '🎮'
})
```

## Testing and Debugging

### 3D Brain System Testing
- **Region Detection**: Click various brain regions and verify correct program mapping
- **Camera Transitions**: Test smooth transitions between brain regions
- **Performance**: Monitor FPS with brain rendering active
- **Mobile Interaction**: Test touch interactions on mobile devices

### Audio System Testing
- **Effect Triggers**: Verify audio-reactive effects respond to music
- **Volume Controls**: Test chaos level impact on audio volume
- **Performance Impact**: Monitor CPU usage with audio analysis active

### Common Debugging Scenarios
- **Brain Raycasting Issues**: Check console for color detection logs in `colorUtils.ts`
- **Window Z-Index Problems**: Verify `useWindowManager` z-index incrementing
- **Performance Drops**: Check ChaosProvider performance mode adjustments
- **Mobile Layout Issues**: Test responsive behavior on various screen sizes

### Development Environment
- **Browser DevTools**: Use React DevTools for component state inspection
- **Three.js Inspector**: Browser extension for 3D scene debugging
- **Audio Context**: Check browser audio permissions and autoplay policies
- **Performance Monitoring**: Use browser Performance tab for FPS analysis

## Development Notes

- The project embraces intentional "chaos" and glitch effects as core features
- Maintain the nostalgic early-web aesthetic when adding new features
- All programs should integrate with the window management system
- Consider mobile experience for all new components
- Use the established program registry pattern for new applications
- **Performance Critical**: 3D rendering and audio processing are performance-sensitive
- **Audio Permissions**: Some features require user interaction to enable audio
- **Mobile Considerations**: Touch events and reduced visual effects for performance