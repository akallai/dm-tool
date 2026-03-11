import { Injectable } from '@angular/core';

export interface CachedFile {
  blob: Blob;
  fileName: string;
  contentType: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileCacheService {
  private cache = new Map<string, CachedFile>();

  mediaRefKey(path: string, scope: string): string {
    return `mediaRef:${scope}:${path}`;
  }

  fileStorageKey(widgetId: string): string {
    return `fileStorage:${widgetId}`;
  }

  get(key: string): CachedFile | undefined {
    return this.cache.get(key);
  }

  set(key: string, file: CachedFile): void {
    this.cache.set(key, file);
  }

  evict(key: string): void {
    this.cache.delete(key);
  }
}
