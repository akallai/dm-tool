import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { SettingsService } from './settings.service';
import { BaseSettingsDialogComponent } from '../components/base-settings-dialog/base-settings-dialog.component';

describe('SettingsService', () => {
  let service: SettingsService;
  let dialogSpy: jest.Mocked<MatDialog>;

  beforeEach(() => {
    const mockDialogRef = { afterClosed: () => of({ key: 'value' }) } as unknown as MatDialogRef<any>;
    dialogSpy = { open: jest.fn().mockReturnValue(mockDialogRef) } as any;

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });
    service = TestBed.inject(SettingsService);
  });

  it('should open BaseSettingsDialogComponent with config and settings', () => {
    const config = { title: 'Test', fields: [] } as any;
    const settings = { foo: 'bar' };

    service.openSettings(config, settings).subscribe();

    expect(dialogSpy.open).toHaveBeenCalledWith(BaseSettingsDialogComponent, {
      width: '500px',
      data: { config, settings },
    });
  });

  it('should return dialog result as observable', () => {
    let result: any;
    service.openSettings({ title: 'T', fields: [] } as any, {}).subscribe(r => result = r);

    expect(result).toEqual({ key: 'value' });
  });

  it('should return undefined when dialog is cancelled', () => {
    const cancelRef = { afterClosed: () => of(undefined) } as unknown as MatDialogRef<any>;
    dialogSpy.open.mockReturnValue(cancelRef);

    let result: any = 'initial';
    service.openSettings({ title: 'T', fields: [] } as any, {}).subscribe(r => result = r);

    expect(result).toBeUndefined();
  });
});
