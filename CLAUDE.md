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
npm test               # Run unit tests with Jest
```

### Full Stack Local Development
```bash
# Terminal 1: Angular dev server
cd frontend && npm start

# Terminal 2: SWA CLI with API (requires AAD env vars for auth)
cd frontend && AAD_CLIENT_ID=<client-id> AAD_CLIENT_SECRET=<secret> swa start http://localhost:4200 --api-location ./api
# Opens http://localhost:4280 (frontend + API at /api/*)
# Auth redirects to mock login locally; use any identity to proceed
```

The API requires `frontend/api/local.settings.json` (gitignored) with `STORAGE_CONNECTION_STRING`. Get it via:
```bash
az storage account show-connection-string --name <account> --resource-group <rg> --query connectionString -o tsv
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
terraform output -raw static_web_app_api_key   # Get deployment token (may be stale)
```

### Deployment
**Important:** The terraform `static_web_app_api_key` output can become stale if the key was rotated or the resource recreated. If deployment silently fails with "No matching static site found" (visible only with `--dry-run`), fetch a fresh token via Azure CLI:
```bash
az staticwebapp secrets list --name swa-dmtool-dev --resource-group rg-dmtool-dev --query "properties.apiKey" -o tsv
```

Deploy:
```bash
./deploy.sh   # Fetches token, installs Python packages, builds frontend, deploys
```

**Gotcha:** SWA CLI does not auto-install Python packages — the script handles this by pip-installing into `.python_packages/` targeting Linux x86_64. This directory is gitignored and regenerated on each deploy.

**Gotcha:** SWA CLI v2.0.7 exits with code 0 even when deployment fails due to an invalid token. Always verify with `--dry-run` first if unsure, or check the deployed bundle hash after deploying.

## Architecture Overview

### Azure Infrastructure
- **Static Web App (Free)**: Hosts Angular frontend + managed Python functions
- **Storage Account (LRS Cool)**: Blob storage for all persistent data
- **Authentication**: Microsoft Entra ID (single-tenant, `AzureADMyOrg`)
- **Entra ID App Registration**: `dm-tool-dev` (client ID: `b60842ec-65d7-41f5-8f06-3d238a0851bd`)
- Cost: ~$1/month

### Authentication & Authorization
- Entire app gated behind Entra ID via `staticwebapp.config.json` (`/*` → `authenticated`)
- Only `/api/health` is public (anonymous)
- 401 responses auto-redirect to `/.auth/login/aad`
- Single-tenant: only users in tenant `3f4af33b-1e68-41d9-9620-2838b6689df4` can access
- Guest users can be invited via Azure AD to grant external access
- SWA CLI requires `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET` as environment variables (not from `local.settings.json`)

### Data Persistence
All persistence is server-side via Azure Blob Storage through the media API:
- **`workspace/state.json`**: Single blob holding all workspace state (tabs, widgets, positions, settings, background index)
- **`files/{widgetId}/`**: Binary files for IMAGE_PDF widgets
- **`wiki-images/{widgetId}/{imageId}`**: Wiki widget images (+ `.meta` JSON sidecar)
- **`audio/{widgetId}/{mappingId}/`**: Music widget audio files (+ `meta.json` index)
- No localStorage or IndexedDB usage — the server is the single source of truth

### Frontend Architecture
- **Workspace System**: Tab-based interface where each tab contains multiple widgets
- **Widget Architecture**: Standalone Angular components with drag-and-drop, resize, and settings
- **Services Layer**: Centralized state management and server-backed persistence
- **Settings System**: Dynamic configuration system with typed field definitions
- **Loading Flow**: `AppComponent` loads workspace from server → shows spinner → passes `initialState` to `WorkspaceComponent`
- **Error Handling**: Connection error screen with retry, save-error banner with exponential backoff

### Key Services
- `MediaService`: HTTP client wrapper for `/api/media` CRUD endpoints (foundation for all persistence)
- `WorkspacePersistenceService`: Loads/saves `workspace/state.json` blob with 2s debounced saves, retry logic, and `saveError$` observable
- `WorkspaceService`: In-memory workspace state (tabs, active tab) shared across components
- `FileStorageService`: Stores/retrieves binary files via `MediaService` (replaces former IndexedDB)
- `WikiImageStorageService`: Wiki image CRUD with blob URL caching (replaces former IndexedDB)
- `AudioStorageService`: Audio file CRUD with data URL ↔ blob conversion (replaces former IndexedDB)
- `SettingsService`: Handles widget configuration dialogs with typed field schemas

### Widget System
All widgets follow this pattern:
- Standalone Angular components in `frontend/src/app/widgets/`
- Implement settings interface via `getWidgetSettingsConfig()`
- Support drag/drop positioning and resizing via `WidgetContainerComponent`
- Persist state through `WorkspacePersistenceService` (workspace JSON) and `MediaService` (binary files)
- Custom settings defined in `frontend/src/app/workspace/widget-container/widget-container.component.ts`
- Widget deletion triggers blob cleanup for all associated prefixes (`files/`, `wiki-images/`, `audio/`)

### Widget Types
- `IMAGE_PDF`: File viewer with drag-and-drop support
- `RANDOM_GENERATOR`: Customizable random tables with weighted selection
- `DICE_TOOL`: RPG dice roller with custom notation
- `MUSIC_WIDGET`: Audio playback with multiple tracks
- `WIKI_WIDGET`: Hierarchical article system with TipTap WYSIWYG editor, wiki-links (including header anchors), and table support
- `COMBAT_TRACKER`: Initiative and HP tracking (includes Mutant Year Zero support)
- `DAYTIME_TRACKER`: Visual time progression tracking
- `LLM_CHAT`: AI chat integration with OpenAI API
- `HEX_MAP`: SVG-based hex grid map with paint, select, and path drawing modes
- `NAME_GENERATOR`: Random name generator with fantasy and real-world culture presets

### API Endpoints
Python Azure Functions in `frontend/api/`:
- `GET /api/health` - Health check (public, anonymous)
- `GET /api/media` - List media files (supports `?prefix=` query param)
- `GET /api/media/{filename}` - Download file
- `PUT /api/media/{filename}` - Upload file
- `DELETE /api/media/{filename}` - Delete file

## Technical Details

### Dependencies
- Angular 19 with Material Design (Azure Blue theme)
- TipTap for WYSIWYG editing in Wiki Widget
- honeycomb-grid for hex map calculations
- pdfjs-dist for PDF rendering
- azure-functions and azure-storage-blob (Python API)

### Build Configuration
- SCSS styling
- Bundle size limits: 3MB warning, 5MB error (production)

## Workflow Rules

- When finishing a feature, always add it to `CHANGELOG.md` under the `[Unreleased]` section following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## Widget Development

When creating new widgets:
1. Create standalone component in `frontend/src/app/widgets/`
2. Add to `WidgetType` enum in `widget-selector-dialog.component.ts`
3. Import in `widget-container.component.ts`
4. Add settings configuration in `getWidgetSettingsConfig()` method
5. Add title mapping in `getTitle()` method
6. If widget stores binary data, add cleanup prefix in `WorkspaceComponent.cleanupWidgetBlobs()`

## Infrastructure

### Terraform Modules
- `modules/storage/` - Storage Account with media container and lifecycle policies
- `modules/static-web-app/` - Static Web App with app settings

### Environments
- `environments/dev/` - Development environment
- `environments/prod/` - Production environment

### Remote State
State stored in Azure Storage: `tfstatedmtool` in `rg-terraform-state`

### CI/CD
GitHub Actions workflow (`.github/workflows/frontend.yml`) uses `Azure/static-web-apps-deploy@v1`:
- Triggers on push to `master` and PRs against `master`
- Requires `AZURE_STATIC_WEB_APPS_API_TOKEN` GitHub secret
- Builds frontend from `/frontend`, API from `/frontend/api`, output at `dist/dm-tool/browser`
