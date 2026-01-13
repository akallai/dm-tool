// src/app/widgets/wiki-widget/wiki-widget.component.ts
import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { debounce } from '../../utils/debounce';

// TipTap imports
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { WikiLink } from './wiki-link.extension';
import { isMarkdownContent, migrateMarkdownToHtml } from './content-migration.util';

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
  children?: WikiArticle[];
}

export interface WikiData {
  articles: WikiArticle[];
  currentArticleId?: string;
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
    MatTooltipModule,
    ScrollingModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WikiWidgetComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<void>();
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  wikiData: WikiData = { articles: [] };
  currentArticle: WikiArticle | null = null;
  fileHandle: FileSystemFileHandle | null = null;
  fileName: string = '';

  sidebarCollapsed: boolean = false;
  searchTerm: string = '';
  isSaving: boolean = false;
  errorMessage: string = '';

  // TipTap editor instance
  editor: Editor | null = null;
  private editorInitialized = false;
  private wikiLinkClickHandler: ((e: MouseEvent) => void) | null = null;

  // Create a debounced save function
  private debouncedSaveWiki = debounce(this.saveWiki.bind(this), 1000);

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.settings && this.settings.wikiData) {
      this.wikiData = this.settings.wikiData;

      // Restore UI state from wikiData
      this.sidebarCollapsed = this.wikiData.sidebarCollapsed ?? false;

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

  ngAfterViewInit() {
    this.initializeEditor();
  }

  ngAfterViewChecked() {
    // Initialize editor when the container becomes available (e.g., after *ngIf renders)
    if (!this.editorInitialized && this.editorContainer?.nativeElement) {
      this.initializeEditor();
    }
  }

  private initializeEditor() {
    if (this.editorInitialized || !this.editorContainer?.nativeElement) {
      return;
    }

    this.editorInitialized = true;

    this.editor = new Editor({
      element: this.editorContainer.nativeElement,
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'external-link',
          },
        }),
        Placeholder.configure({
          placeholder: 'Write your article here...'
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        WikiLink,
      ],
      content: '',
      editable: true,
      onUpdate: ({ editor }) => {
        if (this.currentArticle) {
          this.currentArticle.content = editor.getHTML();
          this.onContentChange();
        }
      },
      onSelectionUpdate: () => {
        this.cdr.markForCheck();
      },
    });

    // Handle wiki link clicks via event delegation
    this.wikiLinkClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('wiki-link')) {
        e.preventDefault();
        e.stopPropagation();

        const title = target.getAttribute('data-wiki-title') || target.textContent;
        if (title) {
          this.handleWikiLink(title);
        }
      }
    };
    this.editorContainer.nativeElement.addEventListener('click', this.wikiLinkClickHandler);

    // Load current article content if available
    if (this.currentArticle) {
      this.loadArticleContent(this.currentArticle);
    }
  }

  private async loadArticleContent(article: WikiArticle) {
    if (!this.editor) return;

    let content = article.content || '';

    // Migrate markdown to HTML if needed (backward compatibility)
    if (isMarkdownContent(content)) {
      content = await migrateMarkdownToHtml(content);
      article.content = content; // Update the article with migrated content
      this.updateSettings();
    }

    this.editor.commands.setContent(content);
    this.cdr.markForCheck();
  }

  private onContentChange() {
    this.updateSettings();
    this.debouncedSaveWiki();
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
          await this.loadArticleContent(this.currentArticle);
        } else {
          this.currentArticle = null;
          this.editor?.commands.setContent('');
        }

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
        this.editor?.commands.setContent('');
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

    if (this.editor) {
      this.editor.commands.setContent('');
      setTimeout(() => this.editor?.commands.focus(), 0);
    } else {
      // Editor will be initialized via ngAfterViewChecked, focus after it's ready
      setTimeout(() => {
        this.editor?.commands.focus();
      }, 100);
    }

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

    if (this.editor) {
      this.editor.commands.setContent('');
      setTimeout(() => this.editor?.commands.focus(), 0);
    }

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
      if (this.currentArticle) {
        this.loadArticleContent(this.currentArticle);
      } else {
        this.editor?.commands.setContent('');
      }
    }
    this.saveUIState();
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

  async selectArticle(article: WikiArticle) {
    this.currentArticle = article;
    this.saveUIState();

    await this.loadArticleContent(article);
  }

  updateArticle() {
    this.updateSettings();
    this.debouncedSaveWiki();
  }

  updateSettings() {
    if (this.settings) {
      this.settings.wikiData = this.wikiData;
      this.settingsChange.emit();
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.saveUIState();
    this.cdr.markForCheck();
  }

  // Save UI state (current article, sidebar state) to settings
  private saveUIState() {
    this.wikiData.currentArticleId = this.currentArticle?.id;
    this.wikiData.sidebarCollapsed = this.sidebarCollapsed;
    this.updateSettings();
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

  // Handler for wiki link clicks
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

  // Toolbar methods for TipTap editor
  toggleBold() {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic() {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleHeading(level: 1 | 2 | 3) {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  toggleBulletList() {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList() {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleBlockquote() {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  toggleCodeBlock() {
    this.editor?.chain().focus().toggleCodeBlock().run();
  }

  insertWikiLink() {
    const title = prompt('Enter article title:');
    if (title && this.editor) {
      // Insert text with wiki link mark applied directly
      this.editor.chain().focus().insertContent({
        type: 'text',
        text: title,
        marks: [{ type: 'wikiLink', attrs: { title } }],
      }).run();
    }
  }

  // Table methods
  insertTable() {
    this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  addColumnBefore() {
    this.editor?.chain().focus().addColumnBefore().run();
  }

  addColumnAfter() {
    this.editor?.chain().focus().addColumnAfter().run();
  }

  deleteColumn() {
    this.editor?.chain().focus().deleteColumn().run();
  }

  addRowBefore() {
    this.editor?.chain().focus().addRowBefore().run();
  }

  addRowAfter() {
    this.editor?.chain().focus().addRowAfter().run();
  }

  deleteRow() {
    this.editor?.chain().focus().deleteRow().run();
  }

  deleteTable() {
    this.editor?.chain().focus().deleteTable().run();
  }

  mergeCells() {
    this.editor?.chain().focus().mergeCells().run();
  }

  splitCell() {
    this.editor?.chain().focus().splitCell().run();
  }

  // Table capability checks
  canAddColumnBefore(): boolean {
    return this.editor?.can().addColumnBefore() ?? false;
  }

  canAddColumnAfter(): boolean {
    return this.editor?.can().addColumnAfter() ?? false;
  }

  canAddRowBefore(): boolean {
    return this.editor?.can().addRowBefore() ?? false;
  }

  canAddRowAfter(): boolean {
    return this.editor?.can().addRowAfter() ?? false;
  }

  canDeleteColumn(): boolean {
    return this.editor?.can().deleteColumn() ?? false;
  }

  canDeleteRow(): boolean {
    return this.editor?.can().deleteRow() ?? false;
  }

  canDeleteTable(): boolean {
    return this.editor?.can().deleteTable() ?? false;
  }

  ngOnDestroy() {
    // Remove click event listener to prevent memory leaks
    if (this.wikiLinkClickHandler && this.editorContainer?.nativeElement) {
      this.editorContainer.nativeElement.removeEventListener('click', this.wikiLinkClickHandler);
    }

    // Destroy TipTap editor
    this.editor?.destroy();

    // Cancel any pending debounced operations
    if (this.debouncedSaveWiki.cancel) {
      this.debouncedSaveWiki.cancel();
    }
  }
}
