# Code Style & Conventions

## TypeScript Standards
- **Strict TypeScript** configuration enabled
- Comprehensive type definitions in `src/types/index.ts`
- All components use strict typing with interfaces
- Generic types for React hooks and complex state

## Component Patterns
- **Functional components** with React hooks
- **Props interfaces** named `{ComponentName}Props`
- **Client-side rendering** directive `'use client'` for 3D components
- Components receive `windowId: string` prop for window management

## Styling Approach
- **CSS-in-JS** using styled-jsx for component-specific styles
- **CSS custom properties** in `globals.css` for design system
- **Suda51 color palette** with semantic variable names
- **CRT effects, film grain, scanlines** throughout interface

## Animation Guidelines
- **GSAP for complex animations** (entrance, glitches, state transitions)
- **Framer Motion for React-specific** animations
- Standard entrance pattern: `opacity: 0 → 1`, `scale: 0.8 → 1`, `y: 20 → 0`
- **Stagger animations** for multiple elements (desktop icons, UI elements)
- **Glitch effects**: Random x/y translation with rotationZ, brief duration

## Audio Integration
- **AudioContext** hook (`useAudio()`) in all interactive components
- **`playSound(soundId)`** calls on user interactions
- Specific sound IDs: 'click', 'hover', 'windowOpen', 'targetHit', etc.
- **No external audio files** - all procedurally generated

## Naming Conventions
- **PascalCase** for components and types
- **camelCase** for variables, functions, props
- **UPPER_CASE** for constants and data arrays
- **kebab-case** for CSS classes and file paths

## Import Organization
- **React imports** first
- **Third-party libraries** second  
- **Internal components/utilities** third
- **Types** last