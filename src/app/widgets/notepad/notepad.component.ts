import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
      
      <!-- The text editor is shown once a file is selected -->
      <ng-template #editor>
        <div class="file-info">
          <strong>{{ fileName }}</strong>
        </div>
        <textarea 
          [(ngModel)]="content" 
          (ngModelChange)="onContentChange()"
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
    }
    .action-btn {
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .file-info {
      margin-bottom: 8px;
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

  ngOnInit() {
    // If you previously stored content in settings, load it.
    // (Note: file handles cannot be stored in localStorage.)
    this.content = this.settings?.content || '';
    this.fileName = this.settings?.fileName || '';
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
        // Optionally, write the initial (empty) content immediately:
        await this.autoSave();
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  }

  onContentChange() {
    // Update widget settings (for state persistence)
    if (this.settings) {
      this.settings.content = this.content;
    }
    // Debounce auto-save so we’re not writing on every keystroke
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.autoSave();
    }, 1000); // Save after 1 second of inactivity
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
