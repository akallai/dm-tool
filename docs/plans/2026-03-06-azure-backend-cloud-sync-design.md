# Azure Backend & Cloud Sync Design

## Context

The `feature-azure-backend` branch has infrastructure (Terraform) and a Python Azure Functions API for media CRUD already built. The frontend still stores everything in localStorage/IndexedDB. This design completes the backend integration and adds full workspace cloud sync.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Source of truth | Server (Azure Blob Storage) | Single-user tool, no conflict resolution needed |
| Offline behavior | Hard fail, error screen | Simplest implementation, no sync/queue complexity |
| Workspace storage | Single JSON blob (`workspace/state.json`) | Small data (<1MB), atomic saves, simple API |
| Migration of local data | Fresh start, no migration | Single user, avoids migration complexity |
| Authentication | Gate entire app behind Entra ID | Personal tool, no reason for unauthenticated access |
| Workspace API | Reuse existing media API | No new backend code, media API already does CRUD on blobs |

## Architecture

### Blob Path Convention

```
workspace/state.json          - full workspace state (tabs, widgets, settings, data)
files/{widgetId}/{filename}   - PDF/image files (Image/PDF Viewer, Notepad)
wiki-images/{widgetId}/{id}   - wiki embedded images
audio/{widgetId}/{trackId}    - music widget tracks
```

### New Angular Services

**`MediaService`** (`frontend/src/app/services/media.service.ts`)
- Wraps `/api/media` endpoints with typed methods
- `listFiles(prefix?: string): Observable<FileMetadata[]>`
- `downloadFile(filename: string): Observable<Blob>`
- `uploadFile(filename: string, data: Blob, contentType: string): Observable<void>`
- `deleteFile(filename: string): Observable<void>`
- Uses `HttpClient`, no auth headers needed (SWA handles via cookies)

**`WorkspacePersistenceService`** (`frontend/src/app/services/workspace-persistence.service.ts`)
- `loadWorkspace(): Observable<WorkspaceState>`
- `saveWorkspace(state: WorkspaceState): Observable<void>`
- Debounced auto-save (2s after last change)
- Uses `MediaService` to read/write `workspace/state.json`

### Changes to Existing Services

**`WorkspaceService`**: Replace all localStorage calls with `WorkspacePersistenceService`. Load from server on startup, save on every state change (debounced).

**`WidgetStorageService`**: Widget data goes into the workspace blob instead of localStorage.

**`FileStorageService`**: Replace IndexedDB with `MediaService`. Files stored at `files/{widgetId}/{filename}`.

**`WikiImageStorageService`**: Replace IndexedDB with `MediaService`. Images stored at `wiki-images/{widgetId}/{id}`. Remove blob URL cache.

**`AudioStorageService`**: Replace IndexedDB with `MediaService`. Audio stored at `audio/{widgetId}/{trackId}`.

### App Startup Flow

1. SWA authenticates user (Entra ID redirect)
2. Angular app boots
3. `WorkspaceService` calls `WorkspacePersistenceService.loadWorkspace()`
4. Blob exists -> load and render workspace
5. Blob doesn't exist (first use) -> create default empty workspace
6. Server unreachable -> show full-screen error with retry button

### Authentication

- Add `{"route": "/*", "allowedRoles": ["authenticated"]}` to `staticwebapp.config.json`
- Keep existing 401 -> AAD redirect override
- `/api/health` remains public

### Error Handling

- **Startup failure**: Full-screen error with retry button
- **Auto-save failure**: Persistent banner, exponential backoff retry (max 3 attempts)
- **All retries exhausted**: Banner stays, user warned changes may be lost
- **File upload failure**: Error shown in the specific widget

### CI/CD

Replace GitHub Pages deployment with `Azure/static-web-apps-deploy@v1` including `api_location: ./api`.

## Scope

### In Scope

1. Branch cleanup (merge master, delete stale branches)
2. Fix CI/CD for Azure SWA deployment
3. Gate entire app behind Entra ID
4. Angular `MediaService`
5. `WorkspacePersistenceService` with debounced auto-save
6. Rewire `WorkspaceService` and `WidgetStorageService` to server
7. Rewire `FileStorageService`, `WikiImageStorageService`, `AudioStorageService` to media API
8. Loading/error states for server connectivity
9. Widget blob cleanup on widget deletion

### Out of Scope

- Migration of existing localStorage/IndexedDB data
- Offline mode or local cache fallback
- Multi-campaign / multi-workspace support
- Player view
- Frontend polish (z-index, typed settings, dialog cleanup)
- Tests
- Swagger UI updates
