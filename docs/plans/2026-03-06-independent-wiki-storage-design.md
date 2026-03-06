# Independent Wiki Storage Design

## Problem
Wiki data is currently embedded in widget settings (`settings.wikiData`), meaning each wiki is tied to a specific widget instance. Users cannot manage wikis independently — creating, opening existing, or deleting wikis across widgets/tabs.

## Solution
Store wikis as independent named entities in user-scoped blob storage. Wiki widgets reference a wiki by ID rather than embedding data.

## Storage Model

### Blob Storage Layout
```
users/{userId}/wikis/{wikiId}/data.json     # Wiki content (name + articles)
users/{userId}/wikis/{wikiId}/images/{id}   # Wiki images
users/{userId}/wikis/{wikiId}/images/{id}.meta  # Image metadata
```

### Wiki Data Blob (`data.json`)
```typescript
interface WikiBlobData {
  name: string;           // User-given wiki name
  articles: WikiArticle[]; // Article tree (same structure as today)
}
```

### Widget Settings (reference only)
```typescript
interface WikiWidgetSettings {
  wikiRef?: {
    wikiId: string;
    wikiName: string;
  };
  currentArticleId?: string;   // Per-widget UI state
  sidebarCollapsed?: boolean;  // Per-widget UI state
}
```

## UX Flow

### Empty State (no wikiRef)
Similar to IMAGE_PDF widget — two buttons:
- **"Create New Wiki"** → name prompt → creates blob → opens
- **"Open Existing Wiki"** → dialog with wiki list → select or delete

### Loaded State
Current wiki editor UI, unchanged. Plus a "switch wiki" action to return to picker.

### Wiki Picker Dialog
- Lists all wikis from `wikis/` prefix (user-scoped)
- Shows wiki name
- Delete button with confirmation
- Click to select and open

## Key Behaviors
- Deleting a widget does NOT delete the wiki
- Deleting a wiki (from picker dialog) deletes all its blobs
- Same wiki can be opened in multiple widget instances
- UI state (current article, sidebar) is per-widget, not per-wiki

## Migration
On first load of an existing widget with `settings.wikiData`:
1. Create new wiki blob from existing data
2. Migrate images from `wiki-images/{widgetId}/` to `wikis/{wikiId}/images/`
3. Replace `settings.wikiData` with `settings.wikiRef`
4. Clean up old image blobs

## Components to Create/Modify
1. **WikiStorageService** (new) — CRUD for wiki data blobs
2. **WikiPickerDialogComponent** (new) — list/select/delete wikis
3. **WikiWidgetComponent** — empty state, load from blob, save to blob
4. **WikiImageStorageService** — update paths to `wikis/{wikiId}/images/`
5. **WorkspaceComponent** — stop deleting wiki blobs on widget removal
