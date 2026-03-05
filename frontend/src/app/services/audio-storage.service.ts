import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

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

  constructor(private media: MediaService) {}

  private blobPath(widgetId: string, mappingId: string, index: number): string {
    return `audio/${widgetId}/${mappingId}/${index}`;
  }

  private metaPath(widgetId: string, mappingId: string): string {
    return `audio/${widgetId}/${mappingId}/meta.json`;
  }

  async saveAudioFiles(widgetId: string, mappingId: string, files: { fileName: string, fileDataUrl: string }[]): Promise<void> {
    await this.deleteAudioFilesForMapping(mappingId, widgetId);

    const meta = files.map((f, i) => ({ index: i, fileName: f.fileName }));
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await firstValueFrom(this.media.uploadFile(this.metaPath(widgetId, mappingId), metaBlob, 'application/json'));

    for (let i = 0; i < files.length; i++) {
      const audioBlob = this.dataUrlToBlob(files[i].fileDataUrl);
      await firstValueFrom(this.media.uploadFile(
        this.blobPath(widgetId, mappingId, i),
        audioBlob,
        audioBlob.type
      ));
    }
  }

  async getAudioFiles(mappingId: string, widgetId: string): Promise<{ fileName: string, fileDataUrl: string }[]> {
    try {
      const prefix = `audio/${widgetId}/${mappingId}/`;

      const metaBlobResp = await firstValueFrom(this.media.downloadFile(this.metaPath(widgetId, mappingId)));
      const metaText = await metaBlobResp.text();
      const meta: { index: number, fileName: string }[] = JSON.parse(metaText);

      const results: { fileName: string, fileDataUrl: string }[] = [];
      for (const entry of meta) {
        const audioBlob = await firstValueFrom(this.media.downloadFile(`${prefix}${entry.index}`));
        const dataUrl = await this.blobToDataUrl(audioBlob);
        results.push({ fileName: entry.fileName, fileDataUrl: dataUrl });
      }
      return results;
    } catch {
      return [];
    }
  }

  async getAudioFilesForWidget(widgetId: string): Promise<Map<string, { fileName: string, fileDataUrl: string }[]>> {
    const result = new Map<string, { fileName: string, fileDataUrl: string }[]>();

    try {
      const files = await firstValueFrom(this.media.listFiles(`audio/${widgetId}/`));
      const mappingIds = new Set<string>();
      for (const file of files) {
        const parts = file.name.split('/');
        if (parts.length >= 3) {
          mappingIds.add(parts[2]);
        }
      }

      for (const mappingId of mappingIds) {
        const audioFiles = await this.getAudioFiles(mappingId, widgetId);
        if (audioFiles.length > 0) {
          result.set(mappingId, audioFiles);
        }
      }
    } catch {
      // Return empty map on error
    }

    return result;
  }

  async deleteAudioFilesForWidget(widgetId: string): Promise<void> {
    try {
      const files = await firstValueFrom(this.media.listFiles(`audio/${widgetId}/`));
      for (const file of files) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    } catch {
      // Ignore
    }
  }

  async deleteAudioFilesForMapping(mappingId: string, widgetId?: string): Promise<void> {
    try {
      if (widgetId) {
        const files = await firstValueFrom(this.media.listFiles(`audio/${widgetId}/${mappingId}/`));
        for (const file of files) {
          await firstValueFrom(this.media.deleteFile(file.name));
        }
      }
    } catch {
      // Ignore
    }
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
