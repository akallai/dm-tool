import { Component, OnInit, Inject, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

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
  // For D&D 5e mode:
  armorClass?: number;
  maxHealth?: number;
}

interface CharacterTemplate {
  name: string;
  role: string;
  strength: number;
  agility: number;
  wits: number;
  empathy: number;
  skills: string;
  category?: 'character' | 'humanoid' | 'beast' | 'mechanical' | 'boss';
}

// Templates for Mutant Year Zero mode
const MUTANT_YEAR_ZERO_TEMPLATES: CharacterTemplate[] = [
  // Charaktere (Spielerrollen)
  { name: 'Vollstrecker', role: 'Vollstrecker', strength: 5, agility: 3, wits: 2, empathy: 2, skills: 'Einschüchtern 3, Prügeln 2, Kraftakt 1', category: 'character' },
  { name: 'Schrauber', role: 'Schrauber', strength: 2, agility: 2, wits: 5, empathy: 3, skills: 'Zusammenschustern 3, Begreifen 2, Auskundschaften 1', category: 'character' },
  { name: 'Pirscher', role: 'Pirscher', strength: 2, agility: 5, wits: 3, empathy: 2, skills: 'Pfadfinder 3, Schießen 2, Schleichen 1', category: 'character' },
  { name: 'Hehler', role: 'Hehler', strength: 2, agility: 2, wits: 3, empathy: 5, skills: 'Aushandeln 3, Manipulieren 2, Bewegen 1', category: 'character' },
  { name: 'Hundeführer', role: 'Hundeführer', strength: 3, agility: 4, wits: 3, empathy: 2, skills: 'Abrichten 3, Schießen 2, Schleichen 1', category: 'character' },
  { name: 'Chronist', role: 'Chronist', strength: 2, agility: 2, wits: 4, empathy: 4, skills: 'Inspirieren 3, Begreifen 2, Heilen 1', category: 'character' },
  { name: 'Boss', role: 'Boss', strength: 3, agility: 3, wits: 2, empathy: 4, skills: 'Befehligen 3, Schießen 2, Prügeln 1', category: 'character' },
  { name: 'Sklave', role: 'Sklave', strength: 4, agility: 4, wits: 2, empathy: 2, skills: 'Abschütteln 3, Erdulden 2, Prügeln 1', category: 'character' },
  { name: 'Keine Rolle', role: 'Keine Rolle', strength: 3, agility: 3, wits: 3, empathy: 3, skills: 'Rang 2 in einer Fertigkeit', category: 'character' },
  // Humanoide & Fraktionen
  { name: 'Zonenghul', role: 'Zonenghul', strength: 2, agility: 4, wits: 3, empathy: 2, skills: 'Messer, Rohrschwerter. Greifen oft in Gruppen aus dem Hinterhalt an.', category: 'humanoid' },
  { name: 'Höllenfahrer', role: 'Höllenfahrer', strength: 4, agility: 3, wits: 2, empathy: 2, skills: 'Schrott-Rüstung (3), Rohrgewehre, Kettensägen. Nutzen Fahrzeuge.', category: 'humanoid' },
  { name: 'Nova-Kultist', role: 'Nova-Kultist', strength: 2, agility: 3, wits: 4, empathy: 3, skills: 'Meist ohne Rüstung. Nutzen mentale Mutationen (Telepathie).', category: 'humanoid' },
  { name: 'Wanderer', role: 'Wanderer', strength: 3, agility: 3, wits: 2, empathy: 3, skills: 'Menschen ohne Mutationen. Oft gut bewaffnet, aber misstrauisch.', category: 'humanoid' },
  { name: 'Arche-Boss', role: 'Arche-Boss', strength: 3, agility: 3, wits: 2, empathy: 4, skills: 'Schrott-Pistole. Nutzt "Manipulation", um andere kämpfen zu lassen.', category: 'humanoid' },
  { name: 'Pirscher (NSC)', role: 'Pirscher (NSC)', strength: 2, agility: 5, wits: 3, empathy: 2, skills: 'Fernrohr, Gewehr. Hohe Werte in "Schleichen" und "Auskundschaften".', category: 'humanoid' },
  { name: 'Sklave (NSC)', role: 'Sklave (NSC)', strength: 4, agility: 2, wits: 2, empathy: 2, skills: 'Schwere Werkzeuge als Waffen. Oft nur Kanonenfutter für Bosse.', category: 'humanoid' },
  // Bestien der Zone
  { name: 'Verschlinger', role: 'Bestie', strength: 8, agility: 3, wits: 1, empathy: 0, skills: 'Biss: Schaden 3. Gewaltiges, fast unaufhaltsames Raubtier.', category: 'beast' },
  { name: 'Messerrücken', role: 'Bestie', strength: 5, agility: 3, wits: 1, empathy: 0, skills: 'Rammstoß: Kann Ziele zu Boden werfen (Niederwerfen).', category: 'beast' },
  { name: 'Todeswurm', role: 'Bestie', strength: 6, agility: 2, wits: 1, empathy: 0, skills: 'Erdloch: Zieht Opfer unter die Erde. Benötigt STÄ-Probe zum Befreien.', category: 'beast' },
  { name: 'Zonenhund', role: 'Bestie', strength: 3, agility: 4, wits: 2, empathy: 0, skills: 'Rudeljäger: Greifen koordiniert an. Biss: Schaden 1.', category: 'beast' },
  { name: 'Schrott-Spinne', role: 'Bestie', strength: 4, agility: 4, wits: 1, empathy: 0, skills: 'Netz: Fixiert Beute (Beweglichkeit-Probe erschwert).', category: 'beast' },
  { name: 'Bittervogel', role: 'Bestie', strength: 2, agility: 5, wits: 1, empathy: 0, skills: 'Greifen im Sturzflug an. Schwer zu treffen.', category: 'beast' },
  // Mechanische Bedrohungen
  { name: 'Wachroboter', role: 'Roboter', strength: 6, agility: 2, wits: 4, empathy: 0, skills: 'Laser (Schaden 3) oder Elektroschocker. Panzerung 6.', category: 'mechanical' },
  { name: 'Drohne', role: 'Roboter', strength: 2, agility: 5, wits: 4, empathy: 0, skills: 'Sensoren. Alarmiert andere Einheiten.', category: 'mechanical' },
  { name: 'Autonomer Panzer', role: 'Roboter', strength: 12, agility: 1, wits: 5, empathy: 0, skills: 'Geschütze (Schaden 4+). Schwere Panzerung (10+).', category: 'mechanical' },
  // Legendäre Bosse
  { name: 'Die Hydra', role: 'Mutierter Riese', strength: 10, agility: 4, wits: 3, empathy: 2, skills: 'Rüstung 4. Mutationen: Leichenfresser, Marionettenspieler, Parasit, Telepathie. Fäuste: Schaden 2.', category: 'boss' }
];

