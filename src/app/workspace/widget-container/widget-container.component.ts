import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { WidgetInstance } from '../workspace.component';
import { WidgetType } from '../../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { ImagePdfViewerComponent } from '../../widgets/image-pdf-viewer/image-pdf-viewer.component';
import { NotepadComponent } from '../../widgets/notepad/notepad.component';
import { RandomGeneratorComponent } from '../../widgets/random-generator/random-generator.component';
import { DiceToolComponent } from '../../widgets/dice-tool/dice-tool.component';
import { MusicWidgetComponent } from '../../widgets/music-widget/music-widget.component';
import { ResizableDirective } from './resizable.directive';
import { DiceSettingsDialogComponent } from '../../dialogs/widget-settings/dice-settings-dialog/dice-settings-dialog.component';
import { RandomGeneratorSettingsDialogComponent } from '../../dialogs/widget-settings/random-generator-settings-dialog/random-generator-settings-dialog.component';
import { MusicSettingsDialogComponent } from '../../dialogs/widget-settings/music-settings-dialog/music-settings-dialog.component';

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
    MusicWidgetComponent,
    ResizableDirective
  ]
})
export class WidgetContainerComponent {
  @Input() widgetData!: WidgetInstance;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>();

  constructor(private dialog: MatDialog) {}

  getTitle(type: WidgetType): string {
    if (this.widgetData.settings?.title) {
      return this.widgetData.settings.title;
    }
    const titles: Record<WidgetType, string> = {
      'IMAGE_PDF': 'Image/PDF Viewer',
      'NOTEPAD': 'Notepad',
      'RANDOM_GENERATOR': 'Random Generator',
      'DICE_TOOL': 'Dice Tool',
      'MUSIC_WIDGET': 'Music Widget'
    };
    return titles[type] || 'Widget';
  }

  onDragEnd(event: CdkDragEnd) {
    const currentTransform = this.widgetData.position;
    const dragDistance = event.distance;
    
    const newX = currentTransform.x + dragDistance.x;
    const newY = currentTransform.y + dragDistance.y;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const widgetWidth = this.widgetData.size.width;
    const widgetHeight = this.widgetData.size.height;
    
    const minX = 0;
    const minY = 0;
    const maxX = windowWidth - widgetWidth;
    const maxY = windowHeight - widgetHeight;
    
    this.widgetData.position = {
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    };
    
    this.update.emit();
  }

  onResizeEnd(event: { width: number, height: number }) {
    this.widgetData.size = { width: event.width, height: event.height };
    this.update.emit();
  }

  openSettings(event: MouseEvent) {
    event.stopPropagation();
    
    if (this.widgetData.type === 'DICE_TOOL') {
      const dialogRef = this.dialog.open(DiceSettingsDialogComponent, {
        width: '300px',
        data: { settings: this.widgetData.settings }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.widgetData.settings = result;
          this.update.emit();
        }
      });
    } else if (this.widgetData.type === 'RANDOM_GENERATOR') {
      if (!this.widgetData.settings.elements) {
        this.widgetData.settings.elements = [];
      }
  
      const dialogRef = this.dialog.open(RandomGeneratorSettingsDialogComponent, {
        width: '400px',
        data: { settings: this.widgetData.settings }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.widgetData.settings = result;
          this.update.emit();
        }
      });
    } else if (this.widgetData.type === 'MUSIC_WIDGET') {
      const dialogRef = this.dialog.open(MusicSettingsDialogComponent, {
        width: '400px',
        data: { settings: this.widgetData.settings }
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('Music settings result:', result);
          this.widgetData.settings = result;
          this.update.emit();
        }
      });
    }
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
