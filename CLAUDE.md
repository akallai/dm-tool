# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DM Tool is an Angular 19 application that provides digital tools for Game Masters running tabletop RPG sessions. It features a workspace-based architecture with draggable, resizable widgets and persistent tab-based layout management.

## Common Commands

### Development
- `npm start` or `ng serve` - Start development server on http://localhost:4200
- `ng build` - Build for production (outputs to dist/)
- `ng build --watch --configuration development` - Watch mode for development
- `ng test` - Run unit tests with Karma
- `ng deploy` - Deploy to GitHub Pages with base-href=/dm-tool/

### No Linting/Type Checking
This project does not have explicit lint or typecheck commands configured in package.json.

## Architecture Overview

### Core Structure
- **Workspace System**: Tab-based interface where each tab contains multiple widgets
- **Widget Architecture**: Standalone Angular components with drag-and-drop, resize, and settings capabilities
- **Services Layer**: Centralized state management for workspace, settings, and widget storage
- **Settings System**: Dynamic configuration system with typed field definitions

### Key Services
- `WorkspaceService`: Manages tabs, active tab state, and widget instances
- `SettingsService`: Handles widget configuration dialogs with typed field schemas
- `WidgetStorageService`: Persistent storage for widget data using localStorage

### Widget System
All widgets follow this pattern:
- Standalone Angular components
- Implement settings interface via `getWidgetSettingsConfig()` 
- Support drag/drop positioning and resizing via `WidgetContainerComponent`
- Persist state through `WidgetStorageService`
- Custom settings defined in `widget-container.component.ts:104-300`

### Widget Types
- `IMAGE_PDF`: File viewer with drag-and-drop support
- `NOTEPAD`: Markdown editor with preview mode
- `RANDOM_GENERATOR`: Customizable random tables with weighted selection
- `DICE_TOOL`: RPG dice roller with custom notation
- `MUSIC_WIDGET`: Audio playback with multiple tracks
- `WIKI_WIDGET`: Hierarchical article system with TipTap WYSIWYG editor, wiki-links, and table support
- `COMBAT_TRACKER`: Initiative and HP tracking (includes Mutant Year Zero support)
- `DAYTIME_TRACKER`: Visual time progression tracking
- `LLM_CHAT`: AI chat integration with OpenAI API
- `HEX_MAP`: SVG-based hex grid map with paint, select, and path drawing modes (uses honeycomb-grid)
- `NAME_GENERATOR`: Random name generator with fantasy and real-world culture presets (uses @xaroth8088/random-names)

### Data Persistence
- All widget data stored in localStorage
- Workspace layout (tabs, widget positions/sizes) automatically saved
- File System Access API used for file operations where supported

## Technical Details

### Dependencies
- Angular 19 with Material Design
- CDK for drag-and-drop functionality
- Marked for Markdown parsing (used for backward compatibility migration)
- TipTap (@tiptap/core, @tiptap/starter-kit, extensions) for WYSIWYG editing in Wiki Widget
- RxJS for reactive state management
- Karma/Jasmine for testing
- honeycomb-grid for hex map calculations
- @xaroth8088/random-names for name generation
- pdfjs-dist for PDF rendering

### Browser Requirements
- File System Access API (for file operations)
- Modern CSS features (Grid, Flexbox)
- Web Audio API (for music widgets)

### Build Configuration
- Uses SCSS for styling
- Azure Blue Material theme
- GitHub Pages deployment configured
- Bundle size limits: 500kB warning, 1MB error

## Widget Development

When creating new widgets:
1. Create standalone component in `src/app/widgets/`
2. Add to `WidgetType` enum in `widget-selector-dialog.component.ts`
3. Import in `widget-container.component.ts`
4. Add settings configuration in `getWidgetSettingsConfig()` method
5. Add title mapping in `getTitle()` method
6. Follow established patterns for drag-and-drop integration

## File Structure Notes

- `src/app/workspace/` - Core layout and widget container logic
- `src/app/widgets/` - Individual widget components
  - `wiki-widget/` - Wiki with TipTap editor
    - `wiki-link.extension.ts` - Custom TipTap Mark for `[[wiki links]]`
    - `content-migration.util.ts` - Markdown to HTML migration for backward compatibility
- `src/app/services/` - Application services
- `src/app/settings/` - Settings system with typed configurations
- `src/app/dialogs/` - Modal dialogs (widget selector, etc.)
- `public/backgrounds/` - Background images for workspace
- `public/images/` - Static assets (dice images, etc.)