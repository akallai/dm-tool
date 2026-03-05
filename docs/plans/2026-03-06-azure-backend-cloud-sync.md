# Azure Backend & Cloud Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all localStorage/IndexedDB persistence with Azure Blob Storage via the existing media API, turning the server into the single source of truth.

**Architecture:** The Angular frontend communicates with Python Azure Functions (managed by Static Web App) that CRUD blobs in Azure Storage. A single `workspace/state.json` blob holds all workspace state. Binary files (images, audio, PDFs) are stored as separate blobs under prefixed paths. The entire app is gated behind Microsoft Entra ID authentication.

**Tech Stack:** Angular 19, Python Azure Functions, Azure Blob Storage, Azure Static Web Apps, Terraform, GitHub Actions

---

### Task 1: Merge master into feature-azure-backend

**Files:**
- No file changes, git operations only

**Step 1: Verify development branch is fully merged**

Run: `git log --oneline feature-azure-backend..development`
Expected: No output (empty — all development commits are in feature-azure-backend)

**Step 2: Verify settings-refactoring has no unique work**

Run: `git log --oneline master..settings-refactoring`
Expected: No output (no commits ahead of master)

**Step 3: Merge master into feature-azure-backend**

```bash
git checkout feature-azure-backend
git merge master
```

Expected: Merge succeeds (no conflicts expected — the 6 master commits touch wiki-link.extension.ts and wiki-widget.component.ts, while feature-azure-backend moved files but didn't modify widget internals)

If conflicts occur: resolve them keeping the master changes for wiki header links, since the feature branch only moved files.

**Step 4: Delete stale branches**

```bash
git branch -d development
git branch -d settings-refactoring
```

**Step 5: Commit**

No commit needed — merge creates its own commit. Push if desired.

---

### Task 2: Fix CI/CD for Azure Static Web Apps

**Files:**
- Modify: `frontend/.github/workflows/frontend.yml` (entire file)

**Step 1: Replace GitHub Pages deployment with SWA deployment**

Replace the contents of `.github/workflows/frontend.yml` with:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - master
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - master

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4

      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: "/frontend/api"
          output_location: "dist/dm-tool/browser"

  close_pull_request:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

**Step 2: Move workflow file to repo root**

The workflow file is currently at `frontend/.github/workflows/frontend.yml` but GitHub Actions only reads from the repo root `.github/workflows/`. Move it:

```bash
mv frontend/.github/workflows/frontend.yml .github/workflows/frontend.yml
```

Verify `.github/workflows/frontend.yml` is in the repo root (it should already be — check if both exist and consolidate).

**Step 3: Commit**

```bash
git add .github/workflows/frontend.yml
git commit -m "feat: replace GitHub Pages CI/CD with Azure Static Web Apps deployment"
```

---

### Task 3: Gate entire app behind Entra ID

**Files:**
- Modify: `frontend/staticwebapp.config.json`

**Step 1: Add global auth route**

Edit `frontend/staticwebapp.config.json`. Add the global auth route as the FIRST entry in the routes array (before `/api/health`):

```json
{
  "routes": [
    {
      "route": "/api/health",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,json,ico,png,jpg,jpeg,gif,svg,woff,woff2}"]
  },
  "responseOverrides": {
    "401": {
      "statusCode": 302,
      "redirect": "/.auth/login/aad"
    }
  },
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/common/v2.0",
          "clientIdSettingName": "AAD_CLIENT_ID",
          "clientSecretSettingName": "AAD_CLIENT_SECRET"
        }
      }
    }
  },
  "platform": {
    "apiRuntime": "python:3.10"
  }
}
```

Note: The `/api/health` route MUST come before `/*` so it remains public. SWA evaluates routes in order — the first match wins. The old `/api/*` authenticated route is removed because `/*` already covers it.

**Step 2: Commit**

```bash
git add frontend/staticwebapp.config.json
git commit -m "feat: gate entire app behind Entra ID authentication"
```

---

### Task 4: Create MediaService

**Files:**
- Create: `frontend/src/app/services/media.service.ts`

**Step 1: Create the service**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface FileMetadata {
  name: string;
  size: number;
  content_type: string | null;
  last_modified: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private apiBase = '/api';

  constructor(private http: HttpClient) {}

  listFiles(prefix?: string): Observable<FileMetadata[]> {
    const params = prefix ? { prefix } : {};
    return this.http
      .get<{ files: FileMetadata[] }>(`${this.apiBase}/media`, { params })
      .pipe(map(response => response.files));
  }

  downloadFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiBase}/media/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    });
  }

  uploadFile(filename: string, data: Blob, contentType: string): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': contentType });
    return this.http
      .put<void>(`${this.apiBase}/media/${encodeURIComponent(filename)}`, data, { headers });
  }

  deleteFile(filename: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/media/${encodeURIComponent(filename)}`);
  }
}
```

**Step 2: Verify it compiles**

Run: `cd frontend && npx ng build --configuration=development 2>&1 | head -20`
Expected: Build succeeds (service is tree-shaken if unused, but no compile errors)

**Step 3: Commit**

```bash
git add frontend/src/app/services/media.service.ts
git commit -m "feat: add MediaService for Azure Blob Storage API"
```

---

### Task 5: Create WorkspacePersistenceService

**Files:**
- Create: `frontend/src/app/services/workspace-persistence.service.ts`

**Step 1: Create the service**

This service handles loading/saving the workspace JSON blob, with debounced saves.

```typescript
import { Injectable } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';
import { MediaService } from './media.service';
import { Tab } from '../workspace/workspace.component';
import { debounce } from '../utils/debounce';

export interface WorkspaceState {
  tabs: Tab[];
  activeTabId: string;
  backgroundIndex: number;
}

const WORKSPACE_BLOB_PATH = 'workspace/state.json';

@Injectable({
  providedIn: 'root'
})
export class WorkspacePersistenceService {
  private debouncedSave: (state: WorkspaceState) => void;

  constructor(private media: MediaService) {
    this.debouncedSave = debounce((state: WorkspaceState) => {
      this.saveWorkspaceImmediate(state).subscribe({
        error: (err) => console.error('Failed to save workspace:', err)
      });
    }, 2000);
  }

  loadWorkspace(): Observable<WorkspaceState | null> {
    return this.media.downloadFile(WORKSPACE_BLOB_PATH).pipe(
      map(blob => {
        // downloadFile returns a Blob, we need to parse it as JSON
        // This requires converting to text first — use a switchMap approach instead
        return null; // placeholder, see step 2
      })
    );
  }

  // Actual implementation using fetch-style parsing
  loadWorkspaceAsync(): Promise<WorkspaceState | null> {
    return new Promise((resolve, reject) => {
      this.media.downloadFile(WORKSPACE_BLOB_PATH).subscribe({
        next: async (blob) => {
          try {
            const text = await blob.text();
            const state = JSON.parse(text) as WorkspaceState;
            resolve(state);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => {
          if (err.status === 404) {
            resolve(null); // No workspace yet, first use
          } else {
            reject(err);
          }
        }
      });
    });
  }

  saveWorkspace(state: WorkspaceState): void {
    this.debouncedSave(state);
  }

  saveWorkspaceImmediate(state: WorkspaceState): Observable<void> {
    // Strip large binary data from settings before saving
    const stateToSave = this.stripBinaryData(state);
    const json = JSON.stringify(stateToSave);
    const blob = new Blob([json], { type: 'application/json' });
    return this.media.uploadFile(WORKSPACE_BLOB_PATH, blob, 'application/json');
  }

  private stripBinaryData(state: WorkspaceState): WorkspaceState {
    const cloned = JSON.parse(JSON.stringify(state)) as WorkspaceState;
    for (const tab of cloned.tabs) {
      for (const widget of tab.widgets) {
        if (widget.type === 'MUSIC_WIDGET' && widget.settings?.mappings) {
          widget.settings.mappings = widget.settings.mappings.map((mapping: any) => ({
            ...mapping,
            files: mapping.files?.map((file: any) => ({
              fileName: file.fileName
              // fileDataUrl stored in blob storage, not in workspace JSON
            }))
          }));
        }
      }
    }
    return cloned;
  }
}
```

**Step 2: Verify it compiles**

Run: `cd frontend && npx ng build --configuration=development 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/app/services/workspace-persistence.service.ts
git commit -m "feat: add WorkspacePersistenceService for server-backed workspace state"
```

---

### Task 6: Add loading and error states to AppComponent

**Files:**
- Modify: `frontend/src/app/app.component.ts`
- Modify: `frontend/src/app/app.component.html`

**Step 1: Add loading/error state to AppComponent**

Replace `app.component.ts`:

```typescript
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceComponent } from './workspace/workspace.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkspacePersistenceService, WorkspaceState } from './services/workspace-persistence.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    WorkspaceComponent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  loading = true;
  error: string | null = null;
  initialState: WorkspaceState | null = null;

  constructor(
    private persistence: WorkspacePersistenceService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadWorkspace();
  }

  async loadWorkspace() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      this.initialState = await this.persistence.loadWorkspaceAsync();
      this.loading = false;
    } catch (err) {
      this.error = 'Could not connect to server. Please check your connection and try again.';
      this.loading = false;
    }
    this.cdr.markForCheck();
  }

  async retry() {
    await this.loadWorkspace();
  }
}
```

**Step 2: Update app.component.html**

Replace `app.component.html`:

```html
<div *ngIf="loading" class="loading-screen">
  <mat-spinner diameter="48"></mat-spinner>
  <p>Loading workspace...</p>
</div>

<div *ngIf="error" class="error-screen">
  <mat-icon class="error-icon">cloud_off</mat-icon>
  <h2>Connection Error</h2>
  <p>{{ error }}</p>
  <button mat-raised-button color="primary" (click)="retry()">Retry</button>
</div>

<app-workspace *ngIf="!loading && !error" [initialState]="initialState"></app-workspace>
```

**Step 3: Add styles for loading/error screens**

Add to `app.component.scss`:

```scss
.loading-screen,
.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: white;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  color: #f44336;
}

.error-screen h2 {
  margin: 0 0 8px 0;
}

.error-screen p {
  margin: 0 0 24px 0;
  opacity: 0.7;
}
```

**Step 4: Commit**

```bash
git add frontend/src/app/app.component.ts frontend/src/app/app.component.html frontend/src/app/app.component.scss
git commit -m "feat: add loading spinner and error screen for workspace loading"
```

---

### Task 7: Rewire WorkspaceComponent to use server persistence

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts`

This is the largest change. The `WorkspaceComponent` currently calls `widgetStorage.loadTabs()` (localStorage) on init and `widgetStorage.saveTabs()` on every change. We need to:

1. Accept an `initialState` input from AppComponent
2. Replace all `widgetStorage.saveTabs()` calls with `persistence.saveWorkspace()`
3. Add a save-error banner

**Step 1: Update WorkspaceComponent**

Key changes to `workspace.component.ts`:

1. Add `@Input() initialState: WorkspaceState | null` input
2. Inject `WorkspacePersistenceService` instead of using `WidgetStorageService` for persistence
3. Change `ngOnInit` to use `initialState` instead of `widgetStorage.loadTabs()`
4. Change `saveTabs()` to call `persistence.saveWorkspace()`
5. Persist `backgroundIndex` as part of the workspace state

```typescript
// Add to imports:
import { Input } from '@angular/core';
import { WorkspacePersistenceService, WorkspaceState } from '../services/workspace-persistence.service';

// In constructor, add:
private persistence: WorkspacePersistenceService

// Change ngOnInit:
ngOnInit() {
  if (this.initialState) {
    this.tabs = this.initialState.tabs;
    this.activeTabId = this.initialState.activeTabId;
    this.currentBackgroundIndex = this.initialState.backgroundIndex ?? 0;
  } else {
    // First use — create default workspace
    const defaultTab: Tab = {
      id: Date.now().toString(),
      name: 'Main Tab',
      widgets: []
    };
    this.tabs = [defaultTab];
    this.activeTabId = defaultTab.id;
    this.currentBackgroundIndex = 0;
  }
  this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);
}

