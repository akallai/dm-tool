// src/app/widgets/wiki-widget/wiki-widget.component.ts
import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { WikiStorageService, WikiRef, WikiBlobData } from '../../services/wiki-storage.service';
import { WikiPickerDialogComponent } from '../../dialogs/wiki-picker-dialog/wiki-picker-dialog.component';
import { PromptDialogComponent } from '../../dialogs/prompt-dialog/prompt-dialog.component';

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
    MatProgressSpinnerModule,
    MatDialogModule
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
  wikiRef: WikiRef | null = null;
  wikiLoaded = false;
  loading = false;
  wikiDirty = false;

  sidebarCollapsed: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';

  // TipTap editor instance
  editor: Editor | null = null;
  private editorInitialized = false;
  private previousImageIds = new Set<string>();
  private wikiLinkClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private imageStorage: WikiImageStorageService,
    private wikiStorage: WikiStorageService,
    private dialog: MatDialog,
  ) {}

  async ngOnInit() {
    if (this.settings?.wikiRef) {
      // Load wiki from blob storage
      this.wikiRef = this.settings.wikiRef;
      this.sidebarCollapsed = this.settings.sidebarCollapsed ?? false;
      await this.loadWikiFromBlob(this.wikiRef!.wikiId);
    } else if (this.settings?.wikiData) {
      // Legacy: migrate embedded wiki data to blob storage
      await this.migrateFromSettings();
    }
    // Otherwise: show empty state (no wikiRef, wikiLoaded stays false)
  }

  private async loadWikiFromBlob(wikiId: string) {
    // Restore from in-memory cache (tab switch case)
    if (this.settings?._unsavedArticles) {
      this.wikiData = {
        articles: this.settings._unsavedArticles,
        currentArticleId: this.settings.currentArticleId,
        sidebarCollapsed: this.settings.sidebarCollapsed,
      };
      this.wikiDirty = this.settings._wikiDirty ?? false;
      delete this.settings._unsavedArticles;
      delete this.settings._wikiDirty;

      const savedId = this.settings?.currentArticleId;
      if (savedId) {
        const found = this.findArticleById(this.wikiData.articles, savedId);
        this.currentArticle = found || (this.wikiData.articles.length > 0 ? this.wikiData.articles[0] : null);
      } else if (this.wikiData.articles.length > 0) {
        this.currentArticle = this.wikiData.articles[0];
      }

      this.wikiLoaded = true;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    try {
      const data = await this.wikiStorage.loadWiki(wikiId);
      if (data) {
        this.wikiData = {
          articles: data.articles,
          currentArticleId: this.settings?.currentArticleId,
          sidebarCollapsed: this.settings?.sidebarCollapsed,
        };

        // Restore current article
        const savedId = this.settings?.currentArticleId;
        if (savedId) {
          const found = this.findArticleById(this.wikiData.articles, savedId);
          this.currentArticle = found || (this.wikiData.articles.length > 0 ? this.wikiData.articles[0] : null);
        } else if (this.wikiData.articles.length > 0) {
          this.currentArticle = this.wikiData.articles[0];
        }

        this.wikiLoaded = true;
      } else {
        // Wiki blob not found — clear reference
        this.wikiRef = null;
        delete this.settings.wikiRef;
        this.settingsChange.emit();
      }
    } catch (error) {
      console.error('Error loading wiki:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async migrateFromSettings() {
    this.loading = true;
    this.cdr.markForCheck();

    try {
      const legacyData: WikiData = this.settings.wikiData;
      const name = legacyData.articles[0]?.title || 'Migrated Wiki';

      // Create wiki in blob storage
      const ref = await this.wikiStorage.createWiki(name);

      // Overwrite with actual article data
      const blobData: WikiBlobData = {
        name,
        articles: legacyData.articles,
      };
      this.wikiStorage.saveWiki(ref.wikiId, blobData);

      // Migrate images from wiki-images/{widgetId}/ to wikis/{wikiId}/images/
      // (best-effort — images will still resolve from old paths via getImage scanning)

      // Update settings: remove wikiData, add wikiRef
      this.wikiRef = ref;
      this.settings.wikiRef = ref;
      this.settings.currentArticleId = legacyData.currentArticleId;
      this.settings.sidebarCollapsed = legacyData.sidebarCollapsed;
      delete this.settings.wikiData;
      this.settingsChange.emit();

      // Load the wiki
      this.wikiData = {
        articles: legacyData.articles,
        currentArticleId: legacyData.currentArticleId,
        sidebarCollapsed: legacyData.sidebarCollapsed,
      };
      this.sidebarCollapsed = legacyData.sidebarCollapsed ?? false;

      if (legacyData.currentArticleId) {
        const found = this.findArticleById(this.wikiData.articles, legacyData.currentArticleId);
        this.currentArticle = found || (this.wikiData.articles.length > 0 ? this.wikiData.articles[0] : null);
      } else if (this.wikiData.articles.length > 0) {
        this.currentArticle = this.wikiData.articles[0];
      }

      this.wikiLoaded = true;
    } catch (error) {
      console.error('Error migrating wiki:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  createNewWiki() {
    const dialogRef = this.dialog.open(PromptDialogComponent, {
      width: '400px',
      data: {
        title: 'New Wiki',
        message: 'Enter a name for the new wiki:',
        placeholder: 'Wiki name',
        confirmText: 'Create',
      },
    });
    dialogRef.afterClosed().subscribe(async (name: string | undefined) => {
      if (!name?.trim()) return;

      this.loading = true;
      this.cdr.markForCheck();

      try {
        const ref = await this.wikiStorage.createWiki(name.trim());
        this.wikiRef = ref;
        this.settings.wikiRef = ref;
        delete this.settings.wikiData;
        this.settingsChange.emit();
        await this.loadWikiFromBlob(ref.wikiId);
      } catch (error) {
        console.error('Error creating wiki:', error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openExistingWiki() {
    const dialogRef = this.dialog.open(WikiPickerDialogComponent, {
      width: '500px',
      maxHeight: '80vh',
    });

    dialogRef.afterClosed().subscribe(async (result: WikiRef | undefined) => {
      if (result) {
        this.wikiRef = result;
        this.settings.wikiRef = result;
        this.settings.currentArticleId = undefined;
        this.settings.sidebarCollapsed = undefined;
        delete this.settings.wikiData;
        this.settingsChange.emit();
        await this.loadWikiFromBlob(result.wikiId);
      }
    });
  }

  switchWiki() {
    // Destroy editor
    if (this.wikiLinkClickHandler && this.editorContainer?.nativeElement) {
      this.editorContainer.nativeElement.removeEventListener('click', this.wikiLinkClickHandler);
      this.wikiLinkClickHandler = null;
    }
    this.editor?.destroy();
    this.editor = null;
    this.editorInitialized = false;

    // Revoke blob URLs
    if (this.wikiRef) {
      this.imageStorage.revokeBlobUrlsForWiki(this.wikiRef.wikiId);
    }

    // Clear state
    this.wikiRef = null;
    this.wikiLoaded = false;
    this.wikiData = { articles: [] };
    this.currentArticle = null;
    this.searchTerm = '';
    this.sidebarCollapsed = false;

    // Clear settings reference
    delete this.settings.wikiRef;
    delete this.settings.currentArticleId;
    delete this.settings.sidebarCollapsed;
    this.settingsChange.emit();
    this.cdr.markForCheck();
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
      onTransaction: ({ editor }) => {
        const currentIds = this.collectImageIds(editor.state.doc);

        for (const id of this.previousImageIds) {
          if (!currentIds.has(id)) {
            this.imageStorage.deleteImage(id).catch(() => {});
          }
        }

        this.previousImageIds = currentIds;
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
      article.content = content;
      // One-time migration save
      if (this.wikiRef) {
        const blobData: WikiBlobData = {
          name: this.wikiRef.wikiName,
          articles: this.wikiData.articles,
        };
        await this.wikiStorage.saveWiki(this.wikiRef.wikiId, blobData);
      }
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
    this.previousImageIds = this.collectImageIds(this.editor.state.doc);
    // Note: wiki-image:// URLs are resolved by the WikiImage NodeView automatically
    this.cdr.markForCheck();
  }

  async handleImageUpload(file: File): Promise<string> {
    const wikiId = this.wikiRef?.wikiId || this.widgetId || 'default';
    const imageId = await this.imageStorage.saveImage(wikiId, file);
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
    this.wikiDirty = true;
    this.settingsChange.emit();
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
    this.wikiDirty = true;
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
    this.wikiDirty = true;
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
    this.wikiDirty = true;
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
    this.wikiDirty = true;
    this.settingsChange.emit();
  }

  async saveWikiToServer(): Promise<void> {
    if (this.wikiRef && this.wikiLoaded) {
      const blobData: WikiBlobData = {
        name: this.wikiRef.wikiName,
        articles: this.wikiData.articles,
      };
      await this.wikiStorage.saveWiki(this.wikiRef.wikiId, blobData);
      this.wikiDirty = false;
    }
  }

  /** Save UI state (current article, sidebar) to widget settings */
  private saveUIState() {
    if (this.settings) {
      this.settings.currentArticleId = this.currentArticle?.id;
      this.settings.sidebarCollapsed = this.sidebarCollapsed;
      this.settingsChange.emit();
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.saveUIState();
    this.cdr.markForCheck();
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

  private collectImageIds(doc: any): Set<string> {
    const ids = new Set<string>();
    doc.descendants((node: any) => {
      if (node.type.name === 'wikiImage' && node.attrs.src?.startsWith('wiki-image://')) {
        ids.add(node.attrs.src.replace('wiki-image://', ''));
      }
    });
    return ids;
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
    const dialogRef = this.dialog.open(PromptDialogComponent, {
      width: '400px',
      data: {
        title: 'Insert Wiki Link',
        message: 'Enter article title (use # for header, e.g. Article#Header):',
        placeholder: 'Article#Header',
      },
    });
    dialogRef.afterClosed().subscribe((input: string | undefined) => {
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
    });
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
    // Preserve wiki data in settings so it survives tab switches
    if (this.wikiRef && this.wikiLoaded) {
      this.settings._unsavedArticles = this.wikiData.articles;
      this.settings._wikiDirty = this.wikiDirty;
    }

    if (this.wikiLinkClickHandler && this.editorContainer?.nativeElement) {
      this.editorContainer.nativeElement.removeEventListener('click', this.wikiLinkClickHandler);
    }
    this.editor?.destroy();

    if (this.wikiRef) {
      this.imageStorage.revokeBlobUrlsForWiki(this.wikiRef.wikiId);
    }
  }
}
