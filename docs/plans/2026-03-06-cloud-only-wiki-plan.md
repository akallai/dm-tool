# Cloud-Only Wiki & Remove Notepad — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the Notepad widget entirely and migrate the Wiki widget to cloud-only persistence (no File System Access API, no ZIP import/export, auto-initialize with Welcome article).

**Architecture:** The Wiki widget currently persists data two ways: cloud (via `settings.wikiData` → workspace JSON → Azure Blob) and local files (via File System Access API + IndexedDB handles). We remove the local file path entirely, keeping only the cloud path. The Notepad widget is deleted since Wiki subsumes its functionality.

**Tech Stack:** Angular 19, TypeScript, TipTap WYSIWYG editor, Angular Material

---

## Batch 1: Remove Notepad Widget

### Task 1: Remove Notepad from widget-selector-dialog

**Files:**
- Modify: `frontend/src/app/dialogs/widget-selector-dialog/widget-selector-dialog.component.ts`

**Step 1: Remove NOTEPAD from WidgetType union**

In `widget-selector-dialog.component.ts` line 8, remove `'NOTEPAD' |` from the WidgetType union:

```typescript
// Before:
export type WidgetType = 'IMAGE_PDF' | 'NOTEPAD' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET' | 'COMBAT_TRACKER' | 'DAYTIME_TRACKER' | 'LLM_CHAT' | 'HEX_MAP' | 'NAME_GENERATOR' | 'COUNTDOWN_WIDGET';

// After:
export type WidgetType = 'IMAGE_PDF' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET' | 'COMBAT_TRACKER' | 'DAYTIME_TRACKER' | 'LLM_CHAT' | 'HEX_MAP' | 'NAME_GENERATOR' | 'COUNTDOWN_WIDGET';
```

**Step 2: Remove NOTEPAD entry from widgetTypes array**

Remove this line (line 251):
```typescript
{ type: 'NOTEPAD', label: 'Notepad', icon: 'notepad.png', description: 'Text notes' },
```

**Step 3: Verify — build should show errors in widget-container.component.ts (expected)**

Run: `cd frontend && npx ng build 2>&1 | head -30`
Expected: Errors about 'NOTEPAD' references in widget-container — confirms next task.

---

### Task 2: Remove Notepad from widget-container

**Files:**
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.ts`
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.html`

**Step 1: Remove NotepadComponent import and references from .ts**

In `widget-container.component.ts`:
- Remove line 10: `import { NotepadComponent } from '../../widgets/notepad/notepad.component';`
- Remove `NotepadComponent` from the `imports` array (line 38)
- Remove `@ViewChild('notepad') notepadComponent?: NotepadComponent;` (line 57)
- Remove `'NOTEPAD': 'Notepad',` from the `titles` Record (line 93)
- Remove the entire `case 'NOTEPAD':` block from `getWidgetSettingsConfig()` (lines 201-225)
- Remove the notepad file-picker handling in `openSettings()` (lines 114-125 — the `if (result && this.notepadComponent)` block). Keep the `else if (result)` block but convert it to `if (result)`:

```typescript
// Before (lines 113-131):
      .subscribe(async result => {
          if (result && this.notepadComponent) {
            // Handle notepad file picker requests
            if (result._openFilePickerRequested) { ... }
            if (result._createFilePickerRequested) { ... }
            this.widgetData.settings = result;
            this.update.emit();
          } else if (result) {
            this.widgetData.settings = result;
            this.update.emit();
          }
        });

// After:
      .subscribe(result => {
          if (result) {
            this.widgetData.settings = result;
            this.update.emit();
          }
        });
```

**Step 2: Remove Notepad switch case from .html**

In `widget-container.component.html`, remove line 32:
```html
<app-notepad *ngSwitchCase="'NOTEPAD'" [settings]="widgetData.settings" #notepad></app-notepad>
```

**Step 3: Verify build compiles**

Run: `cd frontend && npx ng build 2>&1 | tail -5`
Expected: Build succeeds (or only wiki-related warnings remain).

---

### Task 3: Delete Notepad component file

**Files:**
- Delete: `frontend/src/app/widgets/notepad/notepad.component.ts`

**Step 1: Delete the file**

```bash
rm frontend/src/app/widgets/notepad/notepad.component.ts
```

**Step 2: Verify build compiles**

