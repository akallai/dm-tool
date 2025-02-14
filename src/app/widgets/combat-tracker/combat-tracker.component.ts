import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

interface Combatant {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  notes: string;
}

@Component({
  selector: 'app-combat-tracker',
  template: `
    <div class="combat-tracker">
      <!-- Compact Header -->
      <div class="tracker-header">
        <div class="header-content">
          <span class="round-counter" *ngIf="showRoundCounter">
            Round {{ currentRound }}
          </span>
          <button mat-button color="primary" (click)="addCombatant()" class="add-btn">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <!-- Combatant List -->
      <div class="combatant-list" cdkDropList (cdkDropListDropped)="drop($event)">
        <div *ngFor="let combatant of combatants; let i = index" 
             class="combatant-card"
             [class.active]="i === activeIndex"
             cdkDrag>
          <!-- Combatant Header -->
          <div class="combatant-header">
            <span class="turn-marker">{{ i === activeIndex ? '>' : '□' }}</span>
            <input [(ngModel)]="combatant.name" 
                   class="name-input" 
                   placeholder="Name">
            <button mat-icon-button color="warn" (click)="removeCombatant(i)" class="remove-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Health Bar -->
          <div class="health-bar-container">
            <div class="health-inputs">
              <input type="number" 
                     [(ngModel)]="combatant.currentHealth" 
                     class="health-input"
                     (ngModelChange)="validateHealth(combatant)">
              <span>/</span>
              <input type="number" 
                     [(ngModel)]="combatant.maxHealth" 
                     class="health-input"
                     (ngModelChange)="validateHealth(combatant)">
            </div>
            <div class="health-bar">
              <div class="health-bar-fill" 
                   [style.width.%]="(combatant.currentHealth / combatant.maxHealth) * 100">
              </div>
            </div>
          </div>

          <!-- Notes -->
          <input [(ngModel)]="combatant.notes" 
                 class="notes-input" 
                 placeholder="Notes">
          
          <!-- Drag Handle -->
          <mat-icon cdkDragHandle class="drag-handle">drag_indicator</mat-icon>
        </div>
      </div>

      <!-- Compact Controls -->
      <div class="tracker-controls">
        <button mat-button color="primary" 
                (click)="nextTurn()"
                [disabled]="combatants.length === 0"
                class="control-btn">
          Next
        </button>
        <button mat-button color="warn" 
                (click)="reset()"
                [disabled]="combatants.length === 0"
                class="control-btn">
          Reset
        </button>
      </div>
    </div>
  `,
  styles: [`
    .combat-tracker {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px;
      height: 100%;
      box-sizing: border-box;
    }

    .tracker-header {
      padding: 2px 4px;
      border-bottom: 1px solid #eee;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 24px;
    }

    .round-counter {
      font-size: 0.8rem;
      color: #666;
    }

    .add-btn {
      min-width: unset;
      padding: 0 8px;
      line-height: 24px;
      height: 24px;
    }

    .combatant-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .combatant-card {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
      
      &.active {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
      }

      &.cdk-drag-placeholder {
        opacity: 0.5;
      }
    }

    .combatant-header {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .turn-marker {
      font-family: monospace;
      font-size: 1rem;
      width: 16px;
    }

    .name-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.9rem;
      padding: 2px;
      border-bottom: 1px solid transparent;
      
      &:focus {
        outline: none;
        border-bottom: 1px solid #2196f3;
      }
    }

    .remove-btn {
      width: 20px;
      height: 20px;
      line-height: 20px;
      
      .mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        line-height: 16px;
      }
    }

    .health-bar-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .health-inputs {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
    }

    .health-input {
      width: 40px;
      padding: 2px;
      border: 1px solid #ddd;
      border-radius: 2px;
      font-size: 0.8rem;
    }

    .health-bar {
      height: 4px;
      background: #ffcdd2;
      border-radius: 2px;
      overflow: hidden;
    }

    .health-bar-fill {
      height: 100%;
      background: #4caf50;
      transition: width 0.3s ease;
    }

    .notes-input {
      width: 100%;
      padding: 2px;
      border: 1px solid #ddd;
      border-radius: 2px;
      box-sizing: border-box;
      font-size: 0.8rem;
      
      &:focus {
        outline: none;
        border-color: #2196f3;
      }
    }

    .drag-handle {
      position: absolute;
      right: 4px;
      bottom: 4px;
      cursor: move;
      color: #999;
      font-size: 16px;
    }

    .tracker-controls {
      display: flex;
      gap: 4px;
      padding: 2px;
      border-top: 1px solid #eee;
    }

    .control-btn {
      flex: 1;
      min-width: unset;
      padding: 0 8px;
      line-height: 24px;
      height: 24px;
      font-size: 0.8rem;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    DragDropModule
  ]
})
export class CombatTrackerComponent {
  @Input() settings: any;
  
  combatants: Combatant[] = [];
  activeIndex: number = 0;
  currentRound: number = 1;
  showRoundCounter: boolean = true;

  ngOnInit() {
    // Load saved state if available
    if (this.settings?.combatants) {
      this.combatants = this.settings.combatants;
      this.activeIndex = this.settings.activeIndex || 0;
      this.currentRound = this.settings.currentRound || 1;
    }
  }

  addCombatant() {
    const newCombatant: Combatant = {
      id: Date.now().toString(),
      name: '',
      currentHealth: 100,
      maxHealth: 100,
      notes: ''
    };
    this.combatants.push(newCombatant);
    this.saveState();
  }

  removeCombatant(index: number) {
    this.combatants.splice(index, 1);
    if (this.activeIndex >= this.combatants.length) {
      this.activeIndex = Math.max(0, this.combatants.length - 1);
    }
    this.saveState();
  }

  nextTurn() {
    if (this.combatants.length === 0) return;
    
    this.activeIndex++;
    if (this.activeIndex >= this.combatants.length) {
      this.activeIndex = 0;
      this.currentRound++;
    }
    this.saveState();
  }

  reset() {
    if (confirm('Are you sure you want to reset the combat tracker?')) {
      this.activeIndex = 0;
      this.currentRound = 1;
      this.saveState();
    }
  }

  validateHealth(combatant: Combatant) {
    combatant.currentHealth = Math.min(combatant.currentHealth, combatant.maxHealth);
    combatant.currentHealth = Math.max(0, combatant.currentHealth);
    this.saveState();
  }

  drop(event: any) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.combatants, event.previousIndex, event.currentIndex);
      if (this.activeIndex === event.previousIndex) {
        this.activeIndex = event.currentIndex;
      }
      this.saveState();
    }
  }

  private saveState() {
    if (this.settings) {
      this.settings.combatants = this.combatants;
      this.settings.activeIndex = this.activeIndex;
      this.settings.currentRound = this.currentRound;
    }
  }
}