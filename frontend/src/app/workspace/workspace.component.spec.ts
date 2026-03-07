import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';
import { WorkspaceComponent } from './workspace.component';
import { WorkspacePersistenceService, WorkspaceState } from '../services/workspace-persistence.service';
import { WorkspaceService } from '../services/workspace.service';
import { MediaService } from '../services/media.service';
import { WikiStorageService } from '../services/wiki-storage.service';
import { RandomTableStorageService } from '../services/random-table-storage.service';

describe('WorkspaceComponent', () => {
  let component: WorkspaceComponent;
  let persistenceSpy: jest.Mocked<WorkspacePersistenceService> & { saveError$: BehaviorSubject<string | null> };
  let workspaceServiceSpy: jest.Mocked<WorkspaceService>;
  let mediaSpy: jest.Mocked<MediaService>;
  let wikiStorageSpy: jest.Mocked<WikiStorageService>;
  let tableStorageSpy: jest.Mocked<RandomTableStorageService>;
  let cdrSpy: jest.Mocked<ChangeDetectorRef>;

  beforeEach(() => {
    const saveError$ = new BehaviorSubject<string | null>(null);
    persistenceSpy = {
      loadWorkspaceAsync: jest.fn(),
      saveWorkspace: jest.fn(),
      saveError$,
    } as any;
    workspaceServiceSpy = {
      updateWorkspace: jest.fn(),
    } as any;
    mediaSpy = {
      listFiles: jest.fn(),
      deleteFile: jest.fn(),
    } as any;
    wikiStorageSpy = {
      saveWiki: jest.fn(),
    } as any;
    tableStorageSpy = {
      saveTable: jest.fn(),
    } as any;
    cdrSpy = {
      markForCheck: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        WorkspaceComponent,
        { provide: WorkspacePersistenceService, useValue: persistenceSpy },
        { provide: WorkspaceService, useValue: workspaceServiceSpy },
        { provide: MediaService, useValue: mediaSpy },
        { provide: WikiStorageService, useValue: wikiStorageSpy },
        { provide: RandomTableStorageService, useValue: tableStorageSpy },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: ChangeDetectorRef, useValue: cdrSpy },
      ],
    });
    component = TestBed.inject(WorkspaceComponent);
  });

  describe('ngOnInit', () => {
    it('should load initial state when provided', () => {
      const state: WorkspaceState = {
        tabs: [{ id: 't1', name: 'Tab 1', widgets: [] }],
        activeTabId: 't1',
        backgroundIndex: 2,
      };
      component.initialState = state;
      component.ngOnInit();

      expect(component.tabs).toEqual(state.tabs);
      expect(component.activeTabId).toBe('t1');
      expect(component.currentBackgroundIndex).toBe(2);
      expect(workspaceServiceSpy.updateWorkspace).toHaveBeenCalledWith(state.tabs, 't1');
    });

    it('should create default tab when no initial state', () => {
      component.initialState = null;
      component.ngOnInit();

      expect(component.tabs.length).toBe(1);
      expect(component.tabs[0].name).toBe('Main Tab');
      expect(component.activeTabId).toBe(component.tabs[0].id);
    });

    it('should default backgroundIndex to 0 when missing', () => {
      component.initialState = {
        tabs: [{ id: 't1', name: 'Tab 1', widgets: [] }],
        activeTabId: 't1',
        backgroundIndex: undefined as any,
      };
      component.ngOnInit();

      expect(component.currentBackgroundIndex).toBe(0);
    });

    it('should subscribe to saveError$ and update component state', () => {
      component.ngOnInit();

      persistenceSpy.saveError$.next('Failed to save. Retrying...');
      expect(component.saveError).toBe('Failed to save. Retrying...');

      persistenceSpy.saveError$.next(null);
      expect(component.saveError).toBeNull();
      expect(component.isDirty).toBe(false);
      expect(component.isSaving).toBe(false);
    });

    it('should set isSaving false on permanent error', () => {
      component.ngOnInit();
      component.isSaving = true;

      persistenceSpy.saveError$.next('Changes could not be saved. Please check your connection.');
      expect(component.isSaving).toBe(false);
    });
  });

  describe('saveTabs', () => {
    it('should set isDirty and update workspace service', () => {
      component.tabs = [{ id: 't1', name: 'T1', widgets: [] }];
      component.activeTabId = 't1';

      component.saveTabs();

      expect(component.isDirty).toBe(true);
      expect(workspaceServiceSpy.updateWorkspace).toHaveBeenCalledWith(component.tabs, 't1');
    });
  });

  describe('switchTab', () => {
    beforeEach(() => {
      component.tabs = [
        { id: 't1', name: 'Tab 1', widgets: [] },
        { id: 't2', name: 'Tab 2', widgets: [] },
      ];
      component.activeTabId = 't1';
    });

    it('should change activeTabId and mark dirty', () => {
      component.switchTab('t2');

      expect(component.activeTabId).toBe('t2');
      expect(component.isDirty).toBe(true);
      expect(workspaceServiceSpy.updateWorkspace).toHaveBeenCalled();
    });
  });

  describe('saveToServer', () => {
    beforeEach(() => {
      Object.defineProperty(component, 'widgetContainers', {
        value: [] as any,
        writable: true,
      });
    });

    it('should set isSaving and call persistence.saveWorkspace', async () => {
      component.tabs = [{ id: 't1', name: 'T1', widgets: [] }];
      component.activeTabId = 't1';
      component.currentBackgroundIndex = 1;

      await component.saveToServer();

      expect(component.isSaving).toBe(true);
      expect(persistenceSpy.saveWorkspace).toHaveBeenCalledWith({
        tabs: component.tabs,
        activeTabId: 't1',
        backgroundIndex: 1,
      });
    });

    it('should not save if already saving', async () => {
      component.isSaving = true;

      await component.saveToServer();

      expect(persistenceSpy.saveWorkspace).not.toHaveBeenCalled();
    });

    it('should save unsaved wiki data from all tabs', async () => {
      wikiStorageSpy.saveWiki.mockResolvedValue();
      component.tabs = [
        {
          id: 't1', name: 'Tab 1', widgets: [{
            id: 'w1', type: 'WIKI_WIDGET' as any,
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
            settings: {
              wikiRef: { wikiId: 'wiki1', wikiName: 'My Wiki' },
              _unsavedArticles: [{ id: '1', title: 'Test', content: '<p>Hi</p>' }],
              _wikiDirty: true,
            },
          }],
        },
      ];
      component.activeTabId = 't1';

      await component.saveToServer();

      expect(wikiStorageSpy.saveWiki).toHaveBeenCalledWith('wiki1', {
        name: 'My Wiki',
        articles: [{ id: '1', title: 'Test', content: '<p>Hi</p>' }],
      });
      expect(component.tabs[0].widgets[0].settings._unsavedArticles).toBeUndefined();
      expect(component.tabs[0].widgets[0].settings._wikiDirty).toBeUndefined();
    });

    it('should save unsaved random table data from all tabs', async () => {
      tableStorageSpy.saveTable.mockResolvedValue();
      component.tabs = [{
        id: 't1', name: 'Tab 1', widgets: [{
          id: 'w1', type: 'RANDOM_GENERATOR' as any,
          position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
          settings: {
            tableRef: { tableId: 'tbl1', tableName: 'Encounters' },
            _unsavedMappings: [{ key: 'k', itemsText: 'a' }],
            _unsavedMappingCategories: [{ key: 'k', value: 'v' }],
            _unsavedUseWeightedSelection: false,
            _tableDirty: true,
          },
        }],
      }];
      component.activeTabId = 't1';

      await component.saveToServer();

      expect(tableStorageSpy.saveTable).toHaveBeenCalledWith('tbl1', {
        name: 'Encounters',
        mappings: [{ key: 'k', itemsText: 'a' }],
        mappingCategories: [{ key: 'k', value: 'v' }],
        useWeightedSelection: false,
      });
    });

    it('should save data across multiple tabs', async () => {
      wikiStorageSpy.saveWiki.mockResolvedValue();

      component.tabs = [
        {
          id: 't1', name: 'Tab 1', widgets: [{
            id: 'w1', type: 'WIKI_WIDGET' as any,
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
            settings: {
              wikiRef: { wikiId: 'wiki1', wikiName: 'Wiki 1' },
              _unsavedArticles: [{ id: '1', title: 'A', content: '' }],
            },
          }],
        },
        {
          id: 't2', name: 'Tab 2', widgets: [{
            id: 'w2', type: 'WIKI_WIDGET' as any,
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
            settings: {
              wikiRef: { wikiId: 'wiki2', wikiName: 'Wiki 2' },
              _unsavedArticles: [{ id: '2', title: 'B', content: '' }],
            },
          }],
        },
      ];
      component.activeTabId = 't1';

      await component.saveToServer();

      expect(wikiStorageSpy.saveWiki).toHaveBeenCalledTimes(2);
      expect(persistenceSpy.saveWorkspace).toHaveBeenCalled();
    });
  });

  describe('addTab', () => {
    it('should add a new tab and switch to it', () => {
      component.tabs = [{ id: 't1', name: 'Tab 1', widgets: [] }];

      component.addTab();

      expect(component.tabs.length).toBe(2);
      expect(component.activeTabId).toBe(component.tabs[1].id);
      expect(component.tabs[1].name).toBe('Tab 2');
      expect(component.isDirty).toBe(true);
    });
  });

  describe('removeTab', () => {
    it('should remove tab and switch to first remaining tab', () => {
      component.tabs = [
        { id: 't1', name: 'Tab 1', widgets: [] },
        { id: 't2', name: 'Tab 2', widgets: [] },
      ];
      component.activeTabId = 't2';

      component.removeTab('t2');

      expect(component.tabs.length).toBe(1);
      expect(component.activeTabId).toBe('t1');
    });

    it('should not remove the last tab', () => {
      component.tabs = [{ id: 't1', name: 'Tab 1', widgets: [] }];

      component.removeTab('t1');

      expect(component.tabs.length).toBe(1);
    });

    it('should keep activeTabId if removing non-active tab', () => {
      component.tabs = [
        { id: 't1', name: 'Tab 1', widgets: [] },
        { id: 't2', name: 'Tab 2', widgets: [] },
      ];
      component.activeTabId = 't1';

      component.removeTab('t2');

      expect(component.activeTabId).toBe('t1');
    });

  });

  describe('addWidget', () => {
    it('should add widget to active tab', () => {
      component.tabs = [{ id: 't1', name: 'Tab 1', widgets: [] }];
      component.activeTabId = 't1';

      component.addWidget('DICE_TOOL' as any);

      expect(component.tabs[0].widgets.length).toBe(1);
      expect(component.tabs[0].widgets[0].type).toBe('DICE_TOOL');
      expect(component.isDirty).toBe(true);
    });

    it('should not add widget when no active tab found', () => {
      component.tabs = [{ id: 't1', name: 'Tab 1', widgets: [] }];
      component.activeTabId = 'nonexistent';

      component.addWidget('DICE_TOOL' as any);

      expect(component.tabs[0].widgets.length).toBe(0);
    });
  });

  describe('removeWidget', () => {
    it('should remove widget and trigger blob cleanup', () => {
      mediaSpy.listFiles.mockReturnValue(of([]));
      component.tabs = [{
        id: 't1', name: 'Tab 1',
        widgets: [{ id: 'w1', type: 'DICE_TOOL' as any, position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, settings: {} }],
      }];
      component.activeTabId = 't1';

      component.removeWidget('w1');

      expect(component.tabs[0].widgets.length).toBe(0);
      expect(mediaSpy.listFiles).toHaveBeenCalled();
    });
  });

  describe('resetWorkspace', () => {
    it('should clear all widgets from active tab', () => {
      component.tabs = [{
        id: 't1', name: 'Tab 1',
        widgets: [{ id: 'w1', type: 'DICE_TOOL' as any, position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, settings: {} }],
      }];
      component.activeTabId = 't1';

      component.resetWorkspace();

      expect(component.tabs[0].widgets.length).toBe(0);
      expect(component.isDirty).toBe(true);
    });
  });

  describe('background cycling', () => {
    beforeEach(() => {
      component.currentBackgroundIndex = 0;
    });

    it('should cycle to next background', () => {
      component.nextBackground();
      expect(component.currentBackgroundIndex).toBe(1);
    });

    it('should wrap around to first background', () => {
      component.currentBackgroundIndex = component.backgrounds.length - 1;
      component.nextBackground();
      expect(component.currentBackgroundIndex).toBe(0);
    });

    it('should cycle to previous background', () => {
      component.currentBackgroundIndex = 1;
      component.previousBackground();
      expect(component.currentBackgroundIndex).toBe(0);
    });

    it('should wrap around to last background', () => {
      component.previousBackground();
      expect(component.currentBackgroundIndex).toBe(component.backgrounds.length - 1);
    });
  });

  describe('beforeunload guard', () => {
    it('should prevent unload when dirty', () => {
      component.isDirty = true;
      const event = new Event('beforeunload') as BeforeUnloadEvent;
      const spy = jest.spyOn(event, 'preventDefault');

      component.onBeforeUnload(event);

      expect(spy).toHaveBeenCalled();
    });

    it('should not prevent unload when clean', () => {
      component.isDirty = false;
      const event = new Event('beforeunload') as BeforeUnloadEvent;
      const spy = jest.spyOn(event, 'preventDefault');

      component.onBeforeUnload(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('renameTab', () => {
    it('should rename tab and save', () => {
      component.tabs = [{ id: 't1', name: 'Old', widgets: [] }];
      component.activeTabId = 't1';

      component.renameTab({ id: 't1', name: 'New Name' });

      expect(component.tabs[0].name).toBe('New Name');
      expect(component.isDirty).toBe(true);
    });

    it('should do nothing for unknown tab id', () => {
      component.tabs = [{ id: 't1', name: 'Original', widgets: [] }];
      component.activeTabId = 't1';

      component.renameTab({ id: 'unknown', name: 'New' });

      expect(component.tabs[0].name).toBe('Original');
    });
  });

  describe('widgets getter', () => {
    it('should return widgets of the active tab', () => {
      const widget = { id: 'w1', type: 'DICE_TOOL' as any, position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, settings: {} };
      component.tabs = [{ id: 't1', name: 'T1', widgets: [widget] }];
      component.activeTabId = 't1';

      expect(component.widgets).toEqual([widget]);
    });

    it('should return empty array when no active tab', () => {
      component.tabs = [];
      component.activeTabId = 'nonexistent';

      expect(component.widgets).toEqual([]);
    });
  });
});
