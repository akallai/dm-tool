import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-random-generator-settings-dialog',
  template: `
    <h2 mat-dialog-title>Random Generator Settings</h2>
    <mat-dialog-content>
      <div class="settings-container">
        <div class="file-input">
          <input
            #fileInput
            type="file"
            accept=".txt"
            style="display: none"
            (change)="onFileSelected($event)"
          />
          <button mat-button (click)="fileInput.click()">Import Items from File</button>
          <p *ngIf="fileName" class="file-name">Selected file: {{ fileName }}</p>
        </div>
        
        <div class="manual-input">
          <h3>Manual Input</h3>
          <p>Enter items manually (one per line):</p>
          <textarea
            [(ngModel)]="itemList"
            rows="10"
            placeholder="Enter items here&#10;One item per line"
            class="items-textarea"
          ></textarea>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 300px;
    }
    .file-input {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .file-name {
      margin: 0;
      font-size: 0.9em;
      color: #666;
    }
    .items-textarea {
      width: 100%;
      min-height: 150px;
      padding: 8px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: vertical;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    FormsModule
  ]
})
export class RandomGeneratorSettingsDialogComponent {
  itemList: string = '';
  fileName: string = '';

  constructor(
    public dialogRef: MatDialogRef<RandomGeneratorSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { settings: { elements: string[] } }
  ) {
    // Initialize textarea with existing items
    this.itemList = data.settings.elements.join('\n');
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fileName = file.name;
      
      try {
        const text = await file.text();
        // Append file content to existing items
        if (this.itemList) {
          this.itemList += '\n' + text;
        } else {
          this.itemList = text;
        }
      } catch (error) {
        console.error('Error reading file:', error);
        // Handle error appropriately
      }
    }
  }

  save() {
    // Split the text into an array, filter out empty lines
    const elements = this.itemList
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    this.dialogRef.close({ elements });
  }
}