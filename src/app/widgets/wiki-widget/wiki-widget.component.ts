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
  children?: WikiArticle[];
}

export interface WikiData {
  articles: WikiArticle[];
}

@Component({
  selector: 'app-wiki-widget',
  templateUrl: './wiki-widget.component.html',
  styleUrls: ['./wiki-widget.component.scss'],
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
  searchTerm: string = '';

  // Use the recursive filter function for search
  get filteredArticles(): WikiArticle[] {
    if (!this.searchTerm) {
      return this.wikiData.articles;
    }
    return this.filterArticles(this.wikiData.articles, this.searchTerm);
  }

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
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
    this.updateSettings();
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
    this.updateSettings();
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
    this.updateSettings();
    this.updateRenderedContent();
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
    this.updateRenderedContent();
  }

  updateArticle() {
    this.updateSettings();
    if (!this.isEditing) {
      this.updateRenderedContent();
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
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

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
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
    }
  }

  // Recursively filter articles by a search term
  private filterArticles(articles: WikiArticle[], term: string): WikiArticle[] {
    return articles.reduce((result: WikiArticle[], article) => {
      const lowerTerm = term.toLowerCase();
      const titleMatches = article.title.toLowerCase().includes(lowerTerm) || article.content.toLowerCase().includes(lowerTerm);
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

  // Handler for wiki link events.
  wikiLinkHandler = (event: CustomEvent) => {
    this.handleWikiLink(event.detail);
  };

  handleWikiLink(title: string) {
    // Searches the tree (flattened) for an article with the matching title.
    const found = this.findArticleByTitle(this.wikiData.articles, title);
    if (found) {
      this.selectArticle(found);
    } else {
      alert(`Article "${title}" not found.`);
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

  ngAfterViewInit() {
    window.addEventListener('wikiLink', this.wikiLinkHandler as EventListener);
  }

  ngOnDestroy() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    window.removeEventListener('wikiLink', this.wikiLinkHandler as EventListener);
  }
}
