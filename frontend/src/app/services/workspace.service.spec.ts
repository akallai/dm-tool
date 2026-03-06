import { TestBed } from '@angular/core/testing';
import { WorkspaceService } from './workspace.service';
import { Tab, WidgetInstance } from '../workspace/workspace.component';
import { WidgetType } from '../dialogs/widget-selector-dialog/widget-selector-dialog.component';

function makeWidget(type: WidgetType, id = '1'): WidgetInstance {
  return { id, type, position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, settings: {} };
}

function makeTab(id: string, name: string, widgets: WidgetInstance[] = []): Tab {
  return { id, name, widgets };
}

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [WorkspaceService] });
    service = TestBed.inject(WorkspaceService);
  });

  describe('initial state', () => {
    it('should start with empty tabs and widgets', () => {
      let state: any;
      service.workspace$.subscribe(s => state = s);
      expect(state.tabs).toEqual([]);
      expect(state.activeTabId).toBe('');
      expect(state.widgets).toEqual([]);
    });
  });

  describe('updateWorkspace', () => {
    it('should emit new state with active tab widgets', () => {
      const widget = makeWidget('DICE_TOOL');
      const tab = makeTab('t1', 'Tab 1', [widget]);

      service.updateWorkspace([tab], 't1');

      let state: any;
      service.workspace$.subscribe(s => state = s);
      expect(state.tabs).toEqual([tab]);
      expect(state.activeTabId).toBe('t1');
      expect(state.widgets).toEqual([widget]);
    });

    it('should return empty widgets when active tab not found', () => {
      const tab = makeTab('t1', 'Tab 1', [makeWidget('DICE_TOOL')]);

      service.updateWorkspace([tab], 'nonexistent');

      let state: any;
      service.workspace$.subscribe(s => state = s);
      expect(state.widgets).toEqual([]);
    });

    it('should update widgets when switching active tab', () => {
      const w1 = makeWidget('DICE_TOOL', 'w1');
      const w2 = makeWidget('WIKI_WIDGET', 'w2');
      const tab1 = makeTab('t1', 'Tab 1', [w1]);
      const tab2 = makeTab('t2', 'Tab 2', [w2]);

      service.updateWorkspace([tab1, tab2], 't1');
      let state: any;
      service.workspace$.subscribe(s => state = s);
      expect(state.widgets).toEqual([w1]);

      service.updateWorkspace([tab1, tab2], 't2');
      expect(state.widgets).toEqual([w2]);
    });
  });

  describe('getWidget', () => {
    it('should find a widget by type in the active tab', () => {
      const widget = makeWidget('COMBAT_TRACKER', 'ct1');
      const tab = makeTab('t1', 'Tab 1', [widget]);
      service.updateWorkspace([tab], 't1');

      expect(service.getWidget('COMBAT_TRACKER')).toEqual(widget);
    });

    it('should return undefined if widget type not in active tab', () => {
      const tab = makeTab('t1', 'Tab 1', [makeWidget('DICE_TOOL')]);
      service.updateWorkspace([tab], 't1');

      expect(service.getWidget('COMBAT_TRACKER')).toBeUndefined();
    });

    it('should not find widgets from inactive tabs', () => {
      const w1 = makeWidget('DICE_TOOL', 'w1');
      const w2 = makeWidget('COMBAT_TRACKER', 'w2');
      const tab1 = makeTab('t1', 'Tab 1', [w1]);
      const tab2 = makeTab('t2', 'Tab 2', [w2]);
      service.updateWorkspace([tab1, tab2], 't1');

      expect(service.getWidget('COMBAT_TRACKER')).toBeUndefined();
    });
  });

  describe('getAllWidgets', () => {
    it('should return all widgets from active tab', () => {
      const w1 = makeWidget('DICE_TOOL', 'w1');
      const w2 = makeWidget('COMBAT_TRACKER', 'w2');
      const tab = makeTab('t1', 'Tab 1', [w1, w2]);
      service.updateWorkspace([tab], 't1');

      expect(service.getAllWidgets()).toEqual([w1, w2]);
    });

    it('should return empty array when no active tab', () => {
      expect(service.getAllWidgets()).toEqual([]);
    });
  });
});
