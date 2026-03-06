import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WikiImageStorageService } from './wiki-image-storage.service';
import { MediaService, FileMetadata } from './media.service';

describe('WikiImageStorageService', () => {
  let service: WikiImageStorageService;
  let mediaSpy: jest.Mocked<MediaService>;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    mediaSpy = {
      uploadFile: jest.fn(),
      downloadFile: jest.fn(),
      listFiles: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    // Save originals and install mocks
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        WikiImageStorageService,
        { provide: MediaService, useValue: mediaSpy },
      ],
    });
    service = TestBed.inject(WikiImageStorageService);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  describe('saveImage', () => {
    it('should upload image blob and metadata, return imageId', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));
      const file = new File(['img-data'], 'photo.png', { type: 'image/png' });

      const imageId = await service.saveImage('wiki1', file);

      expect(imageId).toBeDefined();
      expect(typeof imageId).toBe('string');
      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(2);

      // First call: image blob
      const [imgPath, , imgType] = mediaSpy.uploadFile.mock.calls[0];
      expect(imgPath).toContain('wikis/wiki1/images/');
      expect(imgType).toBe('image/png');

      // Second call: metadata
      const [metaPath, , metaType] = mediaSpy.uploadFile.mock.calls[1];
      expect(metaPath).toBe(`${imgPath}.meta`);
      expect(metaType).toBe('application/json');
    });
  });

  describe('getImage', () => {
    it('should find, download, and return image with metadata', async () => {
      const imageId = 'abc-123';
      const files: FileMetadata[] = [
        { name: `wikis/wiki1/images/${imageId}`, size: 100, content_type: 'image/png', last_modified: null },
        { name: `wikis/wiki1/images/${imageId}.meta`, size: 50, content_type: 'application/json', last_modified: null },
      ];
      const imageBlob = new Blob(['img'], { type: 'image/png' });
      const metaBlob = new Blob([JSON.stringify({ fileName: 'photo.png', mimeType: 'image/png', createdAt: 1000 })]);

      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockImplementation((name: string) => {
        if (name.endsWith('.meta')) return of(metaBlob);
        return of(imageBlob);
      });

      const result = await service.getImage(imageId);

      expect(result).toEqual({
        id: imageId,
        wikiId: 'wiki1',
        fileName: 'photo.png',
        mimeType: 'image/png',
        blob: imageBlob,
        createdAt: 1000,
      });
    });

    it('should return null when image not found', async () => {
      mediaSpy.listFiles.mockReturnValue(of([]));

      const result = await service.getImage('nonexistent');

      expect(result).toBeNull();
    });

    it('should use defaults when metadata is missing', async () => {
      const imageId = 'abc-123';
      const files: FileMetadata[] = [
        { name: `wikis/wiki1/images/${imageId}`, size: 100, content_type: 'image/jpeg', last_modified: null },
      ];
      const imageBlob = new Blob(['img'], { type: 'image/jpeg' });

      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockImplementation((name: string) => {
        if (name.endsWith('.meta')) return throwError(() => new Error('not found'));
        return of(imageBlob);
      });

      const result = await service.getImage(imageId);

      expect(result?.fileName).toBe(imageId);
      expect(result?.mimeType).toBe('image/jpeg');
    });
  });

  describe('deleteImage', () => {
    it('should delete image blob and metadata files', async () => {
      const imageId = 'img1';
      const files: FileMetadata[] = [
        { name: `wikis/w1/images/${imageId}`, size: 100, content_type: 'image/png', last_modified: null },
        { name: `wikis/w1/images/${imageId}.meta`, size: 50, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteImage(imageId);

      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should revoke cached blob URL on delete', async () => {
      (URL.createObjectURL as jest.Mock).mockReturnValue('blob:test-url');

      // First cache a blob URL
      const imageId = 'cached-img';
      const files: FileMetadata[] = [
        { name: `wikis/w1/images/${imageId}`, size: 100, content_type: 'image/png', last_modified: null },
      ];
      const imageBlob = new Blob(['img'], { type: 'image/png' });
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockReturnValue(of(imageBlob));

      await service.getBlobUrl(imageId);

      // Now delete
      mediaSpy.deleteFile.mockReturnValue(of(void 0));
      await service.deleteImage(imageId);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });

  describe('getBlobUrl', () => {
    it('should cache and return blob URL', async () => {
      (URL.createObjectURL as jest.Mock).mockReturnValue('blob:cached');

      const imageId = 'img1';
      const files: FileMetadata[] = [
        { name: `wikis/w1/images/${imageId}`, size: 100, content_type: 'image/png', last_modified: null },
      ];
      const imageBlob = new Blob(['img'], { type: 'image/png' });
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockReturnValue(of(imageBlob));

      const url1 = await service.getBlobUrl(imageId);
      const url2 = await service.getBlobUrl(imageId); // should hit cache

      expect(url1).toBe('blob:cached');
      expect(url2).toBe('blob:cached');
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should return null for nonexistent image', async () => {
      mediaSpy.listFiles.mockReturnValue(of([]));

      const url = await service.getBlobUrl('nope');

      expect(url).toBeNull();
    });
  });

  describe('revokeBlobUrl', () => {
    it('should revoke and remove cached URL', async () => {
      (URL.createObjectURL as jest.Mock).mockReturnValue('blob:url');

      const files: FileMetadata[] = [
        { name: 'wikis/w1/images/img1', size: 100, content_type: 'image/png', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockReturnValue(of(new Blob(['img'])));

      await service.getBlobUrl('img1');
      service.revokeBlobUrl('img1');

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('should be a no-op for uncached image', () => {
      expect(() => service.revokeBlobUrl('unknown')).not.toThrow();
    });
  });

  describe('deleteImagesForWiki', () => {
    it('should delete all files under the wiki images prefix', async () => {
      const files: FileMetadata[] = [
        { name: 'wikis/w1/images/a', size: 10, content_type: 'image/png', last_modified: null },
        { name: 'wikis/w1/images/a.meta', size: 5, content_type: 'application/json', last_modified: null },
        { name: 'wikis/w1/images/b', size: 10, content_type: 'image/png', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteImagesForWiki('w1');

      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('importImages', () => {
    it('should upload each image with blob and metadata', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const images = [
        { id: 'i1', fileName: 'a.png', mimeType: 'image/png', blob: new Blob(['a']) },
        { id: 'i2', fileName: 'b.jpg', mimeType: 'image/jpeg', blob: new Blob(['b']) },
      ];

      await service.importImages('wiki1', images);

      // 2 images × 2 uploads each (blob + meta) = 4
      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(4);
    });
  });
});