// Change saveTabs:
saveTabs() {
  this.persistence.saveWorkspace({
    tabs: this.tabs,
    activeTabId: this.activeTabId,
    backgroundIndex: this.currentBackgroundIndex
  });
  this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);
}
```

Also call `saveTabs()` after background changes (`nextBackground()`, `previousBackground()`, `openBackgroundSelector()`).

Remove `WidgetStorageService` from the constructor since it's no longer used.

**Step 2: Update workspace.component.html**

Add the `[initialState]` input — no template changes needed since `app.component.html` already passes it.

**Step 3: Verify it compiles**

Run: `cd frontend && npx ng build --configuration=development 2>&1 | head -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/workspace/workspace.component.ts
git commit -m "feat: rewire WorkspaceComponent to use server-backed persistence"
```

---

### Task 8: Rewire FileStorageService to use MediaService

**Files:**
- Modify: `frontend/src/app/services/file-storage.service.ts`

Replace the IndexedDB implementation with `MediaService` calls. Keep the same public API so widgets don't need changes.

**Step 1: Rewrite FileStorageService**

```typescript
import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

export interface StoredFile {
  id: string;
  blob: Blob;
  fileName: string;
  fileType: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileStorageService {

  constructor(private media: MediaService) {}

  async saveFile(id: string, file: File): Promise<void> {
    const blobPath = `files/${id}/${file.name}`;
    await firstValueFrom(this.media.uploadFile(blobPath, file, file.type));
  }

  async getFile(id: string): Promise<StoredFile | null> {
    try {
      // List files with this widget's prefix to find the filename
      const files = await firstValueFrom(this.media.listFiles(`files/${id}/`));
      if (files.length === 0) return null;

      const fileInfo = files[0];
      const blob = await firstValueFrom(this.media.downloadFile(fileInfo.name));
      const fileName = fileInfo.name.split('/').pop() || fileInfo.name;

      return {
        id,
        blob,
        fileName,
        fileType: fileInfo.content_type || 'application/octet-stream'
      };
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      const files = await firstValueFrom(this.media.listFiles(`files/${id}/`));
      for (const file of files) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    } catch {
      // Ignore errors on delete
    }
  }
}
```

**Step 2: Verify it compiles**

Run: `cd frontend && npx ng build --configuration=development 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/app/services/file-storage.service.ts
git commit -m "feat: rewire FileStorageService from IndexedDB to Azure Blob Storage"
```

---

### Task 9: Rewire WikiImageStorageService to use MediaService

**Files:**
- Modify: `frontend/src/app/services/wiki-image-storage.service.ts`

Replace IndexedDB with `MediaService`. Keep the same public API. The blob URL cache remains since we still need object URLs for rendering images in TipTap.

**Step 1: Rewrite WikiImageStorageService**

```typescript
import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

export interface StoredWikiImage {
  id: string;
  widgetId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class WikiImageStorageService {
  private blobUrlCache = new Map<string, string>();
  private widgetImageIds = new Map<string, Set<string>>();

  constructor(private media: MediaService) {}

  private blobPath(widgetId: string, imageId: string): string {
    return `wiki-images/${widgetId}/${imageId}`;
  }

  async saveImage(widgetId: string, file: File): Promise<string> {
    const imageId = crypto.randomUUID();
    const path = this.blobPath(widgetId, imageId);

    // Upload the image blob
    await firstValueFrom(this.media.uploadFile(path, file, file.type));

    // Store metadata as a separate small JSON blob
    const meta = { fileName: file.name, mimeType: file.type, createdAt: Date.now() };
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(`${path}.meta`, metaBlob, 'application/json'));

    return imageId;
  }

