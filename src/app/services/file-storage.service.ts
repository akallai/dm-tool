import { Injectable } from '@angular/core';

const DB_NAME = 'dm-tool-files';
const STORE_NAME = 'files';
const DB_VERSION = 1;

export interface StoredFile {
  id: string;
  blob: Blob;
  fileName: string;
  fileType: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileStorageService {

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveFile(id: string, file: File): Promise<void> {
    const db = await this.openDb();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const storedFile: StoredFile = {
          id,
          blob: file,
          fileName: file.name,
          fileType: file.type
        };

        const request = store.put(storedFile);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }

  async getFile(id: string): Promise<StoredFile | null> {
    const db = await this.openDb();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.openDb();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }
}
