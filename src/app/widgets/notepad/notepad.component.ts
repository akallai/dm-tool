import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';


@Component({
  selector: 'app-notepad',
  template: `
    <div class="notepad-container">
      <!-- If no file is open, ask to open or create one -->
      <ng-container *ngIf="!fileHandle; else editor">
        <p>Please choose an option:</p>
        <button class="action-btn" (click)="openExistingFile()">Open File</button>
        <button class="action-btn" (click)="createNewFile()">New File</button>
      </ng-container>
      
      <!-- Editor / Display -->
      <ng-template #editor>
        <div class="file-info">
          <strong>{{ fileName }}</strong>
        </div>
        <!-- Rendered markdown view when not editing -->
        <div *ngIf="!isEditing"
             class="markdown-display"
             [innerHTML]="renderedContent"
             (click)="enableEditing()">
        </div>
        <!-- Plain textarea shown in editing mode -->
        <textarea *ngIf="isEditing"
                  #textareaElement
                  [(ngModel)]="content" 
                  (ngModelChange)="onContentChange()"
                  (blur)="onBlur()"
                  (focus)="onFocus()"
                  placeholder="Write your notes here..."
                  class="notepad-textarea">
        </textarea>
      </ng-template>
    </div>
  `,
  styles: [`
    .notepad-container {
      width: 100%;
      height: 100%;
      padding: 8px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .notepad-textarea {
      flex: 1;
      width: 100%;
      resize: none;
      border: 1px solid #ccc;
      padding: 8px;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 14px;
    }
    .markdown-display {
      flex: 1;
      width: 100%;
      border: 1px solid #ccc;
      padding: 8px;
      box-sizing: border-box;
      overflow-y: auto;
      cursor: text;
      font-size: 14px;
      line-height: 1.4;
    }
    .action-btn {
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .file-info {
      margin-bottom: 8px;
    }
    /* Base markdown content styles */
    :host ::ng-deep {
      h1 { font-size: 1.5em; margin: 0.5em 0; }
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
        border-left: 3px solid #ccc;
        color: #666;
      }
      
      code {
        font-size: 0.9em;
        padding: 0.1em 0.3em;
        background: #f5f5f5;
        border-radius: 3px;
      }
      
      pre {
        margin: 0.5em 0;
        padding: 0.5em;
        background: #f5f5f5;
        border-radius: 3px;
        font-size: 0.9em;
        overflow-x: auto;
      }
      
      pre code {
        padding: 0;
        background: none;
      }
    }
    /* Markdown table styles */
    :host ::ng-deep table {
      border-collapse: collapse;
      margin: 0.5em 0;
      width: 100%;
      font-size: 0.9em;
    }
    :host ::ng-deep th,
    :host ::ng-deep td {
      border: 1px solid #ddd;
      padding: 4px 6px;
      text-align: left;
    }
    :host ::ng-deep th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    :host ::ng-deep tr:nth-child(even) {
      background-color: #fafafa;
    }
    :host ::ng-deep tr:hover {
      background-color: #f0f0f0;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NotepadComponent implements OnInit, OnDestroy {
  @Input() settings: any;
  content = '';
  fileHandle: FileSystemFileHandle | null = null;
  fileName = '';
  saveTimeout: any;
  isEditing = false;
  renderedContent: SafeHtml = '';

  @ViewChild('textareaElement') textareaElement?: ElementRef;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Load any previously saved content from settings
    this.content = this.settings?.content || '';
    this.fileName = this.settings?.fileName || '';
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
        this.fileName = handle.name;
        const file = await handle.getFile();
        this.content = await file.text();
        this.settings.fileName = this.fileName;
        this.settings.content = this.content;
        this.updateRenderedContent();
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error opening file:', error);
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
        this.fileName = handle.name;
        this.content = '';
        this.settings.fileName = this.fileName;
        this.settings.content = this.content;
        this.updateRenderedContent();
        await this.autoSave();
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  }

  onContentChange() {
    // Update settings and schedule auto-save
    if (this.settings) {
      this.settings.content = this.content;
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.autoSave();
    }, 1000);
  }

  onBlur() {
    // When the textarea loses focus, update the rendered markdown
    this.isEditing = false;
    this.updateRenderedContent();
  }

  onFocus() {
    this.isEditing = true;
  }

  enableEditing() {
    this.isEditing = true;
    // Focus the textarea after it appears
    setTimeout(() => {
      this.textareaElement?.nativeElement.focus();
    }, 0);
  }

  async updateRenderedContent() {
    const html = await marked.parse(this.content || '');
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
  }
  

  async autoSave() {
    if (this.fileHandle) {
      try {
        const writable = await this.fileHandle.createWritable();
        await writable.write(this.content);
        await writable.close();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}
