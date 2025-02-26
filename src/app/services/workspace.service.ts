// src/app/services/workspace.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WidgetInstance } from '../workspace/workspace.component';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private workspaceSubject = new BehaviorSubject<{widgets: WidgetInstance[]}>({widgets: []});
  workspace$ = this.workspaceSubject.asObservable();

  updateWorkspace(widgets: WidgetInstance[]) {
    this.workspaceSubject.next({widgets});
  }
  
  getWidget(type: string) {
    return this.workspaceSubject.value.widgets.find(w => w.type === type);
  }
  
  getAllWidgets() {
    return this.workspaceSubject.value.widgets;
  }
}