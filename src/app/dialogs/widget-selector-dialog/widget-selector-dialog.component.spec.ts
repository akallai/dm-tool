import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetSelectorDialogComponent } from './widget-selector-dialog.component';

describe('WidgetSelectorDialogComponent', () => {
  let component: WidgetSelectorDialogComponent;
  let fixture: ComponentFixture<WidgetSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetSelectorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WidgetSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
