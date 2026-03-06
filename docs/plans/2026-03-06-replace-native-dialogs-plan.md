# Replace Native Dialogs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all 6 browser-native `prompt()`/`confirm()` calls with Angular Material dialogs.

**Architecture:** Two reusable standalone dialog components (ConfirmDialogComponent, PromptDialogComponent) in `frontend/src/app/dialogs/`, then update each consumer to use them via `MatDialog.open()`.

**Tech Stack:** Angular 19, Angular Material (`MatDialog`, `MatDialogRef`, `MAT_DIALOG_DATA`, `MatFormField`, `MatInput`, `MatButton`)

---

### Task 1: Create ConfirmDialogComponent

**Files:**
- Create: `frontend/src/app/dialogs/confirm-dialog/confirm-dialog.component.ts`

**Step 1: Create the component**

```typescript
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  warn?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ data.cancelText || 'Cancel' }}</button>
      <button mat-flat-button [color]="data.warn ? 'warn' : 'primary'" (click)="dialogRef.close(true)">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}
}
```

**Step 2: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | head -5`
Expected: Build succeeds (new component is tree-shaken since not yet used)

**Step 3: Commit**

```
feat: add reusable ConfirmDialogComponent (#8)
```

---

### Task 2: Create PromptDialogComponent

**Files:**
- Create: `frontend/src/app/dialogs/prompt-dialog/prompt-dialog.component.ts`

**Step 1: Create the component**

```typescript
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PromptDialogData {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
}

@Component({
  selector: 'app-prompt-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-form-field appearance="outline" style="width: 100%">
        <input matInput
               [(ngModel)]="value"
               [placeholder]="data.placeholder || ''"
               (keydown.enter)="submit()"
               cdkFocusInitial>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!value.trim()" (click)="submit()">
        {{ data.confirmText || 'OK' }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
})
export class PromptDialogComponent {
  value: string;

  constructor(
    public dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData,
  ) {
    this.value = data.defaultValue || '';
  }

  submit() {
    if (this.value.trim()) {
      this.dialogRef.close(this.value);
    }
  }
}
```

**Step 2: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | head -5`
Expected: Build succeeds

**Step 3: Commit**

```
feat: add reusable PromptDialogComponent (#8)
```

---

### Task 3: Replace `confirm()` in CombatTrackerComponent

**Files:**
- Modify: `frontend/src/app/widgets/combat-tracker/combat-tracker.component.ts`
  - Line 6: `MatDialog` is already imported
  - Line ~1281-1288: `reset()` method

**Step 1: Add import for ConfirmDialogComponent**

At top of file, add:
```typescript
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
```

**Step 2: Find the `MatDialog` injection in constructor**

The component already injects `MatDialog` (it has `MatDialogRef` usage for its own sub-dialog). Verify `private dialog: MatDialog` exists in constructor. If not, add it.

**Step 3: Replace `reset()` method (around line 1281)**

Replace:
```typescript
reset() {
  if (confirm('Are you sure you want to reset the combat tracker?')) {
    this.activeIndex = 0;
    this.currentRound = 1;
    this.saveState();
    this.cdr.detectChanges();
  }
}
```

With:
```typescript
reset() {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Reset Combat',
      message: 'Are you sure you want to reset the combat tracker?',
      confirmText: 'Reset',
      warn: true,
    },
  });
  dialogRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      this.activeIndex = 0;
      this.currentRound = 1;
      this.saveState();
      this.cdr.detectChanges();
    }
  });
}
```

Note: Find `this.dialog` — the combat tracker uses `MatDialog` for its own sub-dialogs (AddCombatantDialog etc). Check the constructor parameter name. It may be called `private dialog: MatDialog`. Use the same variable.

**Step 4: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | tail -3`

**Step 5: Commit**

```
refactor: replace native confirm in combat tracker reset (#8)
```

---

### Task 4: Replace `confirm()` in WidgetContainerComponent

**Files:**
- Modify: `frontend/src/app/workspace/widget-container/widget-container.component.ts`
  - Imports (line 1-24): Need to add `MatDialog`, `MatDialogModule`
  - Constructor (line 64-68): Need to inject `MatDialog`
  - `close()` method (line 445-455)

**Step 1: Add imports**

```typescript
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
```

Add `MatDialogModule` to the component's `imports` array.

**Step 2: Inject MatDialog in constructor**

```typescript
constructor(
  private settingsService: SettingsService,
  private elementRef: ElementRef,
  private musicPlaybackService: MusicPlaybackService,
  private dialog: MatDialog,
) {}
```

**Step 3: Replace `close()` method**

Replace:
```typescript
close(event: MouseEvent) {
  event.stopPropagation();
  if (this.hasUnsavedChanges() && !confirm('You have unsaved changes. Close anyway?')) {
    return;
  }
  // Stop music playback when explicitly closing a music widget
  if (this.widgetData.type === 'MUSIC_WIDGET') {
    this.musicPlaybackService.stopAllForWidget(this.widgetData.id);
  }
  this.closeEvent.emit();
}
```

With:
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
      }
    });
  } else {
    this.performClose();
  }
}

private performClose() {
  if (this.widgetData.type === 'MUSIC_WIDGET') {
    this.musicPlaybackService.stopAllForWidget(this.widgetData.id);
  }
  this.closeEvent.emit();
}
```

**Step 4: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | tail -3`

**Step 5: Commit**

```
refactor: replace native confirm in widget close (#8)
```

---

### Task 5: Replace `confirm()` in WidgetSelectorDialogComponent

**Files:**
- Modify: `frontend/src/app/dialogs/widget-selector-dialog/widget-selector-dialog.component.ts`
  - Line 1: Add `MatDialog` import
  - Line 264: Add `MatDialog` to constructor
  - Line 270-274: `reset()` method

**Step 1: Update imports**

Change line 1:
```typescript
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
```

Add:
```typescript
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
```

**Step 2: Update constructor**

```typescript
constructor(
  private dialogRef: MatDialogRef<WidgetSelectorDialogComponent>,
  private dialog: MatDialog,
) {}
```

**Step 3: Replace `reset()` method**

Replace:
```typescript
reset() {
  if (confirm('Are you sure you want to reset the workspace? All widgets will be closed.')) {
    this.dialogRef.close({ action: 'reset' });
  }
}
```

With:
```typescript
reset() {
  const confirmRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Reset Workspace',
      message: 'Are you sure you want to reset the workspace? All widgets will be closed.',
      confirmText: 'Reset',
      warn: true,
    },
  });
  confirmRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      this.dialogRef.close({ action: 'reset' });
    }
  });
}
```

**Step 4: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | tail -3`

