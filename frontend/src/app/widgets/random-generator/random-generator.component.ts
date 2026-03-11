import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RandomTableStorageService, TableRef, TableBlobData } from '../../services/random-table-storage.service';
import { RandomTablePickerDialogComponent } from '../../dialogs/random-table-picker-dialog/random-table-picker-dialog.component';
import { PromptDialogComponent } from '../../dialogs/prompt-dialog/prompt-dialog.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

interface RandomMapping {
  key: string;
  itemsText: string;
  category?: string;
}

@Component({
  selector: 'app-random-generator',
  templateUrl: './random-generator.component.html',
  styleUrls: ['./random-generator.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatExpansionModule, MatProgressSpinnerModule, MatDialogModule]
})
export class RandomGeneratorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() settings: any = {};
  @Output() settingsChange = new EventEmitter<void>();

  mappings: RandomMapping[] = [];
  lastResult: string = '';
  lastKey: string = '';
  filterText: string = '';

  tableRef: TableRef | null = null;
  tableLoaded = false;
  tableDirty = false;
  loading = false;

  get isSharedTable(): boolean {
    return this.tableRef?.scope === 'shared';
  }

  constructor(
    private tableStorage: RandomTableStorageService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    if (!this.settings) {
      this.settings = {};
    }

    if (this.settings.lastResult) this.lastResult = this.settings.lastResult;
    if (this.settings.lastKey) this.lastKey = this.settings.lastKey;

    if (this.settings.tableRef) {
      this.tableRef = this.settings.tableRef;
      await this.loadTableFromBlob(this.tableRef!.tableId, this.tableRef!.scope);
    } else if (this.settings.mappings?.length > 0) {
      await this.migrateFromSettings();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings'] && this.tableLoaded) {
      this.mappings = this.settings?.mappings || [];
      this.applyCategoriesFromSettings();
      if (!this.isSharedTable) {
        this.tableDirty = true;
      }
    }
  }

  ngOnDestroy() {
    if (this.tableRef && this.tableLoaded && !this.isSharedTable) {
      this.settings._unsavedMappings = this.mappings;
      this.settings._unsavedMappingCategories = this.settings.mappingCategories;
      this.settings._unsavedUseWeightedSelection = this.settings.useWeightedSelection;
      this.settings._tableDirty = this.tableDirty;
    }
  }

  private async loadTableFromBlob(tableId: string, scope?: 'user' | 'shared') {
    // Restore from in-memory cache (tab switch case)
    if (this.settings?._unsavedMappings) {
      this.settings.mappings = this.settings._unsavedMappings;
      this.settings.mappingCategories = this.settings._unsavedMappingCategories || [];
      this.settings.useWeightedSelection = this.settings._unsavedUseWeightedSelection ?? true;
      this.tableDirty = this.settings._tableDirty ?? false;
      delete this.settings._unsavedMappings;
      delete this.settings._unsavedMappingCategories;
      delete this.settings._unsavedUseWeightedSelection;
      delete this.settings._tableDirty;

      this.mappings = this.settings.mappings;
      this.applyCategoriesFromSettings();
      this.tableLoaded = true;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    try {
      const data = await this.tableStorage.loadTable(tableId, scope);
      if (data) {
        this.settings.mappings = data.mappings || [];
        this.settings.mappingCategories = data.mappingCategories || [];
        this.settings.useWeightedSelection = data.useWeightedSelection ?? true;
        this.mappings = this.settings.mappings;
        this.applyCategoriesFromSettings();
        this.tableLoaded = true;
      } else {
        this.tableRef = null;
        delete this.settings.tableRef;
        this.settingsChange.emit();
      }
    } catch (error) {
      console.error('Error loading table collection:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async migrateFromSettings() {
    this.loading = true;
    this.cdr.markForCheck();

    try {
      const name = 'Migrated Table';
      const ref = await this.tableStorage.createTable(name);

      const data: TableBlobData = {
        name,
        mappings: this.settings.mappings || [],
        mappingCategories: this.settings.mappingCategories || [],
        useWeightedSelection: this.settings.useWeightedSelection ?? true,
      };
      await this.tableStorage.saveTable(ref.tableId, data);

      this.tableRef = ref;
      this.settings.tableRef = ref;
      this.mappings = this.settings.mappings;
      this.applyCategoriesFromSettings();
      this.tableLoaded = true;
      this.settingsChange.emit();
    } catch (error) {
      console.error('Error migrating table data:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  createNewTable() {
    const dialogRef = this.dialog.open(PromptDialogComponent, {
      width: '400px',
      data: {
        title: 'New Table Collection',
        message: 'Enter a name for the table collection:',
        placeholder: 'Table name',
        confirmText: 'Create',
      },
    });
    dialogRef.afterClosed().subscribe(async (name: string | undefined) => {
      if (!name?.trim()) return;

      this.loading = true;
      this.cdr.markForCheck();

      try {
        const ref = await this.tableStorage.createTable(name);
        this.tableRef = ref;
        this.settings.tableRef = ref;
        this.settings.mappings = [];
        this.settings.mappingCategories = [];
        this.settings.useWeightedSelection = true;
        this.mappings = this.settings.mappings;
        this.tableLoaded = true;
        this.settingsChange.emit();
      } catch (error) {
        console.error('Error creating table collection:', error);
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  switchTable() {
    if (this.tableDirty && !this.isSharedTable) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. What would you like to do?',
          confirmText: 'Save & Switch',
          secondaryText: 'Discard & Switch',
          cancelText: 'Cancel',
        },
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === true) {
          try {
            await this.saveTableToServer();
          } catch (error) {
            console.error('Error saving table before switch:', error);
            return;
          }
          this.openExistingTable();
        } else if (result === 'secondary') {
          this.tableDirty = false;
          this.openExistingTable();
        }
        // Cancel: do nothing
      });
    } else {
      this.openExistingTable();
    }
  }

  private clearResultAndFilter() {
    this.lastResult = '';
    this.lastKey = '';
    this.filterText = '';
    delete this.settings.lastResult;
    delete this.settings.lastKey;
    this.settingsChange.emit();
  }

  openExistingTable() {
    const dialogRef = this.dialog.open(RandomTablePickerDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
    });
    dialogRef.afterClosed().subscribe(async (result: TableRef) => {
      if (result) {
        this.clearResultAndFilter();
        this.tableRef = result;
        this.settings.tableRef = result;
        this.settingsChange.emit();
        await this.loadTableFromBlob(result.tableId, result.scope);
      }
    });
  }

  async saveTableToServer(): Promise<void> {
    if (this.tableRef && this.tableLoaded && !this.isSharedTable) {
      const blobData: TableBlobData = {
        name: this.tableRef.tableName,
        mappings: this.settings.mappings || [],
        mappingCategories: this.settings.mappingCategories || [],
        useWeightedSelection: this.settings.useWeightedSelection ?? true,
      };
      await this.tableStorage.saveTable(this.tableRef.tableId, blobData);
      this.tableDirty = false;
    }
  }

  // --- Existing logic (unchanged) ---

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

  get uniqueCategories(): string[] {
    return [...new Set(
      this.mappings
        .filter(mapping => mapping.category && mapping.category.trim() !== '')
        .map(mapping => mapping.category as string)
    )].sort();
  }

  getMappingsByCategory(category: string): RandomMapping[] {
    return this.mappings.filter(mapping => mapping.category === category);
  }

  getUncategorizedMappings(): RandomMapping[] {
    return this.mappings.filter(mapping => !mapping.category || mapping.category.trim() === '');
  }

  private matchesFilter(mapping: RandomMapping): boolean {
    if (!this.filterText) return true;
    const filter = this.filterText.toLowerCase();
    return mapping.key.toLowerCase().includes(filter)
      || (!!mapping.category && mapping.category.toLowerCase().includes(filter));
  }

  private categoryMatchesFilter(category: string): boolean {
    if (!this.filterText) return true;
    return category.toLowerCase().includes(this.filterText.toLowerCase());
  }

  get filteredCategories(): string[] {
    return this.uniqueCategories.filter(cat =>
      this.categoryMatchesFilter(cat) || this.getFilteredMappingsByCategory(cat).length > 0
    );
  }

  getFilteredMappingsByCategory(category: string): RandomMapping[] {
    if (this.categoryMatchesFilter(category)) {
      return this.getMappingsByCategory(category);
    }
    return this.getMappingsByCategory(category).filter(m => this.matchesFilter(m));
  }

  getFilteredUncategorizedMappings(): RandomMapping[] {
    return this.getUncategorizedMappings().filter(m => this.matchesFilter(m));
  }

  get filteredMappingsCount(): number {
    return this.mappings.filter(m => this.matchesFilter(m)).length;
  }

  private parseItem(item: string): { text: string, weight: number } {
    const rangeRegex = /^(\d+)\s*-\s*(\d+)\s+(.+)$/;
    const match = item.match(rangeRegex);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      const text = match[3];
      const weight = Math.max(1, end - start + 1);
      return { text, weight };
    }
    return { text: item, weight: 1 };
  }

  getItems(mapping: RandomMapping): string[] {
    if (!mapping.itemsText) return [];
    return mapping.itemsText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
  }

  hasItems(mapping: RandomMapping): boolean {
    return this.getItems(mapping).length > 0;
  }

  randomize(mapping: RandomMapping) {
    const items = this.getItems(mapping);
    if (items.length > 0) {
      const useWeightedSelection = this.settings?.useWeightedSelection !== false;

      if (useWeightedSelection) {
        const weightedPool: string[] = [];
        items.forEach(item => {
          const { text, weight } = this.parseItem(item);
          for (let i = 0; i < weight; i++) {
            weightedPool.push(text);
          }
        });
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        this.lastResult = weightedPool[randomIndex];
      } else {
        const index = Math.floor(Math.random() * items.length);
        this.lastResult = items[index];
      }

      this.lastKey = mapping.key;
      this.settings.lastResult = this.lastResult;
      this.settings.lastKey = this.lastKey;
      this.settingsChange.emit();
    }
  }
}
