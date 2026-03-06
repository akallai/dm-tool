# Cloud-Only Wiki & Remove Notepad

## Summary

Remove the Notepad widget entirely (superseded by Wiki) and migrate the Wiki widget to cloud-only persistence by removing all File System Access API usage and ZIP import/export.

## Changes

### Remove Notepad Widget
- Delete `frontend/src/app/widgets/notepad-widget/` directory
- Remove `NOTEPAD` from `WidgetType` enum in `widget-selector-dialog.component.ts`
- Remove Notepad import and case from `widget-container.component.ts`
- Remove Notepad settings config from `getWidgetSettingsConfig()`
- Remove Notepad title mapping from `getTitle()`

### Simplify Wiki Widget
- **Remove toolbar buttons**: Open (`folder_open`), New (`note_add`), Import (`upload`), Export (`download`)
- **Remove File System Access API**: `showSaveFilePicker`, `showOpenFilePicker`, `fileHandle` property, local file auto-save, permission requests
- **Remove `WikiFileHandleService`**: IndexedDB persistence for file handles (entire service)
- **Remove `WikiExportService`**: ZIP export/import logic (entire service)
- **Remove `jszip` dependency** from package.json
- **Remove empty state**: No more "No wiki loaded. Open an existing wiki or create a new one."
- **Auto-initialize**: When widget is first added and `wikiData` is empty, create a wiki with a single "Welcome" article pre-loaded in the editor
- **Remove file status indicators**: `link_off` warning, file name display, `NOT SAVED` indicator, stale save detection

### Persistence (no changes)
- `wikiData` stored in `settings.wikiData` -> workspace JSON -> Azure Blob (already works)
- Wiki images via `WikiImageStorageService` -> Azure Blob (already works)
- Debounced workspace save via `WorkspacePersistenceService` (already works)

## What stays the same
- TipTap WYSIWYG editor with all formatting
- Hierarchical article tree with sidebar
- Wiki links (`[[Article]]` and `[[Article#Header]]`)
- Image upload/paste/drop (cloud-stored via WikiImageStorageService)
- Search/filter articles
- Table support
- Article CRUD (add, delete, rename, reorder)
