# Header Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract the header bar into a standalone `WorkspaceHeaderComponent` with grouped toolbar layout, unified button styling, and refined aesthetics.

**Architecture:** Extract header HTML/SCSS/logic from `WorkspaceComponent` into a new `WorkspaceHeaderComponent`. The parent keeps tab management methods but delegates UI rendering. Tab rename state moves into the header component (local concern). All action button styles consolidated into one `.toolbar-btn` class.

**Tech Stack:** Angular 19 (standalone components), SCSS, Angular Material icons/tooltips, Jest

---

### Task 1: Create WorkspaceHeaderComponent with template

**Files:**
- Create: `frontend/src/app/workspace/workspace-header/workspace-header.component.ts`
- Create: `frontend/src/app/workspace/workspace-header/workspace-header.component.html`
- Create: `frontend/src/app/workspace/workspace-header/workspace-header.component.scss`

**Step 1: Create the component TypeScript file**

Create `frontend/src/app/workspace/workspace-header/workspace-header.component.ts`:

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Tab } from '../workspace.component';

@Component({
  selector: 'app-workspace-header',
  templateUrl: './workspace-header.component.html',
  styleUrls: ['./workspace-header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceHeaderComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId: string = '';
  @Input() isDirty = false;
  @Input() isSaving = false;

  @Output() tabSwitch = new EventEmitter<string>();
  @Output() tabAdd = new EventEmitter<void>();
  @Output() tabRemove = new EventEmitter<string>();
  @Output() tabRenameFinish = new EventEmitter<{ id: string; name: string }>();
  @Output() openBackground = new EventEmitter<void>();
  @Output() openWidgetSelector = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  editingTabId: string | null = null;
  tempTabName = '';

  startEditingTab(tabId: string, event: MouseEvent) {
    event.stopPropagation();
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      this.editingTabId = tabId;
      this.tempTabName = tab.name;
      setTimeout(() => {
        const input = document.getElementById(`tab-name-input-${tabId}`);
        if (input) input.focus();
      }, 0);
    }
  }

  finishEditingTab() {
    if (this.editingTabId && this.tempTabName.trim()) {
      this.tabRenameFinish.emit({ id: this.editingTabId, name: this.tempTabName.trim() });
    }
    this.editingTabId = null;
  }

  onRemoveTab(tabId: string, event: MouseEvent) {
    event.stopPropagation();
    this.tabRemove.emit(tabId);
  }

  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }
}
```

**Step 2: Create the template**

Create `frontend/src/app/workspace/workspace-header/workspace-header.component.html`:

```html
<div class="header-bar">
  <!-- Tabs section -->
  <div class="tabs-section">
    <div *ngFor="let tab of tabs; trackBy: trackByTabId"
         class="tab"
         [class.active]="tab.id === activeTabId"
         [class.editing]="editingTabId === tab.id"
         (click)="tabSwitch.emit(tab.id)"
         (dblclick)="startEditingTab(tab.id, $event)">

      <span *ngIf="editingTabId !== tab.id" class="tab-name">{{ tab.name }}</span>

      <input *ngIf="editingTabId === tab.id"
             [id]="'tab-name-input-' + tab.id"
             class="tab-name-input"
             [(ngModel)]="tempTabName"
             (blur)="finishEditingTab()"
             (keydown.enter)="finishEditingTab()"
             (keydown.escape)="editingTabId = null"
             (click)="$event.stopPropagation()">

      <button *ngIf="tabs.length > 1 && editingTabId !== tab.id"
              class="tab-close-btn"
              (click)="onRemoveTab(tab.id, $event)"
              matTooltip="Close tab">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- Add tab button -->
    <button class="toolbar-btn" (click)="tabAdd.emit()" matTooltip="Add new tab">
      <mat-icon>add</mat-icon>
    </button>
  </div>

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Actions section -->
  <div class="actions-section">
    <button class="toolbar-btn" (click)="openBackground.emit()" matTooltip="Change background">
      <mat-icon>palette</mat-icon>
    </button>

    <button class="toolbar-btn" (click)="openWidgetSelector.emit()" matTooltip="Add new widget">
      <mat-icon>extension</mat-icon>
    </button>

    <button class="toolbar-btn"
            [class.dirty]="isDirty"
            [class.saving]="isSaving"
            (click)="save.emit()"
            [matTooltip]="isDirty ? 'Save changes (Ctrl+S)' : 'All changes saved'">
      <mat-icon>{{ isSaving ? 'sync' : 'save' }}</mat-icon>
    </button>
  </div>
