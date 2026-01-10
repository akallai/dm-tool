import { MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type WidgetType = 'IMAGE_PDF' | 'NOTEPAD' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET' | 'COMBAT_TRACKER' | 'DAYTIME_TRACKER' | 'LLM_CHAT' | 'HEX_MAP';

interface WidgetOption {
  type: WidgetType;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-widget-selector-dialog',
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Add a Widget</h2>
    </div>
    <mat-dialog-content class="dialog-content">
      <div class="widget-grid">
        <div
          class="widget-card"
          *ngFor="let widget of widgetTypes"
          (click)="select(widget.type)"
          [attr.aria-label]="widget.label"
        >
          <div class="widget-icon">
            <img [src]="'/dm-tool/images/' + widget.icon" [alt]="widget.label" />
          </div>
          <div class="widget-info">
            <span class="widget-label">{{ widget.label }}</span>
            <span class="widget-description">{{ widget.description }}</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="reset-section">
        <button
          mat-stroked-button
          color="warn"
          class="reset-button"
          (click)="reset()"
        >
          <mat-icon>refresh</mat-icon>
          Reset Workspace
        </button>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-header {
      padding: 24px 24px 0 24px;
    }

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .dialog-content {
      padding: 16px 24px 24px 24px;
      min-width: 640px;
      width: 100%;
      box-sizing: border-box;
    }

    /* Widget Grid */
    .widget-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    /* Widget Card */
    .widget-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
    }

    .widget-card:hover {
      background: linear-gradient(135deg, rgba(64, 196, 255, 0.15) 0%, rgba(64, 196, 255, 0.05) 100%);
      border-color: rgba(64, 196, 255, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(64, 196, 255, 0.2);
    }

    .widget-card:active {
      transform: translateY(-2px);
    }

    /* Widget Icon */
    .widget-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.08);
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }

    .widget-card:hover .widget-icon {
      background: rgba(64, 196, 255, 0.2);
      transform: scale(1.08);
    }

    .widget-icon img {
      width: 40px;
      height: 40px;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
    }

    /* Widget Info */
    .widget-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .widget-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .widget-description {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Divider */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
      margin: 16px 0 20px 0;
    }

    /* Reset Section */
    .reset-section {
      display: flex;
      justify-content: center;
    }

    .reset-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      border-color: rgba(255, 82, 82, 0.4) !important;
      color: var(--danger-color) !important;
      background: rgba(255, 82, 82, 0.08) !important;
      transition: all 0.2s ease;
    }

    .reset-button:hover {
      background: rgba(255, 82, 82, 0.15) !important;
      border-color: rgba(255, 82, 82, 0.6) !important;
      box-shadow: 0 4px 12px rgba(255, 82, 82, 0.2);
    }

    /* Custom scrollbar for dialog content */
    .dialog-content::-webkit-scrollbar {
      width: 8px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .dialog-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
      .widget-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .widget-card {
        padding: 16px 12px;
      }

      .widget-icon {
        width: 48px;
        height: 48px;
      }

      .widget-icon img {
        width: 32px;
        height: 32px;
      }

      .widget-label {
        font-size: 12px;
      }

      .widget-description {
        font-size: 10px;
      }
    }

    @media (max-width: 400px) {
      .widget-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class WidgetSelectorDialogComponent {
  widgetTypes: WidgetOption[] = [
    { type: 'IMAGE_PDF', label: 'Image/PDF Viewer', icon: 'image.png', description: 'View images & PDFs' },
    { type: 'NOTEPAD', label: 'Notepad', icon: 'notepad.png', description: 'Text notes' },
    { type: 'RANDOM_GENERATOR', label: 'Random Generator', icon: 'random_generator.png', description: 'Random tables' },
    { type: 'DICE_TOOL', label: 'Dice Tool', icon: 'dice.png', description: 'Roll dice' },
    { type: 'MUSIC_WIDGET', label: 'Music Widget', icon: 'note.png', description: 'Play tracks' },
    { type: 'WIKI_WIDGET', label: 'Wiki', icon: 'wiki.png', description: 'Knowledge base' },
    { type: 'COMBAT_TRACKER', label: 'Combat Tracker', icon: 'combat.png', description: 'Battle manager' },
    { type: 'DAYTIME_TRACKER', label: 'Daytime Tracker', icon: 'moon.png', description: 'Time of day' },
    { type: 'LLM_CHAT', label: 'LLM Chat', icon: 'llm.png', description: 'AI assistant' },
    { type: 'HEX_MAP', label: 'Hex Map', icon: 'hex.svg', description: 'Hex grid map' }
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
