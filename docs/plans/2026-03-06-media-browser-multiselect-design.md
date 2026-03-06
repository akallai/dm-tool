# Media Browser Multiselect Design

## Problem
The Media Browser dialog is single-select only. Clicking a file immediately closes the dialog. For the music widget, users need to select multiple audio files to build playlists (one mapping = one channel with multiple tracks that play sequentially).

## Solution
Add a `multiple` mode to `MediaBrowserDialogComponent`. When enabled, files are toggled on/off instead of instantly selected, and a confirmation button submits the full selection.

## Changes

### `MediaBrowserDialogData`
- Add `multiple?: boolean` field.

### `MediaBrowserDialogComponent`
- New state: `selectedFiles: Map<string, { file: FileMetadata, scope: 'user' | 'shared' }>` keyed by `scope:path`.
- `selectFile()`: when `multiple` is true, toggle the file in/out of `selectedFiles` instead of closing.
- New method `confirmSelection()`: builds `MediaBrowserResult[]` from `selectedFiles` and closes dialog.
- Template changes (when `multiple` is true):
  - File row click toggles selection.
  - Icon switches between `check_box` / `check_box_outline_blank`.
  - Selected rows get accent-tinted background.
  - Dialog actions: `Cancel` | `Add N file(s)` button (disabled when 0 selected).
- When `multiple` is false/absent: behavior unchanged (single-select, instant close).

### `BaseSettingsDialogComponent.browseLibraryForMapping()`
- Pass `{ filter: 'audio', multiple: true }` as dialog data.
- Handle `MediaBrowserResult[]` return: download each file, convert to data URL, push all into `mapping.files`.

### No changes needed
- `MusicMapping` data model (already `files: MusicFile[]`)
- `MusicPlaybackService` (already supports playlists)
- `MusicWidgetComponent` (already has next/previous/shuffle/loop)
- `AudioStorageService` (already saves/loads file arrays)

## Files to modify
1. `frontend/src/app/dialogs/media-browser-dialog/media-browser-dialog.component.ts`
2. `frontend/src/app/settings/components/base-settings-dialog/base-settings-dialog.component.ts`
