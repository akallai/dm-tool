import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dice-settings-dialog',
  template: `
    <h2 mat-dialog-title>Dice Settings</h2>
    <mat-dialog-content>
      <div class="dice-settings">
        <mat-checkbox
          *ngFor="let dice of diceTypes"
          [(ngModel)]="settings.enabledDice[dice.sides]"
          class="dice-checkbox"
        >
          D{{ dice.sides }}
        </mat-checkbox>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dice-settings {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }
    .dice-checkbox {
      margin-bottom: 8px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    FormsModule
  ]
})
export class DiceSettingsDialogComponent {
  settings: { enabledDice: Record<number, boolean> };
  diceTypes = [
    { sides: 4 },
    { sides: 6 },
    { sides: 8 },
    { sides: 10 },
    { sides: 12 },
    { sides: 20 },
    { sides: 100 }
  ];

  constructor(
    public dialogRef: MatDialogRef<DiceSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { settings: { enabledDice: Record<number, boolean> } }
  ) {
    this.settings = { ...data.settings };
  }

  save() {
    this.dialogRef.close(this.settings);
  }
}