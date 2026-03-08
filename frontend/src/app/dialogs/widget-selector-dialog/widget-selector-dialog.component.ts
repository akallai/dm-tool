import { MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type WidgetType = 'IMAGE_PDF' | 'RANDOM_GENERATOR' | 'DICE_TOOL' | 'MUSIC_WIDGET' | 'WIKI_WIDGET' | 'COMBAT_TRACKER' | 'DAYTIME_TRACKER' | 'LLM_CHAT' | 'HEX_MAP' | 'NAME_GENERATOR' | 'COUNTDOWN_WIDGET';

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
      <button mat-icon-button mat-dialog-close class="close-btn" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
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
            <img [src]="'/images/' + widget.icon" [alt]="widget.label" />
          </div>
          <div class="widget-info">
            <span class="widget-label">{{ widget.label }}</span>
            <span class="widget-description">{{ widget.description }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 0 24px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .close-btn {
      color: var(--text-muted);
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .dialog-content {
      padding: 8px 24px 16px 24px;
      width: 100%;
      box-sizing: border-box;
      max-height: unset;
      overflow-y: auto;
    }

    /* Widget Grid */
    .widget-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    /* Widget Card */
    .widget-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 8px 8px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
    }

    .widget-card:hover {
      background: linear-gradient(135deg, rgba(64, 196, 255, 0.15) 0%, rgba(64, 196, 255, 0.05) 100%);
      border-color: rgba(64, 196, 255, 0.4);
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(64, 196, 255, 0.2);
    }

    .widget-card:active {
      transform: translateY(-1px);
    }

    /* Widget Icon */
    .widget-icon {
      width: 96px;
      height: 96px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      transition: transform 0.2s ease;
    }

    .widget-card:hover .widget-icon {
      transform: scale(1.08);
    }

    .widget-icon img {
      width: 96px;
      height: 96px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
    }

    /* Widget Info */
    .widget-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .widget-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .widget-description {
      font-size: 10px;
      color: var(--text-muted);
      line-height: 1.3;
    }

    /* Responsive: laptops / smaller desktops */
    @media (max-width: 1024px) {
      .widget-icon,
      .widget-icon img {
        width: 72px;
        height: 72px;
      }
    }

    /* Responsive: tablets */
    @media (max-width: 768px) {
      .widget-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .widget-icon,
      .widget-icon img {
        width: 64px;
        height: 64px;
      }
    }

    /* Responsive: mobile */
    @media (max-width: 500px) {
      .widget-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }

      .widget-icon,
      .widget-icon img {
        width: 48px;
        height: 48px;
      }

      .widget-label {
        font-size: 11px;
      }

      .widget-description {
        display: none;
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
    { type: 'IMAGE_PDF', label: 'Image/PDF Viewer', icon: 'image_pdf_viewer.png', description: 'Display images & PDF files' },
    { type: 'RANDOM_GENERATOR', label: 'Random Generator', icon: 'random_table.png', description: 'Roll on custom tables' },
    { type: 'DICE_TOOL', label: 'Dice Tool', icon: 'dice.png', description: 'Roll any dice combination' },
    { type: 'MUSIC_WIDGET', label: 'Music Widget', icon: 'music.png', description: 'Ambient music & SFX' },
    { type: 'WIKI_WIDGET', label: 'Wiki', icon: 'wiki.png', description: 'Campaign knowledge base' },
    { type: 'COMBAT_TRACKER', label: 'Combat Tracker', icon: 'combat.png', description: 'Track initiative & HP' },
    { type: 'DAYTIME_TRACKER', label: 'Daytime Tracker', icon: 'daytime.png', description: 'Track time of day' },
    { type: 'LLM_CHAT', label: 'LLM Chat', icon: 'llm.png', description: 'AI-powered assistant' },
    { type: 'HEX_MAP', label: 'Hex Map', icon: 'hexmap.png', description: 'Hex grid exploration map' },
    { type: 'NAME_GENERATOR', label: 'Name Generator', icon: 'name_generator.png', description: 'Fantasy & cultural names' },
    { type: 'COUNTDOWN_WIDGET', label: 'Countdown', icon: 'timer.png', description: 'Countdown timer' }
  ];

  constructor(
    private dialogRef: MatDialogRef<WidgetSelectorDialogComponent>,
  ) {}

  select(type: WidgetType) {
    this.dialogRef.close(type);
  }
}
