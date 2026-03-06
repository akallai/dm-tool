# Independent Wiki Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Store wikis as independent named entities in user-scoped blob storage, with a picker UI for creating/opening/deleting wikis.

**Architecture:** Wikis move from embedded widget settings to standalone blobs at `wikis/{wikiId}/`. The wiki widget shows an empty state (like the PDF viewer) with "Create New Wiki" / "Open Existing Wiki" buttons. A new `WikiStorageService` handles CRUD. `WikiImageStorageService` updates its paths from `wiki-images/{widgetId}/` to `wikis/{wikiId}/images/`. Widget settings only store a reference (`wikiRef`) and per-widget UI state.

**Tech Stack:** Angular 19, Angular Material, Azure Blob Storage via MediaService

---

### Task 1: Create WikiStorageService

**Files:**
- Create: `frontend/src/app/services/wiki-storage.service.ts`

**Context:** This service handles all wiki CRUD operations against blob storage via `MediaService`. Wikis are stored at `wikis/{wikiId}/data.json` (content) and `wikis/{wikiId}/meta.json` (name for fast listing). Saves are debounced at 2s to match workspace persistence behavior.

**Step 1: Create the WikiStorageService**

```typescript
// frontend/src/app/services/wiki-storage.service.ts
import { Injectable } from '@angular/core';
import { MediaService, FileMetadata } from './media.service';
import { firstValueFrom } from 'rxjs';

export interface WikiMeta {
  wikiId: string;
  name: string;
  createdAt: number;
}

export interface WikiBlobData {
  name: string;
  articles: WikiArticleData[];
}

export interface WikiArticleData {
  id: string;
  title: string;
  content: string;
  children?: WikiArticleData[];
}

export interface WikiRef {
  wikiId: string;
  wikiName: string;
}

@Injectable({
  providedIn: 'root'
})
export class WikiStorageService {
  private saveTimers = new Map<string, any>();

  constructor(private media: MediaService) {}

  private metaPath(wikiId: string): string {
    return `wikis/${wikiId}/meta.json`;
  }

  private dataPath(wikiId: string): string {
    return `wikis/${wikiId}/data.json`;
  }

  async createWiki(name: string): Promise<WikiRef> {
    const wikiId = crypto.randomUUID();

    const meta: WikiMeta = { wikiId, name, createdAt: Date.now() };
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(this.metaPath(wikiId), metaBlob, 'application/json'));

    const data: WikiBlobData = {
      name,
      articles: [{
        id: Date.now().toString(),
        title: 'Welcome',
        content: '<h2>Welcome to your Wiki</h2><p>This is your personal knowledge base. Use the sidebar to create and organize articles.</p><p>Tips:</p><ul><li>Click <strong>+</strong> in the sidebar to add articles</li><li>Use <strong>[[Article Name]]</strong> to create wiki links</li><li>Drag and drop images directly into the editor</li></ul>',
        children: []
      }]
    };
    const dataBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(this.dataPath(wikiId), dataBlob, 'application/json'));

    return { wikiId, wikiName: name };
  }

  async listWikis(): Promise<WikiMeta[]> {
    const files = await firstValueFrom(this.media.listFiles('wikis/'));
    const metaFiles = files.filter(f => f.name.endsWith('/meta.json'));

    const wikis: WikiMeta[] = [];
    for (const file of metaFiles) {
      try {
        const blob = await firstValueFrom(this.media.downloadFile(file.name));
        const text = await blob.text();
        const meta = JSON.parse(text) as WikiMeta;
        wikis.push(meta);
      } catch {
        // Skip corrupted meta files
      }
    }

    wikis.sort((a, b) => b.createdAt - a.createdAt);
    return wikis;
  }

  async loadWiki(wikiId: string): Promise<WikiBlobData | null> {
    try {
      const blob = await firstValueFrom(this.media.downloadFile(this.dataPath(wikiId)));
      const text = await blob.text();
      return JSON.parse(text) as WikiBlobData;
    } catch {
      return null;
    }
  }

  saveWiki(wikiId: string, data: WikiBlobData): void {
    // Debounced save (2s)
    if (this.saveTimers.has(wikiId)) {
      clearTimeout(this.saveTimers.get(wikiId));
    }
    this.saveTimers.set(wikiId, setTimeout(() => {
      this.saveTimers.delete(wikiId);
      this.doSaveWiki(wikiId, data);
    }, 2000));
  }

  private async doSaveWiki(wikiId: string, data: WikiBlobData): Promise<void> {
    try {
      const dataBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      await firstValueFrom(this.media.uploadFile(this.dataPath(wikiId), dataBlob, 'application/json'));
    } catch (error) {
      console.error('Error saving wiki:', error);
    }
  }

  async renameWiki(wikiId: string, newName: string): Promise<void> {
    const meta: WikiMeta = { wikiId, name: newName, createdAt: Date.now() };
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(this.metaPath(wikiId), metaBlob, 'application/json'));
  }

  async deleteWiki(wikiId: string): Promise<void> {
    // Cancel any pending save
    if (this.saveTimers.has(wikiId)) {
      clearTimeout(this.saveTimers.get(wikiId));
      this.saveTimers.delete(wikiId);
    }

    const files = await firstValueFrom(this.media.listFiles(`wikis/${wikiId}/`));
    for (const file of files) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  /** Flush pending saves immediately (call before component destroy) */
  async flushSave(wikiId: string): Promise<void> {
    // No-op if no pending save
    if (!this.saveTimers.has(wikiId)) return;
    // Timer exists, but we don't have the data anymore — this is a limitation.
    // The component should call doSaveWiki directly on destroy if needed.
  }
}
```

