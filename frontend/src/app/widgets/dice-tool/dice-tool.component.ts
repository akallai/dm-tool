import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { DiceRollerService } from '../../services/dice-roller.service';

interface DiceButton {
  label: string;
  formula: string; // e.g. "1d6", "2d20+4"
  image?: string;
  settingKey?: string; // Key in settings object for standard dice
}

@Component({
  selector: 'app-dice-tool',
  template: `
    <div class="dice-container">
      <div class="dice-grid">
        <button
          mat-button
          *ngFor="let btn of availableButtons"
          (click)="rollFormula(btn.formula)"
          class="dice-button"
          [class.rolling]="isRolling"
          [attr.title]="btn.label + ' (' + btn.formula + ')'"
        >
          <img
            *ngIf="btn.image"
            [src]="btn.image"
            [alt]="btn.label"
            class="dice-image"
          />
          <span *ngIf="!btn.image" class="dice-text">{{ btn.label }}</span>
        </button>
        <div class="custom-dice-cell" *ngIf="settings.showCustomDiceInput">
          <input matInput [(ngModel)]="customDiceInput" (keydown.enter)="rollCustomInput()" placeholder="3d6+2" class="custom-dice-input">
          <button mat-icon-button class="custom-dice-btn" (click)="rollCustomInput()" [disabled]="isRolling">
            <mat-icon>casino</mat-icon>
          </button>
        </div>
      </div>
      <div *ngIf="finalResult" class="result-container" [class.fresh]="resultFresh">
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
      color: var(--text-primary);
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
      border: var(--glass-border);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      transition: all 0.2s;
      overflow: hidden;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: var(--accent-color);
        box-shadow: 0 0 10px rgba(64, 196, 255, 0.2);
      }

      &.rolling {
        pointer-events: none;
        opacity: 0.5;
      }
    }

    .dice-image {
      width: 48px;
      height: 48px;
      object-fit: contain;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
    }

    .dice-text {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      word-break: break-word;
      line-height: 1.1;
      padding: 2px;
      color: var(--text-primary);
    }

    .custom-dice-cell {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      grid-column: span 2;
      height: 52px;
      background: var(--input-bg);
      border: var(--glass-border);
      border-radius: 4px;
    }

    .custom-dice-input {
      width: 50px;
      padding: 4px;
      font-size: 0.9em;
      height: 24px;
      background: transparent;
      border: none;
      color: var(--text-primary);
      text-align: center;
      flex: 1;

      &:focus {
        outline: none;
      }
    }

    .custom-dice-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
      padding: 0;
      color: var(--accent-color);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: rgba(64, 196, 255, 0.1);
      }
    }

    .result-container {
      padding: 12px;
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 4px;
      margin-top: auto;
      text-align: center;
      backdrop-filter: var(--glass-backdrop);
      transition: border-color 0.5s ease;
    }

    .result-container.fresh {
      border-color: var(--accent-color);
      box-shadow: 0 0 15px rgba(64, 196, 255, 0.3);
    }

    .result-text {
      font-size: 0.9em;
      margin: 0;
      font-weight: 500;
      color: var(--text-primary);
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      white-space: pre-wrap;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiceToolComponent implements OnInit {
  @Input() settings: any;

  finalResult: string = '';
  customDiceInput: string = '';
  isRolling = false;
  resultFresh = false;

  standardDice: DiceButton[] = [
    { label: 'd4', formula: '1d4', image: '/images/d4.png', settingKey: 'enableD4' },
    { label: 'd6', formula: '1d6', image: '/images/d6.png', settingKey: 'enableD6' },
    { label: 'd8', formula: '1d8', image: '/images/d8.png', settingKey: 'enableD8' },
    { label: 'd10', formula: '1d10', image: '/images/d10.png', settingKey: 'enableD10' },
    { label: 'd12', formula: '1d12', image: '/images/d12.png', settingKey: 'enableD12' },
    { label: 'd20', formula: '1d20', image: '/images/d20.png', settingKey: 'enableD20' },
    { label: 'd100', formula: '1d100', image: '/images/d100.png', settingKey: 'enableD100' }
  ];

  constructor(
    private diceRoller: DiceRollerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.standardDice.forEach(dice => {
      if (dice.settingKey && this.settings[dice.settingKey] === undefined) {
        this.settings[dice.settingKey] = true;
      }
    });

    if (this.settings.showCustomDiceInput === undefined) {
      this.settings.showCustomDiceInput = true;
    }
  }

  get availableButtons(): DiceButton[] {
    const buttons: DiceButton[] = [];

    this.standardDice.forEach(dice => {
      if (dice.settingKey && this.settings[dice.settingKey]) {
        buttons.push(dice);
      }
    });

    if (Array.isArray(this.settings.customButtons)) {
        this.settings.customButtons.forEach((item: {key: string, value: string}) => {
            buttons.push({
                label: item.key,
                formula: item.value
            });
        });
    }

    return buttons;
  }

  async rollFormula(formula: string) {
    if (this.isRolling) return;

    const input = formula.trim();
    const regex = /^(\d+)?[wd](\d+)([+-]\d+)?$/i;
    const match = input.match(regex);

    if (!match) {
      this.finalResult = `Invalid notation: ${formula}`;
      this.cdr.markForCheck();
      return;
    }

    this.isRolling = true;
    this.cdr.markForCheck();

    // Normalize 'w' notation to 'd' for the roller service
    const normalized = formula.replace(/[wW]/, 'd');
    const result = await this.diceRoller.roll(normalized);

    this.isRolling = false;

    if (result) {
      let resultText = `Roll: ${formula}\n[${result.rolls.join(', ')}]`;
      if (result.modifier !== 0) {
        resultText += ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`;
      }
      resultText += ` = ${result.total}`;
      this.finalResult = resultText;

      // Flash the result container
      this.resultFresh = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.resultFresh = false;
        this.cdr.markForCheck();
      }, 1500);
    } else {
      this.finalResult = `Invalid notation: ${formula}`;
      this.cdr.markForCheck();
    }
  }

  rollCustomInput() {
    if (this.customDiceInput && !this.isRolling) {
      this.rollFormula(this.customDiceInput);
    }
  }
}
