import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

// Static imports for all generators
// Fantasy
import elfs from '@xaroth8088/random-names/generators/fantasy/elfs.mjs';
import dwarfs from '@xaroth8088/random-names/generators/fantasy/dwarfs.mjs';
import orcs from '@xaroth8088/random-names/generators/fantasy/orcs.mjs';
import gnomes from '@xaroth8088/random-names/generators/fantasy/gnomes.mjs';
import goblins from '@xaroth8088/random-names/generators/fantasy/goblins.mjs';
import hobbits from '@xaroth8088/random-names/generators/fantasy/hobbits.mjs';
import dragons from '@xaroth8088/random-names/generators/fantasy/dragons.mjs';
import demons from '@xaroth8088/random-names/generators/fantasy/demons.mjs';
import angels from '@xaroth8088/random-names/generators/fantasy/angels.mjs';
import vampires from '@xaroth8088/random-names/generators/fantasy/vampires.mjs';
import werewolfs from '@xaroth8088/random-names/generators/fantasy/werewolfs.mjs';
import wizards from '@xaroth8088/random-names/generators/fantasy/wizards.mjs';
import knights from '@xaroth8088/random-names/generators/fantasy/knights.mjs';
import pirates from '@xaroth8088/random-names/generators/fantasy/pirates.mjs';
import barbarians from '@xaroth8088/random-names/generators/fantasy/barbarians.mjs';
import medievals from '@xaroth8088/random-names/generators/fantasy/medievals.mjs';
import steampunks from '@xaroth8088/random-names/generators/fantasy/steampunks.mjs';
import futuristics from '@xaroth8088/random-names/generators/fantasy/futuristics.mjs';
import robots from '@xaroth8088/random-names/generators/fantasy/robots.mjs';
import aliens from '@xaroth8088/random-names/generators/fantasy/aliens.mjs';
import ninjas from '@xaroth8088/random-names/generators/fantasy/ninjas.mjs';
import cowboys from '@xaroth8088/random-names/generators/fantasy/cowboys.mjs';

// Real World
import englishs from '@xaroth8088/random-names/generators/real/englishs.mjs';
import germans from '@xaroth8088/random-names/generators/real/germans.mjs';
import frenchs from '@xaroth8088/random-names/generators/real/frenchs.mjs';
import italians from '@xaroth8088/random-names/generators/real/italians.mjs';
import russians from '@xaroth8088/random-names/generators/real/russians.mjs';
import japaneses from '@xaroth8088/random-names/generators/real/japaneses.mjs';
import chineses from '@xaroth8088/random-names/generators/real/chineses.mjs';
import muslims from '@xaroth8088/random-names/generators/real/muslims.mjs';
import vikings from '@xaroth8088/random-names/generators/real/vikings.mjs';
import celtics from '@xaroth8088/random-names/generators/real/celtics.mjs';
import greeks from '@xaroth8088/random-names/generators/real/greeks.mjs';
import romans from '@xaroth8088/random-names/generators/real/romans.mjs';
import nativeAmericans from '@xaroth8088/random-names/generators/real/nativeAmericans.mjs';
import hispanics from '@xaroth8088/random-names/generators/real/hispanics.mjs';
import africanAmericans from '@xaroth8088/random-names/generators/real/africanAmericans.mjs';
import victorians from '@xaroth8088/random-names/generators/real/victorians.mjs';

// D&D
import dndHumans from '@xaroth8088/random-names/generators/dungeon_and_dragons/humans.mjs';
import dndElfs from '@xaroth8088/random-names/generators/dungeon_and_dragons/elfs.mjs';
import dndDwarfs from '@xaroth8088/random-names/generators/dungeon_and_dragons/dwarfs.mjs';
import dndHalflings from '@xaroth8088/random-names/generators/dungeon_and_dragons/halflings.mjs';
import dndGnomes from '@xaroth8088/random-names/generators/dungeon_and_dragons/gnomes.mjs';
import dndDragonborns from '@xaroth8088/random-names/generators/dungeon_and_dragons/dragonborns.mjs';
import dndTieflings from '@xaroth8088/random-names/generators/dungeon_and_dragons/tieflings.mjs';
import dndHalfOrcs from '@xaroth8088/random-names/generators/dungeon_and_dragons/halfOrcs.mjs';
import dndHalfElfs from '@xaroth8088/random-names/generators/dungeon_and_dragons/halfElfs.mjs';
import dndDrows from '@xaroth8088/random-names/generators/dungeon_and_dragons/drows.mjs';

