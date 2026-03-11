import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Tab } from '../workspace.component';

@Component({
  selector: 'app-workspace-header',
  templateUrl: './workspace-header.component.html',
  styleUrls: ['./workspace-header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceHeaderComponent {
  constructor(private cdr: ChangeDetectorRef) {}
  @Input() tabs: Tab[] = [];
  @Input() activeTabId: string = '';
  @Input() isDirty = false;
  @Input() isSaving = false;

  @Output() tabSwitch = new EventEmitter<string>();
  @Output() tabAdd = new EventEmitter<void>();
  @Output() tabRemove = new EventEmitter<string>();
  @Output() tabRenameFinish = new EventEmitter<{ id: string; name: string }>();
  @Output() openWidgetSelector = new EventEmitter<void>();
  @Output() resetWorkspace = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  editingTabId: string | null = null;
  tempTabName = '';
  isFullscreen = !!document.fullscreenElement;

  startEditingTab(tabId: string, event: MouseEvent) {
    event.stopPropagation();
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      this.editingTabId = tabId;
      this.tempTabName = tab.name;
      setTimeout(() => {
        const input = document.getElementById(`tab-name-input-${tabId}`);
        if (input) input.focus();
      }, 0);
    }
  }

  finishEditingTab() {
    if (this.editingTabId && this.tempTabName.trim()) {
      this.tabRenameFinish.emit({ id: this.editingTabId, name: this.tempTabName.trim() });
    }
    this.editingTabId = null;
  }

  onRemoveTab(tabId: string, event: MouseEvent) {
    event.stopPropagation();
    this.tabRemove.emit(tabId);
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
    this.cdr.markForCheck();
  }

  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }
}
