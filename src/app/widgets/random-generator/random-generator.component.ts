import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

interface RandomMapping {
  key: string;
  itemsText: string;
  category?: string; // Added category property
}

@Component({
  selector: 'app-random-generator',
  templateUrl: './random-generator.component.html',
  styleUrls: ['./random-generator.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatExpansionModule]
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

  // File handle for the JSON file (the file name isn't displayed).
  fileHandle: FileSystemFileHandle | null = null;

  saveTimeout: any;

  ngOnInit() {
    this.mappings = this.settings?.mappings || [];
    
    // Initialize useWeightedSelection if not already set
    if (this.settings.useWeightedSelection === undefined) {
      this.settings.useWeightedSelection = true; // Enable by default
    }
    
    // Apply categories from mappingCategories if available
    this.applyCategoriesFromSettings();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.mappings = this.settings?.mappings || [];
      this.applyCategoriesFromSettings();
    }
  }
  
  // Apply categories from settings to mappings
  private applyCategoriesFromSettings() {
    if (this.settings?.mappingCategories && Array.isArray(this.settings.mappingCategories)) {
      const categoryMap = new Map();
      this.settings.mappingCategories.forEach((cat: any) => {
        if (cat.key && cat.value) {
          categoryMap.set(cat.key, cat.value);
        }
      });
      
      this.mappings.forEach(mapping => {
        if (categoryMap.has(mapping.key)) {
          mapping.category = categoryMap.get(mapping.key);
        }
      });
    }
  }

  // Get all unique categories
  get uniqueCategories(): string[] {
    return [...new Set(
      this.mappings
        .filter(mapping => mapping.category && mapping.category.trim() !== '')
        .map(mapping => mapping.category as string) // Add type assertion here
    )].sort();
  }

  // Get mappings for a specific category
  getMappingsByCategory(category: string): RandomMapping[] {
    return this.mappings.filter(mapping => mapping.category === category);
  }

  // Get mappings without a category
  getUncategorizedMappings(): RandomMapping[] {
    return this.mappings.filter(mapping => !mapping.category || mapping.category.trim() === '');
  }

  // Helper function to parse an item and extract range if present
  private parseItem(item: string): { text: string, weight: number } {
    // Regular expression to match range pattern - supports optional spaces around the minus sign
    const rangeRegex = /^(\d+)\s*-\s*(\d+)\s+(.+)$/;
    const match = item.match(rangeRegex);
    
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      const text = match[3];
      // Calculate weight as (end - start + 1), ensuring at least 1
      const weight = Math.max(1, end - start + 1);
      
      return { text, weight };
    }
    
    // No range found, return the original item with weight 1
    return { text: item, weight: 1 };
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
      // Check if weighted selection is enabled
      const useWeightedSelection = this.settings?.useWeightedSelection !== false;
      
      if (useWeightedSelection) {
        // Use weighted selection
        const weightedPool: string[] = [];
        
        items.forEach(item => {
          const { text, weight } = this.parseItem(item);
          // Add the item to the pool 'weight' times
          for (let i = 0; i < weight; i++) {
            weightedPool.push(text);
          }
        });
        
        // Select a random item from the weighted pool
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        this.lastResult = weightedPool[randomIndex];
      } else {
        // Use simple random selection (one item, one chance)
        // When weighted selection is off, use the original text with the range prefix
        const index = Math.floor(Math.random() * items.length);
        this.lastResult = items[index];
      }
      
      this.lastKey = mapping.key;
      
      // Trigger an auto-save after changes
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
        // Update _settings in place so that parent's reference isn't replaced.
        Object.assign(this._settings, data);
        if (!Array.isArray(this._settings.mappings)) {
          this._settings.mappings = [];
        }
        this.mappings = this._settings.mappings;
        // Apply categories if they exist
        this.applyCategoriesFromSettings();
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
        this._settings = { 
          mappings: [],
          mappingCategories: [],
          useWeightedSelection: true // Enable by default for new files
        };
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
        // Make sure we save the categories
        this.saveCategoriesInSettings();
        
        const writable = await this.fileHandle.createWritable();
        await writable.write(JSON.stringify(this._settings, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  }
  
  // Save the categories from mappings to the mappingCategories array in settings
  private saveCategoriesInSettings() {
    if (!this._settings.mappingCategories) {
      this._settings.mappingCategories = [];
    }
    
    // Update or add categories based on mapping.category
    this.mappings.forEach(mapping => {
      const existingCategoryIndex = this._settings.mappingCategories.findIndex(
        (c: any) => c.key === mapping.key
      );
      
      if (mapping.category) {
        // If category exists, add or update it
        if (existingCategoryIndex >= 0) {
          this._settings.mappingCategories[existingCategoryIndex].value = mapping.category;
        } else {
          this._settings.mappingCategories.push({
            key: mapping.key,
            value: mapping.category
          });
        }
      } else if (existingCategoryIndex >= 0) {
        // If mapping has no category but there's an entry in mappingCategories, remove it
        this._settings.mappingCategories.splice(existingCategoryIndex, 1);
      }
    });
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