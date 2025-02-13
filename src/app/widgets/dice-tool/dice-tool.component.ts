import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

interface DiceType {
  sides: number;
  image: string;
}

@Component({
  selector: 'app-dice-tool',
  template: `
    <div class="dice-container">
      <div class="dice-grid">
        <button 
          mat-button 
          *ngFor="let dice of diceTypes" 
          (click)="roll(dice.sides)"
          class="dice-button"
        >
          <img 
            [src]="dice.image" 
            [alt]="'d' + dice.sides"
            class="dice-image"
          />
        </button>
      </div>
      <div *ngIf="result !== null" class="result-container">
        <p class="result-text">Result: {{ result }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dice-container {
      padding: 16px;
    }
    .dice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }
    .dice-button {
      padding: 4px;
      min-width: unset;
      height: auto;
      aspect-ratio: 1;
    }
    .dice-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .result-container {
      text-align: center;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .result-text {
      font-size: 1.5em;
      margin: 0;
      font-weight: bold;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class DiceToolComponent {
  @Input() settings: any;
  
  diceTypes: DiceType[] = [
    { sides: 4, image: '/images/d4.png' },
    { sides: 6, image: '/images/d6.png' },
    { sides: 8, image: '/images/d8.png' },
    { sides: 10, image: '/images/d10.png' },
    { sides: 12, image: '/images/d12.png' },
    { sides: 20, image: '/images/d20.jpg' },
    { sides: 100, image: '/images/d100.png' }
  ];
  
  result: number | null = null;

  roll(sides: number) {
    this.result = Math.floor(Math.random() * sides) + 1;
  }
}