import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FileStorageService } from './file-storage.service';
import { MediaService, FileMetadata } from './media.service';

describe('FileStorageService', () => {
  let service: FileStorageService;
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
        FileStorageService,
        { provide: MediaService, useValue: mediaSpy },
      ],
    });
    service = TestBed.inject(FileStorageService);
  });

  describe('saveFile', () => {
    it('should upload file to files/{id}/{fileName}', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));
      const file = new File(['data'], 'image.png', { type: 'image/png' });

      await service.saveFile('widget1', file);

      expect(mediaSpy.uploadFile).toHaveBeenCalledWith('files/widget1/image.png', file, 'image/png');
    });
  });

  describe('getFile', () => {
    it('should list and download the first file', async () => {
      const filesMeta: FileMetadata[] = [
        { name: 'files/w1/photo.jpg', size: 500, content_type: 'image/jpeg', last_modified: null },
      ];
      const blob = new Blob(['image-data'], { type: 'image/jpeg' });
      mediaSpy.listFiles.mockReturnValue(of(filesMeta));
      mediaSpy.downloadFile.mockReturnValue(of(blob));

      const result = await service.getFile('w1');

      expect(result).toEqual({
        id: 'w1',
        blob,
        fileName: 'photo.jpg',
        fileType: 'image/jpeg',
      });
      expect(mediaSpy.listFiles).toHaveBeenCalledWith('files/w1/');
      expect(mediaSpy.downloadFile).toHaveBeenCalledWith('files/w1/photo.jpg');
    });

    it('should return null when no files exist', async () => {
      mediaSpy.listFiles.mockReturnValue(of([]));

      const result = await service.getFile('w1');

      expect(result).toBeNull();
    });

    it('should return null on 404 error', async () => {
      mediaSpy.listFiles.mockReturnValue(throwError(() => ({ status: 404 })));

      const result = await service.getFile('w1');

      expect(result).toBeNull();
    });

    it('should rethrow non-404 errors', async () => {
      mediaSpy.listFiles.mockReturnValue(throwError(() => ({ status: 500 })));

      await expect(service.getFile('w1')).rejects.toEqual({ status: 500 });
    });

    it('should use fallback content type when null', async () => {
      const filesMeta: FileMetadata[] = [
        { name: 'files/w1/doc.bin', size: 100, content_type: null, last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(filesMeta));
      mediaSpy.downloadFile.mockReturnValue(of(new Blob()));

      const result = await service.getFile('w1');

      expect(result?.fileType).toBe('application/octet-stream');
    });
  });

  describe('deleteFile', () => {
    it('should list and delete all files under the widget prefix', async () => {
      const filesMeta: FileMetadata[] = [
        { name: 'files/w1/a.png', size: 10, content_type: 'image/png', last_modified: null },
        { name: 'files/w1/b.pdf', size: 20, content_type: 'application/pdf', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(filesMeta));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteFile('w1');

      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(2);
      expect(mediaSpy.deleteFile).toHaveBeenCalledWith('files/w1/a.png');
      expect(mediaSpy.deleteFile).toHaveBeenCalledWith('files/w1/b.pdf');
    });

    it('should silently ignore errors during deletion', async () => {
      mediaSpy.listFiles.mockReturnValue(throwError(() => new Error('network')));

      await expect(service.deleteFile('w1')).resolves.toBeUndefined();
    });
  });
});
