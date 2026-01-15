import { Injectable } from '@angular/core';

const DB_NAME = 'wiki-file-handles';
const STORE_NAME = 'handles';
const DB_VERSION = 1;

/**
 * Service to persist FileSystemFileHandle objects in IndexedDB.
 * This allows wiki file connections to survive page reloads.
 */
@Injectable({
  providedIn: 'root'
})
export class WikiFileHandleService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Store a file handle for a specific widget instance
   */
  async storeHandle(widgetId: string, handle: FileSystemFileHandle, fileName: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ handle, fileName }, widgetId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Failed to store file handle:', error);
    }
  }

  /**
   * Retrieve a stored file handle for a widget and verify/request permission
   * Returns null if no handle exists or permission is denied
   */
  async restoreHandle(widgetId: string): Promise<{ handle: FileSystemFileHandle; fileName: string } | null> {
    try {
      const db = await this.openDB();
      const data = await new Promise<{ handle: FileSystemFileHandle; fileName: string } | undefined>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(widgetId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      if (!data?.handle) {
        return null;
      }

      // Verify we still have permission (may prompt user)
      // Note: requestPermission is part of the File System Access API but not in TypeScript's default types
      const handle = data.handle as FileSystemFileHandle & {
        requestPermission(options: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
      };
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to restore file handle:', error);
      return null;
    }
  }

  /**
   * Remove a stored file handle
   */
  async removeHandle(widgetId: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(widgetId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Failed to remove file handle:', error);
    }
  }
}
