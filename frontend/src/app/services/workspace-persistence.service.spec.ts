import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WorkspacePersistenceService, WorkspaceState } from './workspace-persistence.service';
import { MediaService } from './media.service';

function makeState(overrides: Partial<WorkspaceState> = {}): WorkspaceState {
  return {
    tabs: [{
      id: 't1',
      name: 'Tab 1',
      widgets: []
    }],
    activeTabId: 't1',
    ...overrides
  };
}

describe('WorkspacePersistenceService', () => {
  let service: WorkspacePersistenceService;
  let mediaSpy: jest.Mocked<MediaService>;

  beforeEach(() => {
    mediaSpy = {
      downloadFile: jest.fn(),
      uploadFile: jest.fn(),
      listFiles: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        WorkspacePersistenceService,
        { provide: MediaService, useValue: mediaSpy },
      ],
    });
    service = TestBed.inject(WorkspacePersistenceService);
  });

  describe('loadWorkspaceAsync', () => {
    it('should load and parse workspace state from blob', async () => {
      const state = makeState();
      const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
      mediaSpy.downloadFile.mockReturnValue(of(blob));

      const result = await service.loadWorkspaceAsync();

      expect(result).toEqual(state);
      expect(mediaSpy.downloadFile).toHaveBeenCalledWith('workspace/state.json');
    });

    it('should return null on 404', async () => {
      mediaSpy.downloadFile.mockReturnValue(throwError(() => ({ status: 404 })));

      const result = await service.loadWorkspaceAsync();

      expect(result).toBeNull();
    });

    it('should reject on non-404 errors', async () => {
      mediaSpy.downloadFile.mockReturnValue(throwError(() => ({ status: 500 })));

      await expect(service.loadWorkspaceAsync()).rejects.toEqual({ status: 500 });
    });

    it('should reject on invalid JSON', async () => {
      const blob = new Blob(['not-json'], { type: 'text/plain' });
      mediaSpy.downloadFile.mockReturnValue(of(blob));

      await expect(service.loadWorkspaceAsync()).rejects.toThrow();
    });
  });

  describe('saveWorkspace', () => {
    it('should upload state as JSON blob and clear errors', () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));
      const state = makeState();

      service.saveWorkspace(state);

      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(1);
      const [path, , contentType] = mediaSpy.uploadFile.mock.calls[0];
      expect(path).toBe('workspace/state.json');
      expect(contentType).toBe('application/json');
      expect(service.saveError$.value).toBeNull();
    });

    it('should retry on failure with exponential backoff', fakeAsync(() => {
      let callCount = 0;
      mediaSpy.uploadFile.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return throwError(() => new Error('fail'));
        return of(void 0);
      });

      service.saveWorkspace(makeState());
      expect(service.saveError$.value).toBe('Failed to save. Retrying...');

      // 1st retry after 2s
      tick(2000);
      expect(service.saveError$.value).toBe('Failed to save. Retrying...');

      // 2nd retry after 4s
      tick(4000);
      expect(service.saveError$.value).toBeNull(); // success on 3rd attempt
      expect(callCount).toBe(3);
    }));

    it('should emit permanent error after max retries', fakeAsync(() => {
      mediaSpy.uploadFile.mockReturnValue(throwError(() => new Error('fail')));

      service.saveWorkspace(makeState());
      tick(2000); // retry 1
      tick(4000); // retry 2
      tick(8000); // retry 3

      expect(service.saveError$.value).toBe('Changes could not be saved. Please check your connection.');
    }));

    it('should reset retry count on success', fakeAsync(() => {
      let callCount = 0;
      mediaSpy.uploadFile.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return throwError(() => new Error('fail'));
        return of(void 0);
      });

      service.saveWorkspace(makeState());
      tick(2000); // retry succeeds

      expect(service.saveError$.value).toBeNull();

      // Now another save should start fresh
      callCount = 0;
      mediaSpy.uploadFile.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return throwError(() => new Error('fail'));
        return of(void 0);
      });

      service.saveWorkspace(makeState());
      tick(2000);
      expect(service.saveError$.value).toBeNull();
    }));
  });

  describe('stripBinaryData', () => {
    it('should strip music widget file data URLs but keep fileNames', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const state = makeState({
        tabs: [{
          id: 't1', name: 'Tab 1',
          widgets: [{
            id: 'w1', type: 'MUSIC_WIDGET' as any,
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
            settings: {
              mappings: [{
                id: 'm1',
                files: [
                  { fileName: 'song.mp3', fileDataUrl: 'data:audio/mp3;base64,abc123' }
                ]
              }]
            }
          }]
        }]
      });

      service.saveWorkspace(state);

      const uploadedBlob = mediaSpy.uploadFile.mock.calls[0][1] as Blob;
      const text = await uploadedBlob.text();
      const saved = JSON.parse(text);
      const files = saved.tabs[0].widgets[0].settings.mappings[0].files;
      expect(files[0]).toEqual({ fileName: 'song.mp3' });
      expect(files[0].fileDataUrl).toBeUndefined();
    });

    it('should strip _unsavedArticles and _wikiDirty from wiki widgets', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const state = makeState({
        tabs: [{
          id: 't1', name: 'Tab 1',
          widgets: [{
            id: 'w1', type: 'WIKI_WIDGET' as any,
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
            settings: {
              wikiRef: { wikiId: 'wiki1', wikiName: 'My Wiki' },
              _unsavedArticles: [{ id: '1', title: 'Test', content: 'data' }],
              _wikiDirty: true
            }
          }]
        }]
      });

      service.saveWorkspace(state);

      const uploadedBlob = mediaSpy.uploadFile.mock.calls[0][1] as Blob;
      const text = await uploadedBlob.text();
      const saved = JSON.parse(text);
      const settings = saved.tabs[0].widgets[0].settings;
      expect(settings._unsavedArticles).toBeUndefined();
      expect(settings._wikiDirty).toBeUndefined();
      expect(settings.wikiRef).toBeDefined();
    });

    it('should not mutate the original state object', () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const state = makeState({
        tabs: [{
          id: 't1', name: 'Tab 1',
          widgets: [{
            id: 'w1', type: 'WIKI_WIDGET' as any,
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
            settings: {
              _unsavedArticles: [{ id: '1', title: 'Test', content: 'data' }],
              _wikiDirty: true
            }
          }]
        }]
      });

      service.saveWorkspace(state);

      // Original state should still have transient data
      expect(state.tabs[0].widgets[0].settings._unsavedArticles).toBeDefined();
      expect(state.tabs[0].widgets[0].settings._wikiDirty).toBe(true);
    });
  });
});
