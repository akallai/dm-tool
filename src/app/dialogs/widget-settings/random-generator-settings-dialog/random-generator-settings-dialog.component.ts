import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

interface RandomMapping {
  key: string;
  itemsText: string; // One item per line.
}

export interface RandomGeneratorSettings {
  mappings: RandomMapping[];
}

@Component({
  selector: 'app-random-generator-settings-dialog',
  template: `
    <h2 mat-dialog-title>Random Generator Settings</h2>
    <mat-dialog-content>
      <div class="mapping-list">
        <div *ngFor="let mapping of mappings; let i = index" class="mapping-item">
          <div class="mapping-header">
            <mat-form-field appearance="fill" class="mapping-key-field">
              <mat-label>Key</mat-label>
              <input matInput [(ngModel)]="mapping.key" placeholder="Enter key">
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeMapping(i)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <div class="mapping-body">
            <mat-form-field appearance="fill" class="mapping-items-field">
              <mat-label>Items (one per line)</mat-label>
              <textarea
                matInput
                [(ngModel)]="mapping.itemsText"
                placeholder="Enter items here, one per line"
                rows="5">
              </textarea>
            </mat-form-field>
            <div class="import-section">
              <input type="file" accept=".txt" #fileInput (change)="onFileSelected($event, i)" style="display: none">
              <button mat-stroked-button color="primary" (click)="fileInput.click()">Import</button>
            </div>
          </div>
        </div>
      </div>
      <button mat-stroked-button color="primary" (click)="addMapping()">Add Mapping</button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .mapping-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }
    .mapping-item {
      border: 1px solid #ccc;
      padding: 8px;
      border-radius: 4px;
    }
    .mapping-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .mapping-key-field {
      flex: 1;
      max-width: 120px;
      margin-right: 8px;
    }
    .mapping-body {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .mapping-items-field {
      flex: 1;
    }
    .import-section {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .import-section button {
      font-size: 0.8em;
      padding: 4px 8px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ]
})
export class RandomGeneratorSettingsDialogComponent {
  mappings: RandomMapping[] = [];

  constructor(
    public dialogRef: MatDialogRef<RandomGeneratorSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { settings: RandomGeneratorSettings }
  ) {
    // Initialize with existing mappings or a default one.
    this.mappings = data.settings.mappings ? [...data.settings.mappings] : [{ key: '', itemsText: '' }];
  }

  addMapping() {
    this.mappings.push({ key: '', itemsText: '' });
  }

  removeMapping(index: number) {
    this.mappings.splice(index, 1);
  }

  async onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const file = input.files[0];
        const text = await file.text();
        // Replace existing text with the file's content.
        this.mappings[index].itemsText = text;
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  }

  save() {
    this.dialogRef.close({ mappings: this.mappings });
  }
}
