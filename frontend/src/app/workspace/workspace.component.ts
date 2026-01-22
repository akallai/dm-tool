import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WidgetSelectorDialogComponent, WidgetType } from '../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { BackgroundSelectorDialogComponent } from '../dialogs/background-selector-dialog/background-selector-dialog.component';
import { WidgetStorageService } from '../services/widget-storage.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { WidgetContainerComponent } from '../workspace/widget-container/widget-container.component';
import { WorkspaceService } from '../services/workspace.service';

export interface Tab {
  id: string;
  name: string;
  widgets: WidgetInstance[];
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: { x: number, y: number };
  size: { width: number, height: number };
  settings: any;
}

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    WidgetContainerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceComponent implements OnInit {
  tabs: Tab[] = [];
  activeTabId: string = '';
  backgrounds: string[] = [
    '/backgrounds/glass.png',
    '/backgrounds/glass_dragon.png',
    '/backgrounds/glass_zombie.png'
  ];
  currentBackgroundIndex: number = 0;
  editingTabId: string | null = null;
  tempTabName: string = '';

  // Helper getter to access the widgets of the active tab
  get widgets(): WidgetInstance[] {
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    return activeTab?.widgets || [];
  }

  get currentBackground(): string {
    return this.backgrounds[this.currentBackgroundIndex];
  }

  constructor(
    private dialog: MatDialog,
    private widgetStorage: WidgetStorageService,
    private workspaceService: WorkspaceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load tabs and active tab from storage
    const { tabs, activeTabId } = this.widgetStorage.loadTabs();
    this.tabs = tabs;
    this.activeTabId = activeTabId;
    
    // Update the workspace service
    this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);
  }

  openWidgetSelector() {
    const dialogRef = this.dialog.open(WidgetSelectorDialogComponent, { width: '680px' });
    dialogRef.afterClosed().subscribe((result: { action: string, type?: WidgetType }) => {
      if (result) {
        if (result.action === 'add' && result.type) {
          this.addWidget(result.type);
        } else if (result.action === 'reset') {
          this.resetWorkspace();
        }
        this.cdr.markForCheck(); // Trigger change detection
      }
    });
  }

  addWidget(type: WidgetType) {
    // Find the active tab
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    if (!activeTab) return;
    
    const newWidget: WidgetInstance = {
      id: Date.now().toString(),
      type,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      settings: {}
    };
    
    activeTab.widgets.push(newWidget);
    this.saveTabs();
  }

  removeWidget(id: string) {
    // Find the active tab
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    if (!activeTab) return;
    
    activeTab.widgets = activeTab.widgets.filter(w => w.id !== id);
    this.saveTabs();
    this.cdr.markForCheck(); // Trigger change detection
  }

  resetWorkspace() {
    // Find the active tab
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    if (!activeTab) return;
    
    activeTab.widgets = [];
    this.saveTabs();
    this.cdr.markForCheck(); // Trigger change detection
  }

  saveTabs() {
    this.widgetStorage.saveTabs(this.tabs, this.activeTabId);
    this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);
  }

  saveWidgets() {
    this.saveTabs();
  }

  // Tab management methods
  addTab() {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: `Tab ${this.tabs.length + 1}`,
      widgets: []
    };
    
    this.tabs.push(newTab);
    this.activeTabId = newTab.id;
    this.saveTabs();
    this.cdr.markForCheck();
  }

  switchTab(tabId: string) {
    this.activeTabId = tabId;
    this.saveTabs();
    this.cdr.markForCheck();
  }

  removeTab(tabId: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    
    // Don't allow removing the last tab
    if (this.tabs.length <= 1) {
      return;
    }
    
    this.tabs = this.tabs.filter(tab => tab.id !== tabId);
    
    // If we removed the active tab, switch to the first tab
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[0].id;
    }
    
    this.saveTabs();
    this.cdr.markForCheck();
  }

  startEditingTab(tabId: string, event: MouseEvent) {
    event.stopPropagation();
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      this.editingTabId = tabId;
      this.tempTabName = tab.name;
      this.cdr.markForCheck();
      
      // Focus the input field after it's rendered
      setTimeout(() => {
        const inputElement = document.getElementById(`tab-name-input-${tabId}`);
        if (inputElement) {
          inputElement.focus();
        }
      }, 0);
    }
  }

  finishEditingTab() {
    if (this.editingTabId) {
      const tab = this.tabs.find(t => t.id === this.editingTabId);
      if (tab && this.tempTabName.trim()) {
        tab.name = this.tempTabName.trim();
        this.saveTabs();
      }
    }

    this.editingTabId = null;
    this.cdr.markForCheck();
  }

  openBackgroundSelector() {
    const dialogRef = this.dialog.open(BackgroundSelectorDialogComponent, {
      data: this.currentBackgroundIndex,
      panelClass: 'background-selector-dialog'
    });
    dialogRef.afterClosed().subscribe((index: number) => {
      if (index !== undefined && index !== null) {
        this.currentBackgroundIndex = index;
        this.cdr.markForCheck();
      }
    });
  }

  nextBackground() {
    this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgrounds.length;
    this.cdr.markForCheck(); // Trigger change detection
  }

  previousBackground() {
    this.currentBackgroundIndex = (this.currentBackgroundIndex - 1 + this.backgrounds.length) % this.backgrounds.length;
    this.cdr.markForCheck(); // Trigger change detection
  }

  // Track widgets by ID for better performance with ngFor
  trackByWidgetId(index: number, widget: WidgetInstance): string {
    return widget.id;
  }
  
  // Track tabs by ID for better performance with ngFor
  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }

  // Keyboard shortcuts for background cycling
  @HostListener('window:keydown.alt.arrowleft', ['$event'])
  cyclePrevious(event: KeyboardEvent) {
    event.preventDefault();
    this.previousBackground();
  }

  @HostListener('window:keydown.alt.arrowright', ['$event'])
  cycleNext(event: KeyboardEvent) {
    event.preventDefault();
    this.nextBackground();
  }
}