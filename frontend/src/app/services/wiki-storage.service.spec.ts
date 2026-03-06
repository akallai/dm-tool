import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WikiStorageService, WikiBlobData } from './wiki-storage.service';
import { MediaService, FileMetadata } from './media.service';

describe('WikiStorageService', () => {
  let service: WikiStorageService;
  let mediaSpy: jest.Mocked<MediaService>;

  beforeEach(() => {
    mediaSpy = {
      uploadFile: jest.fn(),
      downloadFile: jest.fn(),
      listFiles: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        WikiStorageService,
        { provide: MediaService, useValue: mediaSpy },
      ],
    });
    service = TestBed.inject(WikiStorageService);
  });

  describe('createWiki', () => {
    it('should create meta.json and data.json with welcome article', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const ref = await service.createWiki('My Wiki');

      expect(ref.wikiName).toBe('My Wiki');
      expect(ref.wikiId).toBeDefined();
      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('listWikis', () => {
    it('should list and parse all wiki meta.json files', async () => {
      const files: FileMetadata[] = [
        { name: 'wikis/w1/meta.json', size: 50, content_type: 'application/json', last_modified: null },
        { name: 'wikis/w2/meta.json', size: 50, content_type: 'application/json', last_modified: null },
        { name: 'wikis/w1/data.json', size: 500, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockImplementation((name: string) => {
        if (name.includes('w1/meta'))
          return of(new Blob([JSON.stringify({ name: 'Wiki A', createdAt: 2000 })]));
        if (name.includes('w2/meta'))
          return of(new Blob([JSON.stringify({ name: 'Wiki B', createdAt: 1000 })]));
        return throwError(() => new Error('not found'));
      });

      const wikis = await service.listWikis();

      expect(wikis.length).toBe(2);
      expect(wikis[0].name).toBe('Wiki A'); // sorted by createdAt desc
      expect(wikis[1].name).toBe('Wiki B');
    });

    it('should skip wikis with corrupt metadata', async () => {
      const files: FileMetadata[] = [
        { name: 'wikis/w1/meta.json', size: 50, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockReturnValue(throwError(() => new Error('corrupt')));

      const wikis = await service.listWikis();

      expect(wikis.length).toBe(0);
    });
  });

  describe('loadWiki', () => {
    it('should download and parse data.json', async () => {
      const data: WikiBlobData = { name: 'W', articles: [{ id: '1', title: 'Hello', content: '<p>Hi</p>' }] };
      mediaSpy.downloadFile.mockReturnValue(of(new Blob([JSON.stringify(data)])));

      const result = await service.loadWiki('w1');

      expect(result).toEqual(data);
      expect(mediaSpy.downloadFile).toHaveBeenCalledWith('wikis/w1/data.json');
    });

    it('should return null on error', async () => {
      mediaSpy.downloadFile.mockReturnValue(throwError(() => new Error('fail')));

      const result = await service.loadWiki('w1');

      expect(result).toBeNull();
    });
  });

  describe('saveWiki', () => {
    it('should upload data.json', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));
      const data: WikiBlobData = { name: 'W', articles: [] };

      await service.saveWiki('w1', data);

      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(1);
      const [path] = mediaSpy.uploadFile.mock.calls[0];
      expect(path).toBe('wikis/w1/data.json');
    });
  });

  describe('deleteWiki', () => {
    it('should delete all files under the wiki prefix', async () => {
      const files: FileMetadata[] = [
        { name: 'wikis/w1/meta.json', size: 50, content_type: 'application/json', last_modified: null },
        { name: 'wikis/w1/data.json', size: 500, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteWiki('w1');

      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('renameWiki', () => {
    it('should download meta, update name, re-upload', async () => {
      mediaSpy.downloadFile.mockReturnValue(
        of(new Blob([JSON.stringify({ name: 'Old', createdAt: 1000 })]))
      );
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      await service.renameWiki('w1', 'New Name');

      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(1);
    });

    it('should create meta.json if download fails', async () => {
      mediaSpy.downloadFile.mockReturnValue(throwError(() => new Error('not found')));
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      await service.renameWiki('w1', 'Fresh');

      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(1);
    });
  });
});
