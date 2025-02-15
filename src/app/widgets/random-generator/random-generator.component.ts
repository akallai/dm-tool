import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

interface RandomMapping {
  key: string;
  itemsText: string;
}

interface RandomGeneratorSettings {
  mappings: RandomMapping[];
}

@Component({
  selector: 'app-random-generator',
  template: `
    <div class="random-generator">
      <div *ngIf="!mappings || mappings.length === 0" class="empty-message">
        No mappings available. Add mappings in settings.
      </div>
      
      <div *ngIf="mappings.length > 0" class="content-wrapper">
        <div class="button-grid">
          <button 
            mat-raised-button 
            *ngFor="let mapping of mappings" 
            (click)="randomize(mapping)"
            [disabled]="!hasItems(mapping)">
            {{ mapping.key || 'No Key' }}
          </button>
        </div>
        
        <div *ngIf="lastResult" class="result">
          <strong>{{ lastKey || 'Result' }}:</strong> {{ lastResult }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .random-generator {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-wrapper {
      width: 100%;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
    }

    .result {
      text-align: center;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-top: auto;
    }

    .empty-message {
      color: #666;
      font-size: 0.9em;
      text-align: center;
      padding: 16px;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class RandomGeneratorComponent implements OnInit, OnChanges {
  @Input() settings: any;
  mappings: RandomMapping[] = [];
  lastResult: string = '';
  lastKey: string = '';

  ngOnInit() {
    if (this.settings && this.settings.mappings) {
      this.mappings = this.settings.mappings;
    } else {
      this.mappings = [];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings'] && this.settings && this.settings.mappings) {
      this.mappings = this.settings.mappings;
    }
  }

  getItems(mapping: RandomMapping): string[] {
    if (!mapping.itemsText) {
      return [];
    }
    return mapping.itemsText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  hasItems(mapping: RandomMapping): boolean {
    return this.getItems(mapping).length > 0;
  }

  randomize(mapping: RandomMapping) {
    const items = this.getItems(mapping);
    if (items.length > 0) {
      const index = Math.floor(Math.random() * items.length);
      this.lastResult = items[index];
      this.lastKey = mapping.key;
    }
  }
}