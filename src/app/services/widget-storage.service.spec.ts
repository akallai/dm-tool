import { TestBed } from '@angular/core/testing';

import { WidgetStorageService } from './widget-storage.service';

describe('WidgetStorageService', () => {
  let service: WidgetStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
