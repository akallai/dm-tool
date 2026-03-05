import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface FileMetadata {
  name: string;
  size: number;
  content_type: string | null;
  last_modified: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private apiBase = '/api';

  constructor(private http: HttpClient) {}

  listFiles(prefix?: string): Observable<FileMetadata[]> {
    let params = new HttpParams();
    if (prefix) {
      params = params.set('prefix', prefix);
    }
    return this.http
      .get<{ files: FileMetadata[] }>(`${this.apiBase}/media`, { params })
      .pipe(map(response => response.files));
  }

  downloadFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiBase}/media/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    });
  }

  uploadFile(filename: string, data: Blob, contentType: string): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': contentType });
    return this.http
      .put(`${this.apiBase}/media/${encodeURIComponent(filename)}`, data, {
        headers,
        responseType: 'text'
      }).pipe(map(() => void 0));
  }

  deleteFile(filename: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/media/${encodeURIComponent(filename)}`);
  }
}
