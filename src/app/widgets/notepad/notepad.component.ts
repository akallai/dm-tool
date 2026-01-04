// src/app/widgets/notepad/notepad.component.ts
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { debounce } from 'lodash';

@Component({
  selector: 'app-notepad',
  template: `
    <div class="notepad-container">
      <ng-container *ngIf="fileHandle || content; else emptyState">
        <!-- Editor / Display -->
        <div *ngIf="!isEditing"
             class="markdown-display"
             [innerHTML]="renderedContent"
             (click)="enableEditing()">
        </div>
        <textarea *ngIf="isEditing"
                  #textareaElement
                  [(ngModel)]="content"
                  (ngModelChange)="onContentChange()"
                  (blur)="onBlur()"
                  (focus)="onFocus()"
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
    .markdown-display {
      flex: 1;
      width: 100%;
      padding: 12px;
      box-sizing: border-box;
      overflow-y: auto;
      cursor: text;
      font-size: 14px;
      line-height: 1.6;
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
    /* Base markdown content styles */
    :host ::ng-deep {
      h1 { font-size: 1.5em; margin: 0.5em 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.2em; }
      h2 { font-size: 1.3em; margin: 0.4em 0; }
      h3 { font-size: 1.2em; margin: 0.3em 0; }
      h4 { font-size: 1.1em; margin: 0.2em 0; }
      h5, h6 { font-size: 1em; margin: 0.1em 0; }

      p { margin: 0.5em 0; }

      ul, ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }

      li {
        margin: 0.2em 0;
      }

      blockquote {
        margin: 0.5em 0;
        padding-left: 1em;
        border-left: 3px solid var(--accent-color);
        color: var(--text-secondary);
      }

      code {
        font-size: 0.9em;
        padding: 0.1em 0.3em;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        color: var(--text-primary);
      }

      pre {
        margin: 0.5em 0;
        padding: 0.5em;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 3px;
        font-size: 0.9em;
        overflow-x: auto;
      }

      pre code {
        padding: 0;
        background: none;
      }

      /* Image responsiveness styles */
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0.5em 0;
        border-radius: 4px;
      }

      table {
        border-collapse: collapse;
        margin: 0.5em 0;
        width: 100%;
        font-size: 0.9em;
      }

      th, td {
        border: 1px solid rgba(255,255,255,0.1);
        padding: 4px 6px;
        text-align: left;
      }

      th {
        background-color: rgba(255,255,255,0.05);
        font-weight: bold;
      }

      tr:nth-child(even) {
        background-color: rgba(255,255,255,0.02);
      }

      tr:hover {
        background-color: rgba(255,255,255,0.05);
      }

      a {
        color: var(--accent-color);
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
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
  isEditing = false;
  renderedContent: SafeHtml = '';
  isSaving = false;
  errorMessage = '';

  @ViewChild('textareaElement') textareaElement?: ElementRef;

  // Create a debounced autoSave function to avoid excessive disk operations
  private debouncedAutoSave = debounce(this.autoSave.bind(this), 1000);

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load any previously saved content from settings
    this.content = this.settings?.content || '';
    if (this.settings?.fileName) {
      this.settings.title = this.settings.fileName;
    }
    this.updateRenderedContent();
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

        // Show loading indicator
        this.isSaving = true;
        this.cdr.markForCheck();

        const file = await handle.getFile();
        this.content = await file.text();
        this.settings.content = this.content;
        this.updateRenderedContent();

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
        this.content = '';
        this.settings.content = this.content;
        this.updateRenderedContent();
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

  onBlur() {
    // When the textarea loses focus, update the rendered markdown
    this.isEditing = false;
    this.updateRenderedContent();
    this.cdr.markForCheck();
  }

  onFocus() {
    this.isEditing = true;
    this.cdr.markForCheck();
  }

  enableEditing() {
    this.isEditing = true;
    this.cdr.markForCheck();

    // Focus the textarea after it appears
    setTimeout(() => {
      this.textareaElement?.nativeElement.focus();
    }, 0);
  }

  async updateRenderedContent() {
    const html = await marked.parse(this.content || '');
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
    this.cdr.markForCheck();
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
