import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ViewChildren, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WidgetSelectorDialogComponent, WidgetType } from '../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WidgetContainerComponent } from '../workspace/widget-container/widget-container.component';
import { WorkspaceHeaderComponent } from './workspace-header/workspace-header.component';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspacePersistenceService, WorkspaceState } from '../services/workspace-persistence.service';
import { MediaService } from '../services/media.service';
import { WikiStorageService, WikiBlobData } from '../services/wiki-storage.service';
import { RandomTableStorageService, TableBlobData } from '../services/random-table-storage.service';
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
  zIndex?: number;
}

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    WidgetContainerComponent,
    WorkspaceHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceComponent implements OnInit {
  @Input() initialState: WorkspaceState | null = null;
  @ViewChildren(WidgetContainerComponent) widgetContainers!: QueryList<WidgetContainerComponent>;

  tabs: Tab[] = [];
  activeTabId: string = '';
  saveError: string | null = null;
  isDirty = false;
  isSaving = false;
  private nextZIndex = 10;

  // Helper getter to access the widgets of the active tab
  get widgets(): WidgetInstance[] {
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    return activeTab?.widgets || [];
  }

  constructor(
    private dialog: MatDialog,
    private persistence: WorkspacePersistenceService,
    private workspaceService: WorkspaceService,
    private media: MediaService,
    private wikiStorage: WikiStorageService,
    private tableStorage: RandomTableStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.initialState) {
      this.tabs = this.initialState.tabs;
      this.activeTabId = this.initialState.activeTabId;
    } else {
      const defaultTab: Tab = {
        id: Date.now().toString(),
        name: 'Main Tab',
        widgets: []
      };
      this.tabs = [defaultTab];
      this.activeTabId = defaultTab.id;
    }
    this.workspaceService.updateWorkspace(this.tabs, this.activeTabId);

    // Initialize nextZIndex from existing widget z-indices
    const allZIndices = this.tabs.flatMap(t => t.widgets.map(w => w.zIndex ?? 2));
    if (allZIndices.length > 0) {
      this.nextZIndex = Math.max(10, ...allZIndices) + 1;
    }

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
    const dialogRef = this.dialog.open(WidgetSelectorDialogComponent, { width: '960px', maxWidth: '95vw', maxHeight: '95vh' });
    dialogRef.afterClosed().subscribe((type: WidgetType) => {
      if (type) {
        this.addWidget(type);
        this.cdr.markForCheck();
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
      size: this.getDefaultSize(type),
      settings: {},
      zIndex: this.nextZIndex++
    };
    activeTab.widgets.push(newWidget);
    this.saveTabs();
  }

  bringWidgetToFront(widget: WidgetInstance) {
    // Skip if already the topmost widget
    if (widget.zIndex === this.nextZIndex - 1) return;

    widget.zIndex = this.nextZIndex++;
    this.saveTabs();
    this.cdr.markForCheck();
  }

  private getDefaultSize(type: WidgetType): { width: number; height: number } {
    switch (type) {
      case 'WIKI_WIDGET':
        return { width: 600, height: 500 };
      case 'LLM_CHAT':
        return { width: 400, height: 500 };
      case 'HEX_MAP':
        return { width: 600, height: 500 };
      case 'COMBAT_TRACKER':
        return { width: 350, height: 400 };
      case 'IMAGE_PDF':
        return { width: 400, height: 350 };
      case 'RANDOM_GENERATOR':
        return { width: 350, height: 300 };
      case 'MUSIC_WIDGET':
        return { width: 350, height: 250 };
      case 'NAME_GENERATOR':
        return { width: 300, height: 350 };
      case 'COUNTDOWN_WIDGET':
        return { width: 250, height: 200 };
      default:
        return { width: 300, height: 200 };
    }
  }

  removeWidget(id: string) {
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    if (!activeTab) return;

    const widget = activeTab.widgets.find(w => w.id === id);
    activeTab.widgets = activeTab.widgets.filter(w => w.id !== id);
    this.saveTabs();
    this.cdr.markForCheck();

    if (widget) {
      this.cleanupWidgetBlobs(widget);
    }
  }

  private async cleanupWidgetBlobs(widget: WidgetInstance) {
    try {
      const prefixes = [`files/${widget.id}/`, `audio/${widget.id}/`];
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

  confirmResetWorkspace() {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reset Workspace',
        message: 'Are you sure you want to reset the workspace? All widgets will be closed.',
        confirmText: 'Reset',
        warn: true,
      },
    });
    confirmRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.resetWorkspace();
      }
    });
  }

  resetWorkspace() {
    const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
    if (!activeTab) return;

    activeTab.widgets = [];
    this.saveTabs();
    this.cdr.markForCheck();
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
        if (widget.type === 'RANDOM_GENERATOR' && widget.settings?._unsavedMappings && widget.settings?.tableRef) {
          const blobData: TableBlobData = {
            name: widget.settings.tableRef.tableName,
            mappings: widget.settings._unsavedMappings,
            mappingCategories: widget.settings._unsavedMappingCategories || [],
            useWeightedSelection: widget.settings._unsavedUseWeightedSelection ?? true,
          };
          await this.tableStorage.saveTable(widget.settings.tableRef.tableId, blobData);
          delete widget.settings._unsavedMappings;
          delete widget.settings._unsavedMappingCategories;
          delete widget.settings._unsavedUseWeightedSelection;
          delete widget.settings._tableDirty;
        }
      }
    }

    this.persistence.saveWorkspace({
      tabs: this.tabs,
      activeTabId: this.activeTabId,
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

  removeTab(tabId: string) {
    if (this.tabs.length <= 1) return;
    this.tabs = this.tabs.filter(tab => tab.id !== tabId);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[0].id;
    }
    this.saveTabs();
    this.cdr.markForCheck();
  }

  renameTab(event: { id: string; name: string }) {
    const tab = this.tabs.find(t => t.id === event.id);
    if (tab) {
      tab.name = event.name;
      this.saveTabs();
    }
  }

  trackByWidgetId(index: number, widget: WidgetInstance): string {
    return widget.id;
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