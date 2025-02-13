import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WidgetSelectorDialogComponent, WidgetType } from '../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { WidgetStorageService } from '../services/widget-storage.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { WidgetContainerComponent } from '../workspace/widget-container/widget-container.component';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: { x: number, y: number };
  size: { width: number, height: number };
  settings: any;
  minimized?: boolean;
  maximized?: boolean;
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
    WidgetContainerComponent
  ]
})
export class WorkspaceComponent implements OnInit {
  widgets: WidgetInstance[] = [];

  constructor(
    private dialog: MatDialog,
    private widgetStorage: WidgetStorageService
  ) {}

  ngOnInit() {
    // Load saved widget state from local storage
    this.widgets = this.widgetStorage.loadWidgets();
  }

  openWidgetSelector() {
    const dialogRef = this.dialog.open(WidgetSelectorDialogComponent, {
      width: '300px'
    });

    dialogRef.afterClosed().subscribe((selectedType: WidgetType) => {
      if (selectedType) {
        this.addWidget(selectedType);
      }
    });
  }

  addWidget(type: WidgetType) {
    const newWidget: WidgetInstance = {
      id: Date.now().toString(),
      type,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      settings: {} // initial settings per widget type
    };
    this.widgets.push(newWidget);
    this.saveWidgets();
  }

  removeWidget(id: string) {
    this.widgets = this.widgets.filter(w => w.id !== id);
    this.saveWidgets();
  }

  saveWidgets() {
    this.widgetStorage.saveWidgets(this.widgets);
  }
}