**Step 2: Verify the service compiles**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds (service is tree-shakeable, no consumers yet)

**Step 3: Commit**

```bash
git add frontend/src/app/services/wiki-storage.service.ts
git commit -m "feat: add WikiStorageService for independent wiki blob storage"
```

---

### Task 2: Create WikiPickerDialogComponent

**Files:**
- Create: `frontend/src/app/dialogs/wiki-picker-dialog/wiki-picker-dialog.component.ts`

**Context:** A Material dialog that lists all user wikis, allows selecting one to open, and provides delete with confirmation. Follows the same patterns as `MediaBrowserDialogComponent`. Returns the selected `WikiRef` or `undefined` on cancel.

**Step 1: Create the WikiPickerDialogComponent**

```typescript
// frontend/src/app/dialogs/wiki-picker-dialog/wiki-picker-dialog.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WikiStorageService, WikiMeta, WikiRef } from '../../services/wiki-storage.service';

@Component({
  selector: 'app-wiki-picker-dialog',
  template: `
    <h2 mat-dialog-title>My Wikis</h2>
    <mat-dialog-content class="dialog-content">
      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
      <div *ngIf="!loading && wikis.length === 0" class="empty-state">
        No wikis found.
      </div>
      <div *ngIf="!loading" class="wiki-list">
        <div *ngFor="let wiki of wikis; let i = index" class="wiki-row" (click)="selectWiki(wiki)">
          <mat-icon class="wiki-icon">menu_book</mat-icon>
          <span class="wiki-name">{{ wiki.name }}</span>
          <ng-container *ngIf="deletingIndex !== i">
            <button mat-icon-button matTooltip="Delete" color="warn"
                    (click)="confirmDelete(i); $event.stopPropagation()">
              <mat-icon>delete</mat-icon>
            </button>
          </ng-container>
          <ng-container *ngIf="deletingIndex === i">
            <span class="delete-confirm">Delete?</span>
            <button mat-icon-button color="warn"
                    (click)="deleteWiki(wiki, i); $event.stopPropagation()">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button
                    (click)="cancelDelete(); $event.stopPropagation()">
              <mat-icon>close</mat-icon>
            </button>
          </ng-container>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      min-height: 200px;
      max-height: 60vh;
    }
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary, rgba(255,255,255,0.5));
    }
    .wiki-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .wiki-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .wiki-row:hover {
      background: var(--item-hover, rgba(255,255,255,0.1));
    }
    .wiki-icon {
      color: var(--accent-color, #64b5f6);
      flex-shrink: 0;
    }
    .wiki-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-primary, white);
    }
    .delete-confirm {
      color: var(--danger-color, #f44336);
      font-size: 13px;
      margin-right: 4px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ]
})
export class WikiPickerDialogComponent implements OnInit {
  wikis: WikiMeta[] = [];
  loading = false;
  deletingIndex = -1;

  constructor(
    public dialogRef: MatDialogRef<WikiPickerDialogComponent>,
    private wikiStorage: WikiStorageService,
  ) {}

  async ngOnInit() {
    this.loading = true;
    try {
      this.wikis = await this.wikiStorage.listWikis();
    } finally {
      this.loading = false;
    }
  }

  selectWiki(wiki: WikiMeta) {
    const ref: WikiRef = { wikiId: wiki.wikiId, wikiName: wiki.name };
    this.dialogRef.close(ref);
  }

  confirmDelete(index: number) {
    this.deletingIndex = index;
  }

  cancelDelete() {
    this.deletingIndex = -1;
  }

  async deleteWiki(wiki: WikiMeta, index: number) {
    try {
      await this.wikiStorage.deleteWiki(wiki.wikiId);
      this.wikis.splice(index, 1);
    } catch (error) {
      console.error('Failed to delete wiki:', error);
    }
    this.deletingIndex = -1;
  }
}
```

**Step 2: Verify build**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/app/dialogs/wiki-picker-dialog/wiki-picker-dialog.component.ts
git commit -m "feat: add WikiPickerDialog for browsing and managing wikis"
```