Run: `cd frontend && npx ng build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 3: Commit Batch 1**

```bash
git add -A
git commit -m "feat: remove Notepad widget (superseded by Wiki)"
```

---

## Batch 2: Remove Wiki File System Access API & Services

### Task 4: Delete WikiFileHandleService

**Files:**
- Delete: `frontend/src/app/widgets/wiki-widget/wiki-file-handle.service.ts`

**Step 1: Delete the file**

```bash
rm frontend/src/app/widgets/wiki-widget/wiki-file-handle.service.ts
```

**Step 2: Verify — build should fail with missing import (expected, fixed in Task 6)**

---

### Task 5: Delete WikiExportService and remove jszip

**Files:**
- Delete: `frontend/src/app/widgets/wiki-widget/wiki-export.service.ts`
- Modify: `frontend/package.json`

**Step 1: Delete the service file**

```bash
rm frontend/src/app/widgets/wiki-widget/wiki-export.service.ts
```

**Step 2: Remove jszip from package.json**

In `frontend/package.json`, remove line 35:
```json
"jszip": "^3.10.1",
```

**Step 3: Reinstall dependencies**

Run: `cd frontend && npm install`

---

### Task 6: Strip File System Access API from wiki-widget.component.ts

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`

This is the largest change. Remove all file-related code while preserving cloud persistence.

**Step 1: Remove imports for deleted services**

Remove these lines:
```typescript
import { WikiExportService } from './wiki-export.service';
import { WikiFileHandleService } from './wiki-file-handle.service';
```

**Step 2: Remove WikiExportService from component providers**

Change line 53:
```typescript
// Before:
providers: [WikiExportService],
// After (remove the line entirely or leave empty):
// (delete the providers line)
```

**Step 3: Remove file-related properties**

Remove these properties (lines 65-66, 70-74):
```typescript
fileHandle: FileSystemFileHandle | null = null;
fileName: string = '';
isSaving: boolean = false;
errorMessage: string = '';
lastSavedToFile: Date | null = null;
saveError: boolean = false;
hasUnsavedChanges: boolean = false;
private lastSavedUpdateInterval: ReturnType<typeof setInterval> | null = null;
```

Keep only the debounced save but repurpose it. Since there's no file to save to, the debounced save was calling `saveWiki()` which wrote to the file handle. Now `onContentChange()` should just call `updateSettings()` (which triggers the cloud save via `settingsChange.emit()`).

**Step 4: Remove file-related constructor dependencies**

```typescript
// Before:
constructor(
  private cdr: ChangeDetectorRef,
  private imageStorage: WikiImageStorageService,
  private exportService: WikiExportService,
  private fileHandleService: WikiFileHandleService
) {}

// After:
constructor(
  private cdr: ChangeDetectorRef,
  private imageStorage: WikiImageStorageService,
) {}
```

**Step 5: Simplify ngOnInit — remove file handle restoration, add auto-init**

```typescript
ngOnInit() {
  if (this.settings && this.settings.wikiData) {
    this.wikiData = this.settings.wikiData;

    // Restore UI state
    this.sidebarCollapsed = this.wikiData.sidebarCollapsed ?? false;

    // Restore current article
    if (this.wikiData.currentArticleId) {
      const found = this.findArticleById(this.wikiData.articles, this.wikiData.currentArticleId);
      if (found) {
        this.currentArticle = found;
      } else if (this.wikiData.articles.length > 0) {
        this.currentArticle = this.wikiData.articles[0];
      }
    } else if (this.wikiData.articles.length > 0) {
      this.currentArticle = this.wikiData.articles[0];
    }
  } else {
    // Auto-initialize with Welcome article
    this.wikiData = {
      articles: [{
        id: Date.now().toString(),
        title: 'Welcome',
        content: '<h2>Welcome to your Wiki</h2><p>This is your personal knowledge base. Use the sidebar to create and organize articles.</p><p>Tips:</p><ul><li>Click <strong>+</strong> in the sidebar to add articles</li><li>Use <strong>[[Article Name]]</strong> to create wiki links</li><li>Drag and drop images directly into the editor</li></ul>',
        children: []
      }]
    };
    this.currentArticle = this.wikiData.articles[0];
    this.updateSettings();
  }
}
```

**Step 6: Remove these methods entirely**

- `restoreFileHandle()` (lines 123-138)
- `exportWikiZip()` (lines 298-328)
- `importWikiZip()` (lines 330-405)
- `openExistingWiki()` (lines 413-482)
- `createNewWiki()` (lines 484-539)
- `saveWiki()` (lines 541-573)
- `getLastSavedText()` (lines 788-811)
- `isSaveStale()` (lines 813-820)

**Step 7: Simplify onContentChange**

```typescript
// Before:
private onContentChange() {
  this.hasUnsavedChanges = true;
  this.updateSettings();
  this.debouncedSaveWiki();
}

// After:
private onContentChange() {
  this.updateSettings();
}
```

Also remove the `debouncedSaveWiki` property (line 83) and its cancel call in `ngOnDestroy`.

**Step 8: Simplify updateArticle**

```typescript
// Before:
updateArticle() {
  this.updateSettings();
  this.debouncedSaveWiki();
}

// After:
updateArticle() {
  this.updateSettings();
}
```

