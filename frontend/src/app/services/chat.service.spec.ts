import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST to /api/chat with messages and model', () => {
    const messages = [{ role: 'user' as const, content: 'Hello' }];

    service.chat(messages, 'gpt-4').subscribe();

    const req = httpMock.expectOne('/api/chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ model: 'gpt-4', messages });
    req.flush({ choices: [] });
  });

  it('should include temperature when provided', () => {
    const messages = [{ role: 'user' as const, content: 'Hi' }];

    service.chat(messages, 'gpt-4', 0.7).subscribe();

    const req = httpMock.expectOne('/api/chat');
    expect(req.request.body.temperature).toBe(0.7);
    req.flush({ choices: [] });
  });

  it('should not include temperature when undefined', () => {
    service.chat([{ role: 'user' as const, content: 'Hi' }], 'gpt-4').subscribe();

    const req = httpMock.expectOne('/api/chat');
    expect(req.request.body.temperature).toBeUndefined();
    req.flush({ choices: [] });
  });

  it('should transform API errors into Error objects', () => {
    let error: Error | undefined;

    service.chat([{ role: 'user' as const, content: 'Hi' }], 'gpt-4').subscribe({
      error: (e) => { error = e; },
    });

    const req = httpMock.expectOne('/api/chat');
    req.flush({ error: { message: 'Rate limited' } }, { status: 429, statusText: 'Too Many Requests' });

    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe('Rate limited');
  });

  it('should fallback to generic error message', () => {
    let error: Error | undefined;

    service.chat([{ role: 'user' as const, content: 'Hi' }], 'gpt-4').subscribe({
      error: (e) => { error = e; },
    });

    const req = httpMock.expectOne('/api/chat');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe('An error occurred');
  });
});
