# Header Refactor Design

**Date:** 2026-03-07
**Goal:** Polish the workspace header/tabs-bar aesthetic while preserving all existing functionality.

## Current State

A single 52px glass bar spans the full width containing all elements in one flat row:
- Tab buttons (scrollable, inline rename/close)
- Add Tab button (+)
- Background selector button (palette)
- Add Widget button (extension)
- Save button (save)

All action buttons use nearly identical but duplicated 40x40px styling (~120 lines of repeated SCSS) with different hover colors per button.

## Design

### Layout: Grouped Toolbar

```
+------------------------------------------------------------------+
|  [Main Tab] [Combat] [Loot]  [+]    |    bg   widget   save      |
+------------------------------------------------------------------+
   <-- tabs section (flex grow) -->  div  <-- actions (fixed) -->
```

- **Tabs section** (left): `flex: 1`, scrolls horizontally on overflow. "Add Tab" button is the last item in this group.
- **Vertical divider**: Subtle 1px line (`rgba(255,255,255,0.12)`) with 16px horizontal margin on each side.
- **Actions section** (right): Fixed group of icon buttons (Background, Add Widget, Save). Right-aligned, `flex-shrink: 0`.

### Visual Changes

1. **Unified `.toolbar-btn` class**: All action buttons share one base style (32px rounded, same background/border/hover). Eliminates ~120 lines of duplicated SCSS.

2. **Unified hover color**: All buttons use cyan accent (`--accent-color`) on hover. Only exception: save "dirty" state keeps orange to signal unsaved changes.

3. **Refined active tab indicator**: Active tab uses a 2px bottom accent line instead of full border + box-shadow glow. Cleaner, less heavy.

4. **Better spacing**: 8px gap between action buttons, 4px gap between tabs. Divider has 16px margin on each side.

5. **Height reduction**: Bar 52px -> 44px. Tabs/buttons 40px -> 32px. More workspace real estate.

6. **Component extraction**: Extract header into `WorkspaceHeaderComponent` as a standalone Angular component. Separates header UI from workspace logic.

### What Stays the Same

- Glass background (`--glass-bg`, `--glass-backdrop`)
- Tab rename on double-click
- Tab close on hover
- Save dirty/saving animation states
- Ctrl+S shortcut (remains on WorkspaceComponent)
- Tooltip behavior
- Icon-only buttons with tooltips

### Component Interface

```typescript
// WorkspaceHeaderComponent inputs/outputs
@Input() tabs: Tab[]
@Input() activeTabId: string
@Input() isDirty: boolean
@Input() isSaving: boolean
@Input() editingTabId: string | null

@Output() tabSwitch = new EventEmitter<string>()
@Output() tabAdd = new EventEmitter<void>()
@Output() tabRemove = new EventEmitter<string>()
@Output() tabRenameStart = new EventEmitter<string>()
@Output() tabRenameFinish = new EventEmitter<{id: string, name: string}>()
@Output() openBackground = new EventEmitter<void>()
@Output() openWidgetSelector = new EventEmitter<void>()
@Output() save = new EventEmitter<void>()
```
