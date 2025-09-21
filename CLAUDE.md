# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Transcriptor Pro** is a desktop application for local audio/video transcription using AI. It's built as an Electron app with an integrated Express.js backend, React frontend, and SQLite database. The application runs entirely offline, ensuring complete data privacy.

## Architecture

### Multi-Process Electron Architecture
- **Main Process** (`src/main/`): Handles app lifecycle, window management, and runs an embedded Express server
- **Renderer Process** (`src/renderer/`): React-based UI that communicates with main process via IPC
- **Preload Script** (`src/main/preload.ts`): Secure bridge between renderer and main process

### Integrated Backend
The Express server runs **inside** the Electron main process on port 3001, providing:
- REST API endpoints (`/api/health`, `/api/transcription/*`)
- File upload handling with Multer
- SQLite database operations via Prisma ORM
- Transcription processing queue

### Database Layer
- **SQLite** with Prisma ORM for local storage
- Schema: `Transcription` model with status tracking, progress, and results
- Database file: `prisma/transcriptor.db`
- Prisma client configured for cross-platform (Windows/Linux) compatibility

### TypeScript Configuration
- **Multi-target setup**: Separate tsconfig files for main and renderer processes
- **Path aliases**: `@/main/*`, `@/renderer/*`, `@/shared/*`, `@/types/*`
- Main process compiles to CommonJS, renderer to ESNext

## Development Commands

### Development Mode
```bash
npm run dev
# Starts both renderer (webpack-dev-server on :3000) and main process with hot reload
```

### Building
```bash
npm run build          # Build both main and renderer
npm run build:main     # Build main process only
npm run build:renderer # Build renderer process only  
npm run build:preload  # Build preload script
```

### Running
```bash
npm start             # Run built application
npm run dev          # Development mode with hot reload
```

### Database Operations
```bash
npm run prisma:studio    # Launch Prisma Studio database viewer
npx prisma generate     # Regenerate Prisma client
npx prisma migrate dev  # Create and apply new migration
```

### Code Quality
```bash
npm run lint        # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run format     # Format with Prettier
```

### Distribution
```bash
npm run pack    # Package app (no installer)
npm run dist    # Build distributables for current platform
```

## Key Implementation Details

### IPC Communication Pattern
- Main process exposes APIs via `contextBridge` in preload script
- Renderer calls `window.electronAPI.*` methods
- File operations and backend info accessible via IPC, transcription via HTTP

### Express Server Integration
- Server lifecycle managed by main process (start on app ready, stop on quit)  
- Automatic port conflict resolution (tries 3001, then 3002, etc.)
- CORS enabled for cross-origin requests during development

### Transcription Workflow
1. File selection via IPC (`file:select`)
2. Upload to Express endpoint (`POST /api/transcription/upload`)
3. Async processing with progress updates in database
4. Results stored in SQLite with full metadata

### Database Schema Considerations
- Files are temporarily stored during processing, then deleted
- Only transcription metadata and results are persisted
- Cross-platform Prisma client includes Windows and Linux binaries

### Development Environment Detection
- `isDev()` function checks NODE_ENV and app.isPackaged
- Development mode loads renderer from webpack-dev-server
- Production mode loads from built files

## Windows-Specific Considerations

- Prisma schema includes `binaryTargets: ["native", "windows", "debian-openssl-3.0.x"]`
- npm scripts use `set` instead of `export` for environment variables
- All commands should be run with `npx` prefix for Windows compatibility

## Testing Backend

The Express server can be tested independently:
- Health check: `GET http://127.0.0.1:3001/api/health`
- Transcription list: `GET http://127.0.0.1:3001/api/transcription/list`
- File upload: `POST http://127.0.0.1:3001/api/transcription/upload` (multipart/form-data with 'audio' field)

## Future Integration Points

The codebase is prepared for:
- OpenAI Whisper integration (placeholder service exists)
- FFmpeg for audio/video format conversion
- File format validation and preprocessing
- Real-time transcription progress via WebSockets

When modifying the database schema, always run `npx prisma generate` after changes and rebuild the main process.