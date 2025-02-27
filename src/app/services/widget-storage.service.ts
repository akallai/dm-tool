import { Injectable } from '@angular/core';
import { WidgetInstance, Tab } from '../workspace/workspace.component';

@Injectable({
  providedIn: 'root'
})
export class WidgetStorageService {
  private widgetsKey = 'dm-tool-widgets';
  private tabsKey = 'dm-tool-tabs';
  private activeTabKey = 'dm-tool-active-tab';

  // Legacy method to support older versions
  saveWidgets(widgets: WidgetInstance[]) {
    localStorage.setItem(this.widgetsKey, JSON.stringify(widgets));
  }

  // Legacy method to support older versions
  loadWidgets(): WidgetInstance[] {
    const data = localStorage.getItem(this.widgetsKey);
    return data ? JSON.parse(data) : [];
  }

  // New methods for tab support
  saveTabs(tabs: Tab[], activeTabId: string) {
    localStorage.setItem(this.tabsKey, JSON.stringify(tabs));
    localStorage.setItem(this.activeTabKey, activeTabId);
  }

  loadTabs(): { tabs: Tab[], activeTabId: string } {
    const tabsData = localStorage.getItem(this.tabsKey);
    const activeTabId = localStorage.getItem(this.activeTabKey);
    
    const tabs = tabsData ? JSON.parse(tabsData) : [];
    
    // If there are no tabs, create a default tab
    if (tabs.length === 0) {
      // Migrate existing widgets to the default tab if they exist
      const legacyWidgets = this.loadWidgets();
      const defaultTab: Tab = {
        id: Date.now().toString(),
        name: 'Main Tab',
        widgets: legacyWidgets
      };
      tabs.push(defaultTab);
    }
    
    // If no active tab or the active tab doesn't exist, use the first tab
    const validActiveTabId = activeTabId && tabs.some((tab: Tab) => tab.id === activeTabId) 
      ? activeTabId 
      : (tabs.length > 0 ? tabs[0].id : '');
      
    return { tabs, activeTabId: validActiveTabId };
  }
}