// D&D 5e Template Interface
interface Dnd5eTemplate {
  name: string;
  armorClass: number;
  health: number;
  challengeRating: string;
  notes: string;
  category: 'humanoid' | 'goblinoid' | 'undead' | 'beast' | 'monster';
}

// Templates for D&D 5e mode (German names, SRD 5.1 stats)
const DND_5E_TEMPLATES: Dnd5eTemplate[] = [
  // Humanoide
  { name: 'Bandit', armorClass: 12, health: 11, challengeRating: '1/8', notes: 'Krummsäbel, Leichte Armbrust', category: 'humanoid' },
  { name: 'Banditenhauptmann', armorClass: 15, health: 65, challengeRating: '2', notes: 'Mehrfachangriff, Krummsäbel, Dolch', category: 'humanoid' },
  { name: 'Kultist', armorClass: 12, health: 9, challengeRating: '1/8', notes: 'Krummsäbel, Dunkle Hingabe', category: 'humanoid' },
  // Goblinartige
  { name: 'Goblin', armorClass: 15, health: 7, challengeRating: '1/4', notes: 'Flinke Flucht, Krummsäbel, Kurzbogen', category: 'goblinoid' },
  { name: 'Hobgoblin', armorClass: 18, health: 11, challengeRating: '1/2', notes: 'Kampfvorteil, Langschwert, Langbogen', category: 'goblinoid' },
  { name: 'Kobold', armorClass: 12, health: 5, challengeRating: '1/8', notes: 'Sonnenlichtempfindlichkeit, Rudeltaktik', category: 'goblinoid' },
  { name: 'Ork', armorClass: 13, health: 15, challengeRating: '1/2', notes: 'Aggressiv, Großaxt, Wurfspeer', category: 'goblinoid' },
  // Untote
  { name: 'Skelett', armorClass: 13, health: 13, challengeRating: '1/4', notes: 'Anfällig gegen Wuchtschaden, Kurzschwert', category: 'undead' },
  { name: 'Zombie', armorClass: 8, health: 22, challengeRating: '1/4', notes: 'Untote Zähigkeit, Schlag', category: 'undead' },
  { name: 'Ghul', armorClass: 12, health: 22, challengeRating: '1', notes: 'Klauen (Lähmung), Biss', category: 'undead' },
  // Bestien
  { name: 'Wolf', armorClass: 13, health: 11, challengeRating: '1/4', notes: 'Rudeltaktik, Biss (Niederwerfen)', category: 'beast' },
  { name: 'Worg', armorClass: 13, health: 26, challengeRating: '1/2', notes: 'Scharfe Sinne, Biss', category: 'beast' },
  { name: 'Riesenspinne', armorClass: 14, health: 26, challengeRating: '1', notes: 'Spinnenklettern, Netz, Giftbiss', category: 'beast' },
  { name: 'Riesenratte', armorClass: 12, health: 7, challengeRating: '1/8', notes: 'Scharfe Sinne, Rudeltaktik', category: 'beast' },
  // Monster
  { name: 'Bugbear', armorClass: 16, health: 27, challengeRating: '1', notes: 'Überraschungsangriff, Morgensterntreffer', category: 'monster' },
  { name: 'Gnoll', armorClass: 15, health: 22, challengeRating: '1/2', notes: 'Blutrausch, Biss, Speer', category: 'monster' },
  { name: 'Oger', armorClass: 11, health: 59, challengeRating: '2', notes: 'Große Keule, Wurfspeer', category: 'monster' },
  { name: 'Troll', armorClass: 15, health: 84, challengeRating: '5', notes: 'Regeneration, Mehrfachangriff, Feuer/Säure stoppt Regeneration', category: 'monster' }
];

