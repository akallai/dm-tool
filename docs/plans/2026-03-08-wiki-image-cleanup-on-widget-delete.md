# Wiki Image Cleanup on Widget Delete - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When a wiki widget is deleted from the workspace, also delete its wiki data and images from blob storage.

**Architecture:** Modify `cleanupWidgetBlobs` in `WorkspaceComponent` to accept the full widget object (not just the id), so it can read the widget type and settings. For wiki widgets, call the existing `WikiStorageService.deleteWiki(wikiId)` which already handles deleting everything under `wikis/{wikiId}/` (meta, data, and images). Also add the legacy `wiki-images/{widgetId}/` prefix to the cleanup list.

**Tech Stack:** Angular 19, TypeScript, Karma (unit tests)

---

### Task 1: Add test for wiki cleanup on widget delete

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.spec.ts:337-351`

**Step 1: Write the failing test**

Add a new test inside the existing `removeWidget` describe block (after the current test at line 350). The test should verify that when a `WIKI_WIDGET` with a `wikiRef` is deleted, `wikiStorage.deleteWiki` is called with the correct wikiId, and `media.listFiles` is called with the legacy `wiki-images/{widgetId}/` prefix.

```typescript
it('should cleanup wiki data and images when removing a wiki widget', () => {
  mediaSpy.listFiles.mockReturnValue(of([]));
  wikiStorageSpy.deleteWiki = jest.fn().mockResolvedValue(undefined);
  component.tabs = [{
    id: 't1', name: 'Tab 1',
    widgets: [{
      id: 'w1',
      type: 'WIKI_WIDGET' as any,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      settings: { wikiRef: { wikiId: 'wiki-abc', wikiName: 'My Wiki' } }
    }],
  }];
  component.activeTabId = 't1';

  component.removeWidget('w1');

  expect(component.tabs[0].widgets.length).toBe(0);
  expect(wikiStorageSpy.deleteWiki).toHaveBeenCalledWith('wiki-abc');
  expect(mediaSpy.listFiles).toHaveBeenCalledWith('wiki-images/w1/');
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -30`
Expected: FAIL — `deleteWiki` is never called because `cleanupWidgetBlobs` doesn't handle wiki widgets yet.

**Step 3: Commit**

```
test: add failing test for wiki cleanup on widget delete
```

---

### Task 2: Modify cleanupWidgetBlobs to handle wiki widgets

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts:147-173`

**Step 1: Update removeWidget to pass the full widget**

Change `removeWidget` to pass the widget object instead of just the id:

```typescript
removeWidget(id: string) {
  const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
  if (!activeTab) return;

  const widget = activeTab.widgets.find(w => w.id === id);
  activeTab.widgets = activeTab.widgets.filter(w => w.id !== id);
  this.saveTabs();
  this.cdr.markForCheck();

  if (widget) {
    this.cleanupWidgetBlobs(widget);
  }
}
```

**Step 2: Update cleanupWidgetBlobs to accept WidgetInstance and handle wiki cleanup**

```typescript
private async cleanupWidgetBlobs(widget: WidgetInstance) {
  try {
    const prefixes = [`files/${widget.id}/`, `audio/${widget.id}/`, `wiki-images/${widget.id}/`];
    for (const prefix of prefixes) {
      const files = await firstValueFrom(this.media.listFiles(prefix));
      for (const file of files) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    }

    if (widget.type === 'WIKI_WIDGET' && widget.settings?.wikiRef?.wikiId) {
      await this.wikiStorage.deleteWiki(widget.settings.wikiRef.wikiId);
    }
  } catch {
    // Best-effort cleanup
  }
}
```

**Step 3: Run tests to verify they pass**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -30`
Expected: ALL PASS — both the existing test and the new wiki cleanup test.

**Step 4: Commit**

```
fix: clean up wiki data and images when deleting wiki widget
```

---

### Task 3: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entry under `[Unreleased]`**

Under the `### Fixed` section (create it if missing):

```markdown
### Fixed
- Wiki images and data are now deleted from blob storage when a wiki widget is removed from the workspace
```

**Step 2: Commit**

```
docs: add wiki cleanup fix to CHANGELOG
```
