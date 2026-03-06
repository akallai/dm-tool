import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RandomTableStorageService, TableBlobData } from './random-table-storage.service';
import { MediaService, FileMetadata } from './media.service';

describe('RandomTableStorageService', () => {
  let service: RandomTableStorageService;
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
        RandomTableStorageService,
        { provide: MediaService, useValue: mediaSpy },
      ],
    });
    service = TestBed.inject(RandomTableStorageService);
  });

  describe('createTable', () => {
    it('should upload meta.json and data.json, return ref', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      const ref = await service.createTable('Encounters');

      expect(ref.tableName).toBe('Encounters');
      expect(ref.tableId).toBeDefined();
      expect(mediaSpy.uploadFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('listTables', () => {
    it('should list and parse all meta.json files, sorted by createdAt desc', async () => {
      const files: FileMetadata[] = [
        { name: 'random-tables/t1/meta.json', size: 50, content_type: 'application/json', last_modified: null },
        { name: 'random-tables/t2/meta.json', size: 50, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.downloadFile.mockImplementation((name: string) => {
        if (name.includes('t1')) return of(new Blob([JSON.stringify({ name: 'Older', createdAt: 100 })]));
        return of(new Blob([JSON.stringify({ name: 'Newer', createdAt: 200 })]));
      });

      const tables = await service.listTables();

      expect(tables[0].name).toBe('Newer');
      expect(tables[1].name).toBe('Older');
    });
  });

  describe('loadTable', () => {
    it('should download and parse data.json', async () => {
      const data: TableBlobData = {
        name: 'T', mappings: [{ key: 'k1', itemsText: 'a\nb' }],
        mappingCategories: [], useWeightedSelection: true,
      };
      mediaSpy.downloadFile.mockReturnValue(of(new Blob([JSON.stringify(data)])));

      const result = await service.loadTable('t1');

      expect(result).toEqual(data);
    });

    it('should return null on error', async () => {
      mediaSpy.downloadFile.mockReturnValue(throwError(() => new Error('fail')));

      expect(await service.loadTable('t1')).toBeNull();
    });
  });

  describe('saveTable', () => {
    it('should upload data.json', async () => {
      mediaSpy.uploadFile.mockReturnValue(of(void 0));

      await service.saveTable('t1', {
        name: 'T', mappings: [], mappingCategories: [], useWeightedSelection: false,
      });

      const [path] = mediaSpy.uploadFile.mock.calls[0];
      expect(path).toBe('random-tables/t1/data.json');
    });
  });

  describe('deleteTable', () => {
    it('should delete all files under the table prefix', async () => {
      const files: FileMetadata[] = [
        { name: 'random-tables/t1/meta.json', size: 50, content_type: 'application/json', last_modified: null },
        { name: 'random-tables/t1/data.json', size: 200, content_type: 'application/json', last_modified: null },
      ];
      mediaSpy.listFiles.mockReturnValue(of(files));
      mediaSpy.deleteFile.mockReturnValue(of(void 0));

      await service.deleteTable('t1');

      expect(mediaSpy.deleteFile).toHaveBeenCalledTimes(2);
    });
  });
});
