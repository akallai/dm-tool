# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Media Browser multiselect** — Browse button in music widget settings now supports selecting multiple files at once to build playlists

### Fixed
- **Loading spinners** — Music Widget now shows a spinner while audio files download; Image/PDF Viewer uses `mat-spinner` instead of plain text "Loading..." (#10)
- **Wiki sidebar scroll** — replaced broken CDK virtual scroll with native scrolling to fix scroll position miscalculations with nested articles (#6)

### Changed
- **LLM Chat widget** — API requests now proxy through `/api/chat` backend instead of direct OpenAI calls; switched provider to OpenRouter; API key moved to server-side environment variable

### Removed
- **LLM Chat wiki context** — removed automatic wiki article injection into LLM context
- **LLM Chat API key setting** — no longer needed in widget settings (handled server-side)

### Changed
- **Settings dialog** — renamed "Save" button to "Apply" to clarify it only applies changes in-memory (actual persistence requires Ctrl+S)
- **Manual save** — replaced autosave with explicit save button (+ Ctrl+S) to reduce server requests; wiki content also saves only on button click with close confirmation for unsaved changes
- **Wiki widget** — wikis are now independent entities stored in cloud storage, not tied to widget instances
- Wiki picker dialog for creating, opening, and deleting wikis (similar to PDF viewer pattern)
- Deleting a wiki widget no longer deletes wiki data
- Wiki images stored under wiki-scoped paths (`wikis/{wikiId}/images/`)
- Existing wikis auto-migrate from widget settings to blob storage on first load
- **Random Generator** — table collections are now independent cloud-backed entities (like wikis), not tied to widget instances
- Random table picker dialog for creating, opening, and deleting table collections
- Multiple Random Generator widgets can share the same table collection
- Existing random generators auto-migrate embedded mappings to blob storage on first load

### Removed
- File System Access API code from Random Generator (was non-functional in cloud architecture)

### Fixed
- **API 500 errors** — pre-install Python packages (azure-storage-blob) for SWA managed functions deployment
- **Workspace save/load 404** — use catch-all route `{*filename}` in API to handle URL-encoded slashes in blob paths
- **List endpoint routing conflict** — handle empty filename in get_media to prevent catch-all from stealing list route

### Added
- **Media browser dialog** for browsing shared rulebooks, shared sounds, and user files
- **Shared media support** — access pre-loaded content from blob storage (`rulebooks/`, `sounds/`)
- User file upload and deletion from media browser
- IMAGE_PDF widget "Browse Library" button for selecting shared/user files
- Music widget "Browse" button for shared sounds in mapping settings
- **Azure backend cloud sync** — all persistence moved from localStorage/IndexedDB to Azure Blob Storage
- **Microsoft Entra ID authentication** — entire app gated behind single-tenant AAD login
- **Per-user storage scoping** — each user's data isolated under `users/{userId}/` in blob storage
- `MediaService` for Azure Blob Storage CRUD via `/api/media` endpoints
- `WorkspacePersistenceService` with debounced saves, retry logic, and error observable
- Loading spinner and error screen during workspace load from server
- Save-error banner with exponential backoff retry
- Blob cleanup on widget deletion (files, wiki images, audio)
- Auth interceptor to forward user identity to API in local dev
- Azure Static Web Apps CI/CD deployment (replacing GitHub Pages)

### Changed
- `FileStorageService` rewritten from IndexedDB to Azure Blob Storage
- `WikiImageStorageService` rewritten from IndexedDB to Azure Blob Storage
- `AudioStorageService` rewritten from IndexedDB to Azure Blob Storage
- `WorkspaceComponent` rewired to use server-backed persistence
- `AppComponent` now loads workspace state from server before rendering
- **Wiki widget is now fully cloud-only** — all data persists via Azure Blob Storage, no local file operations
- Wiki widget auto-initializes with a Welcome article when first added

### Removed
- **Notepad widget** — superseded by Wiki widget (WYSIWYG editor with cloud persistence)
- Wiki local file operations (Open, New, Save to disk via File System Access API)
- Wiki ZIP import/export and `jszip` dependency
- `WikiFileHandleService` (IndexedDB file handle persistence)
- `WikiExportService` (ZIP archive service)
- `WidgetStorageService` (replaced by server-side persistence)
- localStorage and IndexedDB usage for all data storage
- GitHub Pages deployment workflow

## [0.5.0] - 2026-02-17

### Added
- Wiki header navigation — wiki links can now target specific headers within articles

### Fixed
- Wiki links no longer accidentally open in new browser tabs

## [0.4.0] - 2026-01-22

### Added
- Azure Functions API backend (health check, media CRUD endpoints)
- Terraform infrastructure modules for Azure Storage Account and Static Web App

## [0.3.0] - 2026-01-10

### Added
- **Hex Map widget** — SVG-based hex grid with paint, select, and path drawing modes
- **Random Name Generator widget** — fantasy and real-world culture name presets
- **Countdown widget**
- PDF text search
- Wiki widget rewrite with TipTap WYSIWYG editor, image support, and save status indicator
- Combat tracker redesign
- Music widget shuffle, previous, and next track buttons
- Daytime tracker time adjustment buttons
- New background images

### Changed
- Replace lodash with custom debounce utility

### Fixed
- PDF viewer rendering issues
- Wiki save reliability
- Music playback not stopping on widget close

## [0.2.0] - 2026-01-04

### Added
- **LLM Chat widget** — AI chat integration with OpenAI API and configurable temperature
- **Tabs system** — multi-tab workspace with rename support
- Weighted probability in random generator
- Categorizable random elements in random generator
- Dialog-based background selector (replacing overlay buttons)
- Widget selector redesign with grid layout and custom icons
- Music widget volume slider redesign
- Settings button hidden when widget has no configuration

### Changed
- Tabs UI refactored to horizontal layout
- Music widget refactored
- Notepad simplified (removed markdown rendering)
- Dice tool settings updated to use checkboxes with custom buttons

### Fixed
- Widget persistence across page reloads (wiki, random generator, music, LLM chat)
- Combat tracker update bug
- Tab bar widget overlaying
- Music widget file selection display
- Performance improvements and memory leak fix
- Widgets constrained to stay on screen

## [0.1.0] - 2025-02-13

### Added
- **Image/PDF Viewer widget** — drag-and-drop file viewing
- **Notepad widget** — text editor with markdown support
- **Dice Tool widget** — RPG dice roller with visual dice and custom notation
- **Random Generator widget** — customizable random tables with import
- **Music widget** — audio playback with multiple tracks and randomizer
- **Wiki widget** — hierarchical article system with search
- **Combat Tracker widget** — initiative and HP tracking with Mutant Year Zero support
- **Daytime Tracker widget** — visual time progression
- Drag-and-drop widget positioning and resizing
- Fullscreen mode
- Workspace background customization
- Widget state persistence via localStorage
- GitHub Pages deployment
