# OnPush Change Detection for WidgetContainerComponent

**Date:** 2026-03-07
**Issue:** #27

## Problem

`WidgetContainerComponent` uses Angular's default change detection, meaning Angular checks every widget container on every change detection cycle — even when nothing changed for that widget. With many widgets on screen, this causes unnecessary work.

## Solution

Add `ChangeDetectionStrategy.OnPush` to `WidgetContainerComponent` and inject `ChangeDetectorRef` to manually trigger change detection where needed.

## Changes

**File:** `frontend/src/app/workspace/widget-container/widget-container.component.ts`

1. Import `ChangeDetectionStrategy` and `ChangeDetectorRef`
2. Add `changeDetection: ChangeDetectionStrategy.OnPush` to `@Component` decorator
3. Inject `ChangeDetectorRef` in constructor
4. Add `this.cdr.markForCheck()` in methods with async/internal state changes:
   - `openSettings()` — settings dialog subscription callback
   - `close()` — confirm dialog subscription callback
   - `toggleMaximize()` — toggles `isMaximized` local state

Note: `onDragEnd()`, `onResizeEnd()`, and `onResize()` are triggered by template event bindings or `@HostListener`, which already trigger change detection under OnPush.
