import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RandomTableStorageService, TableMeta, TableRef } from '../../services/random-table-storage.service';

@Component({
  selector: 'app-random-table-picker-dialog',
  template: `
    <h2 mat-dialog-title>Table Collections</h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group (selectedTabChange)="onTabChange()">
        <!-- Shared Tables tab -->
        <mat-tab label="Shared Tables">
          <ng-template matTabContent>
            <div class="tab-content">
              <div *ngIf="sharedLoading" class="loading-state">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
              <div *ngIf="!sharedLoading && sharedTables.length === 0" class="empty-state">
                No shared tables available.
              </div>
              <div *ngIf="!sharedLoading && sharedTables.length > 0" class="table-list">
                <div *ngFor="let table of sharedTables" class="table-row" (click)="selectTable(table, 'shared')">
                  <mat-icon class="table-icon">casino</mat-icon>
                  <span class="table-name">{{ table.name }}</span>
                </div>
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- My Tables tab -->
        <mat-tab label="My Tables">
          <ng-template matTabContent>
            <div class="tab-content">
              <div *ngIf="myLoading" class="loading-state">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
              <div *ngIf="!myLoading && tables.length === 0" class="empty-state">
                No table collections found.
              </div>
              <div *ngIf="!myLoading && tables.length > 0" class="table-list">
                <div *ngFor="let table of tables; let i = index" class="table-row" (click)="selectTable(table)">
                  <mat-icon class="table-icon">casino</mat-icon>
                  <span class="table-name">{{ table.name }}</span>
                  <ng-container *ngIf="deletingIndex !== i">
                    <button mat-icon-button color="warn" (click)="confirmDelete(i); $event.stopPropagation()">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </ng-container>
                  <ng-container *ngIf="deletingIndex === i">
                    <span class="delete-confirm">Delete?</span>
                    <button mat-icon-button color="warn" (click)="deleteTable(table, i); $event.stopPropagation()">
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
    .table-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .table-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .table-row:hover {
      background: var(--item-hover, rgba(255,255,255,0.1));
    }
    .table-icon {
      color: var(--accent-color, #64b5f6);
      flex-shrink: 0;
    }
    .table-name {
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
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ]
})
export class RandomTablePickerDialogComponent implements OnInit {
  tables: TableMeta[] = [];
  sharedTables: TableMeta[] = [];
  sharedLoading = false;
  myLoading = false;
  deletingIndex = -1;

  constructor(
    public dialogRef: MatDialogRef<RandomTablePickerDialogComponent>,
    private tableStorage: RandomTableStorageService,
  ) {}

  ngOnInit() {
    this.loadSharedTables();
    this.loadMyTables();
  }

  private async loadSharedTables() {
    this.sharedLoading = true;
    try {
      this.sharedTables = await this.tableStorage.listSharedTables();
    } catch (err) {
      console.error('Failed to load shared tables:', err);
      this.sharedTables = [];
    } finally {
      this.sharedLoading = false;
    }
  }

  private async loadMyTables() {
    this.myLoading = true;
    try {
      this.tables = await this.tableStorage.listTables();
    } catch (err) {
      console.error('Failed to load table collections:', err);
      this.tables = [];
    } finally {
      this.myLoading = false;
    }
  }

  onTabChange() {
    this.deletingIndex = -1;
  }

  selectTable(table: TableMeta, scope?: 'shared') {
    const result: TableRef = { tableId: table.tableId, tableName: table.name, scope };
    this.dialogRef.close(result);
  }

  confirmDelete(index: number) {
    this.deletingIndex = index;
  }

  cancelDelete() {
    this.deletingIndex = -1;
  }

  async deleteTable(table: TableMeta, index: number) {
    try {
      await this.tableStorage.deleteTable(table.tableId);
      this.tables.splice(index, 1);
      this.deletingIndex = -1;
    } catch (err) {
      console.error('Delete failed:', err);
      this.deletingIndex = -1;
    }
  }
}
