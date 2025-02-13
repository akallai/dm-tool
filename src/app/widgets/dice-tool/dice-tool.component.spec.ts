import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceToolComponent } from './dice-tool.component';

describe('DiceToolComponent', () => {
  let component: DiceToolComponent;
  let fixture: ComponentFixture<DiceToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiceToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
