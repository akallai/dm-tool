import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

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
  private blobUrlCache = new Map<string, string>();
  private widgetImageIds = new Map<string, Set<string>>();

  constructor(private media: MediaService) {}

  private blobPath(widgetId: string, imageId: string): string {
    return `wiki-images/${widgetId}/${imageId}`;
  }

  async saveImage(widgetId: string, file: File): Promise<string> {
    const imageId = crypto.randomUUID();
    const path = this.blobPath(widgetId, imageId);

    await firstValueFrom(this.media.uploadFile(path, file, file.type));

    const meta = { fileName: file.name, mimeType: file.type, createdAt: Date.now() };
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(`${path}.meta`, metaBlob, 'application/json'));

    return imageId;
  }

  async getImage(imageId: string): Promise<StoredWikiImage | null> {
    try {
      const files = await firstValueFrom(this.media.listFiles(`wiki-images/`));
      const imageFile = files.find(f => f.name.includes(`/${imageId}`) && !f.name.endsWith('.meta'));
      if (!imageFile) return null;

      const parts = imageFile.name.split('/');
      const widgetId = parts[1];

      const blob = await firstValueFrom(this.media.downloadFile(imageFile.name));

      let fileName = imageId;
      let mimeType = imageFile.content_type || 'image/png';
      let createdAt = Date.now();
      try {
        const metaBlob = await firstValueFrom(this.media.downloadFile(`${imageFile.name}.meta`));
        const metaText = await metaBlob.text();
        const meta = JSON.parse(metaText);
        fileName = meta.fileName || fileName;
        mimeType = meta.mimeType || mimeType;
        createdAt = meta.createdAt || createdAt;
      } catch {
        // Metadata not found, use defaults
      }

      return { id: imageId, widgetId, fileName, mimeType, blob, createdAt };
    } catch {
      return null;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }

    const files = await firstValueFrom(this.media.listFiles(`wiki-images/`));
    const toDelete = files.filter(f => f.name.includes(`/${imageId}`));
    for (const file of toDelete) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async deleteImagesForWidget(widgetId: string): Promise<void> {
    const imageIds = this.widgetImageIds.get(widgetId);
    if (imageIds) {
      imageIds.forEach(id => {
        const url = this.blobUrlCache.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.blobUrlCache.delete(id);
        }
      });
      this.widgetImageIds.delete(widgetId);
    }

    const files = await firstValueFrom(this.media.listFiles(`wiki-images/${widgetId}/`));
    for (const file of files) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async getAllImagesForWidget(widgetId: string): Promise<StoredWikiImage[]> {
    const files = await firstValueFrom(this.media.listFiles(`wiki-images/${widgetId}/`));
    const imageFiles = files.filter(f => !f.name.endsWith('.meta'));

    const images: StoredWikiImage[] = [];
    for (const file of imageFiles) {
      const imageId = file.name.split('/').pop()!;
      const image = await this.getImage(imageId);
      if (image) images.push(image);
    }
    return images;
  }

  async getBlobUrl(imageId: string): Promise<string | null> {
    if (this.blobUrlCache.has(imageId)) {
      return this.blobUrlCache.get(imageId)!;
    }

    const image = await this.getImage(imageId);
    if (!image) return null;

    const blobUrl = URL.createObjectURL(image.blob);
    this.blobUrlCache.set(imageId, blobUrl);

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
    for (const image of images) {
      const path = this.blobPath(widgetId, image.id);
      await firstValueFrom(this.media.uploadFile(path, image.blob, image.mimeType));

      const meta = { fileName: image.fileName, mimeType: image.mimeType, createdAt: Date.now() };
      const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
      await firstValueFrom(this.media.uploadFile(`${path}.meta`, metaBlob, 'application/json'));
    }
  }
}