  async getImage(imageId: string): Promise<StoredWikiImage | null> {
    try {
      // Find the image by listing with prefix
      const files = await firstValueFrom(this.media.listFiles(`wiki-images/`));
      const imageFile = files.find(f => f.name.includes(`/${imageId}`) && !f.name.endsWith('.meta'));
      if (!imageFile) return null;

      const parts = imageFile.name.split('/');
      const widgetId = parts[1];

      const blob = await firstValueFrom(this.media.downloadFile(imageFile.name));

      // Try to get metadata
      let fileName = imageId;
      let mimeType = imageFile.content_type || 'image/png';
      let createdAt = Date.now();
      try {
        const metaBlob = await firstValueFrom(this.media.downloadFile(`${imageFile.name}.meta`));
        const metaText = await metaBlob.text();
        const meta = JSON.parse(metaText);
        fileName = meta.fileName || fileName;
        mimeType = meta.mimeType || mimeType;
        createdAt = meta.createdAt || createdAt;
      } catch {
        // Metadata not found, use defaults
      }

      return { id: imageId, widgetId, fileName, mimeType, blob, createdAt };
    } catch {
      return null;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }

    const files = await firstValueFrom(this.media.listFiles(`wiki-images/`));
    const toDelete = files.filter(f => f.name.includes(`/${imageId}`));
    for (const file of toDelete) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async deleteImagesForWidget(widgetId: string): Promise<void> {
    // Revoke all cached blob URLs
    const imageIds = this.widgetImageIds.get(widgetId);
    if (imageIds) {
      imageIds.forEach(id => {
        const url = this.blobUrlCache.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.blobUrlCache.delete(id);
        }
      });
      this.widgetImageIds.delete(widgetId);
    }

    const files = await firstValueFrom(this.media.listFiles(`wiki-images/${widgetId}/`));
    for (const file of files) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async getAllImagesForWidget(widgetId: string): Promise<StoredWikiImage[]> {
    const files = await firstValueFrom(this.media.listFiles(`wiki-images/${widgetId}/`));
    const imageFiles = files.filter(f => !f.name.endsWith('.meta'));

    const images: StoredWikiImage[] = [];
    for (const file of imageFiles) {
      const imageId = file.name.split('/').pop()!;
      const image = await this.getImage(imageId);
      if (image) images.push(image);
    }
    return images;
  }

  async getBlobUrl(imageId: string): Promise<string | null> {
    if (this.blobUrlCache.has(imageId)) {
      return this.blobUrlCache.get(imageId)!;
    }

    const image = await this.getImage(imageId);
    if (!image) return null;

    const blobUrl = URL.createObjectURL(image.blob);
    this.blobUrlCache.set(imageId, blobUrl);

    if (!this.widgetImageIds.has(image.widgetId)) {
      this.widgetImageIds.set(image.widgetId, new Set());
    }
    this.widgetImageIds.get(image.widgetId)!.add(imageId);

    return blobUrl;
  }

  revokeBlobUrl(imageId: string): void {
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }
  }

