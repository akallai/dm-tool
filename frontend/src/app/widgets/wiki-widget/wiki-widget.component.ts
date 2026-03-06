// src/app/widgets/wiki-widget/wiki-widget.component.ts
import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
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
import { WikiImage } from './wiki-image.extension';
import { isMarkdownContent, migrateMarkdownToHtml } from './content-migration.util';
import { WikiImageStorageService } from '../../services/wiki-image-storage.service';

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
  @Input() widgetId: string = '';
  @Output() settingsChange = new EventEmitter<void>();
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  wikiData: WikiData = { articles: [] };
  currentArticle: WikiArticle | null = null;

  sidebarCollapsed: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';

  // TipTap editor instance
  editor: Editor | null = null;
  private editorInitialized = false;
  private wikiLinkClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private imageStorage: WikiImageStorageService,
  ) {}

  ngOnInit() {
    if (this.settings && this.settings.wikiData) {
      this.wikiData = this.settings.wikiData;
      this.sidebarCollapsed = this.wikiData.sidebarCollapsed ?? false;

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
    } else {
      // Auto-initialize with Welcome article
      this.wikiData = {
        articles: [{
          id: Date.now().toString(),
          title: 'Welcome',
          content: '<h2>Welcome to your Wiki</h2><p>This is your personal knowledge base. Use the sidebar to create and organize articles.</p><p>Tips:</p><ul><li>Click <strong>+</strong> in the sidebar to add articles</li><li>Use <strong>[[Article Name]]</strong> to create wiki links</li><li>Drag and drop images directly into the editor</li></ul>',
          children: []
        }]
      };
      this.currentArticle = this.wikiData.articles[0];
      this.updateSettings();
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
        WikiImage.configure({
          onImageUpload: this.handleImageUpload.bind(this),
          resolveImageUrl: this.resolveImageUrl.bind(this),
        }),
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
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Always prevent default on anchor clicks inside the editor
      e.preventDefault();
      e.stopPropagation();

      // Check if this is a wiki link and navigate to the article
      const wikiLink = target.closest('a.wiki-link') as HTMLElement | null
        || (anchor.classList.contains('wiki-link') ? anchor : null);
      if (wikiLink) {
        const title = wikiLink.getAttribute('data-wiki-title') || null;
        const header = wikiLink.getAttribute('data-wiki-header') || null;
        if (title || header) {
          this.handleWikiLink(title, header);
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

    // Clean up corrupted wiki links that have Link extension attributes
    // (target="_blank", href="#", rel, external-link class) from prior bug
    content = content.replace(
      /<a\s+[^>]*class="[^"]*wiki-link[^"]*"[^>]*>/g,
      (match) => {
        return match
          .replace(/\s*target="[^"]*"/g, '')
          .replace(/\s*rel="[^"]*"/g, '')
          .replace(/\s*href="#"/g, '')
          .replace(/external-link\s*/g, '');
      }
    );

    this.editor.commands.setContent(content);
    // Note: wiki-image:// URLs are resolved by the WikiImage NodeView automatically
    this.cdr.markForCheck();
  }

  async handleImageUpload(file: File): Promise<string> {
    const widgetId = this.widgetId || 'default';
    const imageId = await this.imageStorage.saveImage(widgetId, file);
    return `wiki-image://${imageId}`;
  }

  async resolveImageUrl(src: string): Promise<string | null> {
    if (!src.startsWith('wiki-image://')) {
      return src;
    }
    const imageId = src.replace('wiki-image://', '');
    return this.imageStorage.getBlobUrl(imageId);
  }

  insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && this.editor) {
        const src = await this.handleImageUpload(file);
        this.editor.chain().focus().setWikiImage({ src, alt: file.name }).run();
      }
    };
    input.click();
  }

  private onContentChange() {
    this.updateSettings();
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
  handleWikiLink(title: string | null, header: string | null = null) {
    if (!title && header) {
      // Same-article header link: [[#Header]]
      this.scrollToHeader(header, this.currentArticle?.title || 'current article');
      return;
    }

    if (!title) return;

    // Searches the tree for an article with the matching title
    const found = this.findArticleByTitle(this.wikiData.articles, title);
    if (found) {
      this.selectArticle(found).then(() => {
        if (header) {
          // Cross-article header link: [[Article#Header]]
          // Small delay to let the DOM render the new content
          setTimeout(() => this.scrollToHeader(header, title), 50);
        }
      });
    } else {
      this.errorMessage = `Article "${title}" not found.`;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }, 3000);
    }
  }

  private scrollToHeader(header: string, articleName: string) {
    if (!this.editorContainer?.nativeElement) return;

    const headings = this.editorContainer.nativeElement.querySelectorAll('h1, h2, h3');
    const target = Array.from(headings).find(
      (el) => (el as HTMLElement).textContent?.trim().toLowerCase() === header.toLowerCase()
    ) as HTMLElement | undefined;

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      this.errorMessage = `Header "${header}" not found in "${articleName}".`;
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
    const input = prompt('Enter article title (use # for header, e.g. Article#Header):');
    if (input && this.editor) {
      const hashIndex = input.indexOf('#');
      let title: string | null = null;
      let header: string | null = null;

      if (hashIndex !== -1) {
        title = input.substring(0, hashIndex) || null;
        header = input.substring(hashIndex + 1) || null;
      } else {
        title = input;
      }

      this.editor.chain().focus().insertContent({
        type: 'text',
        text: input,
        marks: [{ type: 'wikiLink', attrs: { title, header } }],
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
    if (this.wikiLinkClickHandler && this.editorContainer?.nativeElement) {
      this.editorContainer.nativeElement.removeEventListener('click', this.wikiLinkClickHandler);
    }
    this.editor?.destroy();
    const widgetId = this.widgetId || 'default';
    this.imageStorage.revokeBlobUrlsForWidget(widgetId);
  }
}
