import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dice-tool',
  template: `
    <div>
      <div class="dice-buttons">
        <button mat-raised-button *ngFor="let dice of diceTypes" (click)="roll(dice)">
          {{ dice }}
        </button>
      </div>
      <div *ngIf="result !== null">
        <p>Result: {{ result }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dice-buttons button { margin: 4px; }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class DiceToolComponent {
  @Input() settings: any;
  diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
  result: number | null = null;

  roll(dice: string) {
    const sides = parseInt(dice.substring(1), 10);
    this.result = Math.floor(Math.random() * sides) + 1;
  }
}
