import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-random-generator',
  template: `
    <div>
      <button mat-raised-button (click)="randomize()">Randomize</button>
      <p *ngIf="selectedElement">Selected: {{ selectedElement }}</p>
      <div>
        <input [(ngModel)]="newElement" placeholder="New element">
        <button mat-button (click)="addElement()">Add</button>
        <ul>
          <li *ngFor="let item of elements">{{ item }}</li>
        </ul>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule]
})
export class RandomGeneratorComponent implements OnInit {
  @Input() settings: any;
  elements: string[] = [];
  newElement = '';
  selectedElement?: string;

  ngOnInit() {
    this.elements = this.settings?.elements || [];
  }

  addElement() {
    if (this.newElement.trim()) {
      this.elements.push(this.newElement.trim());
      this.settings.elements = this.elements;
      this.newElement = '';
    }
  }

  randomize() {
    if (this.elements.length > 0) {
      const index = Math.floor(Math.random() * this.elements.length);
      this.selectedElement = this.elements[index];
    }
  }
}