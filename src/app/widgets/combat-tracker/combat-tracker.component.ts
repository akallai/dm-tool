import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// Updated interface: common fields plus optional mutant year zero stats.
interface Combatant {
  id: string;
  name: string;
  notes: string;
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
  templateUrl: './combat-tracker.component.html',
  styleUrls: ['./combat-tracker.component.scss'],
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
    let newCombatant: Combatant;
    if (this.settings?.gameMode === 'mutant_year_zero') {
      newCombatant = {
        id: Date.now().toString(),
        name: '',
        role: '',
        strength: 0,
        agility: 0,
        wits: 0,
        empathy: 0,
        skills: '',
        notes: ''
      };
    } else {
      newCombatant = {
        id: Date.now().toString(),
        name: '',
        health: 100,
        notes: ''
      };
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
