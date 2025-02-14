import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

interface DiceType {
  sides: number;
  image: string;
  enabled: boolean;
}

@Component({
  selector: 'app-dice-tool',
  template: `
    <div class="dice-container">
      <div class="dice-grid">
        <button 
          mat-button 
          *ngFor="let dice of availableDice" 
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
      padding: 8px;
    }
    .dice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
      gap: 4px;
      margin-bottom: 8px;
    }
    .dice-button {
      padding: 2px;
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
      font-size: 1em;
      margin: 0;
      font-weight: bold;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class DiceToolComponent implements OnInit {
  @Input() settings: any;
  
  allDiceTypes: DiceType[] = [
    { sides: 4, image: '/dm-tool/images/d4.png', enabled: true },
    { sides: 6, image: '/dm-tool/images/d6.png', enabled: true },
    { sides: 8, image: '/dm-tool/images/d8.png', enabled: true },
    { sides: 10, image: '/dm-tool/images/d10.png', enabled: true },
    { sides: 12, image: '/dm-tool/images/d12.png', enabled: true },
    { sides: 20, image: '/dm-tool/images/d20.jpg', enabled: true },
    { sides: 100, image: '/dm-tool/images/d100.png', enabled: true }
];
  
  get availableDice(): DiceType[] {
    if (this.settings?.enabledDice) {
      return this.allDiceTypes.filter(dice => this.settings.enabledDice[dice.sides]);
    }
    return this.allDiceTypes;
  }
  
  result: number | null = null;

  ngOnInit() {
    if (!this.settings.enabledDice) {
      this.settings.enabledDice = this.allDiceTypes.reduce((acc, dice) => {
        acc[dice.sides] = true;
        return acc;
      }, {} as Record<number, boolean>);
    }
  }

  roll(sides: number) {
    this.result = Math.floor(Math.random() * sides) + 1;
  }
}