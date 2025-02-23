import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

interface Combatant {
  id: string;
  name: string;
  notes: string;
  initiative: number;
  // For general mode:
  health?: number;
  // For Mutant Year Zero mode:
  role?: string;
  strength?: number;
  agility?: number;
  wits?: number;
  empathy?: number;
  skills?: string;
}

@Component({
  selector: 'app-combat-tracker',
  // combat-tracker.component.ts
// Replace just the template and styles sections:

template: `
<div class="combat-tracker">
  <!-- Header -->
  <div class="tracker-header">
    <div class="header-content">
      <span class="round-counter" *ngIf="settings?.showRoundCounter">Round {{ currentRound }}</span>
      <button mat-button color="primary" (click)="addCombatant()" class="add-btn">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  </div>

  <!-- Combatant List Container -->
  <div class="list-container">
    <div class="combatant-list" cdkDropList (cdkDropListDropped)="drop($event)">
      <div *ngFor="let combatant of sortedCombatants; let i = index" 
           class="combatant-card"
           [class.active]="i === activeIndex"
           [class.defeated]="settings?.gameMode !== 'mutant_year_zero' && combatant.health !== undefined && combatant.health <= 0"
           cdkDrag>
        <div class="card-content">
          <!-- Drag Handle -->
          <mat-icon cdkDragHandle class="drag-handle">drag_indicator</mat-icon>

          <!-- Defeated Icon for general mode only -->
          <div class="defeated-icon" *ngIf="settings?.gameMode !== 'mutant_year_zero' && combatant.health !== undefined && combatant.health <= 0">
            <mat-icon>close</mat-icon>
          </div>
          
          <!-- Combatant Header -->
          <div class="combatant-header">
            <span class="turn-marker">{{ i === activeIndex ? '>' : '□' }}</span>
            <input [(ngModel)]="combatant.name" 
                   class="name-input" 
                   placeholder="Name">
            <div class="init-group">
              <label>Init</label>
              <input [(ngModel)]="combatant.initiative"
                     type="number"
                     class="initiative-input"
                     placeholder="0">
            </div>
            <button mat-icon-button color="warn" (click)="removeCombatant(i)" class="remove-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Mutant Year Zero Mode -->
          <div *ngIf="settings?.gameMode === 'mutant_year_zero'; else generalMode" class="mutant-mode">
            <div class="mutant-row">
              <div class="field-group role-group">
                <label>Role</label>
                <input type="text" [(ngModel)]="combatant.role" placeholder="Role">
              </div>
              <div class="attributes-group">
                <div class="attr-input">
                  <label>Str</label>
                  <input type="number" [(ngModel)]="combatant.strength" placeholder="0">
                </div>
                <div class="attr-input">
                  <label>Agi</label>
                  <input type="number" [(ngModel)]="combatant.agility" placeholder="0">
                </div>
                <div class="attr-input">
                  <label>Wit</label>
                  <input type="number" [(ngModel)]="combatant.wits" placeholder="0">
                </div>
                <div class="attr-input">
                  <label>Emp</label>
                  <input type="number" [(ngModel)]="combatant.empathy" placeholder="0">
                </div>
              </div>
            </div>
            <div class="field-group skills-group">
              <label>Skills</label>
              <input type="text" [(ngModel)]="combatant.skills" placeholder="Skills">
            </div>
            <div class="field-group notes-group">
              <label>Notes</label>
              <input type="text" [(ngModel)]="combatant.notes" placeholder="Notes">
            </div>
          </div>
          
          <!-- General Mode -->
          <ng-template #generalMode>
            <div class="general-mode">
              <div class="health-section">
                <label>HP</label>
                <input type="number" 
                       [(ngModel)]="combatant.health" 
                       class="health-input"
                       [class.health-zero]="combatant.health !== undefined && combatant.health <= 0"
                       placeholder="0">
              </div>
              <div class="notes-section">
                <label>Notes</label>
                <input [(ngModel)]="combatant.notes" 
                       class="notes-input" 
                       placeholder="Notes">
              </div>
            </div>
          </ng-template>
        </div>
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
    <button mat-button color="accent"
            (click)="sortByInitiative()"
            [disabled]="!settings?.autoSort || combatants.length === 0"
            class="control-btn">
      Sort
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
  font-size: 0.9em;
}

.tracker-header {
  flex: 0 0 auto;
  padding: 2px;
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
  padding: 2px;
}

.combatant-card {
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 2px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  padding: 4px;

  &.active {
    background: #e3f2fd;
  }

  &.defeated {
    opacity: 0.6;
    background: #ffebee;
  }
}

.card-content {
  position: relative;
  padding-left: 24px; /* Make room for the drag handle */
}

.drag-handle {
  position: absolute;
  left: 0;
  top: 0;
  cursor: move;
  color: #999;
  font-size: 18px;
}

.combatant-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.turn-marker {
  width: 20px;
  text-align: center;
}

.name-input {
  flex: 1;
  min-width: 0;
  border: 1px solid #ddd;
  border-radius: 2px;
  padding: 2px 4px;
}

.init-group {
  display: flex;
  align-items: center;
  gap: 4px;
  
  label {
    font-size: 0.8em;
    color: #666;
  }
}

.initiative-input {
  width: 40px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 2px;
  padding: 2px;
}

.mutant-mode {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mutant-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.role-group {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;

  label {
    font-size: 0.8em;
    color: #666;
    white-space: nowrap;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid #ddd;
    border-radius: 2px;
    padding: 2px 4px;
  }
}

.attributes-group {
  display: flex;
  gap: 4px;
}

.attr-input {
  display: flex;
  align-items: center;
  gap: 2px;

  label {
    font-size: 0.8em;
    color: #666;
  }

  input {
    width: 30px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 2px;
    padding: 2px;
  }
}

.skills-group, .notes-group {
  display: flex;
  align-items: center;
  gap: 4px;

  label {
    font-size: 0.8em;
    color: #666;
    white-space: nowrap;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid #ddd;
    border-radius: 2px;
    padding: 2px 4px;
  }
}

.general-mode {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.health-section {
  display: flex;
  align-items: center;
  gap: 4px;

  label {
    font-size: 0.8em;
    color: #666;
  }

  input {
    width: 60px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 2px;
    padding: 2px;

    &.health-zero {
      color: red;
      font-weight: bold;
    }
  }
}

.notes-section {
  display: flex;
  align-items: center;
  gap: 4px;

  label {
    font-size: 0.8em;
    color: #666;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid #ddd;
    border-radius: 2px;
    padding: 2px 4px;
  }
}

.tracker-controls {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-top: 1px solid #eee;
}
`],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    DragDropModule
  ]
})
export class CombatTrackerComponent implements OnInit {
  @Input() settings: any;
  
