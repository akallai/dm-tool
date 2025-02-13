import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-image-pdf-viewer',
  templateUrl: './image-pdf-viewer.component.html',
  styleUrls: ['./image-pdf-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ImagePdfViewerComponent {
  @Input() settings: any;
  fileName?: string;

  selectFile() {
    // Simulate file selection (use an <input type="file"> in production)
    this.fileName = 'sample.pdf';
    this.settings.file = this.fileName;
  }
}