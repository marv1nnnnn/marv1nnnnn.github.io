# Task Completion Checklist

## Before Committing Changes

### Code Quality
- [ ] **TypeScript compilation** passes without errors
- [ ] **ESLint** passes: `npm run lint`
- [ ] **Build succeeds**: `npm run build` 
- [ ] All **3D components** have `'use client'` directive
- [ ] **Audio integration** uses `useAudio()` hook and appropriate `playSound()` calls

### Functionality Testing
- [ ] **Component renders** without console errors
- [ ] **Window management** works (dragging, resizing, focus)
- [ ] **Audio feedback** plays on interactions
- [ ] **Responsive design** works on different screen sizes
- [ ] **Animations** execute smoothly with GSAP/Framer Motion

### Architecture Compliance
- [ ] **File paths** follow project structure conventions
- [ ] **TypeScript interfaces** defined for new components
- [ ] **Prop types** correctly defined and used
- [ ] **State management** follows existing patterns
- [ ] **Import organization** follows project standards

### Design System Adherence
- [ ] **Suda51 color palette** used via CSS custom properties
- [ ] **Typography** uses system fonts (Courier New, monospace)
- [ ] **CRT effects** and visual styling maintained
- [ ] **Button hover effects** include `translate(-1px, -1px)`

### AI/Audio Integration (if applicable)
- [ ] **xAI API** calls handle errors gracefully with fallbacks
- [ ] **Audio context** initializes properly after user interaction
- [ ] **Sound IDs** are appropriate for user actions

## Deployment Readiness
- [ ] **Static export** builds successfully
- [ ] **No external dependencies** break client-side rendering
- [ ] **Environment variables** documented in .env.example
- [ ] **Asset optimization** complete (images unoptimized flag set)