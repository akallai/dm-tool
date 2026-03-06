import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

export interface StoredWikiImage {
  id: string;
  wikiId: string;
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
  private wikiImageIds = new Map<string, Set<string>>();

  constructor(private media: MediaService) {}

  private blobPath(wikiId: string, imageId: string): string {
    return `wikis/${wikiId}/images/${imageId}`;
  }

  async saveImage(wikiId: string, file: File): Promise<string> {
    const imageId = crypto.randomUUID();
    const path = this.blobPath(wikiId, imageId);

    await firstValueFrom(this.media.uploadFile(path, file, file.type));

    const meta = { fileName: file.name, mimeType: file.type, createdAt: Date.now() };
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(`${path}.meta`, metaBlob, 'application/json'));

    return imageId;
  }

  async getImage(imageId: string): Promise<StoredWikiImage | null> {
    try {
      const files = await firstValueFrom(this.media.listFiles('wikis/'));
      const imageFile = files.find(f => f.name.includes(`/images/${imageId}`) && !f.name.endsWith('.meta'));
      if (!imageFile) return null;

      const parts = imageFile.name.split('/');
      const wikiId = parts[1];

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

      return { id: imageId, wikiId, fileName, mimeType, blob, createdAt };
    } catch {
      return null;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }

    const files = await firstValueFrom(this.media.listFiles('wikis/'));
    const toDelete = files.filter(f => f.name.includes(`/images/${imageId}`));
    for (const file of toDelete) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async deleteImagesForWiki(wikiId: string): Promise<void> {
    const imageIds = this.wikiImageIds.get(wikiId);
    if (imageIds) {
      imageIds.forEach(id => {
        const url = this.blobUrlCache.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.blobUrlCache.delete(id);
        }
      });
      this.wikiImageIds.delete(wikiId);
    }

    const files = await firstValueFrom(this.media.listFiles(`wikis/${wikiId}/images/`));
    for (const file of files) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async getAllImagesForWiki(wikiId: string): Promise<StoredWikiImage[]> {
    const files = await firstValueFrom(this.media.listFiles(`wikis/${wikiId}/images/`));
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

    if (!this.wikiImageIds.has(image.wikiId)) {
      this.wikiImageIds.set(image.wikiId, new Set());
    }
    this.wikiImageIds.get(image.wikiId)!.add(imageId);

    return blobUrl;
  }

  revokeBlobUrl(imageId: string): void {
    if (this.blobUrlCache.has(imageId)) {
      URL.revokeObjectURL(this.blobUrlCache.get(imageId)!);
      this.blobUrlCache.delete(imageId);
    }
  }

  revokeBlobUrlsForWiki(wikiId: string): void {
    const imageIds = this.wikiImageIds.get(wikiId);
    if (!imageIds) return;

    imageIds.forEach(imageId => {
      const url = this.blobUrlCache.get(imageId);
      if (url) {
        URL.revokeObjectURL(url);
        this.blobUrlCache.delete(imageId);
      }
    });

    this.wikiImageIds.delete(wikiId);
  }

  async importImages(wikiId: string, images: { id: string; fileName: string; mimeType: string; blob: Blob }[]): Promise<void> {
    for (const image of images) {
      const path = this.blobPath(wikiId, image.id);
      await firstValueFrom(this.media.uploadFile(path, image.blob, image.mimeType));

      const meta = { fileName: image.fileName, mimeType: image.mimeType, createdAt: Date.now() };
      const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
      await firstValueFrom(this.media.uploadFile(`${path}.meta`, metaBlob, 'application/json'));
    }
  }
}
