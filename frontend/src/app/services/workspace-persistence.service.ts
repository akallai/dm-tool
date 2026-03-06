import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MediaService } from './media.service';
import { Tab } from '../workspace/workspace.component';

export interface WorkspaceState {
  tabs: Tab[];
  activeTabId: string;
  backgroundIndex: number;
}

const WORKSPACE_BLOB_PATH = 'workspace/state.json';

@Injectable({
  providedIn: 'root'
})
export class WorkspacePersistenceService {
  saveError$ = new BehaviorSubject<string | null>(null);
  private retryCount = 0;
  private maxRetries = 3;

  constructor(private media: MediaService) {}

  async loadWorkspaceAsync(): Promise<WorkspaceState | null> {
    return new Promise((resolve, reject) => {
      this.media.downloadFile(WORKSPACE_BLOB_PATH).subscribe({
        next: async (blob) => {
          try {
            const text = await blob.text();
            const state = JSON.parse(text) as WorkspaceState;
            resolve(state);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => {
          if (err.status === 404) {
            resolve(null);
          } else {
            reject(err);
          }
        }
      });
    });
  }

  saveWorkspace(state: WorkspaceState): void {
    this.saveWorkspaceImmediate(state).subscribe({
      next: () => {
        this.retryCount = 0;
        this.saveError$.next(null);
      },
      error: () => {
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          this.saveError$.next('Failed to save. Retrying...');
          setTimeout(() => this.saveWorkspace(state), 1000 * Math.pow(2, this.retryCount));
        } else {
          this.saveError$.next('Changes could not be saved. Please check your connection.');
        }
      }
    });
  }

  private saveWorkspaceImmediate(state: WorkspaceState): Observable<void> {
    const stateToSave = this.stripBinaryData(state);
    const json = JSON.stringify(stateToSave);
    const blob = new Blob([json], { type: 'application/json' });
    return this.media.uploadFile(WORKSPACE_BLOB_PATH, blob, 'application/json');
  }

  private stripBinaryData(state: WorkspaceState): WorkspaceState {
    const cloned = JSON.parse(JSON.stringify(state)) as WorkspaceState;
    for (const tab of cloned.tabs) {
      for (const widget of tab.widgets) {
        if (widget.type === 'MUSIC_WIDGET' && widget.settings?.mappings) {
          widget.settings.mappings = widget.settings.mappings.map((mapping: any) => ({
            ...mapping,
            files: mapping.files?.map((file: any) => ({
              fileName: file.fileName
            }))
          }));
        }
        // Strip transient wiki data (saved separately to wiki blobs)
        delete widget.settings?._unsavedArticles;
        delete widget.settings?._wikiDirty;
      }
    }
    return cloned;
  }
}
