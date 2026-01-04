import { MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

export type WidgetType = 'IMAGE_PDF' | 'NOTEPAD' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET' | 'COMBAT_TRACKER' | 'DAYTIME_TRACKER' | 'LLM_CHAT';

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
    h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
      color: var(--text-primary);
    }

    /* List styling */
    mat-list {
      padding-top: 0;
    }

    mat-list-item {
      margin-bottom: 4px;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    mat-list-item:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      transform: translateX(4px);
    }

    /* Reset section */
    .reset-section {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }

    .reset-button {
      width: 100%;
      border-color: var(--danger-color) !important;
      color: var(--danger-color) !important;
      background: rgba(255, 82, 82, 0.1) !important;
    }

    .reset-button:hover {
      background: rgba(255, 82, 82, 0.2) !important;
    }

    .my-4 {
      margin: 16px 0;
      border-color: rgba(255, 255, 255, 0.1);
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
    { type: 'WIKI_WIDGET', label: 'Wiki' },
    { type: 'COMBAT_TRACKER', label: 'Combat Tracker' },
    { type: 'DAYTIME_TRACKER', label: 'Daytime Tracker' },
    { type: 'LLM_CHAT', label: 'LLM Chat' }
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