---

### Task 3: Update WikiImageStorageService to use wiki-scoped paths

**Files:**
- Modify: `frontend/src/app/services/wiki-image-storage.service.ts`

**Context:** Change blob paths from `wiki-images/{widgetId}/` to `wikis/{wikiId}/images/`. All methods that take `widgetId` now take `wikiId`. The cache tracking also changes from widgetId to wikiId.

**Step 1: Update the service**

Replace the `blobPath` method and all `widgetId` references with `wikiId`:

```typescript
private blobPath(wikiId: string, imageId: string): string {
  return `wikis/${wikiId}/images/${imageId}`;
}
```

All method signatures change `widgetId` → `wikiId`:
- `saveImage(wikiId, file)`
- `deleteImagesForWidget` → `deleteImagesForWiki(wikiId)`
- `getAllImagesForWidget` → `getAllImagesForWiki(wikiId)`
- `revokeBlobUrlsForWidget` → `revokeBlobUrlsForWiki(wikiId)`
- `importImages(wikiId, images)`

Update `getImage` to search `wikis/` prefix instead of `wiki-images/`:
```typescript
const files = await firstValueFrom(this.media.listFiles('wikis/'));
const imageFile = files.find(f => f.name.includes(`/images/${imageId}`) && !f.name.endsWith('.meta'));
```

And for `getBlobUrl`, update the widgetId extraction:
```typescript
// Extract wikiId from path: wikis/{wikiId}/images/{imageId}
const parts = imageFile.name.split('/');
const wikiId = parts[1]; // was widgetId
```

Full replacement of the service — see `wiki-image-storage.service.ts` and replace all `widgetId` with `wikiId`, `widget` with `wiki`, `wiki-images/${widgetId}/` with `wikis/${wikiId}/images/`, tracking maps from `widgetImageIds` to `wikiImageIds`.

**Step 2: Verify build**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds (the wiki widget will be updated in Task 4 to pass wikiId)

**Step 3: Commit**

```bash
git add frontend/src/app/services/wiki-image-storage.service.ts
git commit -m "refactor: update WikiImageStorageService to use wiki-scoped blob paths"
```

---

### Task 4: Update WikiWidgetComponent — empty state, blob loading/saving

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.html`
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.scss`

**Context:** This is the main change. The component needs:
1. Empty state (no wikiRef) with "Create New Wiki" / "Open Existing Wiki" buttons
2. Load wiki data from blob storage via WikiStorageService
3. Save wiki data to blob storage (debounced) instead of settings
4. Save only UI state (currentArticleId, sidebarCollapsed) to widget settings
5. "Switch wiki" button to return to empty state
6. Migration of existing settings.wikiData to blob storage

**Step 1: Update the component TypeScript**

Key changes to `wiki-widget.component.ts`:

1. Add imports for WikiStorageService, WikiPickerDialogComponent, MatDialog, WikiRef
2. Add `wikiRef: WikiRef | null = null` and `wikiLoaded = false` and `loading = false` state
3. Change `ngOnInit()`:
   - If `settings.wikiRef` exists → set `this.wikiRef`, load wiki from blob
   - If `settings.wikiData` exists (legacy) → migrate to blob storage
   - Otherwise → show empty state
4. Add `createNewWiki()` method:
   - Prompt for name
   - Call `WikiStorageService.createWiki(name)`
   - Set wikiRef in settings, load the wiki
5. Add `openExistingWiki()` method:
   - Open WikiPickerDialogComponent
   - On result, set wikiRef in settings, load the wiki
6. Add `switchWiki()` method:
   - Save current wiki immediately
   - Clear wikiRef and wikiLoaded, show empty state
   - Destroy editor
7. Change `updateSettings()`:
   - Save UI state (currentArticleId, sidebarCollapsed) to widget settings
   - Save wiki data (articles) to blob via WikiStorageService
   - Do NOT save wikiData to settings anymore
8. Add private `loadWikiFromBlob(wikiId)` method
9. Add private `migrateFromSettings()` method for legacy data
10. Update `handleImageUpload` and `resolveImageUrl` to use `wikiRef.wikiId` instead of `widgetId`
11. On `ngOnDestroy`, flush pending wiki save

**Step 2: Update the component HTML**

Add empty state before the wiki-body div:

