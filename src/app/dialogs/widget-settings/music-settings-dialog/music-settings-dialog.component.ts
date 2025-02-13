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
          <div class="mapping-content">
            <mat-form-field appearance="fill" class="key-field">
              <mat-label>Key</mat-label>
              <input matInput [(ngModel)]="mapping.key" placeholder="Enter key">
            </mat-form-field>
            
            <div class="file-section">
              <div class="file-info" [title]="mapping.fileName || ''">
                <span *ngIf="mapping.fileName" class="file-name">
                  {{ mapping.fileName }}
                </span>
                <span *ngIf="!mapping.fileName" class="no-file">
                  No file selected
                </span>
              </div>
              <div class="file-actions">
                <input 
                  type="file" 
                  accept="audio/*" 
                  #fileInput 
                  (change)="onFileSelected($event, i)" 
                  style="display: none"
                >
                <button 
                  mat-stroked-button 
                  (click)="fileInput.click()" 
                  class="file-button">
                  {{ mapping.fileName ? 'Change' : 'Select File' }}
                </button>
                <button 
                  mat-icon-button 
                  color="warn" 
                  (click)="removeMapping(i)"
                  class="remove-button">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button mat-stroked-button color="primary" (click)="addMapping()" class="add-mapping-btn">
        Add Mapping
      </button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-height: 200px;
      max-height: 80vh;
    }

    .playback-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
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
      background-color: #f8f8f8;
      border-radius: 4px;
      padding: 12px;
    }

    .mapping-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .key-field {
      width: 100%;
      margin-bottom: -1.25em;
    }

    .file-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-info {
      background-color: #fff;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      min-height: 24px;
      display: flex;
      align-items: center;
    }

    .file-name {
      font-size: 0.9em;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .no-file {
      color: #888;
      font-style: italic;
      font-size: 0.9em;
    }

    .file-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .file-button {
      flex: 0 0 auto;
    }

    .remove-button {
      flex: 0 0 auto;
    }

    .add-mapping-btn {
      margin-top: 8px;
      width: 100%;
    }

    :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
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