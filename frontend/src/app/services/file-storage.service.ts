import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { firstValueFrom } from 'rxjs';

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

  constructor(private media: MediaService) {}

  async saveFile(id: string, file: File): Promise<void> {
    const blobPath = `files/${id}/${file.name}`;
    await firstValueFrom(this.media.uploadFile(blobPath, file, file.type));
  }

  async getFile(id: string): Promise<StoredFile | null> {
    try {
      const files = await firstValueFrom(this.media.listFiles(`files/${id}/`));
      if (files.length === 0) return null;

      const fileInfo = files[0];
      const blob = await firstValueFrom(this.media.downloadFile(fileInfo.name));
      const fileName = fileInfo.name.split('/').pop() || fileInfo.name;

      return {
        id,
        blob,
        fileName,
        fileType: fileInfo.content_type || 'application/octet-stream'
      };
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      const files = await firstValueFrom(this.media.listFiles(`files/${id}/`));
      for (const file of files) {
        await firstValueFrom(this.media.deleteFile(file.name));
      }
    } catch {
      // Ignore errors on delete
    }
  }
}
