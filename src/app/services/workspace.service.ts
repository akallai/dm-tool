import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WidgetInstance, Tab } from '../workspace/workspace.component';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private workspaceSubject = new BehaviorSubject<{
    tabs: Tab[],
    activeTabId: string,
    widgets: WidgetInstance[]
  }>({
    tabs: [],
    activeTabId: '',
    widgets: []
  });
  
  workspace$ = this.workspaceSubject.asObservable();

  updateWorkspace(tabs: Tab[], activeTabId: string) {
    // Find the active tab to get its widgets
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const widgets = activeTab?.widgets || [];
    
    this.workspaceSubject.next({
      tabs,
      activeTabId,
      widgets
    });
  }
  
  getWidget(type: string) {
    const activeTab = this.workspaceSubject.value.tabs.find(
      tab => tab.id === this.workspaceSubject.value.activeTabId
    );
    
    return activeTab?.widgets.find(w => w.type === type);
  }
  
  getAllWidgets() {
    const activeTab = this.workspaceSubject.value.tabs.find(
      tab => tab.id === this.workspaceSubject.value.activeTabId
    );
    
    return activeTab?.widgets || [];
  }
}