  combatants: Combatant[] = [];
  activeIndex: number = 0;
  currentRound: number = 1;

  get sortedCombatants(): Combatant[] {
    if (this.settings?.autoSort) {
      return [...this.combatants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    }
    return this.combatants;
  }

  ngOnInit() {
    // Load saved state if available
    if (this.settings?.combatants) {
      this.combatants = this.settings.combatants;
      this.activeIndex = this.settings.activeIndex || 0;
      this.currentRound = this.settings.currentRound || 1;
    }

    // Initialize default settings if not present
    if (!this.settings) {
      this.settings = {};
    }
    this.settings.gameMode = this.settings.gameMode || 'general';
    this.settings.showRoundCounter = this.settings.showRoundCounter ?? true;
    this.settings.autoSort = this.settings.autoSort ?? false;
    // New: Initialize defaultInitiative setting
    this.settings.defaultInitiative = this.settings.defaultInitiative ?? 0;
  }

  addCombatant() {
    const defaultInitiative = this.settings.defaultInitiative !== undefined ? this.settings.defaultInitiative : 0;
    let newCombatant: Combatant = {
      id: Date.now().toString(),
      name: '',
      notes: '',
      initiative: defaultInitiative
    };

    if (this.settings?.gameMode === 'mutant_year_zero') {
      newCombatant = {
        ...newCombatant,
        role: '',
        strength: 0,
        agility: 0,
        wits: 0,
        empathy: 0,
        skills: ''
      };
    } else {
      newCombatant.health = 100;
    }

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

  sortByInitiative() {
    this.combatants.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
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