**Step 9: Clean up ngOnDestroy**

Remove the debounced save cancellation and the lastSavedUpdateInterval clearing. Keep editor cleanup and blob URL revocation:

```typescript
ngOnDestroy() {
  if (this.wikiLinkClickHandler && this.editorContainer?.nativeElement) {
    this.editorContainer.nativeElement.removeEventListener('click', this.wikiLinkClickHandler);
  }
  this.editor?.destroy();
  const widgetId = this.widgetId || 'default';
  this.imageStorage.revokeBlobUrlsForWidget(widgetId);
}
```

**Step 10: Remove the `debounce` import if no longer used**

Remove line 9: `import { debounce } from '../../utils/debounce';`

---

### Task 7: Strip file UI from wiki-widget.component.html

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.html`

**Step 1: Replace the entire wiki-header section**

Remove the toolbar buttons (Open, New, Import, Export) and all file status indicators (lines 2-35). Replace with an empty header or remove the header entirely:

```html
<!-- Before: lines 1-35 (full header with buttons and file status) -->

<!-- After: Remove the entire wiki-header div -->
```

The `.wiki-header` div (lines 2-35) should be deleted entirely.

**Step 2: Simplify wiki-body condition**

Change line 41:
```html
<!-- Before: -->
<div class="wiki-body" *ngIf="fileHandle || wikiData.articles.length">

<!-- After: (always show, since wiki auto-initializes) -->
<div class="wiki-body">
```

**Step 3: Remove the loading/error indicators**

Remove lines 37-39:
```html
<div *ngIf="isSaving" class="save-indicator">Saving...</div>
<div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
```

**Step 4: Remove the empty-wiki state**

Remove lines 156-158:
```html
<div *ngIf="!fileHandle && wikiData.articles.length === 0" class="empty-wiki">
  <p>No wiki loaded. Open an existing wiki or create a new one.</p>
</div>
```

---

### Task 8: Clean up wiki-widget.component.scss

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.scss`

**Step 1: Remove file-status styles from .wiki-header**

Remove the `.file-info` block and all its children (lines 31-98 inside `.wiki-header`). Also remove the `@keyframes pulse-error` block (lines 101-108).

If the header is fully removed, also remove the `.wiki-header` styles (lines 8-99).

**Step 2: Remove save-indicator and error-message styles**

Remove lines 639-656:
```scss
.save-indicator, .error-message { ... }
.save-indicator { ... }
.error-message { ... }
```

**Step 3: Verify build**

Run: `cd frontend && npx ng build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit Batch 2**

```bash
git add -A
git commit -m "feat: migrate Wiki to cloud-only, remove File System Access API and ZIP export"
```

---

## Batch 3: Update CHANGELOG and Final Verification

### Task 9: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entries under [Unreleased]**

Add to the `### Removed` section (create if not exists):
```markdown
### Removed
- **Notepad widget** (superseded by Wiki — use Wiki for all text editing)
- Wiki local file operations (Open, New, Save to disk via File System Access API)
- Wiki ZIP import/export and `jszip` dependency
- `WikiFileHandleService` (IndexedDB file handle persistence)
- `WikiExportService` (ZIP archive service)
```

Add to `### Changed` section:
```markdown
### Changed
- Wiki widget auto-initializes with a Welcome article when first added
- Wiki widget is now fully cloud-only — all data persists via Azure Blob Storage
```

---

### Task 10: Build and verify

**Step 1: Run full build**

Run: `cd frontend && npx ng build`
Expected: Build succeeds with no errors.

**Step 2: Run tests**

Run: `cd frontend && npx ng test --watch=false`
Expected: All tests pass (or pre-existing failures only).

**Step 3: Commit final changes**

```bash
git add -A
git commit -m "docs: update CHANGELOG for wiki cloud-only migration"
```

---

## File Summary

| Action | File |
|--------|------|
| Delete | `frontend/src/app/widgets/notepad/notepad.component.ts` |
| Delete | `frontend/src/app/widgets/wiki-widget/wiki-file-handle.service.ts` |
| Delete | `frontend/src/app/widgets/wiki-widget/wiki-export.service.ts` |
| Modify | `frontend/src/app/dialogs/widget-selector-dialog/widget-selector-dialog.component.ts` |
| Modify | `frontend/src/app/workspace/widget-container/widget-container.component.ts` |
| Modify | `frontend/src/app/workspace/widget-container/widget-container.component.html` |
| Modify | `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts` |
| Modify | `frontend/src/app/widgets/wiki-widget/wiki-widget.component.html` |
| Modify | `frontend/src/app/widgets/wiki-widget/wiki-widget.component.scss` |
| Modify | `frontend/package.json` |
| Modify | `CHANGELOG.md` |
