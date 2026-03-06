import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MediaService, FileMetadata } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MediaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('listFiles', () => {
    it('should GET /api/media and return files array', () => {
      const mockFiles: FileMetadata[] = [
        { name: 'test.txt', size: 100, content_type: 'text/plain', last_modified: null },
      ];

      service.listFiles().subscribe(files => {
        expect(files).toEqual(mockFiles);
      });

      const req = httpMock.expectOne('/api/media');
      expect(req.request.method).toBe('GET');
      req.flush({ files: mockFiles });
    });

    it('should pass prefix query param when provided', () => {
      service.listFiles('files/abc/').subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/media' && r.params.get('prefix') === 'files/abc/');
      expect(req.request.method).toBe('GET');
      req.flush({ files: [] });
    });

    it('should pass scope query param when provided', () => {
      service.listFiles(undefined, 'shared').subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/media' && r.params.get('scope') === 'shared');
      req.flush({ files: [] });
    });

    it('should pass both prefix and scope when provided', () => {
      service.listFiles('wikis/', 'user').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/media' &&
        r.params.get('prefix') === 'wikis/' &&
        r.params.get('scope') === 'user'
      );
      req.flush({ files: [] });
    });
  });

  describe('downloadFile', () => {
    it('should GET the file with encoded filename and return a Blob', () => {
      const mockBlob = new Blob(['hello'], { type: 'text/plain' });

      service.downloadFile('path/to/file.txt').subscribe(blob => {
        expect(blob).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne('/api/media/path%2Fto%2Ffile.txt');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should pass scope query param for downloadFile', () => {
      service.downloadFile('test.txt', 'shared').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/media/test.txt' &&
        r.params.get('scope') === 'shared'
      );
      req.flush(new Blob());
    });
  });

  describe('uploadFile', () => {
    it('should PUT the file with correct content-type header', () => {
      const blob = new Blob(['data'], { type: 'application/json' });

      service.uploadFile('workspace/state.json', blob, 'application/json').subscribe();

      const req = httpMock.expectOne('/api/media/workspace%2Fstate.json');
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush('', { status: 200, statusText: 'OK' });
    });

    it('should return void on success', () => {
      const blob = new Blob(['x']);
      let result: void | undefined;

      service.uploadFile('test', blob, 'text/plain').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/media/test');
      req.flush('ok', { status: 200, statusText: 'OK' });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('should DELETE the file with encoded filename', () => {
      service.deleteFile('files/widget1/image.png').subscribe();

      const req = httpMock.expectOne('/api/media/files%2Fwidget1%2Fimage.png');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