**Step 5: Commit**

```
refactor: replace native confirm in workspace reset (#8)
```

---

### Task 6: Replace `prompt()` in WikiWidgetComponent

**Files:**
- Modify: `frontend/src/app/widgets/wiki-widget/wiki-widget.component.ts`
  - Imports: Add `PromptDialogComponent`
  - `createNewWiki()` method (line 212-231)
  - `insertWikiLink()` method (line 703-723)

**Step 1: Add import**

```typescript
import { PromptDialogComponent } from '../../dialogs/prompt-dialog/prompt-dialog.component';
```

`MatDialog` is already imported and injected as `this.dialog`.

**Step 2: Replace `createNewWiki()` method**

Replace:
```typescript
async createNewWiki() {
  const name = prompt('Enter wiki name:');
  if (!name?.trim()) return;
  ...
}
```

With:
```typescript
createNewWiki() {
  const dialogRef = this.dialog.open(PromptDialogComponent, {
    width: '400px',
    data: {
      title: 'New Wiki',
      message: 'Enter a name for the new wiki:',
      placeholder: 'Wiki name',
      confirmText: 'Create',
    },
  });
  dialogRef.afterClosed().subscribe(async (name: string | undefined) => {
    if (!name?.trim()) return;

    this.loading = true;
    this.cdr.markForCheck();

    try {
      const ref = await this.wikiStorage.createWiki(name.trim());
      this.wikiRef = ref;
      this.settings.wikiRef = ref;
      delete this.settings.wikiData;
      this.settingsChange.emit();
      await this.loadWikiFromBlob(ref.wikiId);
    } catch (error) {
      console.error('Error creating wiki:', error);
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}
```

