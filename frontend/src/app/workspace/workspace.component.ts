import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ViewChildren, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WidgetSelectorDialogComponent, WidgetType } from '../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { BackgroundSelectorDialogComponent } from '../dialogs/background-selector-dialog/background-selector-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { WidgetContainerComponent } from '../workspace/widget-container/widget-container.component';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspacePersistenceService, WorkspaceState } from '../services/workspace-persistence.service';
import { MediaService } from '../services/media.service';
import { WikiStorageService, WikiBlobData } from '../services/wiki-storage.service';
import { firstValueFrom } from 'rxjs';

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
  @Input() initialState: WorkspaceState | null = null;
  @ViewChildren(WidgetContainerComponent) widgetContainers!: QueryList<WidgetContainerComponent>;

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
  saveError: string | null = null;
  isDirty = false;
  isSaving = false;

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
    private persistence: WorkspacePersistenceService,
    private workspaceService: WorkspaceService,
    private media: MediaService,
    private wikiStorage: WikiStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.initialState) {
      this.tabs = this.initialState.tabs;
      this.activeTabId = this.initialState.activeTabId;
      this.currentBackgroundIndex = this.initialState.backgroundIndex ?? 0;
    } else {
      const defaultTab: Tab = {
        id: Date.now().toString(),
        name: 'Main Tab',
        widgets: []
      };
      this.tabs = [defaultTab];
      this.activeTabId = defaultTab.id;
      this.currentBackgroundIndex = 0;
    }
    this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);

    this.persistence.saveError$.subscribe(error => {
      this.saveError = error;
      if (error === null) {
        // Save succeeded
        this.isDirty = false;
        this.isSaving = false;
      } else if (!error.includes('Retrying')) {
        // Permanent failure
        this.isSaving = false;
      }
      this.cdr.markForCheck();
    });
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
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    if (!activeTab) return;

    const widget = activeTab.widgets.find(w => w.id === id);
    activeTab.widgets = activeTab.widgets.filter(w => w.id !== id);
    this.saveTabs();
    this.cdr.markForCheck();

    if (widget) {
      this.cleanupWidgetBlobs(widget.id);
    }
  }

  private async cleanupWidgetBlobs(widgetId: string) {
    try {
      const prefixes = [`files/${widgetId}/`, `audio/${widgetId}/`];
      for (const prefix of prefixes) {
        const files = await firstValueFrom(this.media.listFiles(prefix));
        for (const file of files) {
          await firstValueFrom(this.media.deleteFile(file.name));
        }
      }
    } catch {
      // Best-effort cleanup
    }
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
    this.isDirty = true;
    this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);
    this.cdr.markForCheck();
  }

  async saveToServer() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.cdr.markForCheck();

    // Save currently rendered wiki widgets
    for (const container of this.widgetContainers) {
      await container.saveWidget();
    }

    // Save wiki data stashed in settings from widgets on other tabs
    for (const tab of this.tabs) {
      for (const widget of tab.widgets) {
        if (widget.type === 'WIKI_WIDGET' && widget.settings?._unsavedArticles && widget.settings?.wikiRef) {
          const blobData: WikiBlobData = {
            name: widget.settings.wikiRef.wikiName,
            articles: widget.settings._unsavedArticles,
          };
          await this.wikiStorage.saveWiki(widget.settings.wikiRef.wikiId, blobData);
          delete widget.settings._unsavedArticles;
          delete widget.settings._wikiDirty;
        }
      }
    }

    this.persistence.saveWorkspace({
      tabs: this.tabs,
      activeTabId: this.activeTabId,
      backgroundIndex: this.currentBackgroundIndex
    });
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
        this.saveTabs();
        this.cdr.markForCheck();
      }
    });
  }

  nextBackground() {
    this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgrounds.length;
    this.saveTabs();
    this.cdr.markForCheck();
  }

  previousBackground() {
    this.currentBackgroundIndex = (this.currentBackgroundIndex - 1 + this.backgrounds.length) % this.backgrounds.length;
    this.saveTabs();
    this.cdr.markForCheck();
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

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveToServer();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.isDirty) {
      event.preventDefault();
    }
  }
}