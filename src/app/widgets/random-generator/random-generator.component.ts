import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface RandomMapping {
  key: string;
  itemsText: string;
}

@Component({
  selector: 'app-random-generator',
  templateUrl: './random-generator.component.html',
  styleUrls: ['./random-generator.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class RandomGeneratorComponent implements OnInit, OnChanges {
  // Use a private settings object so that we can update it in place.
  private _settings: any = {};
  
  @Input() set settings(value: any) {
    if (value && typeof value === 'object') {
      // If _settings is empty, initialize it with the new value.
      if (!this._settings || Object.keys(this._settings).length === 0) {
        this._settings = value;
      } else {
        Object.assign(this._settings, value);
      }
    } else {
      this._settings = {};
    }
    // Ensure that _settings has a mappings array.
    if (!Array.isArray(this._settings.mappings)) {
      this._settings.mappings = [];
    }
    this.mappings = this._settings.mappings;

    // Trigger auto-save whenever settings are updated (e.g. when a new mapping is added)
    this.scheduleAutoSave();
  }
  get settings() {
    return this._settings;
  }
  
  // Emit updated settings so the parent can update its reference.
  @Output() settingsChange = new EventEmitter<any>();

  mappings: RandomMapping[] = [];
  lastResult: string = '';
  lastKey: string = '';

  // File handle for the JSON file (the file name isn’t displayed).
  fileHandle: FileSystemFileHandle | null = null;

  saveTimeout: any;

  ngOnInit() {
    this.mappings = this.settings?.mappings || [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.mappings = this.settings?.mappings || [];
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
      // Trigger an auto-save after changes.
      this.scheduleAutoSave();
    }
  }

  // Opens an existing JSON file and updates _settings in place.
  async openExistingFile() {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Random Generator Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        this.fileHandle = handle;
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        // Update _settings in place so that parent's reference isn’t replaced.
        Object.assign(this._settings, data);
        if (!Array.isArray(this._settings.mappings)) {
          this._settings.mappings = [];
        }
        this.mappings = this._settings.mappings;
        // Emit the updated settings so the parent can update its widgetData.settings.
        this.settingsChange.emit(this._settings);
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  }

  // Creates a new JSON file with default settings.
  async createNewFile() {
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'untitled_random_generator.json',
          types: [{
            description: 'Random Generator Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        this.fileHandle = handle;
        // Initialize default settings.
        this._settings = { mappings: [] };
        this.mappings = this._settings.mappings;
        // Emit new settings.
        this.settingsChange.emit(this._settings);
        this.scheduleAutoSave();
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  }

  // Auto-saves the current settings to the JSON file.
  async saveFile() {
    if (this.fileHandle) {
      try {
        const writable = await this.fileHandle.createWritable();
        await writable.write(JSON.stringify(this._settings, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  }

  // Debounce auto-saving by waiting 1 second after the last change.
  scheduleAutoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveFile();
    }, 1000);
  }
}
