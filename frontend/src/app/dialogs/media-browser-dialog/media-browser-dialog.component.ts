import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MediaService, FileMetadata } from '../../services/media.service';

export interface MediaBrowserDialogData {
  filter: 'image-pdf' | 'audio' | 'all';
  multiple?: boolean;
}

export interface MediaBrowserResult {
  path: string;
  scope: 'user' | 'shared';
  fileName: string;
  contentType: string;
  size: number;
}

interface FileGroup {
  name: string;
  files: FileMetadata[];
}

@Component({
  selector: 'app-media-browser-dialog',
  template: `
    <h2 mat-dialog-title>Media Browser</h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group (selectedTabChange)="onTabChange($event)">
        <!-- Rulebooks tab -->
        <mat-tab *ngIf="showRulebooks" label="Rulebooks">
          <ng-template matTabContent>
            <div class="tab-content">
              <div *ngIf="rulebooksLoading" class="loading-state">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
              <div *ngIf="!rulebooksLoading && rulebookGroups.length === 0 && rulebookUngrouped.length === 0" class="empty-state">
                No rulebooks available.
              </div>
              <div *ngIf="!rulebooksLoading" class="file-list">
                <!-- Ungrouped files -->
                <div *ngFor="let file of rulebookUngrouped" class="file-row" [class.selected]="isSelected(file, 'shared')" (click)="selectFile(file, 'shared')">
                  <mat-icon class="file-type-icon">{{ getFileIcon(file) }}</mat-icon>
                  <span class="file-name">{{ getDisplayName(file.name) }}</span>
                  <span class="file-size">{{ formatSize(file.size) }}</span>
                  <button mat-icon-button matTooltip="Select" (click)="selectFile(file, 'shared'); $event.stopPropagation()">
                    <mat-icon>{{ multiple && isSelected(file, 'shared') ? 'check_box' : multiple ? 'check_box_outline_blank' : 'check_circle' }}</mat-icon>
                  </button>
                </div>
                <!-- Grouped files -->
                <mat-accordion *ngIf="rulebookGroups.length > 0">
                  <mat-expansion-panel *ngFor="let group of rulebookGroups">
                    <mat-expansion-panel-header>
                      <mat-panel-title>{{ group.name }}</mat-panel-title>
                      <mat-panel-description>{{ group.files.length }} file{{ group.files.length !== 1 ? 's' : '' }}</mat-panel-description>
                    </mat-expansion-panel-header>
                    <div *ngFor="let file of group.files" class="file-row" [class.selected]="isSelected(file, 'shared')" (click)="selectFile(file, 'shared')">
                      <mat-icon class="file-type-icon">{{ getFileIcon(file) }}</mat-icon>
                      <span class="file-name">{{ getDisplayName(file.name) }}</span>
                      <span class="file-size">{{ formatSize(file.size) }}</span>
                      <button mat-icon-button matTooltip="Select" (click)="selectFile(file, 'shared'); $event.stopPropagation()">
                        <mat-icon>{{ multiple && isSelected(file, 'shared') ? 'check_box' : multiple ? 'check_box_outline_blank' : 'check_circle' }}</mat-icon>
                      </button>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Sounds tab -->
        <mat-tab *ngIf="showSounds" label="Sounds">
          <ng-template matTabContent>
            <div class="tab-content">
              <div *ngIf="soundsLoading" class="loading-state">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
              <div *ngIf="!soundsLoading && soundGroups.length === 0 && soundUngrouped.length === 0" class="empty-state">
                No sounds available.
              </div>
              <div *ngIf="!soundsLoading" class="file-list">
                <div *ngFor="let file of soundUngrouped" class="file-row" [class.selected]="isSelected(file, 'shared')" (click)="selectFile(file, 'shared')">
                  <mat-icon class="file-type-icon">{{ getFileIcon(file) }}</mat-icon>
                  <span class="file-name">{{ getDisplayName(file.name) }}</span>
                  <span class="file-size">{{ formatSize(file.size) }}</span>
                  <button mat-icon-button matTooltip="Select" (click)="selectFile(file, 'shared'); $event.stopPropagation()">
                    <mat-icon>{{ multiple && isSelected(file, 'shared') ? 'check_box' : multiple ? 'check_box_outline_blank' : 'check_circle' }}</mat-icon>
                  </button>
                </div>
                <mat-accordion *ngIf="soundGroups.length > 0">
                  <mat-expansion-panel *ngFor="let group of soundGroups">
                    <mat-expansion-panel-header>
                      <mat-panel-title>{{ group.name }}</mat-panel-title>
                      <mat-panel-description>{{ group.files.length }} file{{ group.files.length !== 1 ? 's' : '' }}</mat-panel-description>
                    </mat-expansion-panel-header>
                    <div *ngFor="let file of group.files" class="file-row" [class.selected]="isSelected(file, 'shared')" (click)="selectFile(file, 'shared')">
                      <mat-icon class="file-type-icon">{{ getFileIcon(file) }}</mat-icon>
                      <span class="file-name">{{ getDisplayName(file.name) }}</span>
                      <span class="file-size">{{ formatSize(file.size) }}</span>
                      <button mat-icon-button matTooltip="Select" (click)="selectFile(file, 'shared'); $event.stopPropagation()">
                        <mat-icon>{{ multiple && isSelected(file, 'shared') ? 'check_box' : multiple ? 'check_box_outline_blank' : 'check_circle' }}</mat-icon>
                      </button>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- My Files tab -->
        <mat-tab label="My Files">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="my-files-toolbar">
                <button mat-raised-button color="primary" (click)="triggerUpload()">
                  <mat-icon>upload</mat-icon> Upload
                </button>
                <input #uploadInput type="file" [accept]="uploadAccept" style="display:none" (change)="onUploadFile($event)">
              </div>
              <div *ngIf="myFilesLoading" class="loading-state">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
              <div *ngIf="!myFilesLoading && myFiles.length === 0" class="empty-state">
                No files uploaded yet.
              </div>
              <div *ngIf="!myFilesLoading" class="file-list">
                <div *ngFor="let file of myFiles; let i = index" class="file-row" [class.selected]="isSelected(file, 'user')" (click)="selectFile(file, 'user')">
                  <mat-icon class="file-type-icon">{{ getFileIcon(file) }}</mat-icon>
                  <span class="file-name">{{ getDisplayName(file.name) }}</span>
                  <span class="file-size">{{ formatSize(file.size) }}</span>
                  <ng-container *ngIf="deletingIndex !== i">
                    <button mat-icon-button matTooltip="Select" (click)="selectFile(file, 'user'); $event.stopPropagation()">
                      <mat-icon>{{ multiple && isSelected(file, 'user') ? 'check_box' : multiple ? 'check_box_outline_blank' : 'check_circle' }}</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Delete" color="warn" (click)="confirmDelete(i); $event.stopPropagation()">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </ng-container>
                  <ng-container *ngIf="deletingIndex === i">
                    <span class="delete-confirm">Delete?</span>
                    <button mat-icon-button color="warn" (click)="deleteFile(file, i); $event.stopPropagation()">
                      <mat-icon>check</mat-icon>
                    </button>
                    <button mat-icon-button (click)="cancelDelete(); $event.stopPropagation()">
                      <mat-icon>close</mat-icon>
                    </button>
                  </ng-container>
                </div>
              </div>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button *ngIf="multiple" mat-raised-button color="primary"
              [disabled]="selectedFiles.size === 0"
              (click)="confirmSelection()">
        Add {{ selectedFiles.size }} file{{ selectedFiles.size !== 1 ? 's' : '' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      min-height: 400px;
      max-height: 70vh;
    }
    .tab-content {
      padding: 16px 0;
    }
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary, rgba(255,255,255,0.5));
    }
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .file-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .file-row:hover {
      background: var(--item-hover, rgba(255,255,255,0.1));
    }
    .file-row.selected {
      background: rgba(100, 255, 218, 0.1);
      border-left: 2px solid var(--accent-color, #64ffda);
    }
    .file-type-icon {
      color: var(--accent-color, #64b5f6);
      flex-shrink: 0;
    }
    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-primary, white);
    }
    .file-size {
      color: var(--text-secondary, rgba(255,255,255,0.5));
      font-size: 12px;
      flex-shrink: 0;
    }
    .my-files-toolbar {
      margin-bottom: 12px;
    }
    .delete-confirm {
      color: var(--danger-color, #f44336);
      font-size: 13px;
      margin-right: 4px;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      flex: 1;
    }
    ::ng-deep .mat-expansion-panel {
      background: var(--panel-bg, rgba(0,0,0,0.3)) !important;
      color: var(--text-primary, white) !important;
    }
    ::ng-deep .mat-expansion-panel-header-title,
    ::ng-deep .mat-expansion-panel-header-description {
      color: var(--text-primary, white) !important;
    }
    ::ng-deep .mat-expansion-panel-header-description {
      color: var(--text-secondary, rgba(255,255,255,0.5)) !important;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
  ]
})
export class MediaBrowserDialogComponent implements OnInit {
  @ViewChild('uploadInput') uploadInput!: ElementRef<HTMLInputElement>;

  showRulebooks: boolean;
  showSounds: boolean;
  uploadAccept: string;

  rulebooksLoading = false;
  rulebookGroups: FileGroup[] = [];
  rulebookUngrouped: FileMetadata[] = [];

  soundsLoading = false;
  soundGroups: FileGroup[] = [];
  soundUngrouped: FileMetadata[] = [];

  myFilesLoading = false;
  myFiles: FileMetadata[] = [];

  deletingIndex = -1;

  multiple: boolean;
  selectedFiles = new Map<string, { file: FileMetadata, scope: 'user' | 'shared' }>();

  private filter: 'image-pdf' | 'audio' | 'all';

  constructor(
    public dialogRef: MatDialogRef<MediaBrowserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: MediaBrowserDialogData,
    private mediaService: MediaService,
  ) {
    this.filter = data.filter;
    this.multiple = data.multiple ?? false;
    this.showRulebooks = this.filter === 'image-pdf' || this.filter === 'all';
    this.showSounds = this.filter === 'audio' || this.filter === 'all';

    if (this.filter === 'image-pdf') {
      this.uploadAccept = 'image/*,.pdf';
    } else if (this.filter === 'audio') {
      this.uploadAccept = 'audio/*';
    } else {
      this.uploadAccept = '*';
    }
  }

  ngOnInit() {
    if (this.showRulebooks) this.loadRulebooks();
    if (this.showSounds) this.loadSounds();
    this.loadMyFiles();
  }

  onTabChange(_event: any) {
    this.deletingIndex = -1;
  }

  private loadRulebooks() {
    this.rulebooksLoading = true;
    this.mediaService.listFiles('rulebooks/', 'shared').subscribe({
      next: files => {
        const { groups, ungrouped } = this.groupBySubfolder(files, 'rulebooks/');
        this.rulebookGroups = groups;
        this.rulebookUngrouped = ungrouped;
        this.rulebooksLoading = false;
      },
      error: () => { this.rulebooksLoading = false; }
    });
  }

  private loadSounds() {
    this.soundsLoading = true;
    this.mediaService.listFiles('sounds/', 'shared').subscribe({
      next: files => {
        const { groups, ungrouped } = this.groupBySubfolder(files, 'sounds/');
        this.soundGroups = groups;
        this.soundUngrouped = ungrouped;
        this.soundsLoading = false;
      },
      error: () => { this.soundsLoading = false; }
    });
  }

  loadMyFiles() {
    this.myFilesLoading = true;

    const prefixes: string[] = [];
    if (this.filter === 'image-pdf' || this.filter === 'all') prefixes.push('files/');
    if (this.filter === 'audio' || this.filter === 'all') prefixes.push('audio/');
    prefixes.push('uploads/');

    let completed = 0;
    const allFiles: FileMetadata[] = [];

    prefixes.forEach(prefix => {
      this.mediaService.listFiles(prefix).subscribe({
        next: files => {
          allFiles.push(...files);
          completed++;
          if (completed === prefixes.length) {
            this.myFiles = allFiles;
            this.myFilesLoading = false;
          }
        },
        error: () => {
          completed++;
          if (completed === prefixes.length) {
            this.myFiles = allFiles;
            this.myFilesLoading = false;
          }
        }
      });
    });
  }

  private groupBySubfolder(files: FileMetadata[], rootPrefix: string): { groups: FileGroup[], ungrouped: FileMetadata[] } {
    const groupMap = new Map<string, FileMetadata[]>();
    const ungrouped: FileMetadata[] = [];

    for (const file of files) {
      const relativePath = file.name.startsWith(rootPrefix) ? file.name.slice(rootPrefix.length) : file.name;
      const slashIndex = relativePath.indexOf('/');
      if (slashIndex > 0) {
        const folder = relativePath.substring(0, slashIndex);
        if (!groupMap.has(folder)) groupMap.set(folder, []);
        groupMap.get(folder)!.push(file);
      } else {
        ungrouped.push(file);
      }
    }

    const groups: FileGroup[] = [];
    groupMap.forEach((files, name) => groups.push({ name, files }));
    groups.sort((a, b) => a.name.localeCompare(b.name));
    return { groups, ungrouped };
  }

  selectFile(file: FileMetadata, scope: 'user' | 'shared') {
    if (this.multiple) {
      const key = `${scope}:${file.name}`;
      if (this.selectedFiles.has(key)) {
        this.selectedFiles.delete(key);
      } else {
        this.selectedFiles.set(key, { file, scope });
      }
      return;
    }

    const result: MediaBrowserResult = {
      path: file.name,
      scope,
      fileName: this.getDisplayName(file.name),
      contentType: file.content_type || 'application/octet-stream',
      size: file.size,
    };
    this.dialogRef.close(result);
  }

  isSelected(file: FileMetadata, scope: 'user' | 'shared'): boolean {
    return this.selectedFiles.has(`${scope}:${file.name}`);
  }

  confirmSelection() {
    const results: MediaBrowserResult[] = [];
    this.selectedFiles.forEach(({ file, scope }) => {
      results.push({
        path: file.name,
        scope,
        fileName: this.getDisplayName(file.name),
        contentType: file.content_type || 'application/octet-stream',
        size: file.size,
      });
    });
    this.dialogRef.close(results);
  }

  getDisplayName(name: string): string {
    const parts = name.split('/');
    return parts[parts.length - 1];
  }

  getFileIcon(file: FileMetadata): string {
    const ct = file.content_type || '';
    if (ct.startsWith('image/')) return 'image';
    if (ct === 'application/pdf') return 'picture_as_pdf';
    if (ct.startsWith('audio/')) return 'audiotrack';
    return 'insert_drive_file';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  triggerUpload() {
    this.uploadInput.nativeElement.click();
  }

  onUploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.mediaService.uploadFile(`uploads/${file.name}`, file, file.type).subscribe({
      next: () => this.loadMyFiles(),
      error: err => console.error('Upload failed:', err)
    });
    input.value = '';
  }

  confirmDelete(index: number) {
    this.deletingIndex = index;
  }

  cancelDelete() {
    this.deletingIndex = -1;
  }

  deleteFile(file: FileMetadata, index: number) {
    this.mediaService.deleteFile(file.name).subscribe({
      next: () => {
        this.myFiles.splice(index, 1);
        this.deletingIndex = -1;
      },
      error: err => {
        console.error('Delete failed:', err);
        this.deletingIndex = -1;
      }
    });
  }
}
