# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Transmitter-Receiver OS is a Suda51-inspired personal website that functions as a surreal, interactive desktop operating system. Built with Next.js 14, TypeScript, and React Three Fiber, it recreates the aesthetic and narrative themes of the "Kill the Past" universe through a fragmented, unreliable interface.

## Development Commands

**Build and Development:**
```bash
npm run dev          # Start development server
npm run build        # Production build with static export
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Package Management:**
```bash
pnpm add <package>   # Use pnpm for adding dependencies (not npm)
```

## Architecture Overview

### Core Design Philosophy
The OS simulates a digital consciousness interface with intentional glitches, unreliable data, and cryptic system messages. Everything is themed around conspiracy, fractured identity, and unstable information transmission.

### Application Structure
**Main OS Components:**
- `BootSequence.tsx` - Cryptic startup sequence with procedural errors
- `Desktop.tsx` - Main environment with cursor trails and random glitches  
- `WindowManager.tsx` - Handles draggable windows using react-rnd
- `AudioContext.tsx` - Web Audio API system for procedural sound generation

**Core Applications (Windows):**
- **Case File Reader** (`CaseFileReader.tsx`) - Blog system with "Film Window" interface, typewriter effects, keyword glitching
- **Heaven's Smile Gallery** (`HeavensSmileGallery.tsx`) - 3D portfolio using Three.js, targeting system mechanics
- **Catherine's Suitcase** (`CatherinesSuitcase.tsx`) - 3D music player with rotatable PS2-era model
- **Lost & Found Games** (`LostFoundGames.tsx`) - Mini-game launcher with "Soul Shells" currency
- **Transmitted Consciousness** (`TransmittedConsciousness.tsx`) - AI chat interface using xAI Grok API

### Technical Stack Integration

**3D Graphics (React Three Fiber):**
- Projects use `@react-three/fiber` with `@react-three/drei` helpers
- Custom 3D models for Catherine's Suitcase music player
- Targeting system mechanics in Heaven's Smile Gallery
- All 3D components require `'use client'` directive

**Animation Systems:**
- **GSAP** for sharp, impactful UI transitions and glitch effects
- Window entrance animations, progress bars, target spawning
- Desktop icon staggered entrance animations
- Glitch shake effects with random transforms

**Audio Architecture:**
- **AudioContext** provides Web Audio API-based procedural sound generation
- 10+ system sounds: boot, click, hover, error, windowOpen/Close, typing, glitch, targetHit, gameStart/Over, success
- No external audio files - all sounds generated programmatically
- Use `useAudio()` hook and `playSound(soundId)` throughout components

**AI Integration:**
- xAI Grok API integration in `/api/chat/route.ts`
- Fallback responses when API unavailable
- Cryptic personality with unreliable narrator characteristics
- Environment variable: `XAI_API_KEY` in `.env.local`

### TypeScript Architecture

**Comprehensive type system in `src/types/index.ts`:**
- `WindowState` - Window management with position, focus, z-index
- `ProjectTarget` - 3D portfolio projects with positions, shapes, colors
- `TruthSearchKeyword`, `TargetingTarget` - Game-specific mechanics  
- `SystemState` - Global OS state including glitch levels, connection status
- `BootPhase` - Boot sequence configuration with error chances

**Key Patterns:**
- All components use strict TypeScript with comprehensive interfaces
- Window components receive `windowId: string` prop
- Applications are registered through icon mappings in Desktop.tsx
- State management uses React hooks with TypeScript generics

### Configuration & Build

**Static Export Configuration:**
- `next.config.js` configured for static export (`output: 'export'`)
- Images unoptimized for static hosting
- ESM externals set to 'loose' for Three.js compatibility

**Critical Dependencies:**
- `react-rnd` for draggable/resizable windows
- `gsap` for animations (already installed)
- `@react-three/fiber` + `@react-three/drei` for 3D scenes
- `@ai-sdk/xai` + `ai` for AI chat functionality

### Development Patterns

**Component Architecture:**
- Main applications are windows that receive window management props
- Each app maintains its own state and handles window lifecycle
- Games track scores and use "Soul Shells" currency system
- All interactive elements play system sounds via AudioContext

**Styling Approach:**
- CSS-in-JS using styled-jsx for component-specific styles
- Global Suda51 color palette in `globals.css` with CSS variables
- CRT effects, film grain, scanlines throughout interface
- Button hover effects with `translate(-1px, -1px)` for depth

**Animation Guidelines:**
- Use GSAP for entrance animations, glitches, and state transitions
- Entrance animations: `opacity: 0 → 1`, `scale: 0.8 → 1`, `y: 20 → 0`
- Glitch effects: Random `x/y` translation with `rotationZ`, brief duration
- Stagger animations for multiple elements (desktop icons, UI elements)

**Audio Integration:**
- Wrap new components with `useAudio()` hook
- Call `playSound()` on user interactions: clicks, hovers, game events
- Use specific sound IDs: 'click', 'hover', 'windowOpen', 'targetHit', etc.
- Audio provides immediate feedback for all user actions

### AI Personality Configuration

The Transmitted Consciousness uses a cryptic, unreliable personality:
- Responds with philosophical questions rather than direct answers
- References non-existent "case files" and conspiracy elements  
- Switches tones unexpectedly while maintaining technical knowledge
- Glitches responses occasionally with redacted text and system messages

### Testing & Deployment

**Build Requirements:**
- TypeScript compilation must pass without errors
- Static export generates all pages successfully  
- Three.js components require client-side rendering
- Audio context requires user interaction to initialize

**Environment Setup:**
- Copy `.env.example` to `.env.local` for xAI API key
- No external audio assets needed (procedural generation)
- Static export ready for GitHub Pages or similar hosting