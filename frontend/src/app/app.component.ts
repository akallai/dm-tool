import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceComponent } from './workspace/workspace.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkspacePersistenceService, WorkspaceState } from './services/workspace-persistence.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    WorkspaceComponent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  loading = true;
  error: string | null = null;
  initialState: WorkspaceState | null = null;

  constructor(
    private persistence: WorkspacePersistenceService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadWorkspace();
  }

  async loadWorkspace() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      this.initialState = await this.persistence.loadWorkspaceAsync();
      this.loading = false;
    } catch (err) {
      this.error = 'Could not connect to server. Please check your connection and try again.';
      this.loading = false;
    }
    this.cdr.markForCheck();
  }

  async retry() {
    await this.loadWorkspace();
  }
}
