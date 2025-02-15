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
import { WikiWidgetComponent } from '../../widgets/wiki-widget/wiki-widget.component';
import { CombatTrackerComponent } from '../../widgets/combat-tracker/combat-tracker.component';
import { ResizableDirective } from './resizable.directive';
import { DiceSettingsDialogComponent } from '../../dialogs/widget-settings/dice-settings-dialog/dice-settings-dialog.component';
import { RandomGeneratorSettingsDialogComponent } from '../../dialogs/widget-settings/random-generator-settings-dialog/random-generator-settings-dialog.component';
import { MusicSettingsDialogComponent } from '../../dialogs/widget-settings/music-settings-dialog/music-settings-dialog.component';


@Component({
  selector: 'app-widget-container',
  template: `
    <div
      class="widget-container"
      cdkDrag
      [cdkDragFreeDragPosition]="widgetData.position"
      (cdkDragEnded)="onDragEnd($event)"
      appResizable
      [resizableWidth]="widgetData.size.width"
      [resizableHeight]="widgetData.size.height"
      (resizeEnd)="onResizeEnd($event)">
      
      <div class="widget-header" cdkDragHandle>
        <span class="title">{{ getTitle(widgetData.type) }}</span>
        <div class="controls">
          <button mat-icon-button (click)="openSettings($event)">
            <mat-icon>settings</mat-icon>
          </button>
          <button mat-icon-button (click)="close($event)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="widget-content">
        <ng-container [ngSwitch]="widgetData.type">
          <app-image-pdf-viewer *ngSwitchCase="'IMAGE_PDF'" [settings]="widgetData.settings"></app-image-pdf-viewer>
          <app-notepad *ngSwitchCase="'NOTEPAD'" [settings]="widgetData.settings"></app-notepad>
          <app-random-generator *ngSwitchCase="'RANDOM_GENERATOR'" [settings]="widgetData.settings"></app-random-generator>
          <app-dice-tool *ngSwitchCase="'DICE_TOOL'" [settings]="widgetData.settings"></app-dice-tool>
          <app-music-widget *ngSwitchCase="'MUSIC_WIDGET'" [settings]="widgetData.settings"></app-music-widget>
          <app-wiki-widget *ngSwitchCase="'WIKI_WIDGET'" [settings]="widgetData.settings"></app-wiki-widget>
          <app-combat-tracker *ngSwitchCase="'COMBAT_TRACKER'" [settings]="widgetData.settings"></app-combat-tracker>
        </ng-container>
      </div>
    </div>
  `,
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
    WikiWidgetComponent,
    CombatTrackerComponent,
    ResizableDirective
  ]
})
export class WidgetContainerComponent {
  @Input() widgetData!: WidgetInstance;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>();

  constructor(private dialog: MatDialog) { }

  getTitle(type: WidgetType): string {
    if (this.widgetData.settings?.title) {
      return this.widgetData.settings.title;
    }
    const titles: Record<WidgetType, string> = {
      'IMAGE_PDF': 'Image/PDF Viewer',
      'NOTEPAD': 'Notepad',
      'RANDOM_GENERATOR': 'Random Generator',
      'DICE_TOOL': 'Dice Tool',
      'MUSIC_WIDGET': 'Music Widget',
      'WIKI_WIDGET': 'Wiki',
      'COMBAT_TRACKER': 'Combat Tracker'
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
      // In widget-container.component.ts (inside openSettings method):
    } else if (this.widgetData.type === 'RANDOM_GENERATOR') {
      if (!this.widgetData.settings.mappings) {
        this.widgetData.settings.mappings = [];
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

  close(event: MouseEvent) {
    event.stopPropagation();
    this.closeEvent.emit();
  }
}