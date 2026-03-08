# Wiki Image Orphan Cleanup — Design

## Problem

Wiki images become orphaned in Azure Blob Storage in two scenarios:

1. **Widget deletion:** `cleanupWidgetBlobs()` cleans up `files/` and `audio/` prefixes but not `wikis/{widgetId}/`, leaving all wiki images and data as permanent orphans.
2. **Image removal from editor:** When a user removes an image from article content (backspace, cut, etc.), only the HTML reference is deleted. The blob at `wikis/{wikiId}/images/{imageId}` remains forever.

## Constraints

- Each image is referenced exactly once (no shared images across articles).
- Deletion from Azure is best-effort (fire-and-forget, no UI error on failure).

## Design

### Fix 1: Widget deletion cleanup

Add `wikis/{widgetId}/` to the prefixes in `cleanupWidgetBlobs()` in `workspace.component.ts`. This deletes all wiki images and wiki data when the entire widget is removed.

### Fix 2: Editor image removal cleanup (Approach A — transaction listener)

In `wiki-widget.component.ts`, use TipTap's `onTransaction` hook to detect removed `wikiImage` nodes:

- Before each transaction: collect all `wiki-image://` IDs in the document.
- After each transaction: collect again. IDs present before but missing after were removed.
- For each removed ID: call `WikiImageStorageService.deleteImage(imageId)` to delete the blob + metadata from Azure.

This covers all removal scenarios: backspace, cut, select-all + delete, undo, content replacement, etc.

### Scope

Two files changed:

1. `workspace.component.ts` — add `wikis/` prefix to cleanup
2. `wiki-widget.component.ts` — add transaction listener for image node removal

### What stays the same

- Upload flow (unchanged)
- Blob URL caching/revocation (unchanged)
- `deleteImage()` method in `WikiImageStorageService` (already exists, just needs to be called)
