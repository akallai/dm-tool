import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = '/api/chat';

  constructor(private http: HttpClient) {}

  chat(messages: ChatMessage[], model: string, temperature?: number): Observable<any> {
    const body: ChatCompletionRequest = {
      model,
      messages
    };

    if (temperature !== undefined && temperature !== null) {
      body.temperature = temperature;
    }

    return this.http.post(this.apiUrl, body).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => new Error(error.error?.error?.message || error.error?.error || 'An error occurred'));
      })
    );
  }
}
