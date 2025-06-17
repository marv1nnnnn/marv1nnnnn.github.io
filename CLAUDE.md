# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chaotic Early-Web OS** is a Next.js 14 application that creates a nostalgic desktop environment celebrating early web aesthetics. It features an interactive desktop with draggable windows, multiple AI personalities, mini-games, and a sophisticated 3D brain visualization system built with Three.js and React Three Fiber.

## Development Commands

```bash
# Start development server
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Start production server
npm start

# Run linting
npm run lint
```

## Code Architecture

### Core Application Structure

The app follows Next.js 14 App Router conventions with these key architectural patterns:

- **Provider Chain**: The main page wraps components in multiple context providers in this order:
  - `AIChatProvider` → `WindowManagerProvider` → `ChaosProvider` → `AudioVisualProvider` → `Desktop`

- **Component-Based Desktop**: The main `Desktop` component manages the desktop environment, windows, and application launcher

- **Modular Program System**: Applications are registered in `src/config/programRegistry.ts` with lazy loading for performance

### 3D Brain Visualization System

Located in `src/components/brain/`, this is a sophisticated Three.js implementation:

- **Brain.tsx**: Core 3D model with procedural geometry, vertex coloring, custom shaders, and raycasting
- **BrainDashboard.tsx**: Main UI container orchestrating the 3D scene and 2D overlays  
- **useBrainCamera.tsx**: State-based camera control with smooth transitions and auto-rotation
- **useBrainRaycasting.tsx**: Mouse-to-3D interaction using raycasting for region detection

Data flow: User interaction → Raycasting → Region identification → Camera transitions → UI updates

### Configuration Systems

- **Program Registry** (`src/config/programRegistry.ts`): Defines all launchable applications with lazy loading, window sizing, and auto-launch behavior
- **AI Personalities** (`src/config/personalities.ts`): Configures different AI terminal personalities
- **Brain Mapping** (`src/config/brainMapping.ts`): Maps 3D brain regions to available modules/applications

### Content Management

- **Blog System**: Static markdown files in `public/blog/` with metadata in `blog-metadata.json`
- **Music Playlist**: JSON configuration in `public/music/playlist.json`

## Key Dependencies

- **React Three Fiber**: 3D rendering and Three.js integration
- **Framer Motion**: Animations and transitions
- **React Spring**: Physics-based animations for camera movement
- **Tone.js**: Audio synthesis and effects
- **Howler.js**: Audio playback management
- **React Draggable/RND**: Window dragging and resizing

## Development Standards

### Component Patterns
- Use lazy loading for program components to improve initial load performance
- Implement proper cleanup in useEffect hooks, especially for audio/3D resources
- Follow the established provider pattern for state management

### File Organization
- Components: `/src/components/` (with subdirectories for complex systems like `brain/`)
- Hooks: `/src/hooks/` (with subdirectories like `brain/` for specialized hooks)
- Configuration: `/src/config/`
- Context Providers: `/src/contexts/`
- Services: `/src/services/`

### TypeScript Usage
- Define proper interfaces for component props and configuration objects
- Use proper typing for Three.js objects and React Three Fiber components
- Maintain type safety for the program registry and configuration systems

## Adding New Programs

To add a new desktop application:

1. Create component in `/src/components/`
2. Add lazy import in `programRegistry.ts`
3. Define program configuration with proper sizing and metadata
4. Test window management integration

## Mouse Protocol Integration

This project uses a sophisticated Mouse Protocol system (see `.cursorrules` and `.cursor/rules/core_protocol.mouse.mdc`) that requires:

- All file modifications must be tracked as formal Mouse Tasks
- Detailed logging of all changes and state transitions
- Sequential TaskID generation following the `MOUSE#TASK_DDDD` pattern
- Proper task lifecycle management with states: Pending → Ready → Planning/InProgress → Review → Done

When working on this project, follow the Mouse Protocol guidelines for task creation, execution logging, and file operation tracking.