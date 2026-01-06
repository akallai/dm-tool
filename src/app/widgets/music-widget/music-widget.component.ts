import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AudioStorageService } from '../../services/audio-storage.service';
import { MusicPlaybackService } from '../../services/music-playback.service';
import { Subscription } from 'rxjs';

export interface MusicFile {
  fileName: string;
  fileDataUrl: string;
}

export interface MusicMapping {
  key: string;
  id?: string;
  files?: MusicFile[];
  volume?: number;
  loop?: boolean;
  randomOrder?: boolean;
}

@Component({
  selector: 'app-music-widget',
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="music-widget">
      <!-- Master Channel Strip -->
      <div class="master-strip">
        <div class="channel-label">MASTER</div>
        <div class="fader-well"
             (mousedown)="startMasterVolumeDrag($event)"
             (touchstart)="startMasterVolumeDrag($event)">
          <div class="volume-fill master-fill" [style.height.%]="masterVolume"></div>
        </div>
        <div class="channel-actions">
          <button
            mat-icon-button
            (click)="toggleMasterMute()"
            [color]="masterMuted ? 'warn' : 'primary'"
            class="action-btn"
            [class.active]="masterMuted"
            matTooltip="{{ masterMuted ? 'Unmute' : 'Mute' }}"
          >
            <mat-icon>{{ masterMuted ? 'volume_off' : 'volume_up' }}</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="stopAllSounds()"
            class="action-btn"
            matTooltip="Stop All"
          >
            <mat-icon>stop</mat-icon>
          </button>
        </div>
        <div class="channel-value">{{ masterVolume }}%</div>
      </div>

      <div class="divider"></div>

      <!-- Scrollable Channel Grid -->
      <div class="channels-container">
        <div
          *ngFor="let mapping of mappings"
          class="channel-strip"
          [class.playing]="isPlaying(mapping)"
          [class.paused]="isPaused(mapping)"
        >
          <div class="channel-label" [matTooltip]="mapping.key">{{ mapping.key }}</div>

          <div class="fader-well"
               [class.disabled]="!mapping.files || mapping.files.length === 0"
               (mousedown)="startTrackVolumeDrag($event, mapping)"
               (touchstart)="startTrackVolumeDrag($event, mapping)">

            <div class="volume-fill" [style.height.%]="mapping.volume"></div>
          </div>

          <div class="channel-actions">
            <!-- Play/Pause LED style button -->
            <button
              mat-icon-button
              (click)="togglePlay(mapping)"
              [disabled]="!mapping.files || mapping.files.length === 0"
              class="action-btn play-btn"
              [class.active-play]="isPlaying(mapping)"
              [class.active-pause]="isPaused(mapping)"
              matTooltip="{{ isPlaying(mapping) ? 'Pause' : 'Play' }}"
            >
              <mat-icon>{{ isPlaying(mapping) ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>

            <!-- Loop LED style button -->
            <button
              mat-icon-button
              (click)="toggleLoop(mapping)"
              class="action-btn loop-btn"
              [class.active-loop]="mapping.loop"
              matTooltip="Loop"
            >
              <mat-icon>repeat</mat-icon>
            </button>

            <button
              mat-icon-button
              (click)="stopTrack(mapping)"
              [disabled]="!isPlaying(mapping) && !isPaused(mapping)"
              class="action-btn"
              matTooltip="Stop"
            >
              <mat-icon>stop_circle</mat-icon>
            </button>

            <!-- Shuffle button -->
            <button
              mat-icon-button
              (click)="toggleShuffle(mapping)"
              [disabled]="!mapping.files || mapping.files.length <= 1"
              class="action-btn shuffle-btn"
              [class.active-shuffle]="mapping.randomOrder"
              matTooltip="Shuffle"
            >
              <mat-icon>shuffle</mat-icon>
            </button>

            <!-- Previous button -->
            <button
              mat-icon-button
              (click)="previousTrack(mapping)"
              [disabled]="!mapping.files || mapping.files.length <= 1"
              class="action-btn"
              matTooltip="Previous"
            >
              <mat-icon>skip_previous</mat-icon>
            </button>

            <!-- Next button -->
            <button
              mat-icon-button
              (click)="nextTrack(mapping)"
              [disabled]="!mapping.files || mapping.files.length <= 1"
              class="action-btn"
              matTooltip="Next"
            >
              <mat-icon>skip_next</mat-icon>
            </button>
          </div>

          <div class="channel-value">{{ getTrackVolume(mapping) }}%</div>

          <!-- Compact Progress -->
          <div class="mini-progress-well" *ngIf="isPlaying(mapping) || isPaused(mapping)">
            <div class="mini-progress-bar">
              <div class="mini-progress-fill" [style.height.%]="getProgress(mapping)"></div>
            </div>
          </div>
        </div>

        <div *ngIf="!mappings || mappings.length === 0" class="empty-channels">
          <mat-icon>settings</mat-icon>
          <span>No Tracks</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .music-widget {
      display: flex;
      background: var(--panel-bg);
      backdrop-filter: var(--glass-backdrop);
      border: var(--glass-border);
      border-radius: 4px;
      padding: 6px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
    }

    .divider {
      width: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 8px;
      align-self: stretch;
      flex-shrink: 0;
    }

    /* Channel Strip Base */
    .master-strip, .channel-strip {
      display: flex;
      flex-direction: column;
      width: 50px;
      min-width: 50px;
      flex-shrink: 0;
      background: var(--header-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 4px 2px;
      box-sizing: border-box;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      position: relative;
      transition: all 0.2s ease;
    }

    .channel-strip.playing {
      background: rgba(100, 255, 218, 0.05);
      border-color: var(--accent-color);
      box-shadow: 0 0 10px var(--accent-hover);
    }

    .channel-strip.paused {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .channel-label {
      font-size: 9px;
      font-weight: bold;
      color: var(--text-secondary);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      margin-bottom: 4px;
      padding: 0 2px;
    }

    .master-strip .channel-label {
      color: var(--accent-color);
    }

    /* Fader / Slider Area */
    .fader-well {
      flex: 1;
      min-height: 60px;
      background: rgba(0, 0, 0, 0.4);
      margin: 2px;
      border-radius: 16px;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      cursor: ns-resize;
      user-select: none;
      touch-action: none;
    }

    .fader-well.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Volume Fill */
    .volume-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top,
        rgba(255, 255, 255, 0.15) 0%,
        rgba(255, 255, 255, 0.25) 100%
      );
      border-radius: 0 0 15px 15px;
      transition: height 0.05s ease-out;
      pointer-events: none;
    }

    .master-fill {
      background: linear-gradient(to top,
        rgba(100, 255, 218, 0.2) 0%,
        rgba(100, 255, 218, 0.4) 100%
      );
    }

    .fader-well:active .volume-fill {
      transition: none;
    }


    /* Actions */
    .channel-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .action-btn {
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
      padding: 0 !important;
      background: var(--header-bg) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 4px !important;
      transition: all 0.2s ease !important;
    }

    .action-btn mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--text-secondary);
    }

    .action-btn:hover:not([disabled]) {
      background: var(--item-hover) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .action-btn:disabled {
      opacity: 0.3 !important;
      cursor: not-allowed !important;
    }

    .action-btn:disabled mat-icon {
      color: var(--text-muted) !important;
    }

    /* Active States */
    .active {
      background: rgba(244, 67, 54, 0.2) !important;
      border-color: var(--danger-color) !important;
    }
    .active mat-icon { color: var(--danger-color) !important; }

    .active-play {
      background: rgba(100, 255, 218, 0.1) !important;
      border-color: var(--accent-color) !important;
      box-shadow: 0 0 8px var(--accent-hover);
    }
    .active-play mat-icon { color: var(--accent-color) !important; }

    .active-pause {
      background: rgba(255, 152, 0, 0.1) !important;
      border-color: var(--warning-color) !important;
    }
    .active-pause mat-icon { color: var(--warning-color) !important; }

    .active-loop {
      background: rgba(33, 150, 243, 0.1) !important;
      border-color: var(--info-color) !important;
    }
    .active-loop mat-icon { color: var(--info-color) !important; }

    .active-shuffle {
      background: rgba(156, 39, 176, 0.1) !important;
      border-color: #9c27b0 !important;
    }
    .active-shuffle mat-icon { color: #9c27b0 !important; }

    /* Channel Value Display */
    .channel-value {
      font-size: 9px;
      font-family: monospace;
      color: var(--text-muted);
      text-align: center;
      margin-top: 4px;
    }

    /* Scrollable Container */
    .channels-container {
      flex: 1;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 4px;
      min-height: 0;
    }

    /* Mini Progress Strip */
    .mini-progress-well {
      position: absolute;
      right: 2px;
      top: 20px;
      bottom: 20px;
      width: 2px;
      background: var(--item-hover);
    }

    .mini-progress-bar {
      position: relative;
      height: 100%;
      width: 100%;
    }

    .mini-progress-fill {
      position: absolute;
      top: 0;
      width: 100%;
      background: var(--accent-color);
      box-shadow: 0 0 4px var(--accent-color);
    }

    .empty-channels {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 11px;
      gap: 4px;
    }

    .empty-channels mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
      opacity: 0.5;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule]
})
export class MusicWidgetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() settings: any = {};
  @Input() widgetId: string = '';
  @Output() settingsChange = new EventEmitter<void>();

  mappings: MusicMapping[] = [];
  private audioLoaded = false;
  masterVolume: number = 100;
  masterMuted: boolean = false;
  fadeDuration: number = 0.5;

  // Volume drag state
  private isDragging = false;
  private dragMapping: MusicMapping | null = null;
  private dragType: 'master' | 'track' = 'track';
  private dragElement: HTMLElement | null = null;

  // Subscription to playback service state changes
  private stateSubscription: Subscription | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private audioStorage: AudioStorageService,
    private playbackService: MusicPlaybackService
  ) {}

  async ngOnInit() {
    // Ensure settings object exists
    if (!this.settings) {
      this.settings = {};
    }

    // Initialize mappings if not already set
    if (!Array.isArray(this.settings.mappings)) {
      this.settings.mappings = [];
    }

    // Normalize mappings in place (add missing ids, volumes, etc.)
    this.settings.mappings = this.normalizeMappings(this.settings.mappings);
    this.mappings = this.settings.mappings;

    // Initialize other settings
    this.masterVolume = this.settings.masterVolume ?? 100;
    this.masterMuted = this.settings.masterMuted ?? false;
    this.fadeDuration = this.settings.fadeDuration ?? 0.5;

    // Sync master state with playback service
    if (this.widgetId) {
      const masterState = this.playbackService.getMasterState(this.widgetId);
      // If this is a fresh widget, set the service state from settings
      // Otherwise, use the service state (persists across tab switches)
      if (masterState.volume === 100 && !masterState.muted) {
        // Service has default values, use our settings
        this.playbackService.setMasterVolume(this.widgetId, this.masterVolume);
        if (this.masterMuted) {
          this.playbackService.toggleMasterMute(this.widgetId);
        }
      } else {
        // Service has existing values (from another tab switch), use those
        this.masterVolume = masterState.volume;
        this.masterMuted = masterState.muted;
      }
      this.playbackService.setFadeDuration(this.fadeDuration);
    }

    // Subscribe to playback state changes to update UI
    this.stateSubscription = this.playbackService.stateChanges.subscribe(() => {
      this.cdr.markForCheck();
    });

    // Load audio files from IndexedDB
    await this.loadAudioFromIndexedDB();
  }

  private async loadAudioFromIndexedDB() {
    if (!this.widgetId || this.audioLoaded) return;

    try {
      const filesByMapping = await this.audioStorage.getAudioFilesForWidget(this.widgetId);

      for (const mapping of this.mappings) {
        const mappingId = this.getMappingId(mapping);
        const files = filesByMapping.get(mappingId);

        if (files && files.length > 0) {
          // Restore the file data URLs from IndexedDB
          mapping.files = files.map(f => ({
            fileName: f.fileName,
            fileDataUrl: f.fileDataUrl
          }));
        }
      }

      this.audioLoaded = true;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading audio files from IndexedDB:', error);
    }
  }

  private async saveAudioToIndexedDB(mapping: MusicMapping) {
    if (!this.widgetId) return;

    const mappingId = this.getMappingId(mapping);

    try {
      if (mapping.files && mapping.files.length > 0) {
        // Only save files that have data URLs
        const filesToSave = mapping.files.filter(f => f.fileDataUrl);
        if (filesToSave.length > 0) {
          await this.audioStorage.saveAudioFiles(this.widgetId, mappingId, filesToSave);
        }
      } else {
        // Delete files for this mapping if none exist
        await this.audioStorage.deleteAudioFilesForMapping(mappingId);
      }
    } catch (error) {
      console.error('Error saving audio files to IndexedDB:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings'] && this.settings) {
      if (!Array.isArray(this.settings.mappings)) {
        this.settings.mappings = [];
      }

      // Check if any mappings need IDs generated
      const needsIdGeneration = this.settings.mappings.some((m: MusicMapping) => !m.id);

      this.settings.mappings = this.normalizeMappings(this.settings.mappings);
      this.mappings = this.settings.mappings;
      this.masterVolume = this.settings.masterVolume ?? 100;
      this.masterMuted = this.settings.masterMuted ?? false;
      this.fadeDuration = this.settings.fadeDuration ?? 0.5;

      // Save any audio files that have data URLs to IndexedDB
      // This handles when files are added via the settings dialog
      this.saveAllAudioToIndexedDB();

      // If we generated new IDs, emit settingsChange to save them to localStorage
      // This ensures the IDs persist across page reloads
      if (needsIdGeneration) {
        // Use setTimeout to avoid emitting during change detection
        setTimeout(() => this.settingsChange.emit(), 0);
      }
    }
  }

  private async saveAllAudioToIndexedDB() {
    if (!this.widgetId) return;

    for (const mapping of this.mappings) {
      // Only save if mapping has files with data URLs
      if (mapping.files?.some(f => f.fileDataUrl)) {
        await this.saveAudioToIndexedDB(mapping);
      }
    }
  }

  private normalizeMappings(mappings: MusicMapping[]): MusicMapping[] {
    return mappings.map(m => ({
      ...m,
      id: m.id || this.generateUniqueId(),
      volume: m.volume ?? 100,
      loop: m.loop ?? false,
      randomOrder: m.randomOrder ?? false
    }));
  }

  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMappingId(mapping: MusicMapping): string {
    // Ensure mapping always has an id - generate one if missing
    if (!mapping.id) {
      mapping.id = this.generateUniqueId();
    }
    return mapping.id;
  }

  isPlaying(mapping: MusicMapping): boolean {
    if (!this.widgetId) return false;
    return this.playbackService.isPlaying(this.widgetId, this.getMappingId(mapping));
  }

  isPaused(mapping: MusicMapping): boolean {
    if (!this.widgetId) return false;
    return this.playbackService.isPaused(this.widgetId, this.getMappingId(mapping));
  }

  getProgress(mapping: MusicMapping): number {
    if (!this.widgetId) return 0;
    return this.playbackService.getProgress(this.widgetId, this.getMappingId(mapping));
  }

  getTimeDisplay(mapping: MusicMapping): string {
    if (!this.widgetId) return '--:--';
    const elapsed = this.playbackService.getElapsed(this.widgetId, this.getMappingId(mapping));
    const duration = this.playbackService.getDuration(this.widgetId, this.getMappingId(mapping));
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatTime(elapsed)}/${formatTime(duration)}`;
  }

  getTrackVolume(mapping: MusicMapping): number {
    return mapping.volume ?? 100;
  }

  // Volume drag handlers
  startMasterVolumeDrag(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.dragType = 'master';
    this.dragElement = (event.target as HTMLElement).closest('.fader-well') as HTMLElement;
    this.updateVolumeFromEvent(event);

    document.addEventListener('mousemove', this.onVolumeDrag);
    document.addEventListener('mouseup', this.onVolumeDragEnd);
    document.addEventListener('touchmove', this.onVolumeDrag, { passive: false });
    document.addEventListener('touchend', this.onVolumeDragEnd);
  }

  startTrackVolumeDrag(event: MouseEvent | TouchEvent, mapping: MusicMapping): void {
    if (!mapping.files || mapping.files.length === 0) return;

    event.preventDefault();
    this.isDragging = true;
    this.dragType = 'track';
    this.dragMapping = mapping;
    this.dragElement = (event.target as HTMLElement).closest('.fader-well') as HTMLElement;
    this.updateVolumeFromEvent(event);

    document.addEventListener('mousemove', this.onVolumeDrag);
    document.addEventListener('mouseup', this.onVolumeDragEnd);
    document.addEventListener('touchmove', this.onVolumeDrag, { passive: false });
    document.addEventListener('touchend', this.onVolumeDragEnd);
  }

  private onVolumeDrag = (event: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;
    event.preventDefault();
    this.ngZone.run(() => {
      this.updateVolumeFromEvent(event);
    });
  };

  private onVolumeDragEnd = (): void => {
    document.removeEventListener('mousemove', this.onVolumeDrag);
    document.removeEventListener('mouseup', this.onVolumeDragEnd);
    document.removeEventListener('touchmove', this.onVolumeDrag);
    document.removeEventListener('touchend', this.onVolumeDragEnd);

    this.ngZone.run(() => {
      this.isDragging = false;
      this.dragMapping = null;
      this.dragElement = null;
      this.saveSettings();
    });
  };

  private updateVolumeFromEvent(event: MouseEvent | TouchEvent): void {
    if (!this.dragElement) return;

    const rect = this.dragElement.getBoundingClientRect();
    const clientY = 'touches' in event && event.touches.length > 0
      ? event.touches[0].clientY
      : (event as MouseEvent).clientY;

    // Calculate percentage (inverted because 0 is at bottom)
    const relativeY = rect.bottom - clientY;
    const percentage = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

    if (this.dragType === 'master') {
      this.masterVolume = Math.round(percentage);
      this.masterMuted = this.masterVolume === 0;
      if (this.widgetId) {
        this.playbackService.setMasterVolume(this.widgetId, this.masterVolume);
      }
    } else if (this.dragMapping) {
      this.dragMapping.volume = Math.round(percentage);
      if (this.widgetId) {
        this.playbackService.setTrackVolume(this.widgetId, this.getMappingId(this.dragMapping), this.dragMapping.volume);
      }
    }

    // Trigger change detection since we're updating from document events
    this.cdr.detectChanges();
  }

  onMasterVolumeChange(): void {
    this.masterMuted = this.masterVolume === 0;
    if (this.widgetId) {
      this.playbackService.setMasterVolume(this.widgetId, this.masterVolume);
    }
    this.saveSettings();
  }

  toggleMasterMute(): void {
    this.masterMuted = !this.masterMuted;
    if (this.masterMuted) {
      this.savedMasterVolume = this.masterVolume;
      this.masterVolume = 0;
    } else {
      this.masterVolume = this.savedMasterVolume ?? 100;
    }
    if (this.widgetId) {
      this.playbackService.setMasterVolume(this.widgetId, this.masterVolume);
    }
    this.saveSettings();
  }
  private savedMasterVolume: number = 100;

  onTrackVolumeChange(mapping: MusicMapping): void {
    if (this.widgetId) {
      this.playbackService.setTrackVolume(this.widgetId, this.getMappingId(mapping), mapping.volume ?? 100);
    }
    this.saveSettings();
  }

  toggleLoop(mapping: MusicMapping): void {
    mapping.loop = !mapping.loop;
    if (this.widgetId) {
      this.playbackService.toggleLoop(this.widgetId, this.getMappingId(mapping));
    }
    this.saveSettings();
  }

  toggleShuffle(mapping: MusicMapping): void {
    mapping.randomOrder = !mapping.randomOrder;
    if (this.widgetId) {
      this.playbackService.toggleShuffle(this.widgetId, this.getMappingId(mapping));
    }
    this.saveSettings();
  }

  nextTrack(mapping: MusicMapping): void {
    if (!this.widgetId) return;
    this.playbackService.next(this.widgetId, this.getMappingId(mapping));
  }

  previousTrack(mapping: MusicMapping): void {
    if (!this.widgetId) return;
    this.playbackService.previous(this.widgetId, this.getMappingId(mapping));
  }

  togglePlay(mapping: MusicMapping): void {
    if (!this.widgetId) return;

    if (this.isPaused(mapping)) {
      this.playbackService.resume(this.widgetId, this.getMappingId(mapping));
    } else if (this.isPlaying(mapping)) {
      this.playbackService.pause(this.widgetId, this.getMappingId(mapping));
    } else {
      this.playTrack(mapping);
    }
  }

  stopTrack(mapping: MusicMapping): void {
    if (!this.widgetId) return;
    this.playbackService.stop(this.widgetId, this.getMappingId(mapping));
  }

  playTrack(mapping: MusicMapping): void {
    if (!mapping.files || mapping.files.length === 0 || !this.widgetId) return;

    this.playbackService.play(
      this.widgetId,
      this.getMappingId(mapping),
      mapping.files,
      mapping.volume ?? 100,
      mapping.loop ?? false,
      mapping.randomOrder ?? false,
      this.settings?.allowMultiple ?? false
    );
  }

  stopAllSounds() {
    if (!this.widgetId) return;
    this.playbackService.stopAllForWidget(this.widgetId);
  }

  private saveSettings(): void {
    // Update settings in place to maintain parent reference
    this.settings.mappings = this.mappings;
    this.settings.masterVolume = this.masterVolume;
    this.settings.masterMuted = this.masterMuted;
    this.settings.fadeDuration = this.fadeDuration;

    // Emit to trigger save to localStorage
    this.settingsChange.emit();
  }

  ngOnDestroy() {
    // Unsubscribe from state changes to prevent memory leaks
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    // Note: We intentionally do NOT stop sounds here
    // This allows audio to continue playing when switching tabs
  }
}
