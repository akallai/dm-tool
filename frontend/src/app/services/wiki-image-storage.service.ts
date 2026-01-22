import { Injectable } from '@angular/core';

export interface StoredWikiImage {
  id: string;
  widgetId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class WikiImageStorageService {
  private dbName = 'dm-tool-wiki-images-db';
  private storeName = 'wiki-images';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  // Cache blob URLs: imageId -> blobUrl
  private blobUrlCache = new Map<string, string>();
  // Track which images belong to which widget for proper cleanup
  private widgetImageIds = new Map<string, Set<string>>();

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open WikiImages IndexedDB:', request.error);
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
        }
      };
    });
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  async saveImage(widgetId: string, file: File): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const imageId = this.generateId();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const storedImage: StoredWikiImage = {
        id: imageId,
        widgetId,
        fileName: file.name,
        mimeType: file.type,
        blob: file,
        createdAt: Date.now()
      };

      const request = store.put(storedImage);

      request.onsuccess = () => resolve(imageId);
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(imageId: string): Promise<StoredWikiImage | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(imageId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    // Revoke blob URL if cached
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImagesForWidget(widgetId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    // First get all images to revoke their blob URLs
    const images = await this.getAllImagesForWidget(widgetId);
    images.forEach(img => {
      if (this.blobUrlCache.has(img.id)) {
        URL.revokeObjectURL(this.blobUrlCache.get(img.id)!);
        this.blobUrlCache.delete(img.id);
      }
    });

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

  async getAllImagesForWidget(widgetId: string): Promise<StoredWikiImage[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('widgetId');
      const request = index.getAll(IDBKeyRange.only(widgetId));

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getBlobUrl(imageId: string): Promise<string | null> {
    // Check cache first
    if (this.blobUrlCache.has(imageId)) {
      return this.blobUrlCache.get(imageId)!;
    }

    const image = await this.getImage(imageId);
    if (!image) return null;

    const blobUrl = URL.createObjectURL(image.blob);
    this.blobUrlCache.set(imageId, blobUrl);

    // Track which widget this image belongs to for cleanup
    if (!this.widgetImageIds.has(image.widgetId)) {
      this.widgetImageIds.set(image.widgetId, new Set());
    }
    this.widgetImageIds.get(image.widgetId)!.add(imageId);

    return blobUrl;
  }

  revokeBlobUrl(imageId: string): void {
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }
  }

  revokeBlobUrlsForWidget(widgetId: string): void {
    const imageIds = this.widgetImageIds.get(widgetId);
    if (!imageIds) return;

    imageIds.forEach(imageId => {
      const url = this.blobUrlCache.get(imageId);
      if (url) {
        URL.revokeObjectURL(url);
        this.blobUrlCache.delete(imageId);
      }
    });

    this.widgetImageIds.delete(widgetId);
  }

  async importImages(widgetId: string, images: { id: string; fileName: string; mimeType: string; blob: Blob }[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      images.forEach(image => {
        const storedImage: StoredWikiImage = {
          id: image.id,
          widgetId,
          fileName: image.fileName,
          mimeType: image.mimeType,
          blob: image.blob,
          createdAt: Date.now()
        };
        store.put(storedImage);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