  revokeBlobUrlsForWidget(widgetId: string): void {
    const imageIds = this.widgetImageIds.get(widgetId);
    if (!imageIds) return;

    imageIds.forEach(imageId => {
      const url = this.blobUrlCache.get(imageId);
      if (url) {
        URL.revokeObjectURL(url);
        this.blobUrlCache.delete(imageId);
      }
    });

    this.widgetImageIds.delete(widgetId);
  }

  async importImages(widgetId: string, images: { id: string; fileName: string; mimeType: string; blob: Blob }[]): Promise<void> {
    for (const image of images) {
      const path = this.blobPath(widgetId, image.id);
      await firstValueFrom(this.media.uploadFile(path, image.blob, image.mimeType));

      const meta = { fileName: image.fileName, mimeType: image.mimeType, createdAt: Date.now() };
      const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
      await firstValueFrom(this.media.uploadFile(`${path}.meta`, metaBlob, 'application/json'));
    }
  }
}
```

**Step 2: Remove `init()` calls from WikiWidgetComponent**

The old service required `await this.imageStorage.init()` calls. The new service doesn't need initialization. Search for `imageStorage.init()` in `wiki-widget.component.ts` and remove those calls.

**Step 3: Verify it compiles**

Run: `cd frontend && npx ng build --configuration=development 2>&1 | head -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/services/wiki-image-storage.service.ts frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts
git commit -m "feat: rewire WikiImageStorageService from IndexedDB to Azure Blob Storage"
```

---

### Task 10: Rewire AudioStorageService to use MediaService

**Files:**
- Modify: `frontend/src/app/services/audio-storage.service.ts`

Replace IndexedDB with `MediaService`. The audio service stores data URLs — we'll convert them to/from blobs for Azure storage.

**Step 1: Rewrite AudioStorageService**

```typescript
import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

export interface StoredAudioFile {
  id: string;
  mappingId: string;
  widgetId: string;
  fileName: string;
  fileDataUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioStorageService {

  constructor(private media: MediaService) {}

  private blobPath(widgetId: string, mappingId: string, index: number): string {
    return `audio/${widgetId}/${mappingId}/${index}`;
  }

  private metaPath(widgetId: string, mappingId: string): string {
    return `audio/${widgetId}/${mappingId}/meta.json`;
  }

  async saveAudioFiles(widgetId: string, mappingId: string, files: { fileName: string, fileDataUrl: string }[]): Promise<void> {
    // Delete existing files for this mapping first
    await this.deleteAudioFilesForMapping(mappingId, widgetId);

    // Save metadata (file names)
    const meta = files.map((f, i) => ({ index: i, fileName: f.fileName }));
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(this.metaPath(widgetId, mappingId), metaBlob, 'application/json'));

    // Save each audio file
    for (let i = 0; i < files.length; i++) {
      const audioBlob = this.dataUrlToBlob(files[i].fileDataUrl);
      await firstValueFrom(this.media.uploadFile(
        this.blobPath(widgetId, mappingId, i),
        audioBlob,
        audioBlob.type
      ));
    }
  }

