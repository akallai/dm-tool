import { Component, Input, ElementRef, ViewChild, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { FileStorageService } from '../../services/file-storage.service';
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Set up PDF.js worker - served from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

interface OutlineItem {
  title: string;
  dest: any;
  items: OutlineItem[];
  expanded?: boolean;
}

interface SearchMatch {
  pageNum: number;
  index: number;
  text: string;
}

@Component({
  selector: 'app-image-pdf-viewer',
  template: `
    <div class="viewer-container">
      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        (change)="onFileSelected($event)"
        accept="image/*,.pdf"
        style="display: none"
      />

      <!-- Empty state -->
      <div *ngIf="!fileUrl && !loading" class="empty-state">
        <button mat-raised-button color="primary" (click)="openFileDialog()">
          Open File
        </button>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="empty-state">
        <span>Loading...</span>
      </div>

      <!-- Image viewer -->
      <img
        *ngIf="fileUrl && isImage"
        [src]="fileUrl"
        class="content-view"
        alt="Selected image"
      />

      <!-- PDF viewer with sidebar -->
      <div *ngIf="fileUrl && !isImage && pdfDoc" class="pdf-layout">
        <!-- Table of Contents Sidebar -->
        <div class="toc-sidebar" *ngIf="showToc && outline.length > 0">
          <div class="toc-header">
            <span>Contents</span>
            <button mat-icon-button (click)="showToc = false">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="toc-content">
            <ng-container *ngTemplateOutlet="outlineTemplate; context: { items: outline, level: 0 }"></ng-container>
          </div>
        </div>

        <!-- PDF Pages Container -->
        <div class="pdf-viewer" #pdfContainer (scroll)="onScroll()">
          <div *ngFor="let page of pages; let i = index"
               class="page-wrapper"
               [attr.data-page]="i + 1"
               [class.has-match]="pageHasMatch(i + 1)"
               #pageWrapper>
            <div class="page-container">
              <canvas [id]="'pdf-page-' + (i + 1)" class="pdf-canvas"></canvas>
              <div *ngIf="pageHasMatch(i + 1) && showSearch" class="match-indicator">
                {{ getPageMatchCount(i + 1) }} match{{ getPageMatchCount(i + 1) > 1 ? 'es' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div *ngIf="fileUrl" class="file-controls">
        <ng-container *ngIf="!isImage && pdfDoc">
          <!-- TOC Button -->
          <button mat-icon-button
                  (click)="showToc = !showToc"
                  *ngIf="outline.length > 0"
                  [class.active]="showToc"
                  matTooltip="Table of Contents">
            <mat-icon>menu_book</mat-icon>
          </button>

          <!-- Search Button -->
          <button mat-icon-button
                  (click)="toggleSearch()"
                  [class.active]="showSearch"
                  matTooltip="Search (Ctrl+F)">
            <mat-icon>search</mat-icon>
          </button>

          <span class="separator">|</span>

          <!-- Page Navigation -->
          <button mat-icon-button (click)="previousPage()" [disabled]="currentPage <= 1">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <input
            type="number"
            [(ngModel)]="pageInput"
            (keydown.enter)="goToPage()"
            (blur)="goToPage()"
            min="1"
            [max]="totalPages"
            class="page-input"
          />
          <span class="page-total">/ {{ totalPages }}</span>

          <button mat-icon-button (click)="nextPage()" [disabled]="currentPage >= totalPages">
            <mat-icon>chevron_right</mat-icon>
          </button>

          <span class="separator">|</span>

          <!-- Zoom Controls -->
          <button mat-icon-button (click)="zoomOut()" [disabled]="zoomLevel <= 0.5">
            <mat-icon>remove</mat-icon>
          </button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button mat-icon-button (click)="zoomIn()" [disabled]="zoomLevel >= 3">
            <mat-icon>add</mat-icon>
          </button>

          <span class="separator">|</span>
        </ng-container>
        <button mat-button (click)="clearFile()">Clear</button>
      </div>

      <!-- Search Bar -->
      <div *ngIf="showSearch && pdfDoc" class="search-bar">
        <input
          #searchInput
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearchInput()"
          (keydown.enter)="nextMatch()"
          (keydown.escape)="closeSearch()"
          placeholder="Search in document..."
          class="search-input"
        />
        <span class="match-count" *ngIf="searchQuery">
          {{ pagesWithMatches.length > 0 ? (getCurrentPageMatchIndex() + 1) + '/' + pagesWithMatches.length + ' pages' : 'No matches' }}
        </span>
        <button mat-icon-button (click)="previousMatch()" [disabled]="pagesWithMatches.length === 0" matTooltip="Previous page">
          <mat-icon>keyboard_arrow_up</mat-icon>
        </button>
        <button mat-icon-button (click)="nextMatch()" [disabled]="pagesWithMatches.length === 0" matTooltip="Next page">
          <mat-icon>keyboard_arrow_down</mat-icon>
        </button>
        <button mat-icon-button (click)="closeSearch()" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <!-- Outline recursive template -->
    <ng-template #outlineTemplate let-items="items" let-level="level">
      <div *ngFor="let item of items" class="toc-item" [style.padding-left.px]="level * 16">
        <div class="toc-item-row" (click)="goToOutlineItem(item)">
          <button mat-icon-button
                  *ngIf="item.items?.length"
                  (click)="toggleOutlineItem(item, $event)"
                  class="expand-btn">
            <mat-icon>{{ item.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
          </button>
          <span class="toc-title">{{ item.title }}</span>
        </div>
        <div *ngIf="item.expanded && item.items?.length">
          <ng-container *ngTemplateOutlet="outlineTemplate; context: { items: item.items, level: level + 1 }"></ng-container>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .viewer-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: transparent;
      position: relative;
      color: var(--text-primary);
      overflow: hidden;
    }
    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content-view {
      flex: 1;
      width: 100%;
      height: 100%;
      object-fit: contain;
      border: none;
      background: rgba(255, 255, 255, 0.05);
    }
    .pdf-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    .toc-sidebar {
      width: 250px;
      background: var(--panel-bg, rgba(0,0,0,0.5));
      border-right: 1px solid var(--glass-border-color, rgba(255,255,255,0.1));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .toc-header {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--glass-border-color, rgba(255,255,255,0.1));
      font-weight: 500;
    }
    .toc-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }
    .toc-item {
      font-size: 13px;
    }
    .toc-item-row {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toc-item-row:hover {
      background: rgba(255,255,255,0.1);
    }
    .expand-btn {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }
    .expand-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .toc-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .pdf-viewer {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      padding: 10px;
      gap: 10px;
    }
    .page-wrapper {
      display: flex;
      justify-content: center;
    }
    .page-container {
      position: relative;
      display: inline-block;
    }
    .pdf-canvas {
      display: block;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      background: white;
    }
    .page-wrapper.has-match .page-container {
      outline: 3px solid rgba(255, 200, 0, 0.8);
      outline-offset: -3px;
    }
    .match-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 200, 0, 0.9);
      color: #000;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 2;
    }
    .file-controls {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 4px;
      padding: 4px 8px;
      backdrop-filter: var(--glass-backdrop);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .file-controls button.active {
      background: rgba(255,255,255,0.2);
    }
    .page-input {
      width: 45px;
      padding: 4px;
      border: 1px solid var(--glass-border-color, rgba(255,255,255,0.2));
      border-radius: 4px;
      background: rgba(0,0,0,0.2);
      color: var(--text-primary, white);
      text-align: center;
      font-size: 13px;
    }
    .page-input::-webkit-inner-spin-button,
    .page-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .page-total {
      font-size: 13px;
      margin-right: 4px;
    }
    .zoom-level {
      font-size: 12px;
      min-width: 40px;
      text-align: center;
    }
    .separator {
      margin: 0 4px;
      opacity: 0.5;
    }
    .search-bar {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--panel-bg);
      border: var(--glass-border);
      border-radius: 4px;
      padding: 4px 8px;
      backdrop-filter: var(--glass-backdrop);
      display: flex;
      align-items: center;
      gap: 4px;
      z-index: 10;
    }
    .search-input {
      width: 200px;
      padding: 6px 10px;
      border: 1px solid var(--glass-border-color, rgba(255,255,255,0.2));
      border-radius: 4px;
      background: rgba(0,0,0,0.2);
      color: var(--text-primary, white);
      font-size: 13px;
      outline: none;
    }
    .search-input:focus {
      border-color: var(--primary-color, #64b5f6);
    }
    .search-input::placeholder {
      color: rgba(255,255,255,0.5);
    }
    .match-count {
      font-size: 12px;
      opacity: 0.8;
      min-width: 60px;
      text-align: center;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule]
})
export class ImagePdfViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() settings: any;
  @Input() widgetId!: string;
  @Output() settingsChange = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  // For template access
  Math = Math;

  fileUrl: string | null = null;
  isImage = false;
  loading = false;

  // PDF specific
  pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  currentPage = 1;
  pageInput = 1;
  totalPages = 0;
  pages: number[] = [];
  outline: OutlineItem[] = [];
  showToc = false;
  zoomLevel = 1;
  private pdfData: ArrayBuffer | null = null;
  private renderedPages = new Set<number>();
  private renderingPages = new Set<number>();
  private scrollTimeout: any = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastContainerWidth = 0;
  private resizeTimeout: any = null;

  // Search
  showSearch = false;
  searchQuery = '';
  searchMatches: SearchMatch[] = [];
  currentMatchIndex = 0;
  pagesWithMatches: number[] = [];
  private pageTextContents: Map<number, string> = new Map();
  private searchTimeout: any = null;
  private pageMatchCounts: Map<number, number> = new Map();

  constructor(
    private sanitizer: DomSanitizer,
    private fileStorage: FileStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Restore page number from settings
    if (this.settings?.pdfPage) {
      this.currentPage = this.settings.pdfPage;
      this.pageInput = this.currentPage;
    }

    // Try to restore file from IndexedDB
    if (this.widgetId) {
      this.loading = true;
      this.cdr.detectChanges();
      try {
        const storedFile = await this.fileStorage.getFile(this.widgetId);
        if (storedFile?.blob) {
          this.isImage = storedFile.fileType?.startsWith('image/') || false;

          if (this.isImage) {
            this.fileUrl = URL.createObjectURL(storedFile.blob);
          } else {
            this.pdfData = await storedFile.blob.arrayBuffer();
            this.fileUrl = 'pdf';
            await this.loadPdf();
          }
        }
      } catch (error) {
        console.error('Error restoring file from IndexedDB:', error);
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  ngAfterViewInit() {
    if (this.pdfDoc) {
      setTimeout(() => this.renderVisiblePages(), 100);
    }
    this.setupResizeObserver();
  }

  private setupResizeObserver() {
    // Use ResizeObserver to detect container size changes with debounce
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        // Only re-render if width changed significantly (more than 5px)
        if (this.pdfDoc && Math.abs(newWidth - this.lastContainerWidth) > 5) {
          // Debounce: wait until resize stops before re-rendering
          if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
          }
          this.resizeTimeout = setTimeout(() => {
            this.lastContainerWidth = newWidth;
            this.reRenderAllPages();
          }, 200);
        }
      }
    });

    // Observe the pdf container if it exists already
    this.observePdfContainer();
  }

  private observePdfContainer() {
    // Observe the pdf container when it exists
    if (this.resizeObserver && this.pdfContainer?.nativeElement) {
      this.lastContainerWidth = this.pdfContainer.nativeElement.clientWidth;
      this.resizeObserver.observe(this.pdfContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.fileUrl && this.isImage) {
      URL.revokeObjectURL(this.fileUrl);
    }
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.isImage = file.type.startsWith('image/');

      // Clean up previous file
      if (this.fileUrl && this.isImage) {
        URL.revokeObjectURL(this.fileUrl);
      }
      if (this.pdfDoc) {
        this.pdfDoc.destroy();
        this.pdfDoc = null;
      }

      // Reset state
      this.currentPage = 1;
      this.pageInput = 1;
      this.renderedPages.clear();
      this.renderingPages.clear();
      this.outline = [];
      this.showToc = false;
      this.zoomLevel = 1;

      if (this.isImage) {
        this.fileUrl = URL.createObjectURL(file);
      } else {
        this.pdfData = await file.arrayBuffer();
        this.fileUrl = 'pdf';
        await this.loadPdf();
      }

      // Save to IndexedDB
      if (this.widgetId) {
        try {
          await this.fileStorage.saveFile(this.widgetId, file);
        } catch (error) {
          console.error('Error saving file to IndexedDB:', error);
        }
      }

      // Save metadata
      if (this.settings) {
        this.settings.fileName = file.name;
        this.settings.fileType = file.type;
        this.settings.pdfPage = this.currentPage;
        delete this.settings.fileDataUrl;
        this.notifySettingsChange();
      }

      this.cdr.detectChanges();
    }
  }

  private async loadPdf() {
    if (!this.pdfData) return;

    try {
      const loadingTask = pdfjsLib.getDocument({ data: this.pdfData });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

      // Ensure currentPage is valid
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
      if (this.currentPage < 1) {
        this.currentPage = 1;
      }
      this.pageInput = this.currentPage;

      // Load outline (table of contents)
      await this.loadOutline();

      this.cdr.detectChanges();

      // Wait for DOM to update, then render visible pages and scroll to saved page
      setTimeout(() => {
        this.renderVisiblePages();
        if (this.currentPage > 1) {
          this.scrollToPage(this.currentPage);
        }
        // Setup resize observer for the pdf container now that it exists
        this.observePdfContainer();
      }, 100);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  private async loadOutline() {
    if (!this.pdfDoc) return;

    try {
      const outline = await this.pdfDoc.getOutline();
      if (outline) {
        this.outline = this.processOutline(outline);
      }
    } catch (error) {
      console.error('Error loading PDF outline:', error);
    }
  }

  private processOutline(items: any[]): OutlineItem[] {
    return items.map(item => ({
      title: item.title,
      dest: item.dest,
      items: item.items ? this.processOutline(item.items) : [],
      expanded: false
    }));
  }

  async goToOutlineItem(item: OutlineItem) {
    if (!this.pdfDoc || !item.dest) return;

    try {
      let pageIndex: number;

      if (typeof item.dest === 'string') {
        // Named destination
        const dest = await this.pdfDoc.getDestination(item.dest);
        if (dest) {
          const ref = dest[0];
          pageIndex = await this.pdfDoc.getPageIndex(ref);
        } else {
          return;
        }
      } else if (Array.isArray(item.dest)) {
        // Explicit destination
        const ref = item.dest[0];
        pageIndex = await this.pdfDoc.getPageIndex(ref);
      } else {
        return;
      }

      const pageNum = pageIndex + 1;
      this.currentPage = pageNum;
      this.pageInput = pageNum;
      this.scrollToPage(pageNum);
      this.savePage();
    } catch (error) {
      console.error('Error navigating to outline item:', error);
    }
  }

  toggleOutlineItem(item: OutlineItem, event: Event) {
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  private async renderVisiblePages() {
    if (!this.pdfDoc || !this.pdfContainer?.nativeElement) return;

    const container = this.pdfContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const pageWrappers = container.querySelectorAll('.page-wrapper');

    for (let i = 0; i < pageWrappers.length; i++) {
      const wrapper = pageWrappers[i] as HTMLElement;
      const rect = wrapper.getBoundingClientRect();
      const pageNum = i + 1;

      // Check if page is visible or near viewport (render buffer)
      const buffer = containerRect.height;
      const isVisible = rect.bottom > containerRect.top - buffer &&
                       rect.top < containerRect.bottom + buffer;

      if (isVisible && !this.renderedPages.has(pageNum)) {
        await this.renderPage(pageNum);
      }
    }
  }

  private async renderPage(pageNum: number) {
    // Skip if already rendered at current zoom or currently rendering
    if (!this.pdfDoc || this.renderedPages.has(pageNum) || this.renderingPages.has(pageNum)) return;

    this.renderingPages.add(pageNum);

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = document.getElementById(`pdf-page-${pageNum}`) as HTMLCanvasElement;
      if (!canvas) {
        this.renderingPages.delete(pageNum);
        return;
      }

      const context = canvas.getContext('2d')!;

      // Calculate scale based on container width and zoom level
      const containerWidth = this.pdfContainer?.nativeElement?.clientWidth || 800;
      const viewport = page.getViewport({ scale: 1 });
      const baseScale = (containerWidth - 40) / viewport.width;
      const scale = baseScale * this.zoomLevel;
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas
      }).promise;

      this.renderedPages.add(pageNum);
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    } finally {
      this.renderingPages.delete(pageNum);
    }
  }

  onScroll() {
    // Debounce scroll handling
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.renderVisiblePages();
      this.updateCurrentPageFromScroll();
    }, 100);
  }

  private updateCurrentPageFromScroll() {
    if (!this.pdfContainer?.nativeElement) return;

    const container = this.pdfContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 3;
    const pageWrappers = container.querySelectorAll('.page-wrapper');

    for (let i = 0; i < pageWrappers.length; i++) {
      const wrapper = pageWrappers[i] as HTMLElement;
      const rect = wrapper.getBoundingClientRect();

      if (rect.top <= containerCenter && rect.bottom > containerCenter) {
        const pageNum = i + 1;
        if (this.currentPage !== pageNum) {
          this.currentPage = pageNum;
          this.pageInput = pageNum;
          this.savePage();
          this.cdr.detectChanges();
        }
        break;
      }
    }
  }

  private scrollToPage(pageNum: number) {
    if (!this.pdfContainer?.nativeElement) return;

    const container = this.pdfContainer.nativeElement;
    const pageWrapper = container.querySelector(`[data-page="${pageNum}"]`) as HTMLElement;

    if (pageWrapper) {
      pageWrapper.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageInput = this.currentPage;
      this.scrollToPage(this.currentPage);
      this.savePage();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageInput = this.currentPage;
      this.scrollToPage(this.currentPage);
      this.savePage();
    }
  }

  goToPage() {
    let page = Math.floor(this.pageInput);
    if (isNaN(page) || page < 1) {
      page = 1;
    } else if (page > this.totalPages) {
      page = this.totalPages;
    }

    this.pageInput = page;
    this.currentPage = page;
    this.scrollToPage(page);
    this.savePage();
  }

  zoomIn() {
    if (this.zoomLevel < 3) {
      this.zoomLevel = Math.min(3, this.zoomLevel + 0.25);
      this.reRenderAllPages();
    }
  }

  zoomOut() {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
      this.reRenderAllPages();
    }
  }

  private reRenderAllPages() {
    // Clear rendered pages so they get re-rendered at new zoom level
    this.renderedPages.clear();
    this.cdr.detectChanges();
    // Re-render visible pages
    setTimeout(() => this.renderVisiblePages(), 50);
  }

  private savePage() {
    if (this.settings) {
      this.settings.pdfPage = this.currentPage;
      this.notifySettingsChange();
    }
  }

  async clearFile() {
    if (this.fileUrl && this.isImage) {
      URL.revokeObjectURL(this.fileUrl);
    }
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }

    this.fileUrl = null;
    this.pdfData = null;
    this.currentPage = 1;
    this.pageInput = 1;
    this.totalPages = 0;
    this.pages = [];
    this.outline = [];
    this.showToc = false;
    this.zoomLevel = 1;
    this.renderedPages.clear();
    this.renderingPages.clear();
    this.showSearch = false;
    this.searchQuery = '';
    this.searchMatches = [];
    this.currentMatchIndex = 0;
    this.pagesWithMatches = [];
    this.pageTextContents.clear();
    this.pageMatchCounts.clear();

    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }

    if (this.widgetId) {
      try {
        await this.fileStorage.deleteFile(this.widgetId);
      } catch (error) {
        console.error('Error deleting file from IndexedDB:', error);
      }
    }

    if (this.settings) {
      this.settings.fileName = null;
      this.settings.fileType = null;
      this.settings.pdfPage = null;
      delete this.settings.fileDataUrl;
      this.notifySettingsChange();
    }
  }

  private notifySettingsChange() {
    this.settingsChange.emit(this.settings);
  }

  // Search methods
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f' && this.pdfDoc) {
      event.preventDefault();
      this.toggleSearch();
    }
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.searchInputRef?.nativeElement?.focus();
      }, 50);
    }
  }

  closeSearch() {
    this.showSearch = false;
    this.searchQuery = '';
    this.searchMatches = [];
    this.currentMatchIndex = 0;
    this.pageMatchCounts.clear();
    this.pagesWithMatches = [];
    this.cdr.detectChanges();
  }

  onSearchInput() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  private async performSearch() {
    if (!this.pdfDoc || !this.searchQuery.trim()) {
      this.searchMatches = [];
      this.currentMatchIndex = 0;
      this.pageMatchCounts.clear();
      this.pagesWithMatches = [];
      this.cdr.detectChanges();
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.searchMatches = [];
    this.pageMatchCounts.clear();
    this.pagesWithMatches = [];

    // Extract text from all pages if not already done
    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      if (!this.pageTextContents.has(pageNum)) {
        await this.extractPageText(pageNum);
      }
    }

    // Search through all pages
    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      const text = this.pageTextContents.get(pageNum);
      if (!text) continue;

      const lowerText = text.toLowerCase();
      let searchIndex = 0;
      let pageMatchCount = 0;

      while ((searchIndex = lowerText.indexOf(query, searchIndex)) !== -1) {
        this.searchMatches.push({
          pageNum,
          index: pageMatchCount++,
          text: text.substring(searchIndex, searchIndex + query.length)
        });
        searchIndex += 1;
      }

      if (pageMatchCount > 0) {
        this.pageMatchCounts.set(pageNum, pageMatchCount);
        this.pagesWithMatches.push(pageNum);
      }
    }

    this.currentMatchIndex = 0;
    this.cdr.detectChanges();

    // Go to first page with matches
    if (this.pagesWithMatches.length > 0) {
      this.goToMatchPage(this.pagesWithMatches[0]);
    }
  }

  private async extractPageText(pageNum: number) {
    if (!this.pdfDoc) return;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items.filter((item): item is TextItem => 'str' in item);

      const text = items.map(item => item.str).join(' ');
      this.pageTextContents.set(pageNum, text);
    } catch (error) {
      console.error(`Error extracting text from page ${pageNum}:`, error);
    }
  }

  // Helper methods for template
  pageHasMatch(pageNum: number): boolean {
    return this.pageMatchCounts.has(pageNum);
  }

  getPageMatchCount(pageNum: number): number {
    return this.pageMatchCounts.get(pageNum) || 0;
  }

  getCurrentPageMatchIndex(): number {
    const idx = this.pagesWithMatches.indexOf(this.currentPage);
    return idx >= 0 ? idx : 0;
  }

  previousMatch() {
    if (this.pagesWithMatches.length === 0) return;

    // Find current page index in pages with matches
    const currentIdx = this.pagesWithMatches.indexOf(this.currentPage);
    let newIdx: number;

    if (currentIdx <= 0) {
      // Wrap to last page with matches
      newIdx = this.pagesWithMatches.length - 1;
    } else {
      newIdx = currentIdx - 1;
    }

    this.goToMatchPage(this.pagesWithMatches[newIdx]);
  }

  nextMatch() {
    if (this.pagesWithMatches.length === 0) return;

    // Find current page index in pages with matches
    const currentIdx = this.pagesWithMatches.indexOf(this.currentPage);
    let newIdx: number;

    if (currentIdx === -1 || currentIdx >= this.pagesWithMatches.length - 1) {
      // Wrap to first page with matches
      newIdx = 0;
    } else {
      newIdx = currentIdx + 1;
    }

    this.goToMatchPage(this.pagesWithMatches[newIdx]);
  }

  private goToMatchPage(pageNum: number) {
    this.currentPage = pageNum;
    this.pageInput = pageNum;
    this.scrollToPage(pageNum);
    this.savePage();
    this.cdr.detectChanges();
  }
}