</div>
```

**Step 3: Create the SCSS**

Create `frontend/src/app/workspace/workspace-header/workspace-header.component.scss`:

```scss
.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  display: flex;
  align-items: center;
  padding: 0 12px;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

// --- Tabs Section ---

.tabs-section {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  gap: 4px;
  align-items: center;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab {
  display: flex;
  align-items: center;
  min-width: 80px;
  max-width: 160px;
  height: 32px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 0 12px;
  user-select: none;
  color: var(--text-secondary);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);

    .tab-close-btn {
      opacity: 1;
    }
  }

  &.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent-color);
    background: rgba(255, 255, 255, 0.04);
  }

  &.editing {
    background: var(--input-bg);
    border-bottom-color: var(--accent-color);
  }

  &.active .tab-close-btn {
    opacity: 0;
  }

  &.active:hover .tab-close-btn {
    opacity: 1;
  }
}

.tab-name {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-name-input {
  width: 100%;
  height: 100%;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  padding: 0;
  margin: 0;
}

.tab-close-btn {
  position: absolute;
  right: 4px;
  width: 18px;
  height: 18px;
  background: rgba(255, 82, 82, 0.2);
  border: 1px solid rgba(255, 82, 82, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: all 0.2s;

  &:hover {
    background: var(--danger-color);
    border-color: var(--danger-color);
    transform: scale(1.1);
  }

  .mat-icon {
    font-size: 12px;
    width: 12px;
    height: 12px;
    line-height: 12px;
    color: var(--text-primary);
  }
}

// --- Divider ---

.divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 16px;
  flex-shrink: 0;
}

// --- Actions Section ---

.actions-section {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

// --- Unified Toolbar Button ---

.toolbar-btn {
  width: 32px;
  height: 32px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(64, 196, 255, 0.2);
    border-color: var(--accent-color);
    color: var(--text-primary);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(64, 196, 255, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }

  &.dirty {
    color: #ffa726;
    border-color: rgba(255, 167, 38, 0.5);
    background: rgba(255, 167, 38, 0.15);
    animation: pulse-dirty 2s ease-in-out infinite;

    &:hover {
      background: rgba(255, 167, 38, 0.3);
      border-color: #ffa726;
      box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
    }
  }

  &.saving {
    pointer-events: none;
    .mat-icon {
      animation: spin 1s linear infinite;
    }
  }

  .mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
    line-height: 18px;
  }
}

@keyframes pulse-dirty {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Step 4: Verify the component compiles**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`

Expected: No errors related to workspace-header component files.

**Step 5: Commit**

```bash
git add frontend/src/app/workspace/workspace-header/
git commit -m "feat: create WorkspaceHeaderComponent with grouped toolbar layout"
```

---

### Task 2: Wire header component into WorkspaceComponent

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.ts`
- Modify: `frontend/src/app/workspace/workspace.component.html`
- Modify: `frontend/src/app/workspace/workspace.component.scss`

**Step 1: Update workspace.component.ts**

Remove these imports (no longer needed in workspace): `FormsModule`

Add import: `import { WorkspaceHeaderComponent } from './workspace-header/workspace-header.component';`

In `imports` array: replace `FormsModule` with `WorkspaceHeaderComponent`.

Remove these methods from WorkspaceComponent (moved to header):
- `startEditingTab()`
- `trackByTabId()`

Remove these properties:
- `editingTabId`
- `tempTabName`

Change `finishEditingTab()` to `renameTab(event: { id: string; name: string })`:
```typescript
renameTab(event: { id: string; name: string }) {
  const tab = this.tabs.find(t => t.id === event.id);
  if (tab) {
    tab.name = event.name;
    this.saveTabs();
  }
}
```

Simplify `removeTab` — remove event parameter handling (header handles stopPropagation now):
```typescript
removeTab(tabId: string) {
  if (this.tabs.length <= 1) return;
  this.tabs = this.tabs.filter(tab => tab.id !== tabId);
  if (this.activeTabId === tabId) {
    this.activeTabId = this.tabs[0].id;
  }
  this.saveTabs();
  this.cdr.markForCheck();
}
```

**Step 2: Update workspace.component.html**

Replace the entire `<div class="tabs-bar vertical">...</div>` block (lines 8-61) with:

```html
  <app-workspace-header
    [tabs]="tabs"
    [activeTabId]="activeTabId"
    [isDirty]="isDirty"
    [isSaving]="isSaving"
    (tabSwitch)="switchTab($event)"
    (tabAdd)="addTab()"
    (tabRemove)="removeTab($event)"
    (tabRenameFinish)="renameTab($event)"
    (openBackground)="openBackgroundSelector()"
    (openWidgetSelector)="openWidgetSelector()"
    (save)="saveToServer()">
  </app-workspace-header>
```

**Step 3: Clean up workspace.component.scss**

Remove ALL of these style blocks (they now live in the header component):
- `.add-widget-btn` (lines 26-62)
- `.save-btn` (lines 64-120)
- `@keyframes pulse-dirty` (lines 122-125)
- `@keyframes spin` (lines 127-130)
- `.bg-selector-btn` (lines 132-169)
- `.tabs-bar.vertical` (lines 171-188)
- `.tabs-bar.vertical .tabs-container` (lines 190-204)
- `.tabs-bar.vertical .tab` (lines 206-307)
- `.tabs-bar.vertical .add-tab-btn` (lines 309-345)

Keep only `.save-error-banner` and `.workspace` styles.

**Step 4: Verify build**

Run: `cd frontend && npx ng build --configuration development 2>&1 | head -20`

Expected: Successful build, no errors.

**Step 5: Commit**

```bash
git add frontend/src/app/workspace/
git commit -m "refactor: wire WorkspaceHeaderComponent into workspace"
```

---

### Task 3: Update WorkspaceComponent tests

**Files:**
- Modify: `frontend/src/app/workspace/workspace.component.spec.ts`

**Step 1: Update tests to match new interface**

The `removeTab` method no longer takes an event parameter. Update these tests:

1. Remove the test `'should stop event propagation when event provided'` (line 313-323) — this is now the header's responsibility.

2. Update `removeTab` calls — remove the event argument from existing calls. They should just be `component.removeTab('t2')`.

3. Remove `finishEditingTab` tests that reference `editingTabId` and `tempTabName` (lines 429-452) — these moved to the header component.

4. Add a test for the new `renameTab` method:

```typescript
describe('renameTab', () => {
  it('should rename tab and save', () => {
    component.tabs = [{ id: 't1', name: 'Old', widgets: [] }];
    component.activeTabId = 't1';

    component.renameTab({ id: 't1', name: 'New Name' });

    expect(component.tabs[0].name).toBe('New Name');
    expect(component.isDirty).toBe(true);
  });

  it('should do nothing for unknown tab id', () => {
    component.tabs = [{ id: 't1', name: 'Original', widgets: [] }];
    component.activeTabId = 't1';

    component.renameTab({ id: 'unknown', name: 'New' });

    expect(component.tabs[0].name).toBe('Original');
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `cd frontend && npx jest --testPathPattern workspace.component.spec --verbose 2>&1`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add frontend/src/app/workspace/workspace.component.spec.ts
git commit -m "test: update workspace tests for header extraction"
```

---

### Task 4: Add WorkspaceHeaderComponent tests

**Files:**
- Create: `frontend/src/app/workspace/workspace-header/workspace-header.component.spec.ts`

**Step 1: Write header component tests**

Create `frontend/src/app/workspace/workspace-header/workspace-header.component.spec.ts`:

```typescript
import { WorkspaceHeaderComponent } from './workspace-header.component';

describe('WorkspaceHeaderComponent', () => {
  let component: WorkspaceHeaderComponent;

  beforeEach(() => {
    component = new WorkspaceHeaderComponent();
    component.tabs = [
      { id: 't1', name: 'Tab 1', widgets: [] },
      { id: 't2', name: 'Tab 2', widgets: [] },
    ];
    component.activeTabId = 't1';
  });

  describe('startEditingTab', () => {
    it('should set editingTabId and tempTabName', () => {
      const event = { stopPropagation: jest.fn() } as any;

      component.startEditingTab('t1', event);

      expect(component.editingTabId).toBe('t1');
      expect(component.tempTabName).toBe('Tab 1');
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not set editing for unknown tab', () => {
      const event = { stopPropagation: jest.fn() } as any;

      component.startEditingTab('unknown', event);

      expect(component.editingTabId).toBeNull();
    });
  });

  describe('finishEditingTab', () => {
    it('should emit tabRenameFinish with trimmed name', () => {
      const spy = jest.fn();
      component.tabRenameFinish.subscribe(spy);
      component.editingTabId = 't1';
      component.tempTabName = '  New Name  ';

      component.finishEditingTab();

      expect(spy).toHaveBeenCalledWith({ id: 't1', name: 'New Name' });
      expect(component.editingTabId).toBeNull();
    });

    it('should not emit if temp name is blank', () => {
      const spy = jest.fn();
      component.tabRenameFinish.subscribe(spy);
      component.editingTabId = 't1';
      component.tempTabName = '   ';

      component.finishEditingTab();

      expect(spy).not.toHaveBeenCalled();
      expect(component.editingTabId).toBeNull();
    });

    it('should not emit if no editingTabId', () => {
      const spy = jest.fn();
      component.tabRenameFinish.subscribe(spy);
      component.editingTabId = null;

      component.finishEditingTab();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveTab', () => {
    it('should emit tabRemove and stop propagation', () => {
      const spy = jest.fn();
      component.tabRemove.subscribe(spy);
      const event = { stopPropagation: jest.fn() } as any;

      component.onRemoveTab('t2', event);

      expect(spy).toHaveBeenCalledWith('t2');
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('trackByTabId', () => {
    it('should return tab id', () => {
      expect(component.trackByTabId(0, { id: 'abc', name: 'X', widgets: [] })).toBe('abc');
    });
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `cd frontend && npx jest --testPathPattern workspace-header.component.spec --verbose 2>&1`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add frontend/src/app/workspace/workspace-header/workspace-header.component.spec.ts
git commit -m "test: add WorkspaceHeaderComponent unit tests"
```

---

### Task 5: Visual verification and changelog

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Run all tests**

Run: `cd frontend && npx jest --verbose 2>&1`

Expected: All tests pass, no regressions.

**Step 2: Build production**

Run: `cd frontend && npm run build 2>&1`

Expected: Successful build, no warnings about bundle size.

**Step 3: Visual check**

Run: `cd frontend && npm start`

Verify in browser at http://localhost:4200:
- Header bar is 44px height (slimmer than before)
- Tabs are left-aligned with 4px gap
- Vertical divider visible between tabs and action buttons
- Action buttons are right-aligned with 8px gap
- Active tab has 2px bottom accent line (not full border glow)
- All action buttons share same hover style (cyan accent)
- Save dirty state still shows orange
- Tab rename on double-click still works
- Tab close on hover still works
- Ctrl+S still saves
- Background selector still opens dialog

**Step 4: Update CHANGELOG.md**

Add under `[Unreleased]`:

```markdown
### Changed
- Refactored workspace header into standalone `WorkspaceHeaderComponent` with grouped toolbar layout
- Unified action button styling with consistent hover effects
- Reduced header height from 52px to 44px for more workspace real estate
- Active tab now uses a subtle bottom accent line instead of full border glow
```

**Step 5: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG with header refactor"
```
