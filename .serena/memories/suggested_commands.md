# Suggested Development Commands

## Essential Commands

### Development & Build
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build with static export
npm run start        # Start production server
npm run lint         # Run ESLint code linting
```

### Package Management
```bash
pnpm add <package>   # Add dependencies (use pnpm, not npm)
pnpm install         # Install all dependencies
```

## Testing & Quality Assurance
- **Linting**: `npm run lint` (must pass before deployment)
- **TypeScript**: Compilation checked during build process
- **Build verification**: `npm run build` ensures static export works

## Environment Setup
```bash
cp .env.example .env.local    # Copy environment template
# Edit .env.local with actual XAI_API_KEY
```

## Git Workflow
```bash
git status           # Check current status
git add .            # Stage changes
git commit -m "..."  # Commit with message
git push origin <branch>  # Push to remote
```

## System Commands (Linux/WSL)
```bash
ls -la               # List files with details
cd <directory>       # Change directory  
pwd                  # Show current path
code .               # Open in VS Code
```

## Deployment Notes
- Project is configured for **static export** (`output: 'export'`)
- Compatible with **GitHub Pages**, Netlify, Vercel
- No server-side functionality required (except AI API)
- All 3D assets and audio are client-side generated