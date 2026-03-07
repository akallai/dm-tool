import { WorkspaceHeaderComponent } from './workspace-header.component';

describe('WorkspaceHeaderComponent', () => {
  let component: WorkspaceHeaderComponent;

  beforeEach(() => {
    component = new WorkspaceHeaderComponent();
    component.tabs = [
      { id: 't1', name: 'Tab 1', widgets: [] },
      { id: 't2', name: 'Tab 2', widgets: [] },
    ];
    component.activeTabId = 't1';
  });

  describe('startEditingTab', () => {
    it('should set editingTabId and tempTabName', () => {
      const event = { stopPropagation: jest.fn() } as any;

      component.startEditingTab('t1', event);

      expect(component.editingTabId).toBe('t1');
      expect(component.tempTabName).toBe('Tab 1');
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not set editing for unknown tab', () => {
      const event = { stopPropagation: jest.fn() } as any;

      component.startEditingTab('unknown', event);

      expect(component.editingTabId).toBeNull();
    });
  });

  describe('finishEditingTab', () => {
    it('should emit tabRenameFinish with trimmed name', () => {
      const spy = jest.fn();
      component.tabRenameFinish.subscribe(spy);
      component.editingTabId = 't1';
      component.tempTabName = '  New Name  ';

      component.finishEditingTab();

      expect(spy).toHaveBeenCalledWith({ id: 't1', name: 'New Name' });
      expect(component.editingTabId).toBeNull();
    });

    it('should not emit if temp name is blank', () => {
      const spy = jest.fn();
      component.tabRenameFinish.subscribe(spy);
      component.editingTabId = 't1';
      component.tempTabName = '   ';

      component.finishEditingTab();

      expect(spy).not.toHaveBeenCalled();
      expect(component.editingTabId).toBeNull();
    });

    it('should not emit if no editingTabId', () => {
      const spy = jest.fn();
      component.tabRenameFinish.subscribe(spy);
      component.editingTabId = null;

      component.finishEditingTab();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveTab', () => {
    it('should emit tabRemove and stop propagation', () => {
      const spy = jest.fn();
      component.tabRemove.subscribe(spy);
      const event = { stopPropagation: jest.fn() } as any;

      component.onRemoveTab('t2', event);

      expect(spy).toHaveBeenCalledWith('t2');
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('trackByTabId', () => {
    it('should return tab id', () => {
      expect(component.trackByTabId(0, { id: 'abc', name: 'X', widgets: [] })).toBe('abc');
    });
  });
});
