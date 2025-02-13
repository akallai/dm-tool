import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomGeneratorSettingsDialogComponent } from './random-generator-settings-dialog.component';

describe('RandomGeneratorSettingsDialogComponent', () => {
  let component: RandomGeneratorSettingsDialogComponent;
  let fixture: ComponentFixture<RandomGeneratorSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomGeneratorSettingsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RandomGeneratorSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
