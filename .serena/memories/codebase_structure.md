# Codebase Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/          # xAI Grok API endpoints
│   ├── globals.css        # Suda51 design system
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── applications/      # OS Applications (Windows)
│   │   ├── games/        # Mini-games
│   │   ├── CaseFileReader.tsx      # Blog system
│   │   ├── CatherinesSuitcase.tsx  # 3D music player
│   │   ├── HeavensSmileGallery.tsx # 3D portfolio
│   │   ├── LostFoundGames.tsx      # Game launcher
│   │   └── TransmittedConsciousness.tsx # AI chat
│   ├── BootSequence.tsx   # Startup sequence
│   ├── Desktop.tsx        # Main desktop environment
│   ├── DesktopIcon.tsx    # Desktop icons
│   ├── Taskbar.tsx        # Bottom taskbar
│   ├── Window.tsx         # Individual window
│   └── WindowManager.tsx  # Window management system
├── contexts/
│   └── AudioContext.tsx   # Web Audio API system
└── types/
    └── index.ts           # TypeScript definitions
```

## Key Architecture Patterns

### Component Hierarchy
- **Desktop.tsx** - Main environment, manages windows and system state
- **WindowManager.tsx** - Handles window positioning, dragging, resizing
- **Window.tsx** - Individual window wrapper with controls
- **Applications** - Each app is a separate component receiving `windowId` prop

### State Management
- React hooks with TypeScript generics
- **AudioContext** provides global audio system via `useAudio()` hook
- Window state managed through parent-child prop passing

### File Organization
- All 3D components require `'use client'` directive
- Applications are registered through icon mappings in Desktop.tsx
- Temp artifacts go to `.rooroo/tasks/{TASK_ID}/` (Rooroo system)
- User project files remain at their original paths