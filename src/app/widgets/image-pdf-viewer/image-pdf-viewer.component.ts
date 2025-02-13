import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-image-pdf-viewer',
  template: `
    <div class="viewer-container">
      <!-- Show when no file is selected -->
      <div *ngIf="!currentFile" class="empty-state">
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
        *ngIf="currentFile && isImage"
        [src]="fileUrl"
        class="content-view"
        alt="Selected image"
      />

      <!-- Show when a PDF is selected -->
      <iframe
        *ngIf="currentFile && !isImage"
        [src]="fileUrl"
        class="content-view"
        type="application/pdf"
      ></iframe>
    </div>
  `,
  styles: [`
    .viewer-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }

    .empty-state {
      text-align: center;
    }

    .content-view {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border: none;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class ImagePdfViewerComponent {
  @Input() settings: any;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  currentFile: File | null = null;
  fileUrl: string | null = null;
  isImage = false;

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.currentFile = file;
      
      // Check if the file is an image
      this.isImage = file.type.startsWith('image/');
      
      // Create a URL for the file
      if (this.fileUrl) {
        URL.revokeObjectURL(this.fileUrl);
      }
      this.fileUrl = URL.createObjectURL(file);

      // Save file info to settings
      if (this.settings) {
        this.settings.fileName = file.name;
        this.settings.fileType = file.type;
      }
    }
  }

  ngOnDestroy() {
    // Clean up the object URL when the component is destroyed
    if (this.fileUrl) {
      URL.revokeObjectURL(this.fileUrl);
    }
  }
}