import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AudioStorageService } from './audio-storage.service';
import { MediaService, FileMetadata } from './media.service';

describe('AudioStorageService', () => {
  let service: AudioStorageService;
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
        AudioStorageService,
        { provide: MediaService, useValue: mediaSpy },
      ],
    });
    service = TestBed.inject(AudioStorageService);
  });

  describe('saveAudioFiles', () => {
    it('should delete existing, upload meta.json, then upload each file', async () => {
      mediaSpy.listFiles.mockReturnValue(of([]));
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const files = [
        { fileName: 'track1.mp3', fileDataUrl: 'data:audio/mpeg;base64,dGVzdA==' },
        { fileName: 'track2.ogg', fileDataUrl: 'data:audio/ogg;base64,dGVzdA==' },
      ];

      await service.saveAudioFiles('w1', 'm1', files);

      // 1 meta upload + 2 audio uploads = 3
      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(3);

      // First upload should be meta.json
      const [metaPath] = mediaSpy.uploadFile.mock.calls[0];
      expect(metaPath).toBe('audio/w1/m1/meta.json');

      // Audio files
      expect(mediaSpy.uploadFile.mock.calls[1][0]).toBe('audio/w1/m1/0');
      expect(mediaSpy.uploadFile.mock.calls[2][0]).toBe('audio/w1/m1/1');
    });
  });

  describe('getAudioFiles', () => {
    it('should download meta then each audio file, converting blobs to dataUrls', async () => {
      const meta = [{ index: 0, fileName: 'song.mp3' }];
      const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
      const audioBlob = new Blob(['audio-data'], { type: 'audio/mpeg' });

      mediaSpy.downloadFile.mockImplementation((path: string) => {
        if (path.includes('meta.json')) return of(metaBlob);
        return of(audioBlob);
      });

      const result = await service.getAudioFiles('m1', 'w1');

      expect(result.length).toBe(1);
      expect(result[0].fileName).toBe('song.mp3');
      expect(result[0].fileDataUrl).toContain('data:');
    });

    it('should return empty array on error', async () => {
      mediaSpy.downloadFile.mockReturnValue(throwError(() => new Error('not found')));

      const result = await service.getAudioFiles('m1', 'w1');

      expect(result).toEqual([]);
    });
  });

  describe('getAudioFilesForWidget', () => {
    it('should group files by mappingId', async () => {
      const files: FileMetadata[] = [
        { name: 'audio/w1/m1/meta.json', size: 10, content_type: 'application/json', last_modified: null },
        { name: 'audio/w1/m1/0', size: 100, content_type: 'audio/mpeg', last_modified: null },
        { name: 'audio/w1/m2/meta.json', size: 10, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));

      const meta1 = [{ index: 0, fileName: 'a.mp3' }];
      const meta2: any[] = [];
      mediaSpy.downloadFile.mockImplementation((path: string) => {
        if (path.includes('m1/meta.json')) return of(new Blob([JSON.stringify(meta1)]));
        if (path.includes('m2/meta.json')) return of(new Blob([JSON.stringify(meta2)]));
        return of(new Blob(['audio'], { type: 'audio/mpeg' }));
      });

      const result = await service.getAudioFilesForWidget('w1');

      expect(result.has('m1')).toBe(true);
      expect(result.get('m1')?.length).toBe(1);
      // m2 has no files so should not be in result
      expect(result.has('m2')).toBe(false);
    });

    it('should return empty map on error', async () => {
      mediaSpy.listFiles.mockReturnValue(throwError(() => new Error('fail')));

      const result = await service.getAudioFilesForWidget('w1');

      expect(result.size).toBe(0);
    });
  });

  describe('deleteAudioFilesForWidget', () => {
    it('should delete all files under audio/{widgetId}/', async () => {
      const files: FileMetadata[] = [
        { name: 'audio/w1/m1/0', size: 100, content_type: 'audio/mpeg', last_modified: null },
        { name: 'audio/w1/m1/meta.json', size: 10, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteAudioFilesForWidget('w1');

      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should silently ignore errors', async () => {
      mediaSpy.listFiles.mockReturnValue(throwError(() => new Error('fail')));

      await expect(service.deleteAudioFilesForWidget('w1')).resolves.toBeUndefined();
    });
  });

  describe('deleteAudioFilesForMapping', () => {
    it('should delete files for specific mapping when widgetId provided', async () => {
      const files: FileMetadata[] = [
        { name: 'audio/w1/m1/0', size: 100, content_type: 'audio/mpeg', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteAudioFilesForMapping('m1', 'w1');

      expect(mediaSpy.listFiles).toHaveBeenCalledWith('audio/w1/m1/');
      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when widgetId is not provided', async () => {
      await service.deleteAudioFilesForMapping('m1');

      expect(mediaSpy.listFiles).not.toHaveBeenCalled();
    });
  });
});
