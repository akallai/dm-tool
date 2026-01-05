// src/app/widgets/wiki-widget/wiki-widget.component.ts
import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marked } from 'marked';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { debounce } from 'lodash';

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
  children?: WikiArticle[];
}

export interface WikiData {
  articles: WikiArticle[];
  currentArticleId?: string;
  isEditing?: boolean;
  sidebarCollapsed?: boolean;
}

@Component({
  selector: 'app-wiki-widget',
  templateUrl: './wiki-widget.component.html',
  styleUrls: ['./wiki-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    MatButtonModule,
    MatIconModule,
    ScrollingModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WikiWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<void>();
  wikiData: WikiData = { articles: [] };
  currentArticle: WikiArticle | null = null;
  isEditing: boolean = false;
  fileHandle: FileSystemFileHandle | null = null;
  fileName: string = '';
  renderedContent: SafeHtml = '';
  
  sidebarCollapsed: boolean = false;
  searchTerm: string = '';
  isSaving: boolean = false;
  errorMessage: string = '';

  // Create a debounced save function
  private debouncedSaveWiki = debounce(this.saveWiki.bind(this), 1000);
  
  // Handler for wiki link events as a properly bound method
  private wikiLinkHandler = (event: CustomEvent) => {
    this.handleWikiLink(event.detail);
  };

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.settings && this.settings.wikiData) {
      this.wikiData = this.settings.wikiData;

      // Restore UI state from wikiData
      this.sidebarCollapsed = this.wikiData.sidebarCollapsed ?? false;
      this.isEditing = this.wikiData.isEditing ?? false;

      // Restore the currently open article by ID
      if (this.wikiData.currentArticleId) {
        const found = this.findArticleById(this.wikiData.articles, this.wikiData.currentArticleId);
        if (found) {
          this.currentArticle = found;
        } else if (this.wikiData.articles.length > 0) {
          this.currentArticle = this.wikiData.articles[0];
        }
      } else if (this.wikiData.articles.length > 0) {
        this.currentArticle = this.wikiData.articles[0];
      }
    }
    this.updateRenderedContent();
  }

  private findArticleById(articles: WikiArticle[], id: string): WikiArticle | null {
    for (const article of articles) {
      if (article.id === id) {
        return article;
      }
      if (article.children) {
        const found = this.findArticleById(article.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
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
        
        // Show loading indicator
        this.isSaving = true;
        this.cdr.markForCheck();
        
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
        this.isSaving = false;
        this.cdr.markForCheck();
      } else {
        this.errorMessage = 'File System Access API is not supported in this browser.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    } catch (error) {
      console.error('Error opening wiki file:', error);
      this.errorMessage = 'Failed to open wiki file';
      this.isSaving = false;
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 3000);
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
        await this.saveWiki();
      } else {
        this.errorMessage = 'File System Access API is not supported in this browser.';
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating wiki file:', error);
      this.errorMessage = 'Failed to create wiki file';
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 3000);
    }
  }

  async saveWiki() {
    if (this.fileHandle) {
      try {
        this.isSaving = true;
        this.cdr.markForCheck();
        
        const writable = await this.fileHandle.createWritable();
        await writable.write(JSON.stringify(this.wikiData, null, 2));
        await writable.close();
        
        this.isSaving = false;
        this.cdr.markForCheck();
      } catch (error) {
        console.error('Error saving wiki file:', error);
        this.errorMessage = 'Failed to save wiki file';
        this.isSaving = false;
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      }
    }
  }

  // Add a new root article
  addArticle() {
    const newArticle: WikiArticle = {
      id: Date.now().toString(),
      title: 'New Article',
      content: '',
      children: []
    };
    this.wikiData.articles.push(newArticle);
    this.currentArticle = newArticle;
    this.isEditing = true;
    this.saveUIState();
    this.cdr.markForCheck();
  }

  // Add a sub-article to a given parent article
  addSubArticle(parent: WikiArticle, event: MouseEvent) {
    event.stopPropagation();
    const newArticle: WikiArticle = {
      id: Date.now().toString(),
      title: 'New Sub-Article',
      content: '',
      children: []
    };
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(newArticle);
    this.currentArticle = newArticle;
    this.isEditing = true;
    this.saveUIState();
    this.cdr.markForCheck();
  }

  // Recursively remove an article from a list by id
  deleteArticle(article: WikiArticle, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.wikiData.articles = this.removeArticle(this.wikiData.articles, article.id);
    if (this.currentArticle?.id === article.id) {
      this.currentArticle = this.wikiData.articles.length ? this.wikiData.articles[0] : null;
    }
    this.saveUIState();
    this.updateRenderedContent();
    this.cdr.markForCheck();
  }

  private removeArticle(articles: WikiArticle[], id: string): WikiArticle[] {
    return articles.filter(a => {
      if (a.id === id) {
        return false;
      }
      if (a.children) {
        a.children = this.removeArticle(a.children, id);
      }
      return true;
    });
  }

  selectArticle(article: WikiArticle) {
    this.currentArticle = article;
    this.isEditing = false;
    this.saveUIState();
    this.updateRenderedContent();
    this.cdr.markForCheck();
  }

  updateArticle() {
    this.updateSettings();
    if (!this.isEditing) {
      this.updateRenderedContent();
    }
    this.debouncedSaveWiki();
  }

  updateSettings() {
    if (this.settings) {
      this.settings.wikiData = this.wikiData;
      this.settingsChange.emit();
    }
  }

  toggleEditing() {
    this.isEditing = !this.isEditing;
    this.saveUIState();
    if (!this.isEditing) {
      this.updateRenderedContent();
    }
    this.cdr.markForCheck();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.saveUIState();
    this.cdr.markForCheck();
  }

  // Save UI state (current article, editing mode, sidebar state) to settings
  private saveUIState() {
    this.wikiData.currentArticleId = this.currentArticle?.id;
    this.wikiData.isEditing = this.isEditing;
    this.wikiData.sidebarCollapsed = this.sidebarCollapsed;
    this.updateSettings();
  }

  // Convert article content to HTML with wiki links
  async updateRenderedContent() {
    if (this.currentArticle) {
      let content = this.currentArticle.content || '';
      content = content.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        return `<a href="#" class="wiki-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('wikiLink', { detail: '${p1}' }))">${p1}</a>`;
      });
      const html: string = await marked.parse(content);
      this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
      this.cdr.markForCheck();
    }
  }

  // Recursively filter articles by a search term
  get filteredArticles(): WikiArticle[] {
    if (!this.searchTerm) {
      return this.wikiData.articles;
    }
    return this.filterArticles(this.wikiData.articles, this.searchTerm);
  }
  
  private filterArticles(articles: WikiArticle[], term: string): WikiArticle[] {
    return articles.reduce((result: WikiArticle[], article) => {
      const lowerTerm = term.toLowerCase();
      const titleMatches = article.title.toLowerCase().includes(lowerTerm) || 
                           article.content.toLowerCase().includes(lowerTerm);
      
      let filteredChildren: WikiArticle[] = [];
      if (article.children) {
        filteredChildren = this.filterArticles(article.children, term);
      }
      
      if (titleMatches || filteredChildren.length > 0) {
        result.push({
          ...article,
          children: filteredChildren
        });
      }
      return result;
    }, []);
  }

  // Handler for wiki link events
  handleWikiLink(title: string) {
    // Searches the tree (flattened) for an article with the matching title
    const found = this.findArticleByTitle(this.wikiData.articles, title);
    if (found) {
      this.selectArticle(found);
    } else {
      this.errorMessage = `Article "${title}" not found.`;
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 3000);
    }
  }

  private findArticleByTitle(articles: WikiArticle[], title: string): WikiArticle | null {
    for (const article of articles) {
      if (article.title === title) {
        return article;
      }
      if (article.children) {
        const found = this.findArticleByTitle(article.children, title);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // Track articles for better performance
  trackByArticleId(index: number, article: WikiArticle): string {
    return article.id;
  }

  ngAfterViewInit() {
    window.addEventListener('wikiLink', this.wikiLinkHandler as EventListener);
  }

  ngOnDestroy() {
    // Clean up event listener to prevent memory leaks
    window.removeEventListener('wikiLink', this.wikiLinkHandler as EventListener);
    
    // Cancel any pending debounced operations
    if (this.debouncedSaveWiki.cancel) {
      this.debouncedSaveWiki.cancel();
    }
  }
}