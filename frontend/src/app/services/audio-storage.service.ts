import { Injectable } from '@angular/core';

export interface StoredAudioFile {
  id: string;
  mappingId: string;
  widgetId: string;
  fileName: string;
  fileDataUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioStorageService {
  private dbName = 'dm-tool-audio-db';
  private storeName = 'audio-files';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('widgetId', 'widgetId', { unique: false });
          store.createIndex('mappingId', 'mappingId', { unique: false });
        }
      };
    });
  }

  async saveAudioFiles(widgetId: string, mappingId: string, files: { fileName: string, fileDataUrl: string }[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // First, delete existing files for this mapping
      const index = store.index('mappingId');
      const deleteRequest = index.openCursor(IDBKeyRange.only(mappingId));

      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        // Now add the new files
        const addTransaction = this.db!.transaction([this.storeName], 'readwrite');
        const addStore = addTransaction.objectStore(this.storeName);

        files.forEach((file, index) => {
          const storedFile: StoredAudioFile = {
            id: `${mappingId}-${index}`,
            mappingId,
            widgetId,
            fileName: file.fileName,
            fileDataUrl: file.fileDataUrl
          };
          addStore.put(storedFile);
        });

        addTransaction.oncomplete = () => resolve();
        addTransaction.onerror = () => reject(addTransaction.error);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAudioFiles(mappingId: string): Promise<{ fileName: string, fileDataUrl: string }[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('mappingId');
      const request = index.getAll(IDBKeyRange.only(mappingId));

      request.onsuccess = () => {
        const files = request.result.map((stored: StoredAudioFile) => ({
          fileName: stored.fileName,
          fileDataUrl: stored.fileDataUrl
        }));
        resolve(files);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAudioFilesForWidget(widgetId: string): Promise<Map<string, { fileName: string, fileDataUrl: string }[]>> {
    await this.init();
    if (!this.db) return new Map();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('widgetId');
      const request = index.getAll(IDBKeyRange.only(widgetId));

      request.onsuccess = () => {
        const filesByMapping = new Map<string, { fileName: string, fileDataUrl: string }[]>();

        request.result.forEach((stored: StoredAudioFile) => {
          if (!filesByMapping.has(stored.mappingId)) {
            filesByMapping.set(stored.mappingId, []);
          }
          filesByMapping.get(stored.mappingId)!.push({
            fileName: stored.fileName,
            fileDataUrl: stored.fileDataUrl
          });
        });

        resolve(filesByMapping);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteAudioFilesForWidget(widgetId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('widgetId');
      const request = index.openCursor(IDBKeyRange.only(widgetId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteAudioFilesForMapping(mappingId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('mappingId');
      const request = index.openCursor(IDBKeyRange.only(mappingId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
