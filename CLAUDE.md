# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DM Tool is a monorepo containing a digital toolkit for Game Masters running tabletop RPG sessions.

### Repository Structure
```
dm-tool/
├── frontend/          # Angular 19 web application
│   ├── src/           # Angular source code
│   └── api/           # Python Azure Functions (managed functions)
└── infrastructure/    # Terraform configurations for Azure
```

## Common Commands

### Frontend Development
All frontend commands should be run from the `frontend/` directory:
```bash
cd frontend
npm start              # Start development server on http://localhost:4200
npm run build          # Build for production (outputs to dist/dm-tool/browser)
npm test               # Run unit tests with Karma
```

### Full Stack Local Development
```bash
# Terminal 1: Angular dev server
cd frontend && npm start

# Terminal 2: SWA CLI with API
cd frontend && swa start http://localhost:4200 --api-location ./api
# Opens http://localhost:4280 (frontend + API at /api/*)
```

### API Development
```bash
cd frontend/api
pip install -r requirements.txt    # Install Python dependencies
func start                         # Run functions locally (requires Azure Functions Core Tools)
```

### Infrastructure Provisioning
```bash
cd infrastructure/environments/dev   # or prod
terraform init
terraform plan
terraform apply
terraform output -raw static_web_app_api_key   # Get deployment token
```

### Deployment
```bash
cd frontend
npm run build
swa deploy ./dist/dm-tool/browser --api-location ./api --api-language python --api-version 3.10 --env production --deployment-token <TOKEN>
```

## Architecture Overview

### Azure Infrastructure
- **Static Web App (Free)**: Hosts Angular frontend + managed Python functions
- **Storage Account (LRS Cool)**: Media blob storage with lifecycle policies
- **Authentication**: Microsoft Entra ID (built-in, free)
- Cost: ~$1/month

### Frontend Architecture
- **Workspace System**: Tab-based interface where each tab contains multiple widgets
- **Widget Architecture**: Standalone Angular components with drag-and-drop, resize, and settings
- **Services Layer**: Centralized state management for workspace, settings, and widget storage
- **Settings System**: Dynamic configuration system with typed field definitions

### Key Services
- `WorkspaceService`: Manages tabs, active tab state, and widget instances
- `SettingsService`: Handles widget configuration dialogs with typed field schemas
- `WidgetStorageService`: Persistent storage for widget data using localStorage

### Widget System
All widgets follow this pattern:
- Standalone Angular components in `frontend/src/app/widgets/`
- Implement settings interface via `getWidgetSettingsConfig()`
- Support drag/drop positioning and resizing via `WidgetContainerComponent`
- Persist state through `WidgetStorageService`
- Custom settings defined in `frontend/src/app/workspace/widget-container.component.ts:104-300`

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
- `HEX_MAP`: SVG-based hex grid map with paint, select, and path drawing modes
- `NAME_GENERATOR`: Random name generator with fantasy and real-world culture presets

### API Endpoints
Python Azure Functions in `frontend/api/`:
- `GET /api/health` - Health check (public)
- `GET /api/media` - List media files
- `GET /api/media/{filename}` - Download file
- `PUT /api/media/{filename}` - Upload file
- `DELETE /api/media/{filename}` - Delete file

### Data Persistence
- Widget data stored in localStorage (frontend)
- Media files stored in Azure Blob Storage (backend)
- Workspace layout automatically saved

## Technical Details

### Dependencies
- Angular 19 with Material Design (Azure Blue theme)
- TipTap for WYSIWYG editing in Wiki Widget
- honeycomb-grid for hex map calculations
- pdfjs-dist for PDF rendering
- azure-functions and azure-storage-blob (Python API)

### Build Configuration
- SCSS styling
- Bundle size limits: 500kB warning, 1MB error

## Widget Development

When creating new widgets:
1. Create standalone component in `frontend/src/app/widgets/`
2. Add to `WidgetType` enum in `widget-selector-dialog.component.ts`
3. Import in `widget-container.component.ts`
4. Add settings configuration in `getWidgetSettingsConfig()` method
5. Add title mapping in `getTitle()` method

## Infrastructure

### Terraform Modules
- `modules/storage/` - Storage Account with media container and lifecycle policies
- `modules/static-web-app/` - Static Web App with app settings

### Environments
- `environments/dev/` - Development environment
- `environments/prod/` - Production environment

### Remote State
State stored in Azure Storage: `tfstatedmtool` in `rg-terraform-state`
