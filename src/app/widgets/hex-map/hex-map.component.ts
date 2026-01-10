import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { defineHex, Grid, rectangle, line, Orientation } from 'honeycomb-grid';

interface HexCellData {
  q: number;
  r: number;
  color: string;
  label: string;
}

interface HexPath {
  id: string;
  points: { q: number; r: number }[];
  color: string;
}

interface RenderedHex {
  q: number;
  r: number;
  points: string;
  centerX: number;
  centerY: number;
  color: string;
  label: string;
}

interface RenderedPath {
  id: string;
  svgPath: string;
  color: string;
}

type EditMode = 'select' | 'paint' | 'path';

@Component({
  selector: 'app-hex-map',
  template: `
    <div class="hex-map-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <mat-button-toggle-group [(ngModel)]="editMode" (change)="onModeChange()">
          <mat-button-toggle value="select">
            <mat-icon>touch_app</mat-icon>
            <span class="toggle-label">Select</span>
          </mat-button-toggle>
          <mat-button-toggle value="paint">
            <mat-icon>brush</mat-icon>
            <span class="toggle-label">Paint</span>
          </mat-button-toggle>
          <mat-button-toggle value="path">
            <mat-icon>timeline</mat-icon>
            <span class="toggle-label">Path</span>
          </mat-button-toggle>
        </mat-button-toggle-group>

        <div class="toolbar-divider"></div>

        <!-- Paint color picker (shown in paint mode) -->
        <div class="color-picker-group" *ngIf="editMode === 'paint'">
          <label>Brush</label>
          <input type="color" [(ngModel)]="paintColor" class="toolbar-color-input">
          <button mat-icon-button
                  class="eraser-btn"
                  [class.active]="isEraser"
                  (click)="toggleEraser()"
                  matTooltip="Eraser">
            <mat-icon>cleaning_services</mat-icon>
          </button>
        </div>

        <!-- Path color picker (shown in path mode) -->
        <div class="color-picker-group" *ngIf="editMode === 'path'">
          <label>Path Color</label>
          <input type="color" [(ngModel)]="pathColor" class="toolbar-color-input">
        </div>

        <!-- Mode hints -->
        <span class="mode-hint" *ngIf="editMode === 'paint'">
          {{ isEraser ? 'Click & drag to erase' : 'Click & drag to paint' }}
        </span>
        <span class="mode-hint" *ngIf="editMode === 'path'">
          {{ pathStartHex ? 'Click end hex' : 'Click start hex' }}
        </span>
      </div>

      <!-- SVG Grid -->
      <div class="svg-container"
           (mouseup)="onMouseUp()"
           (mouseleave)="onMouseUp()">
        <svg
          [attr.width]="svgWidth"
          [attr.height]="svgHeight"
          class="hex-grid-svg"
          [class.paint-mode]="editMode === 'paint'">

          <!-- Hex polygons -->
          <g class="hex-layer">
            <g *ngFor="let hex of renderedHexes"
               class="hex-cell"
               [class.selected]="selectedHex?.q === hex.q && selectedHex?.r === hex.r"
               [class.path-start]="pathStartHex?.q === hex.q && pathStartHex?.r === hex.r"
               (mousedown)="onHexMouseDown(hex, $event)"
               (mouseenter)="onHexMouseEnter(hex)"
               (click)="onHexClick(hex)">

              <!-- Hex shape -->
              <polygon
                [attr.points]="hex.points"
                [attr.fill]="hex.color"
                class="hex-polygon">
              </polygon>

              <!-- Label text -->
              <text
                *ngIf="hex.label || settings.showCoordinates"
                [attr.x]="hex.centerX"
                [attr.y]="hex.centerY"
                class="hex-label"
                text-anchor="middle"
                dominant-baseline="central">
                {{ hex.label || (settings.showCoordinates ? hex.q + ',' + hex.r : '') }}
              </text>
            </g>
          </g>

          <!-- Paths layer (rendered on top of hexes) -->
          <g class="paths-layer">
            <g *ngFor="let path of renderedPaths"
               class="path-group"
               (click)="onPathClick(path, $event)">
              <!-- Path line -->
              <path
                [attr.d]="path.svgPath"
                [attr.stroke]="path.color"
                class="hex-path"
                fill="none">
              </path>
              <!-- Invisible wider path for easier clicking -->
              <path
                [attr.d]="path.svgPath"
                stroke="transparent"
                stroke-width="16"
                fill="none"
                class="path-hitarea">
              </path>
            </g>
          </g>

          <!-- Preview line while drawing path -->
          <line
            *ngIf="pathStartHex && previewEndHex"
            [attr.x1]="pathStartHex.centerX"
            [attr.y1]="pathStartHex.centerY"
            [attr.x2]="previewEndHex.centerX"
            [attr.y2]="previewEndHex.centerY"
            [attr.stroke]="pathColor"
            stroke-width="3"
            stroke-dasharray="8,4"
            class="preview-line">
          </line>
        </svg>
      </div>

      <!-- Inline Edit Panel (hex editing) -->
      <div class="edit-panel" *ngIf="selectedHex && editMode === 'select'">
        <div class="edit-header">
          <span>Edit Hex ({{ selectedHex.q }}, {{ selectedHex.r }})</span>
          <button mat-icon-button (click)="cancelEdit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="edit-fields">
          <div class="field-group">
            <label>Color</label>
            <input type="color" [(ngModel)]="editColor" class="color-input">
          </div>
          <div class="field-group">
            <label>Label</label>
            <input type="text" [(ngModel)]="editLabel" placeholder="Enter label" class="label-input">
          </div>
        </div>
        <div class="edit-actions">
          <button mat-button (click)="clearHex()">Clear</button>
          <button mat-raised-button color="primary" (click)="saveHexEdit()">Save</button>
        </div>
      </div>

      <!-- Path Edit Panel -->
      <div class="edit-panel" *ngIf="selectedPath">
        <div class="edit-header">
          <span>Edit Path</span>
          <button mat-icon-button (click)="cancelPathEdit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="edit-fields">
          <div class="field-group">
            <label>Path Color</label>
            <input type="color" [(ngModel)]="editPathColor" class="color-input">
          </div>
        </div>
        <div class="edit-actions">
          <button mat-button color="warn" (click)="deletePath()">
            <mat-icon>delete</mat-icon> Delete
          </button>
          <button mat-raised-button color="primary" (click)="savePathEdit()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hex-map-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: var(--panel-bg, rgba(20, 25, 40, 0.7));
      border-bottom: var(--glass-border, 1px solid rgba(255, 255, 255, 0.1));
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .toolbar mat-button-toggle-group {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .toolbar ::ng-deep .mat-button-toggle {
      background: transparent;
      color: var(--text-secondary, rgba(255, 255, 255, 0.7));
    }

    .toolbar ::ng-deep .mat-button-toggle-checked {
      background: var(--accent-color, #40c4ff) !important;
      color: #000 !important;
    }

    .toolbar ::ng-deep .mat-button-toggle-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 12px;
      height: 36px;
    }

    .toggle-label {
      font-size: 12px;
      font-weight: 500;
    }

    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
    }

    .color-picker-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-picker-group label {
      font-size: 12px;
      color: var(--text-secondary, rgba(255, 255, 255, 0.7));
    }

    .toolbar-color-input {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      padding: 2px;
    }

    .eraser-btn {
      width: 32px;
      height: 32px;
      color: var(--text-secondary, rgba(255, 255, 255, 0.7));
    }

    .eraser-btn.active {
      background: var(--accent-color, #40c4ff);
      color: #000;
    }

    .mode-hint {
      font-size: 12px;
      color: var(--accent-color, #40c4ff);
      font-style: italic;
    }

    /* SVG Container */
    .svg-container {
      flex: 1;
      overflow: auto;
    }

    .hex-grid-svg {
      min-width: fit-content;
      min-height: fit-content;
    }

    .hex-grid-svg.paint-mode {
      cursor: crosshair;
    }

    .hex-cell {
      cursor: pointer;
      transition: filter 0.15s ease;
    }

    .hex-cell:hover .hex-polygon {
      filter: brightness(1.3);
    }

    .hex-cell.selected .hex-polygon {
      stroke: var(--accent-color, #40c4ff);
      stroke-width: 3px;
    }

    .hex-cell.path-start .hex-polygon {
      stroke: #4ade80;
      stroke-width: 3px;
    }

    .hex-polygon {
      stroke: rgba(255, 255, 255, 0.3);
      stroke-width: 1px;
      transition: filter 0.15s ease;
    }

    .hex-label {
      fill: var(--text-primary, #ffffff);
      font-size: 10px;
      font-weight: 500;
      pointer-events: none;
      user-select: none;
    }

    /* Paths */
    .path-group {
      cursor: pointer;
    }

    .hex-path {
      stroke-width: 4px;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      transition: stroke-width 0.15s ease;
    }

    .path-group:hover .hex-path {
      stroke-width: 6px;
    }

    .preview-line {
      pointer-events: none;
      opacity: 0.7;
    }

    /* Edit Panel */
    .edit-panel {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: var(--panel-bg, rgba(20, 25, 40, 0.9));
      border: var(--glass-border, 1px solid rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      padding: 12px;
      min-width: 200px;
      backdrop-filter: blur(12px);
      z-index: 10;
    }

    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      color: var(--text-primary, #ffffff);
      font-weight: 500;
    }

    .edit-header button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .edit-fields {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-group label {
      font-size: 11px;
      color: var(--text-secondary, rgba(255, 255, 255, 0.7));
      text-transform: uppercase;
    }

    .color-input {
      width: 100%;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      background: var(--input-bg, rgba(0, 0, 0, 0.3));
      cursor: pointer;
      padding: 2px;
    }

    .color-input::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    .color-input::-webkit-color-swatch {
      border-radius: 2px;
      border: none;
    }

    .label-input {
      width: 100%;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      background: var(--input-bg, rgba(0, 0, 0, 0.3));
      color: var(--text-primary, #ffffff);
      font-size: 13px;
      box-sizing: border-box;
    }

    .label-input:focus {
      outline: none;
      border-color: var(--accent-color, #40c4ff);
    }

    .label-input::placeholder {
      color: var(--text-muted, rgba(255, 255, 255, 0.4));
    }

    .edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }

    .edit-actions button mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      margin-right: 4px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule
  ]
})
export class HexMapComponent implements OnInit, OnChanges {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<void>();

  renderedHexes: RenderedHex[] = [];
  renderedPaths: RenderedPath[] = [];
  svgWidth: number = 0;
  svgHeight: number = 0;

  // Edit mode
  editMode: EditMode = 'select';

  // For hex editing
  selectedHex: RenderedHex | null = null;
  editColor: string = '';
  editLabel: string = '';

  // For paint mode
  paintColor: string = '#22c55e'; // Green default
  isEraser: boolean = false;
  private isPainting: boolean = false;
  private paintedHexesInStroke: Set<string> = new Set();

  // For path drawing
  pathColor: string = '#f59e0b'; // Orange default
  pathStartHex: RenderedHex | null = null;
  previewEndHex: RenderedHex | null = null;

  // For path editing
  selectedPath: RenderedPath | null = null;
  editPathColor: string = '';

  // Grid reference for line calculation
  private gridInstance: Grid<any> | null = null;
  private HexClass: any = null;

  // Listen for mouseup anywhere on the document
  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    if (this.isPainting) {
      this.onMouseUp();
    }
  }

  ngOnInit(): void {
    this.initializeDefaults();
    this.rebuildGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings'] && !changes['settings'].firstChange) {
      this.rebuildGrid();
    }
  }

  private initializeDefaults(): void {
    if (!this.settings) {
      this.settings = {};
    }
    this.settings.gridWidth = this.settings.gridWidth ?? 10;
    this.settings.gridHeight = this.settings.gridHeight ?? 8;
    this.settings.hexSize = this.settings.hexSize ?? 30;
    this.settings.defaultColor = this.settings.defaultColor ?? '#374151';
    this.settings.showCoordinates = this.settings.showCoordinates ?? false;
    this.settings.hexes = this.settings.hexes ?? [];
    this.settings.paths = this.settings.paths ?? [];
  }

  private rebuildGrid(): void {
    this.initializeDefaults();

    // Define hex class with pointy-top orientation
    this.HexClass = defineHex({
      dimensions: this.settings.hexSize,
      orientation: Orientation.POINTY,
      origin: 'topLeft'
    });

    // Create rectangular grid
    this.gridInstance = new Grid(this.HexClass, rectangle({
      width: this.settings.gridWidth,
      height: this.settings.gridHeight
    }));

    // Build rendered hexes array
    this.renderedHexes = [];

    // Calculate SVG bounds
    let maxX = 0;
    let maxY = 0;

    this.gridInstance.forEach(hex => {
      const points = hex.corners
        .map((corner: { x: number; y: number }) => `${corner.x},${corner.y}`)
        .join(' ');

      const storedHex = (this.settings.hexes as HexCellData[]).find(
        (h: HexCellData) => h.q === hex.q && h.r === hex.r
      );

      const renderedHex: RenderedHex = {
        q: hex.q,
        r: hex.r,
        points: points,
        centerX: hex.x,
        centerY: hex.y,
        color: storedHex?.color ?? this.settings.defaultColor,
        label: storedHex?.label ?? ''
      };

      this.renderedHexes.push(renderedHex);

      hex.corners.forEach((corner: { x: number; y: number }) => {
        if (corner.x > maxX) maxX = corner.x;
        if (corner.y > maxY) maxY = corner.y;
      });
    });

    this.svgWidth = Math.ceil(maxX) + 10;
    this.svgHeight = Math.ceil(maxY) + 10;

    // Rebuild paths
    this.rebuildPaths();
  }

  private rebuildPaths(): void {
    this.renderedPaths = [];

    for (const pathData of this.settings.paths as HexPath[]) {
      const svgPath = this.buildSvgPath(pathData.points);
      if (svgPath) {
        this.renderedPaths.push({
          id: pathData.id,
          svgPath: svgPath,
          color: pathData.color
        });
      }
    }
  }

  private buildSvgPath(points: { q: number; r: number }[]): string | null {
    if (points.length < 2) return null;

    const pathParts: string[] = [];

    for (let i = 0; i < points.length; i++) {
      const hex = this.renderedHexes.find(h => h.q === points[i].q && h.r === points[i].r);
      if (!hex) continue;

      if (i === 0) {
        pathParts.push(`M ${hex.centerX} ${hex.centerY}`);
      } else {
        pathParts.push(`L ${hex.centerX} ${hex.centerY}`);
      }
    }

    return pathParts.join(' ');
  }

  onModeChange(): void {
    // Clear selections when changing modes
    this.selectedHex = null;
    this.pathStartHex = null;
    this.previewEndHex = null;
    this.selectedPath = null;
    this.isPainting = false;
  }

  toggleEraser(): void {
    this.isEraser = !this.isEraser;
  }

  // Paint mode mouse handlers
  onHexMouseDown(hex: RenderedHex, event: MouseEvent): void {
    if (this.editMode === 'paint') {
      event.preventDefault();
      this.isPainting = true;
      this.paintedHexesInStroke.clear();
      this.paintHex(hex);
    }
  }

  onHexMouseEnter(hex: RenderedHex): void {
    if (this.editMode === 'paint' && this.isPainting) {
      this.paintHex(hex);
    }
  }

  onMouseUp(): void {
    if (this.isPainting) {
      this.isPainting = false;
      // Save all changes at once when stroke ends
      if (this.paintedHexesInStroke.size > 0) {
        this.settingsChange.emit();
      }
      this.paintedHexesInStroke.clear();
    }
  }

  private paintHex(hex: RenderedHex): void {
    const hexKey = `${hex.q},${hex.r}`;

    // Skip if already painted in this stroke
    if (this.paintedHexesInStroke.has(hexKey)) {
      return;
    }
    this.paintedHexesInStroke.add(hexKey);

    const colorToApply = this.isEraser ? this.settings.defaultColor : this.paintColor;

    // Update rendered hex immediately for visual feedback
    const renderedIndex = this.renderedHexes.findIndex(
      h => h.q === hex.q && h.r === hex.r
    );
    if (renderedIndex !== -1) {
      this.renderedHexes[renderedIndex].color = colorToApply;
    }

    // Update settings
    const storedIndex = (this.settings.hexes as HexCellData[]).findIndex(
      (h: HexCellData) => h.q === hex.q && h.r === hex.r
    );

    const isDefault = colorToApply === this.settings.defaultColor;
    const existingHex = storedIndex !== -1 ? this.settings.hexes[storedIndex] : null;
    const hasLabel = existingHex?.label && existingHex.label !== '';

    if (isDefault && !hasLabel) {
      // Remove from storage if color is default and no label
      if (storedIndex !== -1) {
        this.settings.hexes.splice(storedIndex, 1);
      }
    } else {
      // Update or add hex data
      const hexData: HexCellData = {
        q: hex.q,
        r: hex.r,
        color: colorToApply,
        label: existingHex?.label ?? ''
      };

      if (storedIndex !== -1) {
        this.settings.hexes[storedIndex] = hexData;
      } else {
        this.settings.hexes.push(hexData);
      }
    }
  }

  onHexClick(hex: RenderedHex): void {
    if (this.editMode === 'select') {
      this.handleSelectModeClick(hex);
    } else if (this.editMode === 'path') {
      this.handlePathModeClick(hex);
    }
    // Paint mode is handled by mousedown/mouseenter
  }

  private handleSelectModeClick(hex: RenderedHex): void {
    // Clear path selection
    this.selectedPath = null;

    // If clicking same hex, toggle selection off
    if (this.selectedHex?.q === hex.q && this.selectedHex?.r === hex.r) {
      this.selectedHex = null;
      return;
    }

    // Select this hex and populate edit fields
    this.selectedHex = hex;
    this.editColor = hex.color;
    this.editLabel = hex.label;
  }

  private handlePathModeClick(hex: RenderedHex): void {
    if (!this.pathStartHex) {
      // First click - set start hex
      this.pathStartHex = hex;
      this.previewEndHex = null;
    } else {
      // Second click - create path
      if (hex.q === this.pathStartHex.q && hex.r === this.pathStartHex.r) {
        // Clicked same hex - cancel
        this.pathStartHex = null;
        this.previewEndHex = null;
        return;
      }

      this.createPath(this.pathStartHex, hex);
      this.pathStartHex = null;
      this.previewEndHex = null;
    }
  }

  private createPath(startHex: RenderedHex, endHex: RenderedHex): void {
    if (!this.gridInstance || !this.HexClass) return;

    // Use honeycomb-grid's line traverser to get all hexes between start and end
    const start = new this.HexClass({ q: startHex.q, r: startHex.r });
    const end = new this.HexClass({ q: endHex.q, r: endHex.r });

    const lineTraverser = line({ start, stop: end });
    const lineGrid = new Grid(this.HexClass, lineTraverser);

    const pathPoints: { q: number; r: number }[] = [];
    lineGrid.forEach(hex => {
      pathPoints.push({ q: hex.q, r: hex.r });
    });

    // Create path data
    const newPath: HexPath = {
      id: Date.now().toString(),
      points: pathPoints,
      color: this.pathColor
    };

    // Add to settings
    this.settings.paths.push(newPath);

    // Rebuild rendered paths
    this.rebuildPaths();

    // Emit change
    this.settingsChange.emit();
  }

  onPathClick(path: RenderedPath, event: MouseEvent): void {
    event.stopPropagation();

    if (this.editMode === 'select') {
      // Select path for editing
      this.selectedHex = null;
      this.selectedPath = path;
      this.editPathColor = path.color;
    }
  }

  savePathEdit(): void {
    if (!this.selectedPath) return;

    // Find and update the path in settings
    const pathIndex = (this.settings.paths as HexPath[]).findIndex(
      p => p.id === this.selectedPath!.id
    );

    if (pathIndex !== -1) {
      this.settings.paths[pathIndex].color = this.editPathColor;

      // Update rendered path
      const renderedIndex = this.renderedPaths.findIndex(p => p.id === this.selectedPath!.id);
      if (renderedIndex !== -1) {
        this.renderedPaths[renderedIndex].color = this.editPathColor;
      }

      this.settingsChange.emit();
    }

    this.selectedPath = null;
  }

  deletePath(): void {
    if (!this.selectedPath) return;

    // Remove from settings
    const pathIndex = (this.settings.paths as HexPath[]).findIndex(
      p => p.id === this.selectedPath!.id
    );

    if (pathIndex !== -1) {
      this.settings.paths.splice(pathIndex, 1);
      this.rebuildPaths();
      this.settingsChange.emit();
    }

    this.selectedPath = null;
  }

  cancelPathEdit(): void {
    this.selectedPath = null;
  }

  saveHexEdit(): void {
    if (!this.selectedHex) return;

    const { q, r } = this.selectedHex;

    const storedIndex = (this.settings.hexes as HexCellData[]).findIndex(
      (h: HexCellData) => h.q === q && h.r === r
    );

    const isDefault =
      this.editColor === this.settings.defaultColor &&
      this.editLabel === '';

    if (isDefault) {
      if (storedIndex !== -1) {
        this.settings.hexes.splice(storedIndex, 1);
      }
    } else {
      const hexData: HexCellData = {
        q,
        r,
        color: this.editColor,
        label: this.editLabel
      };

      if (storedIndex !== -1) {
        this.settings.hexes[storedIndex] = hexData;
      } else {
        this.settings.hexes.push(hexData);
      }
    }

    const renderedIndex = this.renderedHexes.findIndex(
      h => h.q === q && h.r === r
    );
    if (renderedIndex !== -1) {
      this.renderedHexes[renderedIndex].color = this.editColor;
      this.renderedHexes[renderedIndex].label = this.editLabel;
    }

    this.settingsChange.emit();
    this.selectedHex = null;
  }

  clearHex(): void {
    this.editColor = this.settings.defaultColor;
    this.editLabel = '';
    this.saveHexEdit();
  }

  cancelEdit(): void {
    this.selectedHex = null;
  }
}
