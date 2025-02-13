import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceSettingsDialogComponent } from './dice-settings-dialog.component';

describe('DiceSettingsDialogComponent', () => {
  let component: DiceSettingsDialogComponent;
  let fixture: ComponentFixture<DiceSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceSettingsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiceSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
