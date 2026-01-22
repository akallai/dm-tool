// src/app/settings/services/settings.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { BaseSettingsDialogComponent } from '../components/base-settings-dialog/base-settings-dialog.component';
import { SettingsConfig } from '../types/settings.types';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(private dialog: MatDialog) {}

  openSettings(config: SettingsConfig, currentSettings: any): Observable<any> {
    return this.dialog.open(BaseSettingsDialogComponent, {
      width: '500px',
      data: {
        config,
        settings: currentSettings
      }
    }).afterClosed();
  }
}