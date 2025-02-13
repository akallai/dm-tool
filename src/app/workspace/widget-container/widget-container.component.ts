import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WidgetInstance } from '../workspace.component';
import { WidgetType } from '../../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { ImagePdfViewerComponent } from '../../widgets/image-pdf-viewer/image-pdf-viewer.component';
import { NotepadComponent } from '../../widgets/notepad/notepad.component';
import { RandomGeneratorComponent } from '../../widgets/random-generator/random-generator.component';
import { DiceToolComponent } from '../../widgets/dice-tool/dice-tool.component';
import { ResizableDirective } from './resizable.directive';

@Component({
  selector: 'app-widget-container',
  templateUrl: './widget-container.component.html',
  styleUrls: ['./widget-container.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
    ImagePdfViewerComponent,
    NotepadComponent,
    RandomGeneratorComponent,
    DiceToolComponent,
    ResizableDirective
  ]
})
export class WidgetContainerComponent {
  @Input() widgetData!: WidgetInstance;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>();

  getTitle(type: WidgetType): string {
    const titles: Record<WidgetType, string> = {
      'IMAGE_PDF': 'Image/PDF Viewer',
      'NOTEPAD': 'Notepad',
      'RANDOM_GENERATOR': 'Random Generator',
      'DICE_TOOL': 'Dice Tool'
    };
    return titles[type] || 'Widget';
  }

  onDragEnd(event: CdkDragEnd) {
    const currentTransform = this.widgetData.position;
    const dragDistance = event.distance;
    
    this.widgetData.position = {
      x: currentTransform.x + dragDistance.x,
      y: currentTransform.y + dragDistance.y
    };
    
    this.update.emit();
  }

  onResizeEnd(event: { width: number, height: number }) {
    this.widgetData.size = { width: event.width, height: event.height };
    this.update.emit();
  }

  openSettings(event: MouseEvent) {
    event.stopPropagation();
    console.log('Open settings for', this.widgetData.type);
  }

  toggleMinimize(event: MouseEvent) {
    event.stopPropagation();
    this.widgetData.minimized = !this.widgetData.minimized;
    this.update.emit();
  }

  toggleMaximize(event: MouseEvent) {
    event.stopPropagation();
    this.widgetData.maximized = !this.widgetData.maximized;
    if (this.widgetData.maximized) {
      this.widgetData.position = { x: 0, y: 0 };
      this.widgetData.size = { width: window.innerWidth, height: window.innerHeight };
    }
    this.update.emit();
  }

  close(event: MouseEvent) {
    event.stopPropagation();
    this.closeEvent.emit();
  }
}