import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-random-generator',
  template: `
    <div class="random-generator">
      <div class="content">
        <div class="result" *ngIf="selectedElement">
          {{ selectedElement }}
        </div>
        
        <button 
          mat-raised-button 
          color="primary" 
          (click)="randomize()"
          [disabled]="!hasElements"
          class="randomize-button"
        >
          Generate Random
        </button>
        
        <div class="empty-message" *ngIf="!hasElements">
          No items available. Add items in settings.
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
      padding: 16px;
    }

    .content {
      text-align: center;
      width: 100%;
    }

    .result {
      font-size: 1.5em;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
      word-break: break-word;
    }

    .randomize-button {
      min-width: 150px;
    }

    .empty-message {
      margin-top: 16px;
      color: #666;
      font-size: 0.9em;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class RandomGeneratorComponent {
  @Input() settings: any;
  elements: string[] = [];
  selectedElement?: string;

  get hasElements(): boolean {
    return this.elements.length > 0;
  }

  ngOnInit() {
    this.elements = this.settings?.elements || [];
  }

  ngOnChanges() {
    // Update elements when settings change
    if (this.settings?.elements) {
      this.elements = this.settings.elements;
    }
  }

  randomize() {
    if (this.elements.length > 0) {
      const index = Math.floor(Math.random() * this.elements.length);
      this.selectedElement = this.elements[index];
    }
  }
}