@Component({
  selector: 'app-character-template-dialog',
  template: `
    <h2 mat-dialog-title>{{ dialogData.gameMode === 'dnd_5e' ? 'Kreatur auswählen' : 'Charakter auswählen' }}</h2>
    <mat-dialog-content>
      <mat-form-field class="full-width">
        <mat-label>Template suchen</mat-label>
        <input matInput
               [matAutocomplete]="auto"
               [(ngModel)]="searchText"
               (ngModelChange)="filterTemplates()"
               placeholder="Name eingeben...">
        <button *ngIf="searchText" mat-icon-button matSuffix (click)="clearSearch(); $event.stopPropagation()">
          <mat-icon>close</mat-icon>
        </button>
        <mat-autocomplete #auto="matAutocomplete"
                          [displayWith]="displayFn"
                          (optionSelected)="onOptionSelected($event)">
          <mat-option [value]="'default'" class="default-option">Default (Leer)</mat-option>

          <!-- Mutant Year Zero Categories -->
          <ng-container *ngIf="dialogData.gameMode === 'mutant_year_zero'">
            <mat-optgroup *ngIf="filteredCharacterTemplates.length > 0" label="Charaktere">
              <mat-option *ngFor="let template of filteredCharacterTemplates" [value]="template">
                {{ template.name }}
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredHumanoidTemplates.length > 0" label="Humanoide & Fraktionen">
              <mat-option *ngFor="let template of filteredHumanoidTemplates" [value]="template">
                {{ template.name }}
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredBeastTemplates.length > 0" label="Bestien der Zone">
              <mat-option *ngFor="let template of filteredBeastTemplates" [value]="template">
                {{ template.name }}
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredMechanicalTemplates.length > 0" label="Mechanische Bedrohungen">
              <mat-option *ngFor="let template of filteredMechanicalTemplates" [value]="template">
                {{ template.name }}
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredBossTemplates.length > 0" label="Legendäre Bosse">
              <mat-option *ngFor="let template of filteredBossTemplates" [value]="template">
                {{ template.name }}
              </mat-option>
            </mat-optgroup>
          </ng-container>

          <!-- D&D 5e Categories -->
          <ng-container *ngIf="dialogData.gameMode === 'dnd_5e'">
            <mat-optgroup *ngIf="filteredDnd5eHumanoidTemplates.length > 0" label="Humanoide">
              <mat-option *ngFor="let template of filteredDnd5eHumanoidTemplates" [value]="template">
                {{ template.name }} (RK {{ template.armorClass }}, TP {{ template.health }})
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredDnd5eGoblinoidTemplates.length > 0" label="Goblinartige">
              <mat-option *ngFor="let template of filteredDnd5eGoblinoidTemplates" [value]="template">
                {{ template.name }} (RK {{ template.armorClass }}, TP {{ template.health }})
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredDnd5eUndeadTemplates.length > 0" label="Untote">
              <mat-option *ngFor="let template of filteredDnd5eUndeadTemplates" [value]="template">
                {{ template.name }} (RK {{ template.armorClass }}, TP {{ template.health }})
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredDnd5eBeastTemplates.length > 0" label="Bestien">
              <mat-option *ngFor="let template of filteredDnd5eBeastTemplates" [value]="template">
                {{ template.name }} (RK {{ template.armorClass }}, TP {{ template.health }})
              </mat-option>
            </mat-optgroup>
            <mat-optgroup *ngIf="filteredDnd5eMonsterTemplates.length > 0" label="Monster">
              <mat-option *ngFor="let template of filteredDnd5eMonsterTemplates" [value]="template">
                {{ template.name }} (RK {{ template.armorClass }}, TP {{ template.health }})
              </mat-option>
            </mat-optgroup>
          </ng-container>
        </mat-autocomplete>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Abbrechen</button>
      <button mat-button color="primary" (click)="onConfirm()" [disabled]="!selectedTemplate">Bestätigen</button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; } .default-option { font-style: italic; }'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule
  ]
})
export class CharacterTemplateDialogComponent implements OnInit {
  selectedTemplate: string | CharacterTemplate | Dnd5eTemplate = 'default';
  searchText: string = '';
  // MYZ template arrays
  characterTemplates: CharacterTemplate[] = [];
  humanoidTemplates: CharacterTemplate[] = [];
  beastTemplates: CharacterTemplate[] = [];
  mechanicalTemplates: CharacterTemplate[] = [];
  bossTemplates: CharacterTemplate[] = [];
  // D&D 5e template arrays
  dnd5eHumanoidTemplates: Dnd5eTemplate[] = [];
  dnd5eGoblinoidTemplates: Dnd5eTemplate[] = [];
  dnd5eUndeadTemplates: Dnd5eTemplate[] = [];
  dnd5eBeastTemplates: Dnd5eTemplate[] = [];
  dnd5eMonsterTemplates: Dnd5eTemplate[] = [];
  // Filtered arrays (MYZ)
  filteredCharacterTemplates: CharacterTemplate[] = [];
  filteredHumanoidTemplates: CharacterTemplate[] = [];
  filteredBeastTemplates: CharacterTemplate[] = [];
  filteredMechanicalTemplates: CharacterTemplate[] = [];
  filteredBossTemplates: CharacterTemplate[] = [];
  // Filtered arrays (D&D 5e)
  filteredDnd5eHumanoidTemplates: Dnd5eTemplate[] = [];
  filteredDnd5eGoblinoidTemplates: Dnd5eTemplate[] = [];
  filteredDnd5eUndeadTemplates: Dnd5eTemplate[] = [];
  filteredDnd5eBeastTemplates: Dnd5eTemplate[] = [];
  filteredDnd5eMonsterTemplates: Dnd5eTemplate[] = [];

  constructor(
    private dialogRef: MatDialogRef<CharacterTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: { gameMode: string }
  ) {}

  ngOnInit() {
    if (this.dialogData.gameMode === 'mutant_year_zero') {
      // Categorize MYZ templates
      this.characterTemplates = MUTANT_YEAR_ZERO_TEMPLATES.filter(t => !t.category || t.category === 'character');
      this.humanoidTemplates = MUTANT_YEAR_ZERO_TEMPLATES.filter(t => t.category === 'humanoid');
      this.beastTemplates = MUTANT_YEAR_ZERO_TEMPLATES.filter(t => t.category === 'beast');
      this.mechanicalTemplates = MUTANT_YEAR_ZERO_TEMPLATES.filter(t => t.category === 'mechanical');
      this.bossTemplates = MUTANT_YEAR_ZERO_TEMPLATES.filter(t => t.category === 'boss');
      this.filterTemplates();
    } else if (this.dialogData.gameMode === 'dnd_5e') {
      // Categorize D&D 5e templates
      this.dnd5eHumanoidTemplates = DND_5E_TEMPLATES.filter(t => t.category === 'humanoid');
      this.dnd5eGoblinoidTemplates = DND_5E_TEMPLATES.filter(t => t.category === 'goblinoid');
      this.dnd5eUndeadTemplates = DND_5E_TEMPLATES.filter(t => t.category === 'undead');
      this.dnd5eBeastTemplates = DND_5E_TEMPLATES.filter(t => t.category === 'beast');
      this.dnd5eMonsterTemplates = DND_5E_TEMPLATES.filter(t => t.category === 'monster');
      this.filterTemplates();
    }
  }

  filterTemplates(): void {
    const search = this.searchText.toLowerCase().trim();

    if (this.dialogData.gameMode === 'mutant_year_zero') {
      if (!search) {
        this.filteredCharacterTemplates = this.characterTemplates;
        this.filteredHumanoidTemplates = this.humanoidTemplates;
        this.filteredBeastTemplates = this.beastTemplates;
        this.filteredMechanicalTemplates = this.mechanicalTemplates;
        this.filteredBossTemplates = this.bossTemplates;
      } else {
        const categoryLabels: Record<string, string[]> = {
          character: ['charakter', 'charaktere'],
          humanoid: ['humanoid', 'humanoide', 'fraktion', 'fraktionen'],
          beast: ['bestie', 'bestien', 'kreatur', 'kreaturen', 'tier', 'tiere', 'zone'],
          mechanical: ['mechanisch', 'mechanische', 'roboter', 'maschine', 'maschinen', 'drohne'],
          boss: ['boss', 'bosse', 'legendär', 'legendäre']
        };

        const matchesCategory = (category: string): boolean => {
          return categoryLabels[category]?.some(label => label.includes(search)) || false;
        };

        const matchesTemplate = (t: CharacterTemplate): boolean => {
          return t.name.toLowerCase().includes(search) || t.role.toLowerCase().includes(search);
        };

        this.filteredCharacterTemplates = matchesCategory('character')
          ? this.characterTemplates
          : this.characterTemplates.filter(matchesTemplate);
        this.filteredHumanoidTemplates = matchesCategory('humanoid')
          ? this.humanoidTemplates
          : this.humanoidTemplates.filter(matchesTemplate);
        this.filteredBeastTemplates = matchesCategory('beast')
          ? this.beastTemplates
          : this.beastTemplates.filter(matchesTemplate);
        this.filteredMechanicalTemplates = matchesCategory('mechanical')
          ? this.mechanicalTemplates
          : this.mechanicalTemplates.filter(matchesTemplate);
        this.filteredBossTemplates = matchesCategory('boss')
          ? this.bossTemplates
          : this.bossTemplates.filter(matchesTemplate);
      }
    } else if (this.dialogData.gameMode === 'dnd_5e') {
      if (!search) {
        this.filteredDnd5eHumanoidTemplates = this.dnd5eHumanoidTemplates;
        this.filteredDnd5eGoblinoidTemplates = this.dnd5eGoblinoidTemplates;
        this.filteredDnd5eUndeadTemplates = this.dnd5eUndeadTemplates;
        this.filteredDnd5eBeastTemplates = this.dnd5eBeastTemplates;
        this.filteredDnd5eMonsterTemplates = this.dnd5eMonsterTemplates;
      } else {
        const categoryLabels: Record<string, string[]> = {
          humanoid: ['humanoid', 'humanoide', 'mensch', 'menschen', 'bandit'],
          goblinoid: ['goblin', 'goblinartige', 'kobold', 'ork', 'hobgoblin'],
          undead: ['untot', 'untote', 'skelett', 'zombie', 'ghul'],
          beast: ['bestie', 'bestien', 'tier', 'tiere', 'wolf', 'spinne', 'ratte'],
          monster: ['monster', 'oger', 'troll', 'gnoll', 'bugbear']
        };

        const matchesCategory = (category: string): boolean => {
          return categoryLabels[category]?.some(label => label.includes(search)) || false;
        };

        const matchesDnd5eTemplate = (t: Dnd5eTemplate): boolean => {
          return t.name.toLowerCase().includes(search) || t.notes.toLowerCase().includes(search);
        };

        this.filteredDnd5eHumanoidTemplates = matchesCategory('humanoid')
          ? this.dnd5eHumanoidTemplates
          : this.dnd5eHumanoidTemplates.filter(matchesDnd5eTemplate);
        this.filteredDnd5eGoblinoidTemplates = matchesCategory('goblinoid')
          ? this.dnd5eGoblinoidTemplates
          : this.dnd5eGoblinoidTemplates.filter(matchesDnd5eTemplate);
        this.filteredDnd5eUndeadTemplates = matchesCategory('undead')
          ? this.dnd5eUndeadTemplates
          : this.dnd5eUndeadTemplates.filter(matchesDnd5eTemplate);
        this.filteredDnd5eBeastTemplates = matchesCategory('beast')
          ? this.dnd5eBeastTemplates
          : this.dnd5eBeastTemplates.filter(matchesDnd5eTemplate);
        this.filteredDnd5eMonsterTemplates = matchesCategory('monster')
          ? this.dnd5eMonsterTemplates
          : this.dnd5eMonsterTemplates.filter(matchesDnd5eTemplate);
      }
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.selectedTemplate = '';
    this.filterTemplates();
  }

  displayFn = (value: string | CharacterTemplate | Dnd5eTemplate): string => {
    if (!value) return '';
    if (value === 'default') return 'Default (Leer)';
    if (typeof value === 'object') return value.name;
    return value;
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedTemplate = event.option.value;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedTemplate);
  }
}

@Component({
  selector: 'app-combat-tracker',
  template: `
    <div class="combat-tracker">
      <!-- Header -->
      <div class="tracker-header">
        <div class="header-content">
          <span class="round-counter">Round {{ currentRound }}</span>
          <div class="header-buttons">
            <button mat-icon-button
                    *ngIf="settings?.gameMode === 'mutant_year_zero' || settings?.gameMode === 'dnd_5e'"
                    (click)="addRandomEncounter()"
                    class="random-btn"
                    title="Zufälliger Encounter">
              <mat-icon>casino</mat-icon>
            </button>
            <button mat-button color="primary" (click)="addCombatant()" class="add-btn">
              <mat-icon>add</mat-icon>
              Add
            </button>
          </div>
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
            <!-- Defeated skull background for general/d&d mode -->
            <div class="defeated-skull" *ngIf="settings?.gameMode !== 'mutant_year_zero' && combatant.health !== undefined && combatant.health <= 0">
              <img src="images/skull.png" alt="defeated">
            </div>
            <div class="card-content">
              <!-- Drag Handle -->
              <mat-icon cdkDragHandle class="drag-handle">drag_indicator</mat-icon>

              <!-- Combatant Header -->
              <div class="combatant-header">
                <span class="turn-marker">{{ i === activeIndex ? '▶' : '' }}</span>
                <input [(ngModel)]="combatant.name"
                       class="name-input"
                       placeholder="Name">
                <div class="init-group">
                  <label>Init</label>
                  <div class="number-input-wrapper">
                    <button class="num-btn num-btn-dec" (click)="combatant.initiative = (combatant.initiative || 0) - 1; saveState()">−</button>
                    <input [(ngModel)]="combatant.initiative"
                           type="number"
                           class="initiative-input"
                           placeholder="0">
                    <button class="num-btn num-btn-inc" (click)="combatant.initiative = (combatant.initiative || 0) + 1; saveState()">+</button>
                  </div>
                </div>
                <button mat-icon-button color="warn" (click)="removeCombatant(i)" class="remove-btn">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <!-- Mutant Year Zero Mode -->
              <div *ngIf="settings?.gameMode === 'mutant_year_zero'" class="mutant-mode">
                <div class="mutant-row">
                  <div class="field-group role-group">
                    <label>Role</label>
                    <input type="text" [(ngModel)]="combatant.role" placeholder="Role">
                  </div>
                  <div class="attributes-group">
                    <div class="attr-input">
                      <label>Str</label>
                      <div class="number-input-wrapper compact">
                        <button class="num-btn num-btn-dec" (click)="combatant.strength = (combatant.strength || 0) - 1; saveState()">−</button>
                        <input type="number" [(ngModel)]="combatant.strength" placeholder="0">
                        <button class="num-btn num-btn-inc" (click)="combatant.strength = (combatant.strength || 0) + 1; saveState()">+</button>
                      </div>
                    </div>
                    <div class="attr-input">
                      <label>Agi</label>
                      <div class="number-input-wrapper compact">
                        <button class="num-btn num-btn-dec" (click)="combatant.agility = (combatant.agility || 0) - 1; saveState()">−</button>
                        <input type="number" [(ngModel)]="combatant.agility" placeholder="0">
                        <button class="num-btn num-btn-inc" (click)="combatant.agility = (combatant.agility || 0) + 1; saveState()">+</button>
                      </div>
                    </div>
                    <div class="attr-input">
                      <label>Wit</label>
                      <div class="number-input-wrapper compact">
                        <button class="num-btn num-btn-dec" (click)="combatant.wits = (combatant.wits || 0) - 1; saveState()">−</button>
                        <input type="number" [(ngModel)]="combatant.wits" placeholder="0">
                        <button class="num-btn num-btn-inc" (click)="combatant.wits = (combatant.wits || 0) + 1; saveState()">+</button>
                      </div>
                    </div>
                    <div class="attr-input">
                      <label>Emp</label>
                      <div class="number-input-wrapper compact">
                        <button class="num-btn num-btn-dec" (click)="combatant.empathy = (combatant.empathy || 0) - 1; saveState()">−</button>
                        <input type="number" [(ngModel)]="combatant.empathy" placeholder="0">
                        <button class="num-btn num-btn-inc" (click)="combatant.empathy = (combatant.empathy || 0) + 1; saveState()">+</button>
                      </div>
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

              <!-- D&D 5e Mode -->
              <div *ngIf="settings?.gameMode === 'dnd_5e'" class="dnd-mode">
                <div class="dnd-stats-row">
                  <div class="stat-group">
                    <label>RK</label>
                    <div class="number-input-wrapper">
                      <button class="num-btn num-btn-dec" (click)="combatant.armorClass = (combatant.armorClass || 10) - 1; saveState()">−</button>
                      <input type="number" [(ngModel)]="combatant.armorClass" class="ac-input" placeholder="10">
                      <button class="num-btn num-btn-inc" (click)="combatant.armorClass = (combatant.armorClass || 10) + 1; saveState()">+</button>
                    </div>
                  </div>
                  <div class="stat-group hp-group">
                    <label>TP</label>
                    <div class="number-input-wrapper hp-wrapper">
                      <button class="num-btn num-btn-dec" (click)="adjustHealth(combatant, -5)">-5</button>
                      <button class="num-btn num-btn-dec num-btn-inner" (click)="adjustHealth(combatant, -1)">-1</button>
                      <input type="number"
                             [(ngModel)]="combatant.health"
                             class="health-input"
                             [class.health-zero]="combatant.health !== undefined && combatant.health <= 0"
                             placeholder="0">
                      <button class="num-btn num-btn-inc num-btn-inner" (click)="adjustHealth(combatant, 1)">+1</button>
                      <button class="num-btn num-btn-inc" (click)="adjustHealth(combatant, 5)">+5</button>
                    </div>
                    <span class="hp-separator">/</span>
                    <input type="number" [(ngModel)]="combatant.maxHealth" class="max-health-input" placeholder="0">
                  </div>
                </div>
                <div class="field-group notes-group">
                  <label>Notes</label>
                  <input type="text" [(ngModel)]="combatant.notes" placeholder="Zustände, Fähigkeiten...">
                </div>
              </div>

              <!-- General Mode -->
              <div *ngIf="settings?.gameMode !== 'mutant_year_zero' && settings?.gameMode !== 'dnd_5e'" class="general-mode">
                <div class="health-section">
                  <label>HP</label>
                  <div class="number-input-wrapper hp-wrapper">
                    <button class="num-btn num-btn-dec" (click)="adjustHealth(combatant, -5)">-5</button>
                    <button class="num-btn num-btn-dec num-btn-inner" (click)="adjustHealth(combatant, -1)">-1</button>
                    <input type="number"
                           [(ngModel)]="combatant.health"
                           class="health-input"
                           [class.health-zero]="combatant.health !== undefined && combatant.health <= 0"
                           placeholder="0">
                    <button class="num-btn num-btn-inc num-btn-inner" (click)="adjustHealth(combatant, 1)">+1</button>
                    <button class="num-btn num-btn-inc" (click)="adjustHealth(combatant, 5)">+5</button>
                  </div>
                </div>
                <div class="notes-section">
                  <label>Notes</label>
                  <input [(ngModel)]="combatant.notes"
                         class="notes-input"
                         placeholder="Notes">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="tracker-controls">
        <button mat-button class="control-btn"
                (click)="nextTurn()"
                [disabled]="combatants.length === 0">
          Next Turn
        </button>
        <button mat-button class="control-btn"
                (click)="sortByInitiative()"
                [disabled]="combatants.length === 0">
          Sort
        </button>
        <button mat-button color="warn" class="control-btn reset-btn"
                (click)="reset()"
                [disabled]="combatants.length === 0">
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
      font-size: 0.9em;
      color: var(--text-primary);
    }

    .tracker-header {
      flex: 0 0 auto;
      padding: 8px;
      border-bottom: var(--glass-border);
      background: var(--header-bg);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .random-btn {
      color: var(--accent-color);

      &:hover {
        background: rgba(64, 196, 255, 0.15);
      }
    }

    .round-counter {
      font-weight: 500;
      color: var(--accent-color);
      font-size: 1.1em;
    }

    .list-container {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
      padding: 8px;
    }

    .combatant-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .combatant-card {
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 4px;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
      padding: 8px;
      backdrop-filter: var(--glass-backdrop);
      overflow: hidden;

      &.active {
        background: rgba(64, 196, 255, 0.15); /* Accent color with low opacity */
        border-color: var(--accent-color);
        box-shadow: 0 0 10px rgba(64, 196, 255, 0.2);
      }

      &.defeated {
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(40, 0, 0, 0.4) 100%);
        border-color: var(--danger-color);
        box-shadow: inset 0 0 20px rgba(255, 82, 82, 0.1);
      }
    }

    .card-content {
      position: relative;
      padding-left: 24px; /* Make room for the drag handle */
      z-index: 1;
    }

    .drag-handle {
      position: absolute;
      left: -4px;
      top: 50%;
      transform: translateY(-50%);
      cursor: move;
      color: var(--text-secondary);
      font-size: 18px;
      opacity: 0.5;

      &:hover {
        opacity: 1;
        color: var(--text-primary);
      }
    }

    .defeated-skull {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.3;
      z-index: 0;

      img {
        width: 150px;
        height: 150px;
        object-fit: contain;
        filter: brightness(0.4) sepia(1) hue-rotate(-50deg) saturate(6) drop-shadow(0 0 8px rgba(255, 82, 82, 0.6));
      }
    }

    .combatant-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .turn-marker {
      width: 16px;
      text-align: center;
      color: var(--accent-color);
      font-weight: bold;
    }

    .name-input, input {
      background: var(--input-bg);
      border: var(--input-border);
      color: var(--text-primary);
      border-radius: 4px;
      padding: 4px 8px;

      &:focus {
        outline: none;
        border-color: var(--accent-color);
      }
    }

    /* Hide native number input spinners for cleaner look */
    input[type="number"] {
      -moz-appearance: textfield;
      appearance: textfield;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    /* Custom number input wrapper with +/- buttons */
    .number-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0;

      input {
        border-radius: 0;
        border-left: none;
        border-right: none;
        text-align: center;
      }

      &.compact {
        .num-btn {
          width: 18px;
          height: 20px;
          font-size: 0.7em;
        }

        input {
          width: 28px;
          padding: 2px 4px;
          height: 20px;
        }
      }
    }

    .num-btn {
      width: 22px;
      height: 24px;
      border: var(--input-border);
      background: var(--input-bg);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.75em;
      font-weight: normal;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
      }

      &:active {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(0.95);
      }
    }

    .num-btn-dec {
      border-radius: 4px 0 0 4px;

      &:hover {
        background: rgba(255, 82, 82, 0.2);
        color: var(--danger-color);
        border-color: rgba(255, 82, 82, 0.5);
      }
    }

    .num-btn-inc {
      border-radius: 0 4px 4px 0;

      &:hover {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
        border-color: rgba(76, 175, 80, 0.5);
      }
    }

    .num-btn-inner {
      border-radius: 0;
    }

    .hp-wrapper {
      .num-btn {
        width: 24px;
      }

      .health-input {
        width: 45px;
      }
    }

    .name-input {
      flex: 1;
      min-width: 0;
      font-weight: 500;
    }

    .init-group {
      display: flex;
      align-items: center;
      gap: 4px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
      }
    }

    .initiative-input {
      width: 40px;
      text-align: center;
    }

    .mutant-mode {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mutant-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .role-group {
      flex: 1;
      min-width: 120px;
      display: flex;
      align-items: center;
      gap: 4px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
        white-space: nowrap;
      }

      input {
        flex: 1;
        min-width: 0;
      }
    }

    .attributes-group {
      display: flex;
      gap: 6px;
    }

    .attr-input {
      display: flex;
      align-items: center;
      gap: 2px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
      }

      input {
        width: 40px; /* Slightly wider for better touch */
        text-align: center;
      }
    }

    .skills-group, .notes-group {
      display: flex;
      align-items: center;
      gap: 4px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
        white-space: nowrap;
      }

      input {
        flex: 1;
        min-width: 0;
      }
    }

    .general-mode {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .health-section {
      display: flex;
      align-items: center;
      gap: 4px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
      }

      input {
        width: 60px;
        text-align: center;

        &.health-zero {
          color: var(--danger-color);
          font-weight: bold;
          border-color: var(--danger-color);
        }
      }
    }

    .notes-section {
      display: flex;
      align-items: center;
      gap: 4px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
      }

      input {
        flex: 1;
        min-width: 0;
      }
    }

    /* D&D 5e Mode Styles */
    .dnd-mode {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .dnd-stats-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .stat-group {
      display: flex;
      align-items: center;
      gap: 4px;

      label {
        font-size: 0.8em;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    .ac-input {
      width: 45px;
      text-align: center;
    }

    .hp-group {
      display: flex;
      align-items: center;
      gap: 4px;

      .health-input {
        width: 50px;
        text-align: center;

        &.health-zero {
          color: var(--danger-color);
          font-weight: bold;
          border-color: var(--danger-color);
        }
      }

      .hp-separator {
        color: var(--text-secondary);
        font-weight: bold;
      }

      .max-health-input {
        width: 50px;
        text-align: center;
        color: var(--text-secondary);
      }
    }

    .tracker-controls {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-top: var(--glass-border);
      background: var(--header-bg);
      justify-content: flex-end;
    }

    .control-btn {
      color: var(--text-primary);
      border: 1px solid rgba(255,255,255,0.2);

      &:hover:not([disabled]) {
        background: var(--accent-color);
        color: white;
      }

      &.reset-btn:hover:not([disabled]) {
        background: var(--danger-color);
      }
    }

    .remove-btn mat-icon {
      color: var(--text-secondary);
      &:hover {
        color: var(--danger-color);
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DragDropModule,
    MatSelectModule,
    MatFormFieldModule
  ]
})
export class CombatTrackerComponent implements OnInit {
  @Input() settings: any;

  combatants: Combatant[] = [];
  activeIndex: number = 0;
  currentRound: number = 1;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  get sortedCombatants(): Combatant[] {
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
    this.settings.defaultInitiative = this.settings.defaultInitiative ?? '0';
  }

  /**
   * Roll dice notation (e.g., "1D6", "2W4+1", "3d6-2") or return number
   */
  private rollInitiative(notation: string | number): number {
    if (typeof notation === 'number') return notation;

    const str = notation.trim();

    // If it's just a number, return it
    const justNumber = parseInt(str, 10);
    if (!isNaN(justNumber) && str === String(justNumber)) {
      return justNumber;
    }

    // Parse dice notation: XdY+Z or XwY+Z (case insensitive)
    const diceRegex = /^(\d+)?[dw](\d+)([+-]\d+)?$/i;
    const match = str.match(diceRegex);

    if (!match) {
      // Invalid notation, return 0
      return 0;
    }

    const numDice = parseInt(match[1] || '1', 10);
    const dieSize = parseInt(match[2], 10);
    const modifier = parseInt(match[3] || '0', 10);

    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }

    return total + modifier;
  }

  async addCombatant() {
    const dialogRef = this.dialog.open(CharacterTemplateDialogComponent, {
      width: '300px',
      data: { gameMode: this.settings?.gameMode || 'general' }
    });

    dialogRef.afterClosed().subscribe((result: string | CharacterTemplate | Dnd5eTemplate) => {
      if (result) {
        const initiative = this.rollInitiative(this.settings.defaultInitiative ?? '0');
        let newCombatant: Combatant;

        if (result === 'default') {
          // Create default combatant
          newCombatant = {
            id: Date.now().toString(),
            name: '',
            notes: '',
            initiative
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
          } else if (this.settings?.gameMode === 'dnd_5e') {
            newCombatant = {
              ...newCombatant,
              armorClass: 10,
              health: 10,
              maxHealth: 10
            };
          } else {
            newCombatant.health = 100;
          }
        } else if (this.settings?.gameMode === 'dnd_5e') {
          // Create combatant from D&D 5e template
          const template = result as Dnd5eTemplate;
          newCombatant = {
            id: Date.now().toString(),
            name: template.name,
            notes: template.notes,
            initiative,
            armorClass: template.armorClass,
            health: template.health,
            maxHealth: template.health
          };
        } else {
          // Create combatant from MYZ template
          const template = result as CharacterTemplate;
          newCombatant = {
            id: Date.now().toString(),
            name: template.name,
            notes: '',
            initiative,
            role: template.role,
            strength: template.strength,
            agility: template.agility,
            wits: template.wits,
            empathy: template.empathy,
            skills: template.skills
          };
        }

        this.combatants.push(newCombatant);
        this.saveState();
        // Trigger change detection to update the view
        this.cdr.detectChanges();
      }
    });
  }

  addRandomEncounter() {
    const initiative = this.rollInitiative(this.settings.defaultInitiative ?? '0');
    let newCombatant: Combatant;

    if (this.settings?.gameMode === 'dnd_5e') {
      if (DND_5E_TEMPLATES.length === 0) return;

      // Pick a random D&D 5e template
      const randomIndex = Math.floor(Math.random() * DND_5E_TEMPLATES.length);
      const template = DND_5E_TEMPLATES[randomIndex];

      newCombatant = {
        id: Date.now().toString(),
        name: template.name,
        notes: template.notes,
        initiative,
        armorClass: template.armorClass,
        health: template.health,
        maxHealth: template.health
      };
    } else {
      if (MUTANT_YEAR_ZERO_TEMPLATES.length === 0) return;

      // Pick a random MYZ template
      const randomIndex = Math.floor(Math.random() * MUTANT_YEAR_ZERO_TEMPLATES.length);
      const template = MUTANT_YEAR_ZERO_TEMPLATES[randomIndex];

      newCombatant = {
        id: Date.now().toString(),
        name: template.name,
        notes: '',
        initiative,
        role: template.role,
        strength: template.strength,
        agility: template.agility,
        wits: template.wits,
        empathy: template.empathy,
        skills: template.skills
      };
    }

    this.combatants.push(newCombatant);
    this.saveState();
    this.cdr.detectChanges();
  }

  adjustHealth(combatant: Combatant, amount: number) {
    if (combatant.health === undefined) {
      combatant.health = 0;
    }
    combatant.health += amount;
    this.saveState();
    this.cdr.detectChanges();
  }

  removeCombatant(index: number) {
    this.combatants.splice(index, 1);
    if (this.activeIndex >= this.combatants.length) {
      this.activeIndex = Math.max(0, this.combatants.length - 1);
    }
    this.saveState();
    this.cdr.detectChanges();
  }

  nextTurn() {
    if (this.combatants.length === 0) return;

    this.activeIndex++;
    if (this.activeIndex >= this.combatants.length) {
      this.activeIndex = 0;
      this.currentRound++;
    }
    this.saveState();
    this.cdr.detectChanges();
  }

  reset() {
    if (confirm('Are you sure you want to reset the combat tracker?')) {
      this.activeIndex = 0;
      this.currentRound = 1;
      this.saveState();
      this.cdr.detectChanges();
    }
  }

  sortByInitiative() {
    this.combatants.sort((a, b) => {
      const diff = (b.initiative || 0) - (a.initiative || 0);
      // Randomize order when initiatives are equal
      return diff !== 0 ? diff : Math.random() - 0.5;
    });
    this.saveState();
    this.cdr.detectChanges();
  }

  drop(event: any) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.combatants, event.previousIndex, event.currentIndex);
      if (this.activeIndex === event.previousIndex) {
        this.activeIndex = event.currentIndex;
      } else if (this.activeIndex > event.previousIndex && this.activeIndex <= event.currentIndex) {
        this.activeIndex--;
      } else if (this.activeIndex < event.previousIndex && this.activeIndex >= event.currentIndex) {
        this.activeIndex++;
      }
      this.saveState();
      this.cdr.detectChanges();
    }
  }

  saveState() {
    if (this.settings) {
      this.settings.combatants = this.combatants;
      this.settings.activeIndex = this.activeIndex;
      this.settings.currentRound = this.currentRound;
    }
  }
}
