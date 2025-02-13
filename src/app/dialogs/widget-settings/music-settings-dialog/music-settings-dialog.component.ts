import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface MusicMapping {
  key: string;
  fileName?: string;
  fileDataUrl?: string;
}

interface MusicSettings {
  mappings: MusicMapping[];
  allowMultiple: boolean;
  loopEnabled: boolean;
}

@Component({
  selector: 'app-music-settings-dialog',
  template: `
    <h2 mat-dialog-title>Music Widget Settings</h2>
    <mat-dialog-content>
      <div class="playback-options">
        <mat-checkbox [(ngModel)]="settings.loopEnabled">
          Loop audio files
        </mat-checkbox>
        <mat-checkbox [(ngModel)]="settings.allowMultiple">
          Allow multiple simultaneous playback
        </mat-checkbox>
      </div>

      <div class="mapping-list">
        <div *ngFor="let mapping of mappings; let i = index" class="mapping-item">
          <mat-form-field appearance="fill" class="mapping-field">
            <mat-label>Key</mat-label>
            <input matInput [(ngModel)]="mapping.key" placeholder="Enter key">
          </mat-form-field>
          <div class="file-section">
            <span *ngIf="mapping.fileName">Selected file: {{ mapping.fileName }}</span>
            <input type="file" accept="audio/*" #fileInput (change)="onFileSelected($event, i)" style="display: none">
            <button mat-button (click)="fileInput.click()">
              {{ mapping.fileName ? 'Change File' : 'Select File' }}
            </button>
          </div>
          <button mat-icon-button color="warn" (click)="removeMapping(i)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>
      <button mat-button (click)="addMapping()">Add Mapping</button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .playback-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .mapping-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }
    .mapping-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mapping-field {
      flex: 1;
    }
    .file-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule
  ]
})
export class MusicSettingsDialogComponent {
  mappings: MusicMapping[] = [];
  settings: MusicSettings;

  constructor(
    public dialogRef: MatDialogRef<MusicSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { settings: MusicSettings }
  ) {
    // Initialize settings with defaults if not provided
    this.settings = {
      mappings: data.settings.mappings || [],
      allowMultiple: data.settings.allowMultiple ?? false,
      loopEnabled: data.settings.loopEnabled ?? false
    };
    this.mappings = [...this.settings.mappings];
  }

  addMapping() {
    this.mappings.push({ key: '' });
  }

  removeMapping(index: number) {
    this.mappings.splice(index, 1);
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.mappings[index].fileDataUrl = reader.result as string;
        this.mappings[index].fileName = file.name;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    this.settings.mappings = this.mappings;
    this.dialogRef.close(this.settings);
  }
}