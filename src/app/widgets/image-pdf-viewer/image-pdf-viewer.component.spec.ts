import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagePdfViewerComponent } from './image-pdf-viewer.component';

describe('ImagePdfViewerComponent', () => {
  let component: ImagePdfViewerComponent;
  let fixture: ComponentFixture<ImagePdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePdfViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagePdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
