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
  MappingFieldConfig,
  ReadonlyTextFieldConfig,
  FileButtonFieldConfig
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

          <!-- Readonly text -->
          <div *ngIf="field.type === 'readonly-text'" class="readonly-field">
            <label *ngIf="field.label">{{ field.label }}</label>
            <div class="readonly-text">{{ settings[field.key] || '(No file selected)' }}</div>
          </div>

          <!-- File button -->
          <div *ngIf="field.type === 'file-button'" class="file-button-field">
            <button mat-button class="file-button" (click)="onFileButtonClick(field)">
              <mat-icon>folder_open</mat-icon>
              <span>{{ getFileButtonText(field) }}</span>
            </button>
            <input type="file"
                   [accept]="getFileButtonAccept(field)"
                   style="display: none;"
                   #fileInput>
          </div>

          <!-- Mapping field -->
          <div *ngIf="field.type === 'mapping'" class="mapping-field glass-panel">
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
                  <button mat-button class="file-input-button" (click)="triggerFileInput(field.key, i)">
                    <mat-icon>upload_file</mat-icon>
                    <span>Select Files</span>
                  </button>
                  <input type="file"
                         [accept]="getMappingFileAccept(field)"
                         [multiple]="getMappingFileMultiple(field) || mapping.useFolderMode"
                         [attr.webkitdirectory]="mapping.useFolderMode ? '' : null"
                         (change)="onMappingFileSelected($event, field.key, i)"
                         [attr.data-field-key]="field.key"
                         [attr.data-mapping-index]="i"
                         style="display: none;">
                  <div *ngIf="mapping.files && mapping.files.length > 0" class="file-names-display">
                    <mat-icon class="file-icon">music_note</mat-icon>
                    <span>{{ getFileNames(mapping) }}</span>
                  </div>
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
            <button mat-button (click)="addMapping(field.key)">
              <mat-icon>add</mat-icon> Add Item
            </button>
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
    h2[mat-dialog-title] {
      color: var(--text-primary);
      margin: 0 0 16px 0;
      font-size: 20px;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
      min-width: 300px;
      color: var(--text-primary);
    }
    .full-width {
      width: 100%;
    }
    .file-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      background: var(--input-bg);
      border: var(--glass-border);
      border-radius: 8px;
      color: var(--text-primary);
    }
    .file-field label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .readonly-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      background: var(--input-bg);
      border: var(--glass-border);
      border-radius: 8px;
      color: var(--text-primary);
    }
    .readonly-field label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .readonly-text {
      padding: 8px;
      color: var(--accent-color);
      font-family: monospace;
    }
    .file-button-field {
      padding: 8px;
    }
    .file-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      border: var(--glass-border);
      background: var(--input-bg);
      color: var(--text-primary);
    }
    .file-button:hover {
      background: var(--header-bg);
      border-color: var(--accent-color);
    }
    .mapping-field {
      border: var(--glass-border);
      padding: 16px;
      border-radius: 8px;
      background: var(--panel-bg);
      margin-top: 8px;
    }
    .mapping-field h3 {
      margin-top: 0;
      color: var(--accent-color);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .mapping-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 12px;
      padding: 12px;
      background: var(--panel-bg);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .mapping-item:last-child {
      margin-bottom: 0;
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
      gap: 8px;
    }
    .file-selection-toggle {
      display: flex;
      align-items: center;
      padding: 4px 0;
    }
    .folder-toggle {
      font-size: 12px;
    }
    .file-names-display {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      background: rgba(100, 255, 218, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(100, 255, 218, 0.2);
      font-size: 12px;
      color: var(--accent-color);
    }
    .file-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      opacity: 0.8;
    }
    .file-input-button {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--header-bg);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
      font-size: 12px;
      padding: 6px 12px;
      width: 100%;
      justify-content: center;
    }
    .file-input-button mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    .field-error {
      color: var(--danger-color);
      font-size: 12px;
      margin-top: 4px;
    }

    /* CRITICAL OPTIMIZATIONS FOR GLASS THEME */
    ::ng-deep .mat-mdc-form-field {
      /* Force transparency but inherit text colors from theme */
      --mdc-filled-text-field-container-color: var(--input-bg);
      --mdc-filled-text-field-focus-active-indicator-color: var(--accent-color);
      --mdc-filled-text-field-active-indicator-color: var(--accent-color);
      --mdc-filled-text-field-caret-color: var(--accent-color);
    }

    /* Ensure transparency on wrappers */
    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: var(--input-bg) !important;
    }

    /* Global overrides for bare inputs */
    input, textarea, select {
       caret-color: var(--accent-color) !important;
    }

    /* Placeholder opacity fix (often needed even in dark themes) */
    ::ng-deep input::placeholder,
    ::ng-deep textarea::placeholder {
       color: var(--text-muted) !important;
       opacity: 1 !important;
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

  private isReadonlyTextFieldConfig(field: SettingsField): field is ReadonlyTextFieldConfig {
    return field.type === 'readonly-text';
  }

  private isFileButtonFieldConfig(field: SettingsField): field is FileButtonFieldConfig {
    return field.type === 'file-button';
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

  triggerFileInput(fieldKey: string, index: number) {
    const selector = `input[data-field-key="${fieldKey}"][data-mapping-index="${index}"]`;
    const input = document.querySelector(selector) as HTMLInputElement;
    if (input) {
      input.click();
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

  getFileButtonText(field: SettingsField): string {
    return this.isFileButtonFieldConfig(field) ? field.buttonText || 'Select File' : 'Select File';
  }

  getFileButtonAccept(field: SettingsField): string {
    return this.isFileButtonFieldConfig(field) ? field.accept || '*' : '*';
  }

  onFileButtonClick(field: SettingsField) {
    // For notepad file buttons, we don't need an actual file input
    // Just signal the request based on the field key
    if (field.key === 'openFileButton') {
      this.settings._openFilePickerRequested = true;
      this.dialogRef.close(this.settings);
    } else if (field.key === 'createFileButton') {
      this.settings._createFilePickerRequested = true;
      this.dialogRef.close(this.settings);
    } else {
      // Find the file input element that's a sibling of the button
      const fieldIndex = this.config.fields.indexOf(field);
      const inputs = document.querySelectorAll('.file-button-field input[type="file"]');
      const input = inputs[fieldIndex] as HTMLInputElement;
      if (input) {
        input.onchange = async (e: Event) => {
          await this.onFileButtonSelected(e as Event, field);
        };
        input.click();
      }
    }
  }

  async onFileButtonSelected(event: Event, field: SettingsField) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        // Store the file selection request - the widget will handle the actual file picker
        this.settings._filePickerRequested = true;
        this.dialogRef.close(this.settings);
      } catch (error) {
        console.error('Error selecting file:', error);
      }
    }
  }
}
