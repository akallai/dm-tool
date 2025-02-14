import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { MatIconModule } from '@angular/material/icon';

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
  templateUrl: './wiki-widget.component.html',
  styleUrls: ['./wiki-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule ]
})
export class WikiWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() settings: any;
  wikiData: WikiData = { articles: [] };
  currentArticle: WikiArticle | null = null;
  isEditing = false;
  fileHandle: FileSystemFileHandle | null = null;
  fileName: string = '';
  saveTimeout: any;
  renderedContent: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Load wiki data from settings if available
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
        this.settings.wikiData = this.wikiData;
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
        this.settings.wikiData = this.wikiData;
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

  async updateRenderedContent() {
    if (this.currentArticle) {
      let content = this.currentArticle.content || '';
      // Convert wiki links (e.g. [[Article Title]]) into clickable links.
      content = content.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        return `<a href="#" class="wiki-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('wikiLink', { detail: '${p1}' }))">${p1}</a>`;
      });
      const html: string = await marked.parse(content); // await the result
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

  // Listen for wiki link clicks from the rendered content
  ngAfterViewInit() {
    window.addEventListener('wikiLink', (event: any) => {
      this.handleWikiLink(event.detail);
    });
  }

  ngOnDestroy() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    window.removeEventListener('wikiLink', this.handleWikiLink as any);
  }
}
