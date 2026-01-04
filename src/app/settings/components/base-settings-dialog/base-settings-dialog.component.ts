import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { 
  SettingsConfig, 
  SettingsField,
  TextFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  FileFieldConfig,
  MappingFieldConfig
} from '../../types/settings.types';
import { MusicFile } from '../../../widgets/music-widget/music-widget.component';

@Component({
  selector: 'app-base-settings-dialog',
  template: `
    <h2 mat-dialog-title>{{ config.title }}</h2>
    <mat-dialog-content>
      <div class="settings-form">
        <ng-container *ngFor="let field of config.fields">
          <!-- Text input -->
          <mat-form-field *ngIf="field.type === 'text'" class="full-width" appearance="outline">
            <mat-label>{{ field.label }}</mat-label>
            <input matInput 
                   [(ngModel)]="settings[field.key]"
                   [placeholder]="getTextFieldPlaceholder(field)"
                   [required]="field.required || false"
                   (ngModelChange)="validateField(field)">
            <mat-error *ngIf="fieldErrors[field.key]">
              {{ fieldErrors[field.key] }}
            </mat-error>
          </mat-form-field>

          <!-- Number input -->
          <mat-form-field *ngIf="field.type === 'number'" class="full-width" appearance="outline">
            <mat-label>{{ field.label }}</mat-label>
            <input matInput 
                   type="number" 
                   [(ngModel)]="settings[field.key]"
                   [min]="getNumberFieldMin(field)"
                   [max]="getNumberFieldMax(field)"
                   [required]="field.required || false"
                   (ngModelChange)="validateField(field)">
            <mat-error *ngIf="fieldErrors[field.key]">
              {{ fieldErrors[field.key] }}
            </mat-error>
          </mat-form-field>

          <!-- Checkbox -->
          <mat-checkbox *ngIf="field.type === 'checkbox'"
                      [(ngModel)]="settings[field.key]"
                      [required]="field.required || false"
                      class="full-width"
                      (ngModelChange)="validateField(field)">
            {{ field.label }}
          </mat-checkbox>

          <!-- Select dropdown -->
          <mat-form-field *ngIf="field.type === 'select'" class="full-width" appearance="outline">
            <mat-label>{{ field.label }}</mat-label>
            <mat-select [(ngModel)]="settings[field.key]"
                       [required]="field.required || false"
                       (ngModelChange)="validateField(field)">
              <mat-option *ngFor="let option of getSelectOptions(field)" [value]="option.value">
                {{ option.label }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="fieldErrors[field.key]">
              {{ fieldErrors[field.key] }}
            </mat-error>
          </mat-form-field>

          <!-- Textarea -->
          <mat-form-field *ngIf="field.type === 'textarea'" class="full-width" appearance="outline">
            <mat-label>{{ field.label }}</mat-label>
            <textarea matInput
                    [(ngModel)]="settings[field.key]"
                    [placeholder]="getTextFieldPlaceholder(field)"
                    [required]="field.required || false"
                    [rows]="5"
                    (ngModelChange)="validateField(field)">
            </textarea>
            <mat-error *ngIf="fieldErrors[field.key]">
              {{ fieldErrors[field.key] }}
            </mat-error>
          </mat-form-field>

          <!-- File input -->
          <div *ngIf="field.type === 'file'" class="file-field">
            <label>{{ field.label }}</label>
            <input type="file" 
                   [accept]="getFileAccept(field)"
                   [multiple]="getFileMultiple(field)"
                   (change)="onFileSelected($event, field.key)"
                   [required]="field.required || false">
            <mat-error *ngIf="fieldErrors[field.key]" class="field-error">
              {{ fieldErrors[field.key] }}
            </mat-error>
          </div>

          <!-- Mapping field -->
          <div *ngIf="field.type === 'mapping'" class="mapping-field">
            <h3>{{ field.label }}</h3>
            <div *ngFor="let mapping of getMappingArray(field.key); let i = index" class="mapping-item">
              <mat-form-field class="mapping-key" appearance="outline">
                <mat-label>{{ getMappingKeyLabel(field) }}</mat-label>
                <input matInput [(ngModel)]="mapping.key" (ngModelChange)="validateField(field)">
              </mat-form-field>

              <ng-container [ngSwitch]="getMappingValueType(field)">
                <mat-form-field *ngSwitchCase="'text'" class="mapping-value" appearance="outline">
                  <mat-label>{{ getMappingValueLabel(field) }}</mat-label>
                  <input matInput [(ngModel)]="mapping.value" (ngModelChange)="validateField(field)">
                </mat-form-field>

                <div *ngSwitchCase="'file'" class="mapping-file">
                  <div class="file-selection-toggle">
                    <mat-checkbox [(ngModel)]="mapping.useFolderMode"
                                  (ngModelChange)="toggleFolderMode(field, i)"
                                  class="folder-toggle">
                      Select folder
                    </mat-checkbox>
                  </div>
                  <input type="file"
                         [accept]="getMappingFileAccept(field)"
                         [multiple]="getMappingFileMultiple(field) || mapping.useFolderMode"
                         [attr.webkitdirectory]="mapping.useFolderMode ? '' : null"
                         (change)="onMappingFileSelected($event, field.key, i)">
                </div>

                <mat-checkbox *ngSwitchCase="'checkbox'"
                              [(ngModel)]="mapping.value"
                              class="mapping-value"
                              (ngModelChange)="validateField(field)">
                  {{ getMappingValueLabel(field) }}
                </mat-checkbox>

                <mat-form-field *ngSwitchCase="'textarea'" class="mapping-value" appearance="outline">
                  <mat-label>{{ getMappingValueLabel(field) }}</mat-label>
                  <textarea matInput 
                           [(ngModel)]="mapping.itemsText" 
                           rows="3"
                           (ngModelChange)="validateField(field)">
                  </textarea>
                </mat-form-field>
              </ng-container>

              <button mat-icon-button color="warn" (click)="removeMapping(field.key, i)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <button mat-button (click)="addMapping(field.key)">Add Item</button>
          </div>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button 
              color="primary" 
              (click)="save()"
              [disabled]="!isValid()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
      min-width: 300px;
    }
    .full-width {
      width: 100%;
    }
    .file-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mapping-field {
      border: 1px solid #ddd;
      padding: 16px;
      border-radius: 4px;
    }
    .mapping-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .mapping-key {
      width: 30%;
    }
    .mapping-value {
      flex: 1;
    }
    .mapping-file {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .file-selection-toggle {
      display: flex;
      align-items: center;
      padding: 4px 0;
    }
    .folder-toggle {
      font-size: 12px;
    }
    .field-error {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ]
})
export class BaseSettingsDialogComponent {
  config: SettingsConfig;
  settings: any;
  fieldErrors: { [key: string]: string } = {};

  constructor(
    public dialogRef: MatDialogRef<BaseSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { config: SettingsConfig; settings: any }
  ) {
    this.config = data.config;
    this.settings = { ...data.settings };
    this.initializeDefaultValues();
    this.validateAllFields();
  }

  // Type guard methods
  private isTextFieldConfig(field: SettingsField): field is TextFieldConfig {
    return field.type === 'text';
  }

  private isNumberFieldConfig(field: SettingsField): field is NumberFieldConfig {
    return field.type === 'number';
  }

  private isSelectFieldConfig(field: SettingsField): field is SelectFieldConfig {
    return field.type === 'select';
  }

  private isFileFieldConfig(field: SettingsField): field is FileFieldConfig {
    return field.type === 'file';
  }

  private isMappingFieldConfig(field: SettingsField): field is MappingFieldConfig {
    return field.type === 'mapping';
  }

  // Helper methods for templates
  getTextFieldPlaceholder(field: SettingsField): string {
    return this.isTextFieldConfig(field) ? field.placeholder || '' : '';
  }

  getNumberFieldMin(field: SettingsField): number | null {
    return this.isNumberFieldConfig(field) ? field.min ?? null : null;
  }

  getNumberFieldMax(field: SettingsField): number | null {
    return this.isNumberFieldConfig(field) ? field.max ?? null : null;
  }

  getSelectOptions(field: SettingsField) {
    return this.isSelectFieldConfig(field) ? field.options : [];
  }

  getFileAccept(field: SettingsField): string {
    return this.isFileFieldConfig(field) ? field.accept || '*' : '*';
  }

  getFileMultiple(field: SettingsField): boolean {
    return this.isFileFieldConfig(field) ? field.multiple || false : false;
  }

  getMappingKeyLabel(field: SettingsField): string {
    return this.isMappingFieldConfig(field) ? field.mappingConfig.keyLabel : '';
  }

  getMappingValueType(field: SettingsField): string {
    return this.isMappingFieldConfig(field) ? field.mappingConfig.valueType : 'text';
  }

  getMappingValueLabel(field: SettingsField): string {
    return this.isMappingFieldConfig(field) ? field.mappingConfig.valueLabel : '';
  }

  getMappingFileAccept(field: SettingsField): string {
    return this.isMappingFieldConfig(field) ? field.mappingConfig.fileAccept || '*' : '*';
  }

  getMappingFileMultiple(field: SettingsField): boolean {
    return this.isMappingFieldConfig(field) ? field.mappingConfig.multiple || false : false;
  }

  getMappingDirectory(field: SettingsField): boolean {
    return this.isMappingFieldConfig(field) ? field.mappingConfig.directory || false : false;
  }

  getMappingArray(key: string): any[] {
    return this.settings[key] || [];
  }

  private initializeDefaultValues() {
    this.config.fields.forEach(field => {
      if (field.defaultValue !== undefined && this.settings[field.key] === undefined) {
        this.settings[field.key] = field.defaultValue;
      }
      if (field.type === 'mapping' && !Array.isArray(this.settings[field.key])) {
        this.settings[field.key] = [];
      }
    });
  }

  validateField(field: SettingsField): void {
    if (field.required && !this.settings[field.key]) {
      this.fieldErrors[field.key] = `${field.label} is required`;
    } else {
      delete this.fieldErrors[field.key];
    }
  }

  validateAllFields(): void {
    this.config.fields.forEach(field => {
      this.validateField(field);
    });
  }

  isValid(): boolean {
    this.validateAllFields();
    return Object.keys(this.fieldErrors).length === 0;
  }

  onFileSelected(event: Event, key: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.settings[key] = {
          fileName: file.name,
          fileDataUrl: reader.result
        };
        this.validateField(this.config.fields.find(f => f.key === key)!);
      };
      reader.readAsDataURL(file);
    }
  }

  onMappingFileSelected(event: Event, key: string, index: number) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const filesArray: any[] = [];
    let filesProcessed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        filesArray.push({ fileName: file.name, fileDataUrl: reader.result });
        filesProcessed++;
        if (filesProcessed === files.length) {
          this.settings[key][index] = {
            ...this.settings[key][index],
            files: filesArray
          };
          const field = this.config.fields.find(f => f.key === key);
          if (field) this.validateField(field);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  addMapping(key: string) {
    if (!Array.isArray(this.settings[key])) {
      this.settings[key] = [];
    }
    this.settings[key].push({ key: '', value: '', useFolderMode: false });
    const field = this.config.fields.find(f => f.key === key);
    if (field) this.validateField(field);
  }

  removeMapping(key: string, index: number) {
    this.settings[key].splice(index, 1);
    const field = this.config.fields.find(f => f.key === key);
    if (field) this.validateField(field);
  }

  toggleFolderMode(field: SettingsField, index: number) {
    // When toggling folder mode, clear existing files to force re-selection
    const mapping = this.settings[field.key][index];
    if (mapping && mapping.useFolderMode === false) {
      // Switching to folder mode - clear files
      mapping.files = [];
    }
  }

  save() {
    this.validateAllFields();
    if (this.isValid()) {
      this.dialogRef.close(this.settings);
    }
  }

  // Helper method to display file names without using an inline arrow function
  getFileNames(mapping: any): string {
    if (mapping.files && Array.isArray(mapping.files)) {
      return mapping.files.map((f: MusicFile) => f.fileName).join(', ');
    }
    return '';
  }
}