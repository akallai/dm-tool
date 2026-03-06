# Replace Native Dialogs with Material Dialogs

**Issue:** #8
**Date:** 2026-03-06

## Problem

Six places use browser-native `prompt()`, `confirm()`, or `alert()` instead of Angular Material dialogs, breaking visual consistency.

## Solution

Create two reusable dialog components in `frontend/src/app/dialogs/`:

### ConfirmDialogComponent

- **Data:** `{ title: string, message: string, confirmText?: string, cancelText?: string }`
- **Returns:** `true` (confirmed) or `undefined` (cancelled/dismissed)
- **Consumers:**
  - Combat tracker reset (`combat-tracker.component.ts:1282`)
  - Widget close with unsaved changes (`widget-container.component.ts:447`)
  - Workspace reset (`widget-selector-dialog.component.ts:271`)

### PromptDialogComponent

- **Data:** `{ title: string, message: string, placeholder?: string, defaultValue?: string, confirmText?: string }`
- **Returns:** `string` (entered value) or `undefined` (cancelled/dismissed)
- **Consumers:**
  - Create new wiki (`wiki-widget.component.ts:213`)
  - Insert wiki link (`wiki-widget.component.ts:704`)
  - Create new table collection (`random-generator.component.ts:151`)

## Implementation Notes

- Both components are standalone, use `MAT_DIALOG_DATA` + `MatDialogRef`
- Confirm dialog: warn color on destructive actions, primary otherwise
- Prompt dialog: autofocus input, Enter key submits, validation (non-empty)
- Each consumer opens via injected `MatDialog` service (already available in most)
- `widget-container` and `widget-selector-dialog` need `MatDialog` injected