  async getAudioFiles(mappingId: string, widgetId?: string): Promise<{ fileName: string, fileDataUrl: string }[]> {
    try {
      // We need widgetId to construct the path — find it from listing if not provided
      let prefix = widgetId ? `audio/${widgetId}/${mappingId}/` : `audio/`;
      const allFiles = await firstValueFrom(this.media.listFiles(prefix));

      // If we don't have widgetId, search for the mapping
      if (!widgetId) {
        const metaFile = allFiles.find(f => f.name.includes(`/${mappingId}/meta.json`));
        if (!metaFile) return [];
        prefix = metaFile.name.replace('meta.json', '');
      }

      // Load metadata
      const metaKey = `${prefix}meta.json`;
      const metaBlobResp = await firstValueFrom(this.media.downloadFile(metaKey));
      const metaText = await metaBlobResp.text();
      const meta: { index: number, fileName: string }[] = JSON.parse(metaText);

      // Load each audio file
      const results: { fileName: string, fileDataUrl: string }[] = [];
      for (const entry of meta) {
        const audioBlob = await firstValueFrom(this.media.downloadFile(`${prefix}${entry.index}`));
        const dataUrl = await this.blobToDataUrl(audioBlob);
        results.push({ fileName: entry.fileName, fileDataUrl: dataUrl });
      }
      return results;
    } catch {
      return [];
    }
  }

