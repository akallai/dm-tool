// src/app/widgets/notepad/notepad.component.ts
import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounce } from '../../utils/debounce';

@Component({
  selector: 'app-notepad',
  template: `
    <div class="notepad-container">
      <ng-container *ngIf="fileHandle || content; else emptyState">
        <!-- Editor -->
        <textarea
                  [(ngModel)]="content"
                  (ngModelChange)="onContentChange()"
                  placeholder="Write your notes here..."
                  class="notepad-textarea">
        </textarea>

        <!-- Loading/Error states -->
        <div *ngIf="isSaving" class="save-indicator">
          Saving...
        </div>
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </ng-container>

      <ng-template #emptyState>
        <div class="empty-state">
          <button class="action-btn" (click)="openExistingFile()">Open File</button>
          <button class="action-btn" (click)="createNewFile()">New File</button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .notepad-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      color: var(--text-primary);
    }
    .empty-state {
      flex: 1;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
    }
    .notepad-textarea {
      flex: 1;
      width: 100%;
      resize: none;
      border: none;
      padding: 12px;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      outline: none;
      background: transparent;
      color: var(--text-primary);
    }
    .action-btn {
      padding: 8px 16px;
      border: var(--glass-border);
      border-radius: 4px;
      background: rgba(255,255,255,0.05); /* Slight glass fill */
      color: var(--text-primary);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: rgba(255,255,255,0.15);
      border-color: var(--accent-color);
    }
    .save-indicator {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: var(--accent-color);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .error-message {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: var(--danger-color);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotepadComponent implements OnInit, OnDestroy {
  @Input() settings: any;
  content = '';
  fileHandle: FileSystemFileHandle | null = null;
  isSaving = false;
  errorMessage = '';

  // Create a debounced autoSave function to avoid excessive disk operations
  private debouncedAutoSave = debounce(this.autoSave.bind(this), 1000);

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Exposed method to trigger opening a new file from settings
   */
  async openNewFile() {
    return this.openExistingFile();
  }

  /**
   * Exposed method to trigger creating a new file from settings
   */
  async createNewFileFromSettings() {
    return this.createNewFile();
  }

  ngOnInit() {
    // Load any previously saved content from settings
    this.content = this.settings?.content || '';
    if (this.settings?.fileName) {
      this.settings.title = this.settings.fileName;
    }
  }

  async openExistingFile() {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        this.fileHandle = handle;
        this.settings.title = handle.name;
        this.settings.fileName = handle.name;

        // Show loading indicator
        this.isSaving = true;
        this.cdr.markForCheck();

        const file = await handle.getFile();
        this.content = await file.text();
        this.settings.content = this.content;

        this.isSaving = false;
        this.cdr.markForCheck();
      } else {
        this.errorMessage = 'File System Access API is not supported in this browser.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      this.errorMessage = 'Failed to open file';
      this.isSaving = false;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 3000);
    }
  }

  async createNewFile() {
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'untitled.txt',
          types: [{
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        this.fileHandle = handle;
        this.settings.title = handle.name;
        this.settings.fileName = handle.name;
        this.content = '';
        this.settings.content = this.content;
        await this.autoSave();
      } else {
        this.errorMessage = 'File System Access API is not supported in this browser.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      this.errorMessage = 'Failed to create file';
      this.cdr.markForCheck();
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 3000);
    }
  }

  onContentChange() {
    // Update settings
    if (this.settings) {
      this.settings.content = this.content;
    }

    // Use debounced save to avoid excessive disk operations
    this.debouncedAutoSave();
  }

  async autoSave() {
    if (this.fileHandle) {
      try {
        this.isSaving = true;
        this.cdr.markForCheck();

        const writable = await this.fileHandle.createWritable();
        await writable.write(this.content);
        await writable.close();

        this.isSaving = false;
        this.cdr.markForCheck();
      } catch (error) {
        console.error('Auto-save failed:', error);
        this.errorMessage = 'Auto-save failed';
        this.isSaving = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    }
  }

  ngOnDestroy() {
    // Cancel any pending debounced operations
    if (this.debouncedAutoSave.cancel) {
      this.debouncedAutoSave.cancel();
    }
  }
}
