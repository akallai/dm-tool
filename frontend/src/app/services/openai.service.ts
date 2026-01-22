import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
export class OpenAIService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  chat(apiKey: string, messages: ChatMessage[], model: string, temperature?: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${apiKey}`);

    const body: ChatCompletionRequest = {
      model,
      messages
    };

    // Only include temperature if explicitly provided
    if (temperature !== undefined && temperature !== null) {
      body.temperature = temperature;
    }

    return this.http.post(this.apiUrl, body, { headers }).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => new Error(error.error?.error?.message || 'An error occurred'));
      })
    );
  }
}