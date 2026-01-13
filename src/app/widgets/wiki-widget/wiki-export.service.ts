import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { WikiImageStorageService } from '../../services/wiki-image-storage.service';
import { WikiData, WikiArticle } from './wiki-widget.component';

@Injectable()
export class WikiExportService {
  constructor(private imageStorage: WikiImageStorageService) {}

  async exportToZip(widgetId: string, wikiData: WikiData): Promise<Blob> {
    const zip = new JSZip();

    // 1. Collect all wiki-image:// references from content
    const imageIds = this.extractImageIds(wikiData);

    // 2. Add wiki.json
    zip.file('wiki.json', JSON.stringify(wikiData, null, 2));

    // 3. Add images folder with each image
    if (imageIds.length > 0) {
      const imagesFolder = zip.folder('images');
      if (imagesFolder) {
        for (const imageId of imageIds) {
          const image = await this.imageStorage.getImage(imageId);
          if (image) {
            // Use imageId_fileName format for unique naming
            const ext = this.getExtension(image.mimeType);
            imagesFolder.file(`${imageId}${ext}`, image.blob);
          }
        }
      }
    }

    return zip.generateAsync({ type: 'blob' });
  }

  async importFromZip(widgetId: string, zipBlob: Blob): Promise<WikiData> {
    const zip = await JSZip.loadAsync(zipBlob);

    // 1. Read wiki.json
    const wikiJsonFile = zip.file('wiki.json');
    if (!wikiJsonFile) {
      throw new Error('Invalid wiki archive: wiki.json not found');
    }

    const wikiJsonContent = await wikiJsonFile.async('string');
    const wikiData: WikiData = JSON.parse(wikiJsonContent);

    // 2. Import images from images folder
    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
      const imageFiles = Object.keys(zip.files).filter(name =>
        name.startsWith('images/') && name !== 'images/'
      );

      const imagesToImport: { id: string; fileName: string; mimeType: string; blob: Blob }[] = [];

      for (const filePath of imageFiles) {
        const file = zip.file(filePath);
        if (file) {
          const blob = await file.async('blob');
          const fileName = filePath.replace('images/', '');
          // Extract imageId from filename (format: uuid.ext)
          const imageId = fileName.replace(/\.[^.]+$/, '');
          const mimeType = this.getMimeType(fileName);

          imagesToImport.push({
            id: imageId,
            fileName,
            mimeType,
            blob
          });
        }
      }

      if (imagesToImport.length > 0) {
        await this.imageStorage.importImages(widgetId, imagesToImport);
      }
    }

    return wikiData;
  }

  private extractImageIds(wikiData: WikiData): string[] {
    const regex = /wiki-image:\/\/([a-f0-9-]+)/g;
    const ids = new Set<string>();

    const scanArticle = (article: WikiArticle) => {
      if (article.content) {
        let match;
        while ((match = regex.exec(article.content)) !== null) {
          ids.add(match[1]);
        }
        // Reset regex lastIndex for next article
        regex.lastIndex = 0;
      }
      article.children?.forEach(scanArticle);
    };

    wikiData.articles.forEach(scanArticle);
    return Array.from(ids);
  }

  private getExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
    };
    return mimeToExt[mimeType] || '.png';
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const extToMime: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
    };
    return extToMime[ext || ''] || 'image/png';
  }
}
