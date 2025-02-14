import { MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

export type WidgetType = 'IMAGE_PDF' | 'NOTEPAD' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET';

@Component({
  selector: 'app-widget-selector-dialog',
  templateUrl: './widget-selector-dialog.component.html',
  styleUrls: ['./widget-selector-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatButtonModule
  ]
})
export class WidgetSelectorDialogComponent {
  widgetTypes: { type: WidgetType, label: string }[] = [
    { type: 'IMAGE_PDF', label: 'Image/PDF Viewer' },
    { type: 'NOTEPAD', label: 'Notepad' },
    { type: 'RANDOM_GENERATOR', label: 'Random Generator' },
    { type: 'DICE_TOOL', label: 'Dice Tool' },
    { type: 'MUSIC_WIDGET', label: 'Music Widget' },
    { type: 'WIKI_WIDGET', label: 'Wiki' }
  ];

  constructor(private dialogRef: MatDialogRef<WidgetSelectorDialogComponent>) {}

  select(type: WidgetType) {
    this.dialogRef.close(type);
  }
}