```html
<!-- Loading state -->
<div *ngIf="loading" class="empty-state">
  <mat-spinner diameter="32"></mat-spinner>
</div>

<!-- Empty state: no wiki selected -->
<div *ngIf="!loading && !wikiLoaded" class="empty-state">
  <div class="empty-state-buttons">
    <button mat-raised-button color="primary" (click)="createNewWiki()">Create New Wiki</button>
    <button mat-raised-button (click)="openExistingWiki()">Open Existing Wiki</button>
  </div>
</div>

<!-- Wiki editor (existing body, only shown when wiki is loaded) -->
<div class="wiki-body" *ngIf="!loading && wikiLoaded">
  ... existing sidebar + content ...
</div>
```

Add a "switch wiki" button in the editor toolbar area:

```html
<button mat-icon-button (click)="switchWiki()" matTooltip="Switch Wiki" class="switch-wiki-btn">
  <mat-icon>swap_horiz</mat-icon>
</button>
```

**Step 3: Update the component SCSS**

Add styles for empty-state-buttons (matching image-pdf-viewer pattern):

```scss
.empty-state-buttons {
  display: flex;
  gap: 12px;
}
```

Add styles for the switch-wiki button.

**Step 4: Verify build**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/app/widgets/wiki-widget/
git commit -m "feat: wiki widget empty state with create/open picker, blob storage"
```

---

### Task 5: Update WorkspaceComponent — stop deleting wiki blobs on widget removal

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts:148-160`

**Context:** The `cleanupWidgetBlobs` method currently deletes `wiki-images/{widgetId}/` when a widget is removed. Since wikis are now independent, we should NOT delete wiki blobs when a widget is removed. Remove the `wiki-images/` prefix from the cleanup list.

**Step 1: Update cleanupWidgetBlobs**

In `workspace.component.ts`, line 150, change the prefixes array:

```typescript
// Before:
const prefixes = [`files/${widgetId}/`, `wiki-images/${widgetId}/`, `audio/${widgetId}/`];

// After:
const prefixes = [`files/${widgetId}/`, `audio/${widgetId}/`];
```

Wiki data lives at `wikis/{wikiId}/` and is managed independently via WikiPickerDialog. Removing a wiki widget just removes the reference, not the data.

**Step 2: Verify build**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/app/workspace/workspace.component.ts
git commit -m "fix: stop deleting wiki blobs when widget is removed (wikis are independent)"
```

---

### Task 6: Update widget-container settings config for WIKI_WIDGET

**Files:**
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.ts`

**Context:** The current WIKI_WIDGET settings (`autoSave`, `defaultView`) are unused. They should be removed since wiki management is now handled via the picker. Check if there are other references to these.

**Step 1: Read the widget-container file to find the WIKI_WIDGET settings case**

Look at the `getWidgetSettingsConfig()` method and remove the unused WIKI_WIDGET settings fields (or keep minimal relevant ones).

**Step 2: Update settings config**

Remove the unused `autoSave` and `defaultView` fields from the WIKI_WIDGET case in `getWidgetSettingsConfig()`.

**Step 3: Verify build**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/workspace/widget-container/widget-container.component.ts
git commit -m "chore: remove unused WIKI_WIDGET settings fields"
```

---

### Task 7: Add MatDialogModule and MatProgressSpinnerModule to wiki widget imports

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`

**Context:** The wiki widget now opens `MatDialog` for the picker dialog and may show a `MatSpinner` for loading state. Ensure required Angular Material modules are imported in the standalone component's `imports` array.

This should be done as part of Task 4 — listing here as a reminder. Required additions:
- `MatDialogModule` (for `MatDialog` injection)
- `MatProgressSpinnerModule` (for loading spinner in template)

---

### Task 8: Manual Testing Checklist

After all code changes, manually verify:

1. **New widget**: Add a WIKI_WIDGET → see empty state with two buttons
2. **Create wiki**: Click "Create New Wiki" → enter name → wiki loads with Welcome article
3. **Edit articles**: Add articles, edit content, add images — verify saves to blob (check via `/api/media?prefix=wikis/`)
4. **Switch wiki**: Click switch button → returns to empty state
5. **Open existing**: Click "Open Existing Wiki" → see picker with created wiki → select → wiki loads
6. **Delete wiki**: In picker, delete a wiki → confirm → wiki removed from list
7. **Widget removal**: Delete the wiki widget → verify wiki blobs still exist in storage
8. **Legacy migration**: If any existing wiki widgets have settings.wikiData, verify they auto-migrate on load
9. **Images**: Insert images in wiki → verify stored at `wikis/{wikiId}/images/` path
10. **Multiple widgets**: Open same wiki in two widgets → both load correctly

---

### Task 9: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entry under [Unreleased]**

```markdown
### Changed
- Wiki widget now stores wikis as independent entities in cloud storage
- Wiki picker dialog for creating, opening, and deleting wikis
- Deleting a wiki widget no longer deletes wiki data
- Wiki images stored under wiki-scoped paths
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for independent wiki storage"
```
