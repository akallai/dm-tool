import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface BackgroundOption {
  name: string;
  path: string;
}

@Component({
  selector: 'app-background-selector-dialog',
  template: `
    <h2 mat-dialog-title>Choose Background</h2>
    <mat-dialog-content>
      <div class="backgrounds-grid">
        <div
          *ngFor="let bg of backgrounds; let i = index"
          class="background-option"
          [class.selected]="selectedIndex === i"
          (click)="selectBackground(i)"
        >
          <div class="thumbnail" [ngStyle]="{'background-image': 'url(' + bg.path + ')'}"></div>
          <span class="label">{{ bg.name }}</span>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
      color: var(--text-primary);
    }

    .backgrounds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
      padding: 8px;
    }

    .background-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      border-radius: 12px;
      padding: 12px;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      background: rgba(255, 255, 255, 0.03);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }

      &.selected {
        border-color: var(--accent-color);
        background: rgba(64, 196, 255, 0.15);
      }
    }

    .thumbnail {
      width: 100%;
      aspect-ratio: 16/9;
      background-size: cover;
      background-position: center;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .label {
      margin-top: 8px;
      font-size: 13px;
      color: var(--text-primary);
      text-align: center;
      font-weight: 500;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class BackgroundSelectorDialogComponent {
  backgrounds: BackgroundOption[] = [
    { name: 'Glass', path: '/dm-tool/backgrounds/glass.png' },
    { name: 'Glass Dragon', path: '/dm-tool/backgrounds/glass_dragon.png' },
    { name: 'Glass Zombie', path: '/dm-tool/backgrounds/glass_zombie.png' }
  ];

  selectedIndex: number = 0;

  constructor(
    private dialogRef: MatDialogRef<BackgroundSelectorDialogComponent>
  ) {
    const data = inject(MAT_DIALOG_DATA);
    if (data !== undefined && data !== null) {
      this.selectedIndex = data;
    }
  }

  selectBackground(index: number) {
    this.dialogRef.close(index);
  }

  close() {
    this.dialogRef.close();
  }
}