// Star Wars
import mandalorians from '@xaroth8088/random-names/generators/star_wars/mandalorians.mjs';
import wookiees from '@xaroth8088/random-names/generators/star_wars/wookiees.mjs';
import twileks from '@xaroth8088/random-names/generators/star_wars_the_old_republic/twileks.mjs';
import hutts from '@xaroth8088/random-names/generators/star_wars/hutts.mjs';
import rodians from '@xaroth8088/random-names/generators/star_wars/rodians.mjs';
import zabraks from '@xaroth8088/random-names/generators/star_wars_the_old_republic/zabraks.mjs';
import siths from '@xaroth8088/random-names/generators/star_wars_the_old_republic/siths.mjs';
import darths from '@xaroth8088/random-names/generators/star_wars/darths.mjs';

// Lord of the Rings
import lotrHumans from '@xaroth8088/random-names/generators/lord_of_the_rings/humans.mjs';
import lotrElfs from '@xaroth8088/random-names/generators/lord_of_the_rings/elfs.mjs';
import lotrDwarfs from '@xaroth8088/random-names/generators/lord_of_the_rings/dwarfs.mjs';
import lotrHobbits from '@xaroth8088/random-names/generators/lord_of_the_rings/hobbits.mjs';
import lotrOrcs from '@xaroth8088/random-names/generators/lord_of_the_rings/orcs.mjs';

// The Witcher
import witcherHumans from '@xaroth8088/random-names/generators/the_witcher/humans.mjs';
import witcherElfs from '@xaroth8088/random-names/generators/the_witcher/elfs.mjs';
import witcherDwarfs from '@xaroth8088/random-names/generators/the_witcher/dwarfs.mjs';
import witcherHalflings from '@xaroth8088/random-names/generators/the_witcher/halflings.mjs';

// Game of Thrones
import westeros from '@xaroth8088/random-names/generators/game_of_thrones/westeros.mjs';
import dothrakis from '@xaroth8088/random-names/generators/game_of_thrones/dothrakis.mjs';
import valyrians from '@xaroth8088/random-names/generators/game_of_thrones/valyrians.mjs';
import freeFolks from '@xaroth8088/random-names/generators/game_of_thrones/freeFolks.mjs';

// Places
import fantasyTowns from '@xaroth8088/random-names/generators/towns_and_cities/fantasyTowns.mjs';
import citys from '@xaroth8088/random-names/generators/towns_and_cities/citys.mjs';
import towns from '@xaroth8088/random-names/generators/towns_and_cities/towns.mjs';
import castles from '@xaroth8088/random-names/generators/places/castles.mjs';
import inns from '@xaroth8088/random-names/generators/places/inns.mjs';
import kingdoms from '@xaroth8088/random-names/generators/places/kingdoms.mjs';
import dungeons from '@xaroth8088/random-names/generators/places/dungeons.mjs';
import forests from '@xaroth8088/random-names/generators/places/forests.mjs';
import mountains from '@xaroth8088/random-names/generators/places/mountains.mjs';

// Weapons & Armour
import swords from '@xaroth8088/random-names/generators/weapons/swords.mjs';
import bows from '@xaroth8088/random-names/generators/weapons/bows.mjs';
import daggers from '@xaroth8088/random-names/generators/weapons/daggers.mjs';
import staffs from '@xaroth8088/random-names/generators/weapons/staffs.mjs';
import spears from '@xaroth8088/random-names/generators/weapons/spears.mjs';
import battleAxes from '@xaroth8088/random-names/generators/weapons/battleAxes.mjs';
import warHammers from '@xaroth8088/random-names/generators/weapons/warHammers.mjs';
import shields from '@xaroth8088/random-names/generators/armour/shields.mjs';
import helmets from '@xaroth8088/random-names/generators/armour/helmets.mjs';

