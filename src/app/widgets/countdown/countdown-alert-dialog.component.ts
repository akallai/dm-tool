import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-countdown-alert-dialog',
  template: `
    <div class="alert-dialog">
      <div class="alert-icon">
        <mat-icon>alarm</mat-icon>
      </div>
      <h2 mat-dialog-title>Time's Up!</h2>
      <mat-dialog-content>
        <p class="alert-message">{{ data.label }} has finished.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-raised-button color="primary" (click)="close()">
          <mat-icon>check</mat-icon>
          Dismiss
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .alert-dialog {
      text-align: center;
      padding: 16px;
    }

    .alert-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
    }

    .alert-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      animation: shake 0.5s ease-in-out infinite;
    }

    @keyframes shake {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(5deg); }
    }

    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }

    .alert-message {
      font-size: 16px;
      color: var(--text-secondary, rgba(0,0,0,0.7));
      margin: 0;
    }

    mat-dialog-actions {
      margin-top: 16px;
      padding: 0;
    }

    button mat-icon {
      margin-right: 8px;
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
export class CountdownAlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CountdownAlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { label: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