**Step 3: Replace `insertWikiLink()` method**

Replace:
```typescript
insertWikiLink() {
  const input = prompt('Enter article title (use # for header, e.g. Article#Header):');
  if (input && this.editor) {
    ...
  }
}
```

With:
```typescript
insertWikiLink() {
  const dialogRef = this.dialog.open(PromptDialogComponent, {
    width: '400px',
    data: {
      title: 'Insert Wiki Link',
      message: 'Enter article title (use # for header, e.g. Article#Header):',
      placeholder: 'Article#Header',
    },
  });
  dialogRef.afterClosed().subscribe((input: string | undefined) => {
    if (input && this.editor) {
      const hashIndex = input.indexOf('#');
      let title: string | null = null;
      let header: string | null = null;

      if (hashIndex !== -1) {
        title = input.substring(0, hashIndex) || null;
        header = input.substring(hashIndex + 1) || null;
      } else {
        title = input;
      }

      this.editor.chain().focus().insertContent({
        type: 'text',
        text: input,
        marks: [{ type: 'wikiLink', attrs: { title, header } }],
      }).run();
    }
  });
}
```

**Step 4: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | tail -3`

**Step 5: Commit**

```
refactor: replace native prompts in wiki widget (#8)
```

---

### Task 7: Replace `prompt()` in RandomGeneratorComponent

**Files:**
- Modify: `frontend/src/app/widgets/random-generator/random-generator.component.ts`
  - Imports: Add `PromptDialogComponent`
  - `createNewTable()` method (line 150-173)

**Step 1: Add import**

```typescript
import { PromptDialogComponent } from '../../dialogs/prompt-dialog/prompt-dialog.component';
```

`MatDialog` is already imported and injected as `this.dialog`.

**Step 2: Replace `createNewTable()` method**

Replace:
```typescript
async createNewTable() {
  const name = prompt('Table collection name:');
  if (!name) return;
  ...
}
```

With:
```typescript
createNewTable() {
  const dialogRef = this.dialog.open(PromptDialogComponent, {
    width: '400px',
    data: {
      title: 'New Table Collection',
      message: 'Enter a name for the table collection:',
      placeholder: 'Table name',
      confirmText: 'Create',
    },
  });
  dialogRef.afterClosed().subscribe(async (name: string | undefined) => {
    if (!name) return;

    this.loading = true;
    this.cdr.markForCheck();

    try {
      const ref = await this.tableStorage.createTable(name);
      this.tableRef = ref;
      this.settings.tableRef = ref;
      this.settings.mappings = [];
      this.settings.mappingCategories = [];
      this.settings.useWeightedSelection = true;
      this.mappings = this.settings.mappings;
      this.tableLoaded = true;
      this.settingsChange.emit();
    } catch (error) {
      console.error('Error creating table collection:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}
```

**Step 3: Verify it compiles**

Run: `cd frontend && npx ng build --configuration production 2>&1 | tail -3`

**Step 4: Commit**

```
refactor: replace native prompt in random generator (#8)
```

---

### Task 8: Final verification and CHANGELOG

**Step 1: Full build**

Run: `cd frontend && npx ng build --configuration production`
Expected: Build succeeds with no errors

**Step 2: Run tests**

Run: `cd frontend && npm test -- --watch=false`
Expected: All tests pass

**Step 3: Grep for remaining native dialogs**

Run: Search for `\b(confirm|alert|prompt)\s*\(` in `frontend/src/**/*.ts`
Expected: No matches (zero remaining native dialog calls)

**Step 4: Update CHANGELOG.md**

Add under `[Unreleased]`:
```markdown
### Changed
- Replaced all native browser dialogs (prompt/confirm) with Angular Material dialogs for visual consistency (#8)
```

**Step 5: Commit**

```
chore: update CHANGELOG for native dialog replacement (#8)
```
