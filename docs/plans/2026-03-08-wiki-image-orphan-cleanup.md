# Wiki Image Orphan Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure wiki images are deleted from Azure Blob Storage when removed from the editor or when the wiki widget is deleted.

**Architecture:** Two fixes — (1) add `wikis/` prefix to widget deletion cleanup, (2) add a TipTap `onTransaction` listener that diffs `wikiImage` node sets and calls `deleteImage()` for removed ones.

**Tech Stack:** Angular 19, TipTap, WikiImageStorageService

---

### Task 1: Add `wikis/` prefix to widget deletion cleanup

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts:161-173`

**Step 1: Update `cleanupWidgetBlobs` to include wiki prefix**

Change the prefixes array at line 163 to also clean up wiki images:

```typescript
const prefixes = [`files/${widgetId}/`, `audio/${widgetId}/`, `wikis/${widgetId}/`];
```

**Step 2: Run tests**

Run: `cd frontend && npx ng test --watch=false`
Expected: All existing tests pass.

**Step 3: Commit**

```bash
git add frontend/src/app/workspace/workspace.component.ts
git commit -m "fix: clean up wiki blobs when widget is deleted"
```

---

### Task 2: Add transaction-based image deletion to wiki widget

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`

**Step 1: Add a helper method to collect all `wikiImage` src values from a TipTap document**

Add this private method to `WikiWidgetComponent`:

```typescript
private collectImageIds(doc: any): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node: any) => {
    if (node.type.name === 'wikiImage' && node.attrs.src?.startsWith('wiki-image://')) {
      ids.add(node.attrs.src.replace('wiki-image://', ''));
    }
  });
  return ids;
}
```

**Step 2: Add a `previousImageIds` field to track image state between transactions**

Add to the class fields (around line 77):

```typescript
private previousImageIds = new Set<string>();
```

**Step 3: Add `onTransaction` callback to the editor initialization**

In `initializeEditor()` (around line 327), add an `onTransaction` handler to the Editor constructor options, after the existing `onSelectionUpdate`:

```typescript
onTransaction: ({ editor }) => {
  const currentIds = this.collectImageIds(editor.state.doc);

  for (const id of this.previousImageIds) {
    if (!currentIds.has(id)) {
      this.imageStorage.deleteImage(id).catch(() => {});
    }
  }

  this.previousImageIds = currentIds;
},
```

**Step 4: Initialize `previousImageIds` after loading article content**

In `loadArticleContent()` (around line 426, after `setContent`), add:

```typescript
this.previousImageIds = this.collectImageIds(this.editor.state.doc);
```

This ensures that when switching articles, the previous image set is reset so we don't wrongly delete images from the prior article.

**Step 5: Run tests**

Run: `cd frontend && npx ng test --watch=false`
Expected: All existing tests pass.

**Step 6: Commit**

```bash
git add frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts
git commit -m "fix: delete wiki images from Azure when removed from editor"
```

---

### Task 3: Add image cleanup on article deletion

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`

When an article is deleted, its content (including `wiki-image://` URLs) is discarded. Since `deleteArticle` doesn't go through the editor transaction flow (it just filters the article tree), images in deleted articles would be orphaned.

**Step 1: Add a helper to extract image IDs from article HTML content**

```typescript
private extractImageIdsFromHtml(html: string): string[] {
  const ids: string[] = [];
  const regex = /wiki-image:\/\/([a-f0-9-]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}
```

**Step 2: Add a recursive helper to collect all image IDs from an article and its children**

```typescript
private collectArticleImageIds(article: WikiArticle): string[] {
  const ids = this.extractImageIdsFromHtml(article.content || '');
  if (article.children) {
    for (const child of article.children) {
      ids.push(...this.collectArticleImageIds(child));
    }
  }
  return ids;
}
```

**Step 3: Call cleanup in `deleteArticle()`**

In `deleteArticle()` (line 516), before removing the article from the tree, collect and delete its images:

```typescript
deleteArticle(article: WikiArticle, event?: MouseEvent) {
  if (event) {
    event.stopPropagation();
  }

  // Clean up images from deleted article and its children
  const imageIds = this.collectArticleImageIds(article);
  for (const id of imageIds) {
    this.imageStorage.deleteImage(id).catch(() => {});
  }

  this.wikiData.articles = this.removeArticle(this.wikiData.articles, article.id);
  // ... rest unchanged
```

**Step 4: Run tests**

Run: `cd frontend && npx ng test --watch=false`
Expected: All existing tests pass.

**Step 5: Commit**

```bash
git add frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts
git commit -m "fix: delete wiki images when article is deleted"
```

---

### Task 4: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entry under `[Unreleased]`**

```markdown
### Fixed
- Wiki images are now deleted from cloud storage when removed from articles, when articles are deleted, or when the wiki widget is deleted
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG with wiki image cleanup fix"
```
