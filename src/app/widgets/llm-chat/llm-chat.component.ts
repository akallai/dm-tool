import { Component, Input, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OpenAIService, ChatMessage } from '../../services/openai.service';

interface WikiArticle {
  id: string;
  title: string;
  content: string;
  children?: WikiArticle[];
}

@Component({
  selector: 'app-llm-chat',
  template: `
    <div class="llm-chat">
      <div class="chat-history" #chatHistory>
        <div *ngFor="let msg of conversation" 
             [ngClass]="{'user-message': msg.role === 'user', 'assistant-message': msg.role === 'assistant'}"
             class="message">
          <strong>{{ msg.role === 'user' ? 'You' : 'Assistant' }}:</strong>
          <span [innerHTML]="formatMessage(msg.content)"></span>
        </div>
        <div *ngIf="isLoading" class="loading-message">
          <mat-spinner diameter="20"></mat-spinner>
          <span>Thinking...</span>
        </div>
      </div>
      
      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
      
      <div class="chat-controls">
        <button mat-icon-button 
                (click)="clearChat()" 
                [disabled]="isLoading || conversation.length === 0"
                matTooltip="Clear chat">
          <mat-icon>delete</mat-icon>
        </button>
        <mat-form-field appearance="outline" class="input-field">
          <textarea 
            matInput 
            placeholder="Type your message..." 
            [(ngModel)]="newMessage" 
            (keydown)="handleKeyDown($event)"
            rows="1"
            #messageInput>
          </textarea>
        </mat-form-field>
        <button mat-icon-button 
                color="primary" 
                (click)="sendMessage()" 
                [disabled]="isLoading || !newMessage.trim()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .llm-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .message {
      margin: 8px 0;
      padding: 8px;
      border-radius: 4px;
      white-space: pre-wrap;
    }
    .user-message {
      background: #e3f2fd;
      margin-left: 20%;
    }
    .assistant-message {
      background: #fff;
      margin-right: 20%;
    }
    .loading-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      color: #666;
    }
    .chat-controls {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 0 8px 8px 8px;
    }
    .input-field {
      flex: 1;
      margin: 0;
    }
    .error-message {
      color: #f44336;
      padding: 8px;
      margin: 8px;
      background: #ffebee;
      border-radius: 4px;
    }
    :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ]
})
export class LlmChatComponent implements OnInit, OnDestroy {
  // Rest of the component code remains the same...
  @Input() settings: any;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('chatHistory') chatHistory!: ElementRef;

  conversation: ChatMessage[] = [];
  newMessage: string = '';
  wikiContext: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  private refreshInterval: any;

  constructor(private openAIService: OpenAIService) {}

  ngOnInit() {
    this.refreshWikiContext();
    // Automatically refresh wiki context every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.refreshWikiContext();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private findWikiWidget(): any {
    // Get all widgets from the workspace
    const widgets = (window as any).workspace?.widgets || [];
    // Find the Wiki widget
    return widgets.find((w: any) => w.type === 'WIKI_WIDGET');
  }

  private getAllArticles(articles: WikiArticle[]): WikiArticle[] {
    let allArticles: WikiArticle[] = [];
    for (const article of articles) {
      allArticles.push(article);
      if (article.children && article.children.length > 0) {
        allArticles = allArticles.concat(this.getAllArticles(article.children));
      }
    }
    return allArticles;
  }

  refreshWikiContext() {
    const wikiWidget = this.findWikiWidget();
    const articles = wikiWidget?.settings?.wikiData?.articles;
    if (articles && Array.isArray(articles)) {
      this.wikiContext = this.formatWikiArticles(articles);
    } else {
      this.wikiContext = '';
    }
  }

  private formatWikiArticles(articles: WikiArticle[], prefix = ''): string {
    let result = '';
    for (const article of articles) {
      if (article.title && article.content) {
        result += `${prefix}${article.title}\n\`\`\`\n${article.content.trim()}\n\`\`\`\n\n`;
      }
      if (article.children && Array.isArray(article.children) && article.children.length > 0) {
        result += this.formatWikiArticles(article.children, `${prefix}  `);
      }
    }
    return result;
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  clearChat() {
    this.conversation = [];
    this.errorMessage = '';
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;
    
    if (!this.settings?.apiKey || !this.settings?.model) {
      this.errorMessage = 'Please configure API key and model in settings';
      return;
    }

    this.errorMessage = '';
    const messages: ChatMessage[] = [];

    if (this.settings.prompt) {
      messages.push({ role: 'system', content: this.settings.prompt });
    }

    // Add wiki context if available
    if (this.wikiContext) {
      messages.push({ 
        role: 'system', 
        content: `Here is the wiki context to consider in your responses:\n\n${this.wikiContext}`
      });
    }

    messages.push(...this.conversation);
    messages.push({ role: 'user', content: this.newMessage });
    this.conversation.push({ role: 'user', content: this.newMessage });
    

    const sentMessage = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    try {
      const response = await this.openAIService
        .chat(this.settings.apiKey, messages, this.settings.model)
        .toPromise();

      if (response?.choices?.[0]?.message) {
        const assistantMessage = response.choices[0].message;
        this.conversation.push({
          role: 'assistant',
          content: assistantMessage.content
        });
        
        setTimeout(() => {
          if (this.chatHistory) {
            this.chatHistory.nativeElement.scrollTop = this.chatHistory.nativeElement.scrollHeight;
          }
        });
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to get response';
      this.conversation = this.conversation.filter(msg => msg.content !== sentMessage);
    } finally {
      this.isLoading = false;
    }
  }
}
