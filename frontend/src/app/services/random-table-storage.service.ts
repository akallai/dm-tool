import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MediaService } from './media.service';

export interface TableMeta {
  tableId: string;
  name: string;
  createdAt: number;
}

export interface TableBlobData {
  name: string;
  mappings: { key: string; itemsText: string }[];
  mappingCategories: { key: string; value: string }[];
  useWeightedSelection: boolean;
}

export interface TableRef {
  tableId: string;
  tableName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RandomTableStorageService {
  constructor(private media: MediaService) {}

  private metaPath(tableId: string): string {
    return `random-tables/${tableId}/meta.json`;
  }

  private dataPath(tableId: string): string {
    return `random-tables/${tableId}/data.json`;
  }

  private uploadJson(path: string, data: unknown): Promise<void> {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    return firstValueFrom(this.media.uploadFile(path, blob, 'application/json'));
  }

  async createTable(name: string): Promise<TableRef> {
    const tableId = crypto.randomUUID();
    const createdAt = Date.now();

    const meta = { name, createdAt };
    const data: TableBlobData = {
      name,
      mappings: [],
      mappingCategories: [],
      useWeightedSelection: true,
    };

    await this.uploadJson(this.metaPath(tableId), meta);
    await this.uploadJson(this.dataPath(tableId), data);

    return { tableId, tableName: name };
  }

  async listTables(): Promise<TableMeta[]> {
    const files = await firstValueFrom(this.media.listFiles('random-tables/'));
    const metaFiles = files.filter(f => f.name.endsWith('/meta.json'));

    const tables: TableMeta[] = [];
    for (const file of metaFiles) {
      try {
        const blob = await firstValueFrom(this.media.downloadFile(file.name));
        const text = await blob.text();
        const meta = JSON.parse(text) as { name: string; createdAt: number };
        const parts = file.name.split('/');
        const tableId = parts[1];
        tables.push({ tableId, name: meta.name, createdAt: meta.createdAt });
      } catch {
        // Skip tables with corrupt metadata
      }
    }

    tables.sort((a, b) => b.createdAt - a.createdAt);
    return tables;
  }

  async loadTable(tableId: string): Promise<TableBlobData | null> {
    try {
      const blob = await firstValueFrom(this.media.downloadFile(this.dataPath(tableId)));
      const text = await blob.text();
      return JSON.parse(text) as TableBlobData;
    } catch {
      return null;
    }
  }

  async saveTable(tableId: string, data: TableBlobData): Promise<void> {
    await this.uploadJson(this.dataPath(tableId), data);
  }

  async deleteTable(tableId: string): Promise<void> {
    const files = await firstValueFrom(this.media.listFiles(`random-tables/${tableId}/`));
    for (const file of files) {
      await firstValueFrom(this.media.deleteFile(file.name));
    }
  }
}
