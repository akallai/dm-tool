import { Injectable } from '@angular/core';
import { WidgetInstance } from '../workspace/workspace.component';

@Injectable({
  providedIn: 'root'
})
export class WidgetStorageService {
  private storageKey = 'dm-tool-widgets';

  saveWidgets(widgets: WidgetInstance[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(widgets));
  }

  loadWidgets(): WidgetInstance[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }
}
