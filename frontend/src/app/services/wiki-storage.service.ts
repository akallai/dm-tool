import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MediaService } from './media.service';

export interface WikiMeta {
  wikiId: string;
  name: string;
  createdAt: number;
}

export interface WikiBlobData {
  name: string;
  articles: WikiArticleData[];
}

export interface WikiArticleData {
  id: string;
  title: string;
  content: string;
  children?: WikiArticleData[];
}

export interface WikiRef {
  wikiId: string;
  wikiName: string;
}

@Injectable({
  providedIn: 'root'
})
export class WikiStorageService {
  constructor(private media: MediaService) {}

  private metaPath(wikiId: string): string {
    return `wikis/${wikiId}/meta.json`;
  }

  private dataPath(wikiId: string): string {
    return `wikis/${wikiId}/data.json`;
  }

  private uploadJson(path: string, data: unknown): Promise<void> {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    return firstValueFrom(this.media.uploadFile(path, blob, 'application/json'));
  }

  async createWiki(name: string): Promise<WikiRef> {
    const wikiId = crypto.randomUUID();
    const createdAt = Date.now();

    const meta = { name, createdAt };
    const data: WikiBlobData = {
      name,
      articles: [
        {
          id: crypto.randomUUID(),
          title: 'Welcome',
          content: '<p>Welcome to your new wiki!</p>',
        }
      ]
    };

    await this.uploadJson(this.metaPath(wikiId), meta);
    await this.uploadJson(this.dataPath(wikiId), data);

    return { wikiId, wikiName: name };
  }

  async listWikis(): Promise<WikiMeta[]> {
    const files = await firstValueFrom(this.media.listFiles('wikis/'));
    const metaFiles = files.filter(f => f.name.endsWith('/meta.json'));

    const wikis: WikiMeta[] = [];
    for (const file of metaFiles) {
      try {
        const blob = await firstValueFrom(this.media.downloadFile(file.name));
        const text = await blob.text();
        const meta = JSON.parse(text) as { name: string; createdAt: number };
        const parts = file.name.split('/');
        const wikiId = parts[1];
        wikis.push({ wikiId, name: meta.name, createdAt: meta.createdAt });
      } catch {
        // Skip wikis with corrupt metadata
      }
    }

    wikis.sort((a, b) => b.createdAt - a.createdAt);
    return wikis;
  }

  async loadWiki(wikiId: string): Promise<WikiBlobData | null> {
    try {
      const blob = await firstValueFrom(this.media.downloadFile(this.dataPath(wikiId)));
      const text = await blob.text();
      return JSON.parse(text) as WikiBlobData;
    } catch {
      return null;
    }
  }

  async saveWiki(wikiId: string, data: WikiBlobData): Promise<void> {
    await this.uploadJson(this.dataPath(wikiId), data);
  }

  async deleteWiki(wikiId: string): Promise<void> {
    const files = await firstValueFrom(this.media.listFiles(`wikis/${wikiId}/`));
    for (const file of files) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }

  async renameWiki(wikiId: string, newName: string): Promise<void> {
    try {
      const blob = await firstValueFrom(this.media.downloadFile(this.metaPath(wikiId)));
      const text = await blob.text();
      const meta = JSON.parse(text) as { name: string; createdAt: number };
      meta.name = newName;
      await this.uploadJson(this.metaPath(wikiId), meta);
    } catch {
      // If meta.json doesn't exist, create it
      await this.uploadJson(this.metaPath(wikiId), { name: newName, createdAt: Date.now() });
    }
  }
}