// Generator registry - maps IDs to functions
const generatorRegistry: Record<string, () => string> = {
  // Fantasy
  'fantasy_elfs': elfs,
  'fantasy_dwarfs': dwarfs,
  'fantasy_orcs': orcs,
  'fantasy_gnomes': gnomes,
  'fantasy_goblins': goblins,
  'fantasy_hobbits': hobbits,
  'fantasy_dragons': dragons,
  'fantasy_demons': demons,
  'fantasy_angels': angels,
  'fantasy_vampires': vampires,
  'fantasy_werewolfs': werewolfs,
  'fantasy_wizards': wizards,
  'fantasy_knights': knights,
  'fantasy_pirates': pirates,
  'fantasy_barbarians': barbarians,
  'fantasy_medievals': medievals,
  'fantasy_steampunks': steampunks,
  'fantasy_futuristics': futuristics,
  'fantasy_robots': robots,
  'fantasy_aliens': aliens,
  'fantasy_ninjas': ninjas,
  'fantasy_cowboys': cowboys,
  // Real World
  'real_englishs': englishs,
  'real_germans': germans,
  'real_frenchs': frenchs,
  'real_italians': italians,
  'real_russians': russians,
  'real_japaneses': japaneses,
  'real_chineses': chineses,
  'real_muslims': muslims,
  'real_vikings': vikings,
  'real_celtics': celtics,
  'real_greeks': greeks,
  'real_romans': romans,
  'real_nativeAmericans': nativeAmericans,
  'real_hispanics': hispanics,
  'real_africanAmericans': africanAmericans,
  'real_victorians': victorians,
  // D&D
  'dnd_humans': dndHumans,
  'dnd_elfs': dndElfs,
  'dnd_dwarfs': dndDwarfs,
  'dnd_halflings': dndHalflings,
  'dnd_gnomes': dndGnomes,
  'dnd_dragonborns': dndDragonborns,
  'dnd_tieflings': dndTieflings,
  'dnd_halfOrcs': dndHalfOrcs,
  'dnd_halfElfs': dndHalfElfs,
  'dnd_drows': dndDrows,
  // Star Wars
  'starwars_mandalorians': mandalorians,
  'starwars_wookiees': wookiees,
  'starwars_twileks': twileks,
  'starwars_hutts': hutts,
  'starwars_rodians': rodians,
  'starwars_zabraks': zabraks,
  'starwars_siths': siths,
  'starwars_darths': darths,
  // Lord of the Rings
  'lotr_humans': lotrHumans,
  'lotr_elfs': lotrElfs,
  'lotr_dwarfs': lotrDwarfs,
  'lotr_hobbits': lotrHobbits,
  'lotr_orcs': lotrOrcs,
  // The Witcher
  'witcher_humans': witcherHumans,
  'witcher_elfs': witcherElfs,
  'witcher_dwarfs': witcherDwarfs,
  'witcher_halflings': witcherHalflings,
  // Game of Thrones
  'got_westeros': westeros,
  'got_dothrakis': dothrakis,
  'got_valyrians': valyrians,
  'got_freeFolks': freeFolks,
  // Places
  'places_fantasyTowns': fantasyTowns,
  'places_citys': citys,
  'places_towns': towns,
  'places_castles': castles,
  'places_inns': inns,
  'places_kingdoms': kingdoms,
  'places_dungeons': dungeons,
  'places_forests': forests,
  'places_mountains': mountains,
  // Weapons & Armour
  'items_swords': swords,
  'items_bows': bows,
  'items_daggers': daggers,
  'items_staffs': staffs,
  'items_spears': spears,
  'items_battleAxes': battleAxes,
  'items_warHammers': warHammers,
  'items_shields': shields,
  'items_helmets': helmets,
};

interface NameCategory {
  id: string;
  label: string;
  generators: NameGenerator[];
}

interface NameGenerator {
  id: string;
  label: string;
  key: string; // Key in generatorRegistry
}

