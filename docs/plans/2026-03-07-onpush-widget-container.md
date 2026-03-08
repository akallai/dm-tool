# OnPush WidgetContainerComponent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `ChangeDetectionStrategy.OnPush` to `WidgetContainerComponent` to avoid unnecessary change detection cycles when many widgets are on screen.

**Architecture:** Add OnPush to the component decorator, inject `ChangeDetectorRef`, and call `markForCheck()` in async callbacks (dialog subscriptions) where Angular won't automatically detect changes.

**Tech Stack:** Angular 19, Jest

---

### Task 1: Add OnPush and ChangeDetectorRef

**Files:**
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.ts:1,28,67-72`

**Step 1: Update imports**

In `widget-container.component.ts` line 1, add `ChangeDetectionStrategy` and `ChangeDetectorRef` to the Angular import:

```typescript
import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
```

**Step 2: Add changeDetection to @Component decorator**

In `widget-container.component.ts`, add `changeDetection` to the `@Component` decorator (after `standalone: true,` on line 32):

```typescript
changeDetection: ChangeDetectionStrategy.OnPush,
```

**Step 3: Inject ChangeDetectorRef in constructor**

In `widget-container.component.ts` line 67-72, add `cdr` parameter to the constructor:

```typescript
constructor(
  private settingsService: SettingsService,
  private elementRef: ElementRef,
  private musicPlaybackService: MusicPlaybackService,
  private dialog: MatDialog,
  private cdr: ChangeDetectorRef,
) {}
```

**Step 4: Add markForCheck() in openSettings() subscription callback**

In `widget-container.component.ts` line 113-120, the `openSettings` method has a dialog subscription that mutates `widgetData.settings`. Add `markForCheck()` after the mutation:

```typescript
openSettings(event: MouseEvent) {
  event.stopPropagation();
  const config = this.getWidgetSettingsConfig(this.widgetData.type);
  if (config) {
    this.settingsService.openSettings(config, this.widgetData.settings)
      .subscribe(result => {
        if (result) {
          this.widgetData.settings = result;
          this.update.emit();
          this.cdr.markForCheck();
        }
      });
  }
}
```

**Step 5: Add markForCheck() in close() dialog subscription callback**

In `widget-container.component.ts` line 449-468, the `close` method opens a confirm dialog. The subscription callback needs `markForCheck()` since it may update UI state:

```typescript
close(event: MouseEvent) {
  event.stopPropagation();
  if (this.hasUnsavedChanges()) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Close anyway?',
        confirmText: 'Close',
        warn: true,
      },
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.performClose();
        this.cdr.markForCheck();
      }
    });
  } else {
    this.performClose();
  }
}
```

**Step 6: Run the app and verify widgets still work**

Run: `cd frontend && npm start`

Verify manually:
- Widgets render correctly
- Drag and drop works
- Resize works
- Settings dialog opens and applies changes
- Maximize/restore works
- Close with unsaved changes shows confirm dialog
- Widget title displays correctly

**Step 7: Run existing tests**

Run: `cd frontend && npx jest --passWithNoTests`
Expected: All existing tests pass (no WidgetContainerComponent tests exist yet).

**Step 8: Commit**

```bash
git add frontend/src/app/workspace/widget-container/widget-container.component.ts
git commit -m "perf: add OnPush change detection to WidgetContainerComponent

Closes #27"
```

### Task 2: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entry under [Unreleased]**

Add under the appropriate section (create `### Changed` if it doesn't exist):

```markdown
### Changed
- Widget containers now use OnPush change detection for better performance with many widgets
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG with OnPush change detection"
```
