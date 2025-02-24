import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

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
        <div class="custom-dice-cell" *ngIf="settings.showCustomDiceInput">
          <input matInput [(ngModel)]="customDiceInput" placeholder="3w6+2" class="custom-dice-input">
          <button mat-icon-button color="primary" (click)="rollCustomDice()" class="custom-dice-btn">
            <mat-icon>casino</mat-icon>
          </button>
        </div>
      </div>
      <div *ngIf="finalResult" class="result-container">
        <p class="result-text">{{ finalResult }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dice-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    
    .dice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, 52px);
      gap: 4px;
      justify-content: center;
      padding: 4px;
      box-sizing: border-box;
    }
    
    .dice-button {
      padding: 1px;
      min-width: unset;
      height: 52px;
      width: 52px;
      line-height: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .dice-image {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
    
    .custom-dice-cell {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      grid-column: span 2;
      height: 52px;
    }
    
    .custom-dice-input {
      width: 50px;
      padding: 2px 4px;
      font-size: 0.8em;
      height: 24px;
    }
    
    .custom-dice-btn {
      width: 24px;
      height: 24px;
      min-width: 24px;
      padding: 0;
    }
    
    .result-container {
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-top: auto;
      text-align: center;
    }
    
    .result-text {
      font-size: 0.9em;
      margin: 0;
      font-weight: bold;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule]
})
export class DiceToolComponent implements OnInit {
  // Component logic remains the same
  @Input() settings: any;

  allDiceTypes: DiceType[] = [
    { sides: 4, image: '/dm-tool/images/d4.png', enabled: true },
    { sides: 6, image: '/dm-tool/images/d6.png', enabled: true },
    { sides: 8, image: '/dm-tool/images/d8.png', enabled: true },
    { sides: 10, image: '/dm-tool/images/d10.png', enabled: true },
    { sides: 12, image: '/dm-tool/images/d12.png', enabled: true },
    { sides: 20, image: '/dm-tool/images/d20.png', enabled: true },
    { sides: 100, image: '/dm-tool/images/d100.png', enabled: true }
  ];

  finalResult: string = '';
  customDiceInput: string = '';

  ngOnInit() {
    if (!this.settings.enabledDice) {
      this.settings.enabledDice = this.allDiceTypes.map(dice => ({
        key: dice.sides.toString(),
        value: true
      }));
    }
    if (this.settings.showCustomDiceInput === undefined) {
      this.settings.showCustomDiceInput = true;
    }
  }

  get availableDice(): DiceType[] {
    let enabledMapping: Record<number, boolean> = {};
    if (Array.isArray(this.settings.enabledDice)) {
      this.settings.enabledDice.forEach((item: { key: string, value: boolean }) => {
        enabledMapping[Number(item.key)] = item.value;
      });
    } else if (this.settings.enabledDice) {
      enabledMapping = this.settings.enabledDice;
    }
    return this.allDiceTypes.filter(dice => enabledMapping[dice.sides]);
  }

  roll(sides: number) {
    const rollValue = Math.floor(Math.random() * sides) + 1;
    this.finalResult = `Roll (d${sides}): ${rollValue}`;
  }

  rollCustomDice() {
    const input = this.customDiceInput.trim();
    // Regex to match custom dice notation (accepting "w" for German and "d" for English)
    const regex = /^(\d+)?[wd](\d+)([+-]\d+)?$/i;
    const match = input.match(regex);
    if (!match) {
      this.finalResult = 'Invalid dice notation';
      return;
    }
    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = sum + modifier;

    let resultText = `Rolls: [${rolls.join(', ')}] → Sum: ${sum}`;
    if (modifier !== 0) {
      resultText += `, Modifier: ${modifier > 0 ? '+' : ''}${modifier}`;
      resultText += `, Total: ${total}`;
    } else {
      resultText += `, Total: ${total}`;
    }
    this.finalResult = resultText;
  }
}