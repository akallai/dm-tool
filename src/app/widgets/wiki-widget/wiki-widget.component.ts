import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marked } from 'marked';

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
}

export interface WikiData {
  articles: WikiArticle[];
}

@Component({
  selector: 'app-wiki-widget',
  template: `
    <div class="wiki-widget">
      <div class="wiki-header">
        <button mat-button (click)="openExistingWiki()">Open Wiki</button>
        <button mat-button (click)="createNewWiki()">New Wiki</button>
      </div>
      <div class="wiki-body" *ngIf="fileHandle || wikiData.articles.length">
        <!-- Sidebar with improved toggle functionality -->
        <div class="wiki-sidebar" [class.collapsed]="sidebarCollapsed">
          <!-- Toggle button moved outside the conditionally rendered content -->
          <div class="sidebar-toggle">
            <button mat-icon-button (click)="toggleSidebar()">
              <mat-icon>{{ sidebarCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          </div>
          
          <!-- Sidebar content -->
          <div class="sidebar-content" [class.hidden]="sidebarCollapsed">
            <div class="sidebar-header">
              <h3>Articles</h3>
            </div>
            <button mat-mini-fab color="primary" (click)="addArticle()">+</button>
            <input
              type="text"
              placeholder="Search articles..."
              [(ngModel)]="searchTerm"
              class="search-input"
            />
            <ul>
              <li *ngFor="let article of filteredArticles" [class.active]="article.id === currentArticle?.id">
                <span (click)="selectArticle(article)">{{ article.title }}</span>
                <button mat-icon-button color="warn" (click)="deleteArticle(article)">
                  <mat-icon>delete</mat-icon>
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Main content area -->
        <div class="wiki-content">
          <div *ngIf="currentArticle" class="article-container">
            <div class="article-header">
              <input 
                type="text" 
                [(ngModel)]="currentArticle.title" 
                (ngModelChange)="updateArticle()" 
                placeholder="Article Title"
                class="title-input"
              >
              <button mat-button (click)="toggleEditing()">
                {{ isEditing ? 'Preview' : 'Edit' }}
              </button>
            </div>
            
            <div *ngIf="isEditing" class="editor-container">
              <textarea 
                [(ngModel)]="currentArticle.content" 
                (ngModelChange)="updateArticle()" 
                placeholder="Write your article here..."
                class="content-editor"
              ></textarea>
            </div>
            
            <div *ngIf="!isEditing" class="preview-container" [innerHTML]="renderedContent"></div>
          </div>
          
          <div *ngIf="!currentArticle" class="empty-state">
            <p>No article selected. Add an article from the sidebar.</p>
          </div>
        </div>
      </div>
      <div *ngIf="!fileHandle && wikiData.articles.length === 0" class="empty-wiki">
        <p>No wiki loaded. Open an existing wiki or create a new one.</p>
      </div>
    </div>
  `,
  styles: [`
    .wiki-widget {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .wiki-header {
      display: flex;
      gap: 8px;
      padding: 8px;
      background: #3f51b5;
      color: white;
      button {
        color: white !important;
      }
    }
    
    .wiki-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 0; /* Important for nested flex containers */
    }
    
    .wiki-sidebar {
      display: flex;
      background: #f5f5f5;
      transition: width 0.3s;
      position: relative;
      width: 200px;
      
      &.collapsed {
        width: 40px;
        
        .sidebar-content {
          display: none;
        }
      }
    }

    .sidebar-toggle {
      position: absolute;
      right: 0;
      top: 8px;
      z-index: 10;
      background: #f5f5f5;
      border-radius: 0 4px 4px 0;
    }

    .sidebar-content {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
      width: 100%;
      
      &.hidden {
        display: none;
      }
    }
    
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      
      h3 {
        margin: 0;
        font-size: 1.1em;
      }
    }
    
    .search-input {
      width: 100%;
      padding: 4px 8px;
      margin: 8px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    ul {
      list-style: none;
      padding: 0;
      margin: 8px 0;
      
      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px;
        cursor: pointer;
        margin: 4px 0;
        
        &.active {
          background: #ddd;
        }
        
        span {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
    
    .wiki-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: white;
      min-height: 0; /* Important for nested flex containers */
    }
    
    .article-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden; /* Important for child content scrolling */
    }
    
    .article-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      flex-shrink: 0; /* Prevent header from shrinking */
      
      .title-input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1em;
      }
    }
    
    .editor-container {
      flex: 1;
      display: flex;
      overflow: hidden;
      padding: 8px;
      min-height: 0; /* Important for nested flex containers */
    }
    
    .content-editor {
      flex: 1;
      width: 100%;
      resize: none;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      overflow-y: auto;
    }
    
    .preview-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 8px;
    }
    
    .empty-state, .empty-wiki {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 16px;
      text-align: center;
      color: #666;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule]
})
export class WikiWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() settings: any;
  wikiData: WikiData = { articles: [] };
  currentArticle: WikiArticle | null = null;
  isEditing: boolean = false;
  fileHandle: FileSystemFileHandle | null = null;
  fileName: string = '';
  saveTimeout: any;
  renderedContent: SafeHtml = '';
  
  sidebarCollapsed: boolean = false;

  // Add search term property
  searchTerm: string = '';

  // Computed property to return filtered articles
  get filteredArticles(): WikiArticle[] {
    if (!this.searchTerm) {
      return this.wikiData.articles;
    }
    const term = this.searchTerm.toLowerCase();
    return this.wikiData.articles.filter(article =>
      article.title.toLowerCase().includes(term) ||
      article.content.toLowerCase().includes(term)
      // If you add a filename property, include:
      // || (article.fileName && article.fileName.toLowerCase().includes(term))
    );
  }

  // Handler for wiki link events.
  wikiLinkHandler = (event: CustomEvent) => {
    this.handleWikiLink(event.detail);
  };

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Load wiki data from settings if available.
    if (this.settings && this.settings.wikiData) {
      this.wikiData = this.settings.wikiData;
      if (this.wikiData.articles.length > 0) {
        this.currentArticle = this.wikiData.articles[0];
      }
    }
    this.updateRenderedContent();
  }

  async openExistingWiki() {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Wiki Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        this.fileHandle = handle;
        this.fileName = handle.name;
        const file = await handle.getFile();
        const text = await file.text();
        this.wikiData = JSON.parse(text);
        if (this.settings) {
          this.settings.wikiData = this.wikiData;
        }
        if (this.wikiData.articles.length > 0) {
          this.currentArticle = this.wikiData.articles[0];
        }
        this.updateRenderedContent();
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error opening wiki file:', error);
    }
  }

  async createNewWiki() {
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'untitled_wiki.json',
          types: [{
            description: 'Wiki Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        this.fileHandle = handle;
        this.fileName = handle.name;
        this.wikiData = { articles: [] };
        if (this.settings) {
          this.settings.wikiData = this.wikiData;
        }
        this.currentArticle = null;
        this.updateRenderedContent();
      } else {
        alert('File System Access API is not supported in this browser.');
      }
    } catch (error) {
      console.error('Error creating wiki file:', error);
    }
  }

  async saveWiki() {
    if (this.fileHandle) {
      try {
        const writable = await this.fileHandle.createWritable();
        await writable.write(JSON.stringify(this.wikiData, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Error saving wiki file:', error);
      }
    }
  }

  addArticle() {
    const newArticle: WikiArticle = {
      id: Date.now().toString(),
      title: 'New Article',
      content: ''
    };
    this.wikiData.articles.push(newArticle);
    this.currentArticle = newArticle;
    this.isEditing = true;
    this.updateSettings();
  }

  selectArticle(article: WikiArticle) {
    this.currentArticle = article;
    this.isEditing = false;
    this.updateRenderedContent();
  }

  deleteArticle(article: WikiArticle) {
    this.wikiData.articles = this.wikiData.articles.filter(a => a.id !== article.id);
    if (this.currentArticle?.id === article.id) {
      this.currentArticle = this.wikiData.articles.length ? this.wikiData.articles[0] : null;
    }
    this.updateSettings();
    this.updateRenderedContent();
  }

  updateArticle() {
    this.updateSettings();
    if (!this.isEditing) {
      this.updateRenderedContent();
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    // Auto-save after 1 second of no changes.
    this.saveTimeout = setTimeout(() => {
      this.saveWiki();
    }, 1000);
  }

  updateSettings() {
    if (this.settings) {
      this.settings.wikiData = this.wikiData;
    }
  }

  toggleEditing() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.updateRenderedContent();
    }
  }

  // Toggle the collapsed state of the sidebar.
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  async updateRenderedContent() {
    if (this.currentArticle) {
      let content = this.currentArticle.content || '';
      // Convert wiki links (e.g. [[Article Title]]) into clickable links.
      content = content.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        return `<a href="#" class="wiki-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('wikiLink', { detail: '${p1}' }))">${p1}</a>`;
      });
      const html: string = await marked.parse(content);
      this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
    }
  }

  handleWikiLink(title: string) {
    const found = this.wikiData.articles.find(a => a.title === title);
    if (found) {
      this.selectArticle(found);
    } else {
      alert(`Article "${title}" not found.`);
    }
  }

  ngAfterViewInit() {
    window.addEventListener('wikiLink', this.wikiLinkHandler as EventListener);
  }

  ngOnDestroy() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    window.removeEventListener('wikiLink', this.wikiLinkHandler as EventListener);
  }
}
