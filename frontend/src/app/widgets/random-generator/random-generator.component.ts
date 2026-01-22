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
  // Keep the original settings reference from parent to update directly
  @Input() settings: any = {};

  // Emit updated settings so the parent can update its reference.
  @Output() settingsChange = new EventEmitter<void>();

  mappings: RandomMapping[] = [];
  lastResult: string = '';
  lastKey: string = '';

  // Flag to prevent emitting during initialization
  private initialized: boolean = false;

  // File handle for the JSON file (the file name isn't displayed).
  fileHandle: FileSystemFileHandle | null = null;

  saveTimeout: any;

  // Check if data has been loaded (either from file or localStorage)
  get hasLoadedData(): boolean {
    return this.mappings && this.mappings.length > 0;
  }

  ngOnInit() {
    // Ensure settings object exists
    if (!this.settings) {
      this.settings = {};
    }

    // Ensure mappings array exists
    if (!Array.isArray(this.settings.mappings)) {
      this.settings.mappings = [];
    }
    this.mappings = this.settings.mappings;

    // Initialize useWeightedSelection if not already set
    if (this.settings.useWeightedSelection === undefined) {
      this.settings.useWeightedSelection = true; // Enable by default
    }

    // Restore last result and key from settings
    if (this.settings.lastResult) {
      this.lastResult = this.settings.lastResult;
    }
    if (this.settings.lastKey) {
      this.lastKey = this.settings.lastKey;
    }

    // Apply categories from mappingCategories if available
    this.applyCategoriesFromSettings();

    // Mark as initialized to enable auto-save emissions
    this.initialized = true;
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

      // Save to settings for persistence
      this.settings.lastResult = this.lastResult;
      this.settings.lastKey = this.lastKey;

      // Trigger an auto-save after changes
      this.scheduleAutoSave();
    }
  }

  // Opens an existing JSON file and updates settings in place.
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

        // Update settings in place so parent's reference is updated
        Object.assign(this.settings, data);
        if (!Array.isArray(this.settings.mappings)) {
          this.settings.mappings = [];
        }
        this.mappings = this.settings.mappings;

        // Apply categories if they exist
        this.applyCategoriesFromSettings();

        // Emit to trigger save to localStorage
        this.settingsChange.emit();
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

        // Clear and initialize settings in place (keeping parent reference)
        Object.keys(this.settings).forEach(key => delete this.settings[key]);
        Object.assign(this.settings, {
          mappings: [],
          mappingCategories: [],
          useWeightedSelection: true
        });
        this.mappings = this.settings.mappings;

        // Emit to trigger save to localStorage
        this.settingsChange.emit();
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
        await writable.write(JSON.stringify(this.settings, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  }

  // Save the categories from mappings to the mappingCategories array in settings
  private saveCategoriesInSettings() {
    if (!this.settings.mappingCategories) {
      this.settings.mappingCategories = [];
    }

    // Update or add categories based on mapping.category
    this.mappings.forEach(mapping => {
      const existingCategoryIndex = this.settings.mappingCategories.findIndex(
        (c: any) => c.key === mapping.key
      );

      if (mapping.category) {
        // If category exists, add or update it
        if (existingCategoryIndex >= 0) {
          this.settings.mappingCategories[existingCategoryIndex].value = mapping.category;
        } else {
          this.settings.mappingCategories.push({
            key: mapping.key,
            value: mapping.category
          });
        }
      } else if (existingCategoryIndex >= 0) {
        // If mapping has no category but there's an entry in mappingCategories, remove it
        this.settings.mappingCategories.splice(existingCategoryIndex, 1);
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
      // Emit settings change to persist to localStorage (only after init)
      if (this.initialized) {
        this.settingsChange.emit();
      }
    }, 1000);
  }
}