  async getAudioFilesForWidget(widgetId: string): Promise<Map<string, { fileName: string, fileDataUrl: string }[]>> {
    const result = new Map<string, { fileName: string, fileDataUrl: string }[]>();

    try {
      const files = await firstValueFrom(this.media.listFiles(`audio/${widgetId}/`));
      // Find unique mapping IDs from paths like audio/{widgetId}/{mappingId}/...
      const mappingIds = new Set<string>();
      for (const file of files) {
        const parts = file.name.split('/');
        if (parts.length >= 3) {
          mappingIds.add(parts[2]);
        }
      }

      for (const mappingId of mappingIds) {
        const audioFiles = await this.getAudioFiles(mappingId, widgetId);
        if (audioFiles.length > 0) {
          result.set(mappingId, audioFiles);
        }
      }
    } catch {
      // Return empty map on error
    }

    return result;
  }

  async deleteAudioFilesForWidget(widgetId: string): Promise<void> {
    try {
      const files = await firstValueFrom(this.media.listFiles(`audio/${widgetId}/`));
      for (const file of files) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    } catch {
      // Ignore
    }
  }

  async deleteAudioFilesForMapping(mappingId: string, widgetId?: string): Promise<void> {
    try {
      const prefix = widgetId ? `audio/${widgetId}/${mappingId}/` : `audio/`;
      const files = await firstValueFrom(this.media.listFiles(prefix));
      const toDelete = widgetId
        ? files
        : files.filter(f => f.name.includes(`/${mappingId}/`));
      for (const file of toDelete) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    } catch {
      // Ignore
    }
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
```

**Step 2: Update MusicWidgetComponent**

The music widget calls `audioStorage.init()` — remove that call. Also, `getAudioFiles` now takes an optional `widgetId` parameter. Check `music-widget.component.ts` for calls to `audioStorage.getAudioFiles(mappingId)` and add the widgetId:

In `music-widget.component.ts`, where `this.audioStorage.getAudioFiles(mapping.id)` is called, change to `this.audioStorage.getAudioFiles(mapping.id, this.widgetId)` (the widget ID should be available as `this.settings?.id` or passed via input).

**Step 3: Verify it compiles**

Run: `cd frontend && npx ng build --configuration=development 2>&1 | head -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/services/audio-storage.service.ts frontend/src/app/widgets/music-widget/music-widget.component.ts
git commit -m "feat: rewire AudioStorageService from IndexedDB to Azure Blob Storage"
```

---

### Task 11: Clean up WidgetStorageService

**Files:**
- Modify: `frontend/src/app/services/widget-storage.service.ts`

Now that workspace state is saved via `WorkspacePersistenceService`, `WidgetStorageService` is no longer needed for persistence. However, it may still be imported elsewhere.

**Step 1: Check for remaining imports**

Run: `grep -r "WidgetStorageService" frontend/src/ --include="*.ts" -l`
Expected: Only `widget-storage.service.ts` and `workspace.component.ts`

**Step 2: Remove WidgetStorageService from WorkspaceComponent**

In `workspace.component.ts`, remove the import and constructor injection of `WidgetStorageService` (should already be done in Task 7, but verify).

**Step 3: Decide on WidgetStorageService**

If no other files import it, delete `widget-storage.service.ts`. If other files still reference it, leave it but empty its implementation (methods return empty defaults, no localStorage calls).

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove WidgetStorageService (replaced by server persistence)"
```

---

### Task 12: Add save-error banner to WorkspaceComponent

**Files:**
- Modify: `frontend/src/app/services/workspace-persistence.service.ts`
- Modify: `frontend/src/app/workspace/workspace.component.ts`
- Modify: `frontend/src/app/workspace/workspace.component.html`
- Modify: `frontend/src/app/workspace/workspace.component.scss`

**Step 1: Add error state to WorkspacePersistenceService**

Add a `BehaviorSubject<string | null>` for save errors:

```typescript
import { BehaviorSubject } from 'rxjs';

// In the class:
saveError$ = new BehaviorSubject<string | null>(null);
private retryCount = 0;
private maxRetries = 3;

// Update debouncedSave in constructor:
this.debouncedSave = debounce((state: WorkspaceState) => {
  this.saveWorkspaceImmediate(state).subscribe({
    next: () => {
      this.retryCount = 0;
      this.saveError$.next(null);
    },
    error: (err) => {
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        this.saveError$.next('Failed to save. Retrying...');
        // Exponential backoff retry
        setTimeout(() => this.debouncedSave(state), 1000 * Math.pow(2, this.retryCount));
      } else {
        this.saveError$.next('Changes could not be saved. Please check your connection.');
      }
    }
  });
}, 2000);
```

**Step 2: Show banner in WorkspaceComponent**

Subscribe to `saveError$` in the workspace component and display a banner:

```html
<!-- Add at the top of workspace.component.html -->
<div *ngIf="saveError" class="save-error-banner">
  <mat-icon>warning</mat-icon>
  <span>{{ saveError }}</span>
</div>
```

```scss
.save-error-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background: #f44336;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add save-error banner with retry logic"
```

---

### Task 13: Widget cleanup on deletion

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts`

**Step 1: Add cleanup logic to removeWidget**

When a widget is removed, delete its associated blobs:

```typescript
// Add to imports:
import { MediaService } from '../services/media.service';
import { firstValueFrom } from 'rxjs';

// Inject MediaService in constructor

// Update removeWidget:
async removeWidget(id: string) {
  const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
  if (!activeTab) return;

  const widget = activeTab.widgets.find(w => w.id === id);
  activeTab.widgets = activeTab.widgets.filter(w => w.id !== id);
  this.saveTabs();
  this.cdr.markForCheck();

  // Clean up blob storage in background
  if (widget) {
    this.cleanupWidgetBlobs(widget.id, widget.type);
  }
}

private async cleanupWidgetBlobs(widgetId: string, type: string) {
  try {
    // Delete files under all possible prefixes for this widget
    const prefixes = [`files/${widgetId}/`, `wiki-images/${widgetId}/`, `audio/${widgetId}/`];
    for (const prefix of prefixes) {
      const files = await firstValueFrom(this.media.listFiles(prefix));
      for (const file of files) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    }
  } catch {
    // Best-effort cleanup, don't block UI
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/workspace/workspace.component.ts
git commit -m "feat: clean up blob storage when widgets are deleted"
```

---

### Task 14: End-to-end verification

**Step 1: Build the project**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Test locally with SWA CLI**

```bash
cd frontend
npm start &
swa start http://localhost:4200 --api-location ./api
```

Verify:
- App loads at http://localhost:4280
- Loading spinner shows briefly
- Workspace renders (empty on first use)
- Adding a widget and refreshing → widget persists
- Check Azure Storage for `workspace/state.json` blob

**Step 3: Test error state**

Stop the API (`Ctrl+C` on `swa start`), then reload the app.
Expected: Error screen with "Could not connect to server" and retry button.

**Step 4: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: end-to-end verification fixes"
```

---

## Task Dependency Graph

```
Task 1 (merge) ─── must be first
   │
Task 2 (CI/CD) ──┐
Task 3 (auth) ───┤── can be parallel, no deps on each other
Task 4 (MediaService) ──── foundation for Tasks 5-10
   │
Task 5 (WorkspacePersistenceService) ──┐
Task 6 (AppComponent loading) ─────────┤── depend on Task 4+5
Task 7 (rewire WorkspaceComponent) ────┘
   │
Task 8 (FileStorageService) ──┐
Task 9 (WikiImageStorage) ────┤── depend on Task 4, parallel with each other
Task 10 (AudioStorage) ───────┘
   │
Task 11 (cleanup WidgetStorage) ── depends on Task 7
Task 12 (error banner) ── depends on Task 5+7
Task 13 (widget deletion cleanup) ── depends on Task 4+7
Task 14 (e2e verification) ── depends on all above
```
