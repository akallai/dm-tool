# Manual Save Button — Wiki Centralization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stop the wiki widget from auto-saving content to blob storage. Wiki content should only be saved when the user clicks the workspace save button (or Ctrl+S). When closing a widget with unsaved changes, show a confirmation dialog.

**Architecture:** Remove the debounced auto-save from WikiStorageService. The wiki widget keeps its data in memory and exposes a public `saveWikiToServer()` method. WorkspaceComponent calls this method on all active wiki widgets when saving. The close button on widget containers checks for unsaved state and confirms before closing.

**Tech Stack:** Angular 19, Angular Material, SCSS

---

### Task 1: Remove debounced auto-save from WikiStorageService

**Files:**
- Modify: `frontend/src/app/services/wiki-storage.service.ts`

Remove the debounced save mechanism. Replace `saveWiki()` with a direct (non-debounced) method that immediately uploads. This method will only be called explicitly from the save button flow.

**Changes:**

1. Remove the `debounce` import and `debouncedSaves` Map
2. Replace `saveWiki()` with a direct upload (returning a Promise):

```typescript
async saveWiki(wikiId: string, data: WikiBlobData): Promise<void> {
  await this.uploadJson(this.dataPath(wikiId), data);
}
```

3. Update `deleteWiki()` to remove the debounce cancel logic (just delete files directly)

---

### Task 2: Remove auto-save calls from WikiWidgetComponent

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`

**Changes:**

1. Add a `wikiDirty = false` flag to track unsaved wiki content changes
2. Remove all `this.saveWikiData()` calls from:
   - `onContentChange()` — just set `wikiDirty = true` and emit `settingsChange` (to mark workspace dirty)
   - `saveUIState()` — remove the `this.saveWikiData()` call at the end, just emit `settingsChange`
   - `switchWiki()` — remove the pre-switch `saveWiki()` call (user must save first)
   - `ngOnDestroy()` — remove the save-on-destroy call
   - `loadArticleContent()` — for markdown migration, keep the save (one-time migration)
3. Add a public `saveWikiToServer()` method that calls `wikiStorage.saveWiki()` and resets `wikiDirty`:

```typescript
async saveWikiToServer(): Promise<void> {
  if (this.wikiRef && this.wikiLoaded) {
    const blobData: WikiBlobData = {
      name: this.wikiRef.wikiName,
      articles: this.wikiData.articles,
    };
    await this.wikiStorage.saveWiki(this.wikiRef.wikiId, blobData);
    this.wikiDirty = false;
  }
}
```

4. Update `addArticle()`, `addSubArticle()`, `deleteArticle()`, `updateArticle()` to set `wikiDirty = true`

---

### Task 3: Wire save button to save wiki widgets

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts`
- Modify: `frontend/src/app/workspace/workspace.component.html`
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.ts`
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.html`

**Changes:**

1. In `WidgetContainerComponent`:
   - Add a `@ViewChild` to get a reference to the wiki widget component
   - Add a public `saveWidget()` method that calls `saveWikiToServer()` if the inner widget is a wiki
   - Add a public `hasUnsavedChanges()` method that checks `wikiDirty` on wiki widgets

2. In `WorkspaceComponent`:
   - Use `@ViewChildren(WidgetContainerComponent)` to get all active widget containers
   - In `saveToServer()`, call `saveWidget()` on each container before saving workspace state

---

### Task 4: Add close confirmation for unsaved widgets

**Files:**
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.ts`

**Changes:**

1. In the `close()` method, check `hasUnsavedChanges()`. If true, show a `window.confirm()` dialog before proceeding:

```typescript
close(event: MouseEvent) {
  event.stopPropagation();
  if (this.hasUnsavedChanges() && !confirm('You have unsaved changes. Close anyway?')) {
    return;
  }
  if (this.widgetData.type === 'MUSIC_WIDGET') {
    this.musicPlaybackService.stopAllForWidget(this.widgetData.id);
  }
  this.closeEvent.emit();
}
```

---

### Task 5: Update CHANGELOG, build, and deploy

**Files:**
- Modify: `CHANGELOG.md`

Add under `### Changed`:
```markdown
- **Wiki save** — wiki content now only saves when clicking the save button, with close confirmation for unsaved changes
```

Build and deploy.
