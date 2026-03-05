import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MediaService } from './media.service';
import { Tab } from '../workspace/workspace.component';
import { debounce } from '../utils/debounce';

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
  private debouncedSave: (state: WorkspaceState) => void;

  constructor(private media: MediaService) {
    this.debouncedSave = debounce((state: WorkspaceState) => {
      this.saveWorkspaceImmediate(state).subscribe({
        error: (err) => console.error('Failed to save workspace:', err)
      });
    }, 2000);
  }

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
    this.debouncedSave(state);
  }

  saveWorkspaceImmediate(state: WorkspaceState): Observable<void> {
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
      }
    }
    return cloned;
  }
}
