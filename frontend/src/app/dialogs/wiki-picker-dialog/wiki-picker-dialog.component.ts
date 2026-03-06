import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WikiStorageService, WikiMeta, WikiRef } from '../../services/wiki-storage.service';

@Component({
  selector: 'app-wiki-picker-dialog',
  template: `
    <h2 mat-dialog-title>My Wikis</h2>
    <mat-dialog-content class="dialog-content">
      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
      <div *ngIf="!loading && wikis.length === 0" class="empty-state">
        No wikis found.
      </div>
      <div *ngIf="!loading && wikis.length > 0" class="wiki-list">
        <div *ngFor="let wiki of wikis; let i = index" class="wiki-row" (click)="selectWiki(wiki)">
          <mat-icon class="wiki-icon">menu_book</mat-icon>
          <span class="wiki-name">{{ wiki.name }}</span>
          <ng-container *ngIf="deletingIndex !== i">
            <button mat-icon-button color="warn" (click)="confirmDelete(i); $event.stopPropagation()">
              <mat-icon>delete</mat-icon>
            </button>
          </ng-container>
          <ng-container *ngIf="deletingIndex === i">
            <span class="delete-confirm">Delete?</span>
            <button mat-icon-button color="warn" (click)="deleteWiki(wiki, i); $event.stopPropagation()">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button (click)="cancelDelete(); $event.stopPropagation()">
              <mat-icon>close</mat-icon>
            </button>
          </ng-container>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      min-height: 200px;
      max-height: 70vh;
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
    .wiki-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .wiki-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .wiki-row:hover {
      background: var(--item-hover, rgba(255,255,255,0.1));
    }
    .wiki-icon {
      color: var(--accent-color, #64b5f6);
      flex-shrink: 0;
    }
    .wiki-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-primary, white);
    }
    .delete-confirm {
      color: var(--danger-color, #f44336);
      font-size: 13px;
      margin-right: 4px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ]
})
export class WikiPickerDialogComponent implements OnInit {
  wikis: WikiMeta[] = [];
  loading = false;
  deletingIndex = -1;

  constructor(
    public dialogRef: MatDialogRef<WikiPickerDialogComponent>,
    private wikiStorageService: WikiStorageService,
  ) {}

  ngOnInit() {
    this.loadWikis();
  }

  private async loadWikis() {
    this.loading = true;
    try {
      this.wikis = await this.wikiStorageService.listWikis();
    } catch (err) {
      console.error('Failed to load wikis:', err);
      this.wikis = [];
    } finally {
      this.loading = false;
    }
  }

  selectWiki(wiki: WikiMeta) {
    const result: WikiRef = { wikiId: wiki.wikiId, wikiName: wiki.name };
    this.dialogRef.close(result);
  }

  confirmDelete(index: number) {
    this.deletingIndex = index;
  }

  cancelDelete() {
    this.deletingIndex = -1;
  }

  async deleteWiki(wiki: WikiMeta, index: number) {
    try {
      await this.wikiStorageService.deleteWiki(wiki.wikiId);
      this.wikis.splice(index, 1);
      this.deletingIndex = -1;
    } catch (err) {
      console.error('Delete failed:', err);
      this.deletingIndex = -1;
    }
  }
}
