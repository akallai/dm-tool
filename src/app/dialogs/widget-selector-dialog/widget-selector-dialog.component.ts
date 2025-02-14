// widget-selector-dialog.component.ts
import { MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

export type WidgetType = 'IMAGE_PDF' | 'NOTEPAD' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET';

@Component({
  selector: 'app-widget-selector-dialog',
  template: `
    <h2 mat-dialog-title>Add a Widget</h2>
    <mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let widget of widgetTypes" (click)="select(widget.type)">
          {{ widget.label }}
        </mat-list-item>
      </mat-list>
      
      <mat-divider class="my-4"></mat-divider>
      
      <div class="reset-section">
        <button 
          mat-stroked-button 
          color="warn" 
          class="reset-button" 
          (click)="reset()"
        >
          Reset Workspace
        </button>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .reset-section {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
    .reset-button {
      width: 100%;
    }
    .my-4 {
      margin: 16px 0;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatDividerModule
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
    this.dialogRef.close({ action: 'add', type });
  }

  reset() {
    if (confirm('Are you sure you want to reset the workspace? All widgets will be closed.')) {
      this.dialogRef.close({ action: 'reset' });
    }
  }
}