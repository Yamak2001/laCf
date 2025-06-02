# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture Overview

This is a Vue 3 + Vite frontend application for a voice isolation system called "laCf" (Loud & Clear). The application provides a web interface for managing voice profiles, processing audio, and working with ML models.

### Tech Stack
- Vue 3 with `<script setup>` syntax
- Vite for build tooling
- Vuetify 3 for UI components with Material Design Icons
- Vue Router for navigation
- Axios for API communication

### Key Architecture Patterns

**API Communication**: Centralized in `src/resources/api.js` with axios client configured to communicate with a backend at `http://localhost:8000`. The API handles voice profiles, audio processing, and model management.

**Routing Structure**: Four main pages accessible via Vue Router:
- Home (`/`) - Main dashboard
- Profiles (`/profiles`) - Voice profile management
- Isolation (`/isolation`) - Audio processing interface
- Models (`/models`) - Available ML models

**Component Organization**: 
- `components/` - Reusable UI components including AppHeader, AudioRecorder, and ModelInfoCard
- `pages/` - Route-level page components
- Vuetify theming configured in `main.js` with custom color scheme

**State Management**: No centralized state management (Vuex/Pinia) - components communicate via props/events and direct API calls.

The backend API expects multipart/form-data for file uploads (voice profiles and audio processing) and standard JSON for other operations.