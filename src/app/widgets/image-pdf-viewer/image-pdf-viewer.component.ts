import { Component, Input, ElementRef, ViewChild, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-image-pdf-viewer',
  template: `
    <div class="viewer-container">
      <!-- Show when no file is selected -->
      <div *ngIf="!currentFile && !fileUrl" class="empty-state">
        <input
          #fileInput
          type="file"
          (change)="onFileSelected($event)"
          accept="image/*,.pdf"
          style="display: none"
        />
        <button mat-raised-button color="primary" (click)="openFileDialog()">
          Open File
        </button>
      </div>

      <!-- Show when an image is selected -->
      <img
        *ngIf="(currentFile || fileUrl) && isImage"
        [src]="fileUrl"
        class="content-view"
        alt="Selected image"
      />

      <!-- Show when a PDF is selected -->
      <iframe
        *ngIf="(currentFile || fileUrl) && !isImage"
        [src]="safeFileUrl"
        class="content-view"
        type="application/pdf"
      ></iframe>

      <!-- File controls when a file is open -->
      <div *ngIf="currentFile || fileUrl" class="file-controls">
        <button mat-button (click)="clearFile()">Clear</button>
      </div>
    </div>
  `,
  styles: [`
    .viewer-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: transparent; /* Updated to transparent for glass theme */
      position: relative;
      color: var(--text-primary);
    }
    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content-view {
      flex: 1;
      width: 100%;
      height: 100%;
      object-fit: contain;
      border: none;
      /* Ensure PDFs/Images have a background if they are transparent */
      background: rgba(255, 255, 255, 0.05);
    }
    .file-controls {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 4px;
      padding: 4px;
      backdrop-filter: var(--glass-backdrop);
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class ImagePdfViewerComponent implements OnInit {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  currentFile: File | null = null;
  fileUrl: string | null = null;
  safeFileUrl: SafeResourceUrl | null = null;
  isImage = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Restore previously saved file if available
    if (this.settings && this.settings.fileDataUrl) {
      this.fileUrl = this.settings.fileDataUrl;
      this.isImage = this.settings.fileType?.startsWith('image/') || false;
      if (!this.isImage && this.fileUrl) {
        this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
      }
    }
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.currentFile = file;
      this.isImage = file.type.startsWith('image/');

      // Use FileReader to create a data URL (works for both images and PDFs)
      const reader = new FileReader();
      reader.onload = () => {
        this.fileUrl = reader.result as string;
        if (!this.isImage) {
          this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
        }
        // Save file info into settings and notify parent of change
        if (this.settings) {
          this.settings.fileName = file.name;
          this.settings.fileType = file.type;
          this.settings.fileDataUrl = this.fileUrl;
          this.notifySettingsChange();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  clearFile() {
    this.currentFile = null;
    this.fileUrl = null;
    this.safeFileUrl = null;
    this.fileInput.nativeElement.value = '';
    if (this.settings) {
      this.settings.fileName = null;
      this.settings.fileType = null;
      this.settings.fileDataUrl = null;
      this.notifySettingsChange();
    }
  }

  private notifySettingsChange() {
    this.settingsChange.emit(this.settings);
  }
}