@Component({
  selector: 'app-name-generator',
  template: `
    <div class="name-generator-container">
      <div class="controls">
        <mat-form-field appearance="outline" class="category-select">
          <mat-label>Category</mat-label>
          <mat-select [(value)]="selectedCategory" (selectionChange)="onCategoryChange()">
            <mat-option *ngFor="let cat of categories" [value]="cat.id">
              {{ cat.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="generator-select">
          <mat-label>Name Type</mat-label>
          <mat-select [(value)]="selectedGenerator">
            <mat-option *ngFor="let gen of currentGenerators" [value]="gen.id">
              {{ gen.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="generate-section">
        <button mat-raised-button color="primary" (click)="generateName()" [disabled]="!selectedGenerator">
          <mat-icon>casino</mat-icon>
          Generate
        </button>
      </div>

      <div class="result-section" *ngIf="generatedName">
        <div class="result-card">
          <span class="result-label">Generated Name:</span>
          <span class="result-name">{{ generatedName }}</span>
          <button mat-icon-button class="copy-btn" (click)="copyToClipboard()" title="Copy to clipboard">
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>
      </div>

      <div class="history-section" *ngIf="nameHistory.length > 0">
        <div class="history-header">
          <span>History</span>
          <button mat-icon-button (click)="clearHistory()" title="Clear history">
            <mat-icon>delete_outline</mat-icon>
          </button>
        </div>
        <div class="history-list">
          <div class="history-item" *ngFor="let item of nameHistory">
            <span class="history-name">{{ item.name }}</span>
            <span class="history-type">{{ item.type }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .name-generator-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 12px;
      box-sizing: border-box;
      gap: 12px;
      overflow: auto;
    }

    .controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .category-select, .generator-select {
      flex: 1;
      min-width: 120px;
    }

    ::ng-deep .name-generator-container .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .generate-section {
      display: flex;
      justify-content: center;
    }

    .generate-section button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 24px;
    }

    .result-section {
      display: flex;
      justify-content: center;
    }

    .result-card {
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 8px;
      padding: 16px 24px;
      text-align: center;
      backdrop-filter: var(--glass-backdrop);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .copy-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 32px;
      height: 32px;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .copy-btn:hover {
      opacity: 1;
    }

    .copy-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .result-label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .result-name {
      display: block;
      font-size: 1.4em;
      font-weight: 500;
      color: var(--accent-color);
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .history-section {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: var(--glass-border);
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .history-header button {
      width: 28px;
      height: 28px;
      line-height: 28px;
    }

    .history-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .history-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .history-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .history-name {
      font-size: 13px;
      color: var(--text-primary);
    }

    .history-type {
      font-size: 10px;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    FormsModule
  ]
})
export class NameGeneratorComponent implements OnInit {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<void>();

  constructor(private snackBar: MatSnackBar) {}

  categories: NameCategory[] = [
    {
      id: 'fantasy',
      label: 'Fantasy',
      generators: [
        { id: 'elfs', label: 'Elves', key: 'fantasy_elfs' },
        { id: 'dwarfs', label: 'Dwarves', key: 'fantasy_dwarfs' },
        { id: 'orcs', label: 'Orcs', key: 'fantasy_orcs' },
        { id: 'gnomes', label: 'Gnomes', key: 'fantasy_gnomes' },
        { id: 'goblins', label: 'Goblins', key: 'fantasy_goblins' },
        { id: 'hobbits', label: 'Hobbits', key: 'fantasy_hobbits' },
        { id: 'dragons', label: 'Dragons', key: 'fantasy_dragons' },
        { id: 'demons', label: 'Demons', key: 'fantasy_demons' },
        { id: 'angels', label: 'Angels', key: 'fantasy_angels' },
        { id: 'vampires', label: 'Vampires', key: 'fantasy_vampires' },
        { id: 'werewolfs', label: 'Werewolves', key: 'fantasy_werewolfs' },
        { id: 'wizards', label: 'Wizards', key: 'fantasy_wizards' },
        { id: 'knights', label: 'Knights', key: 'fantasy_knights' },
        { id: 'pirates', label: 'Pirates', key: 'fantasy_pirates' },
        { id: 'barbarians', label: 'Barbarians', key: 'fantasy_barbarians' },
        { id: 'medievals', label: 'Medieval', key: 'fantasy_medievals' },
        { id: 'steampunks', label: 'Steampunk', key: 'fantasy_steampunks' },
        { id: 'futuristics', label: 'Futuristic', key: 'fantasy_futuristics' },
        { id: 'robots', label: 'Robots', key: 'fantasy_robots' },
        { id: 'aliens', label: 'Aliens', key: 'fantasy_aliens' },
        { id: 'ninjas', label: 'Ninjas', key: 'fantasy_ninjas' },
        { id: 'cowboys', label: 'Cowboys', key: 'fantasy_cowboys' }
      ]
    },
    {
      id: 'real',
      label: 'Real World',
      generators: [
        { id: 'englishs', label: 'English', key: 'real_englishs' },
        { id: 'germans', label: 'German', key: 'real_germans' },
        { id: 'frenchs', label: 'French', key: 'real_frenchs' },
        { id: 'italians', label: 'Italian', key: 'real_italians' },
        { id: 'russians', label: 'Russian', key: 'real_russians' },
        { id: 'japaneses', label: 'Japanese', key: 'real_japaneses' },
        { id: 'chineses', label: 'Chinese', key: 'real_chineses' },
        { id: 'muslims', label: 'Arabic/Muslim', key: 'real_muslims' },
        { id: 'vikings', label: 'Vikings', key: 'real_vikings' },
        { id: 'celtics', label: 'Celtic', key: 'real_celtics' },
        { id: 'greeks', label: 'Greek', key: 'real_greeks' },
        { id: 'romans', label: 'Roman', key: 'real_romans' },
        { id: 'nativeAmericans', label: 'Native American', key: 'real_nativeAmericans' },
        { id: 'hispanics', label: 'Hispanic', key: 'real_hispanics' },
        { id: 'africanAmericans', label: 'African American', key: 'real_africanAmericans' },
        { id: 'victorians', label: 'Victorian', key: 'real_victorians' }
      ]
    },
    {
      id: 'dnd',
      label: 'D&D',
      generators: [
        { id: 'humans', label: 'Humans', key: 'dnd_humans' },
        { id: 'elfs', label: 'Elves', key: 'dnd_elfs' },
        { id: 'dwarfs', label: 'Dwarves', key: 'dnd_dwarfs' },
        { id: 'halflings', label: 'Halflings', key: 'dnd_halflings' },
        { id: 'gnomes', label: 'Gnomes', key: 'dnd_gnomes' },
        { id: 'dragonborns', label: 'Dragonborn', key: 'dnd_dragonborns' },
        { id: 'tieflings', label: 'Tieflings', key: 'dnd_tieflings' },
        { id: 'halfOrcs', label: 'Half-Orcs', key: 'dnd_halfOrcs' },
        { id: 'halfElfs', label: 'Half-Elves', key: 'dnd_halfElfs' },
        { id: 'drows', label: 'Drow', key: 'dnd_drows' }
      ]
    },
    {
      id: 'scifi',
      label: 'Sci-Fi',
      generators: [
        { id: 'futuristics', label: 'Futuristic', key: 'fantasy_futuristics' },
        { id: 'robots', label: 'Robots', key: 'fantasy_robots' },
        { id: 'aliens', label: 'Aliens', key: 'fantasy_aliens' }
      ]
    },
    {
      id: 'starwars',
      label: 'Star Wars',
      generators: [
        { id: 'mandalorians', label: 'Mandalorians', key: 'starwars_mandalorians' },
        { id: 'wookiees', label: 'Wookiees', key: 'starwars_wookiees' },
        { id: 'twileks', label: "Twi'leks", key: 'starwars_twileks' },
        { id: 'hutts', label: 'Hutts', key: 'starwars_hutts' },
        { id: 'rodians', label: 'Rodians', key: 'starwars_rodians' },
        { id: 'zabraks', label: 'Zabraks', key: 'starwars_zabraks' },
        { id: 'siths', label: 'Sith', key: 'starwars_siths' },
        { id: 'darths', label: 'Darth Names', key: 'starwars_darths' }
      ]
    },
    {
      id: 'lotr',
      label: 'Lord of the Rings',
      generators: [
        { id: 'humans', label: 'Humans', key: 'lotr_humans' },
        { id: 'elfs', label: 'Elves', key: 'lotr_elfs' },
        { id: 'dwarfs', label: 'Dwarves', key: 'lotr_dwarfs' },
        { id: 'hobbits', label: 'Hobbits', key: 'lotr_hobbits' },
        { id: 'orcs', label: 'Orcs', key: 'lotr_orcs' }
      ]
    },
    {
      id: 'witcher',
      label: 'The Witcher',
      generators: [
        { id: 'humans', label: 'Humans', key: 'witcher_humans' },
        { id: 'elfs', label: 'Elves', key: 'witcher_elfs' },
        { id: 'dwarfs', label: 'Dwarves', key: 'witcher_dwarfs' },
        { id: 'halflings', label: 'Halflings', key: 'witcher_halflings' }
      ]
    },
    {
      id: 'got',
      label: 'Game of Thrones',
      generators: [
        { id: 'westeros', label: 'Westeros', key: 'got_westeros' },
        { id: 'dothrakis', label: 'Dothraki', key: 'got_dothrakis' },
        { id: 'valyrians', label: 'Valyrian', key: 'got_valyrians' },
        { id: 'freeFolks', label: 'Free Folk', key: 'got_freeFolks' }
      ]
    },
    {
      id: 'places',
      label: 'Places',
      generators: [
        { id: 'fantasyTowns', label: 'Fantasy Towns', key: 'places_fantasyTowns' },
        { id: 'citys', label: 'Cities', key: 'places_citys' },
        { id: 'towns', label: 'Towns', key: 'places_towns' },
        { id: 'castles', label: 'Castles', key: 'places_castles' },
        { id: 'inns', label: 'Taverns', key: 'places_inns' },
        { id: 'kingdoms', label: 'Kingdoms', key: 'places_kingdoms' },
        { id: 'dungeons', label: 'Dungeons', key: 'places_dungeons' },
        { id: 'forests', label: 'Forests', key: 'places_forests' },
        { id: 'mountains', label: 'Mountains', key: 'places_mountains' }
      ]
    },
    {
      id: 'items',
      label: 'Items & Weapons',
      generators: [
        { id: 'swords', label: 'Swords', key: 'items_swords' },
        { id: 'bows', label: 'Bows', key: 'items_bows' },
        { id: 'daggers', label: 'Daggers', key: 'items_daggers' },
        { id: 'staffs', label: 'Staffs', key: 'items_staffs' },
        { id: 'spears', label: 'Spears', key: 'items_spears' },
        { id: 'battleAxes', label: 'Battle Axes', key: 'items_battleAxes' },
        { id: 'warHammers', label: 'War Hammers', key: 'items_warHammers' },
        { id: 'shields', label: 'Shields', key: 'items_shields' },
        { id: 'helmets', label: 'Helmets', key: 'items_helmets' }
      ]
    }
  ];

  selectedCategory: string = 'fantasy';
  selectedGenerator: string = '';
  currentGenerators: NameGenerator[] = [];
  generatedName: string = '';
  nameHistory: { name: string; type: string }[] = [];

  ngOnInit() {
    this.onCategoryChange();
    if (this.settings?.lastCategory) {
      this.selectedCategory = this.settings.lastCategory;
      this.onCategoryChange();
    }
    if (this.settings?.lastGenerator) {
      this.selectedGenerator = this.settings.lastGenerator;
    }
    if (this.settings?.history) {
      this.nameHistory = this.settings.history;
    }
  }

  onCategoryChange() {
    const category = this.categories.find(c => c.id === this.selectedCategory);
    this.currentGenerators = category?.generators || [];
    if (this.currentGenerators.length > 0 && !this.currentGenerators.find(g => g.id === this.selectedGenerator)) {
      this.selectedGenerator = this.currentGenerators[0].id;
    }
  }

  generateName() {
    const generator = this.currentGenerators.find(g => g.id === this.selectedGenerator);
    if (!generator) return;

    const genFn = generatorRegistry[generator.key];
    if (!genFn) {
      this.generatedName = 'Generator not found';
      return;
    }

    try {
      const name = genFn().trim();
      this.generatedName = name;

      // Add to history
      this.nameHistory.unshift({
        name,
        type: generator.label
      });

      // Keep only last 20 items
      if (this.nameHistory.length > 20) {
        this.nameHistory = this.nameHistory.slice(0, 20);
      }

      // Save state
      this.saveState();
    } catch (error) {
      console.error('Failed to generate name:', error);
      this.generatedName = 'Error generating name';
    }
  }

  clearHistory() {
    this.nameHistory = [];
    this.saveState();
  }

  copyToClipboard() {
    if (this.generatedName) {
      navigator.clipboard.writeText(this.generatedName).then(() => {
        this.snackBar.open('Copied to clipboard!', undefined, {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      });
    }
  }

  private saveState() {
    if (this.settings) {
      this.settings.lastCategory = this.selectedCategory;
      this.settings.lastGenerator = this.selectedGenerator;
      this.settings.history = this.nameHistory;
      this.settingsChange.emit();
    }
  }
}
