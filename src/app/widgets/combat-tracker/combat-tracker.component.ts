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
  health: number;
  notes: string;
}

@Component({
  selector: 'app-combat-tracker',
  template: `
    <div class="combat-tracker">
      <!-- Header -->
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

      <!-- Combatant List Container -->
      <div class="list-container">
        <div class="combatant-list" cdkDropList (cdkDropListDropped)="drop($event)">
          <div *ngFor="let combatant of combatants; let i = index" 
               class="combatant-card"
               [class.active]="i === activeIndex"
               [class.defeated]="combatant.health <= 0"
               cdkDrag>
            <div class="card-content">
              <!-- Defeated Icon -->
              <div class="defeated-icon" *ngIf="combatant.health <= 0">
                <mat-icon>close</mat-icon>
              </div>
              
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

              <!-- Health Section -->
              <div class="health-section">
                <input type="number" 
                       [(ngModel)]="combatant.health" 
                       class="health-input"
                       [class.health-zero]="combatant.health <= 0"
                       placeholder="HP">
              </div>

              <!-- Notes -->
              <input [(ngModel)]="combatant.notes" 
                     class="notes-input" 
                     placeholder="Notes">
            </div>
            
            <!-- Drag Handle -->
            <mat-icon cdkDragHandle class="drag-handle">drag_indicator</mat-icon>
          </div>
        </div>
      </div>

      <!-- Controls -->
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
      height: 100%;
      width: 100%;
      box-sizing: border-box;
    }

    .tracker-header {
      flex: 0 0 auto;
      padding: 4px;
      border-bottom: 1px solid #eee;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .list-container {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    .combatant-list {
      padding: 4px;
    }

    .combatant-card {
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 4px;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }

    .combatant-card.defeated {
      background-color: #b71c1c;
      border: 2px solid #d50000;
      color: white;
      transform: scale(0.99);
    }

    .defeated-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      opacity: 0.2;
      
      .mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ff1744;
      }
    }

    .card-content {
      padding: 8px;
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }

    .combatant-header {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      margin-bottom: 4px;
    }

    .turn-marker {
      flex: 0 0 auto;
      width: 16px;
      text-align: center;
    }

    .name-input {
      flex: 1 1 auto;
      min-width: 0;
      border: none;
      background: transparent;
      padding: 2px;
      color: inherit;
    }

    .health-section {
      margin: 4px 0;
      width: 100%;
    }

    .health-input {
      width: 60px;
      padding: 2px;
      border: 1px solid #ddd;
      border-radius: 2px;
      background: transparent;
      color: inherit;
      
      &.health-zero {
        color: #ff1744;
        font-weight: bold;
        border-color: #ff1744;
      }
    }

    .notes-input {
      width: 100%;
      padding: 2px;
      border: 1px solid #ddd;
      border-radius: 2px;
      box-sizing: border-box;
      background: transparent;
      color: inherit;
    }

    .remove-btn {
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      line-height: 24px;
      
      .mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        line-height: 16px;
      }
    }

    .drag-handle {
      position: absolute;
      right: 4px;
      bottom: 4px;
      cursor: move;
      color: currentColor;
      opacity: 0.5;
      font-size: 16px;
    }

    .tracker-controls {
      flex: 0 0 auto;
      display: flex;
      gap: 4px;
      padding: 4px;
      border-top: 1px solid #eee;
    }

    .control-btn {
      flex: 1;
    }

    .active {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;

      &.defeated {
        background: #d32f2f;
        border: 2px solid #ff1744;
        border-left: 4px solid #ff1744;
      }
    }

    /* Override input placeholder color for defeated state */
    .defeated {
      input::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
      
      input {
        color: white;
      }
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
      health: 100,
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