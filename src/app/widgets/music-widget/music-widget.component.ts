import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

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

interface PlaybackState {
  currentIndex: number;
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  isPaused: boolean;
  playlist: MusicFile[];
  playOrder: number[];
  progress: number;
  duration: number;
  elapsed: number;
  fadeTimeout?: number;
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
            <!-- VU Meter effect -->
            <div class="vu-meter" *ngIf="isPlaying(mapping)">
              <div class="vu-bar" [style.height.%]="getTrackVolume(mapping)"></div>
            </div>

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

    /* VU Meter LED effect */
    .vu-meter {
      position: absolute;
      left: 2px;
      bottom: 0;
      width: 3px;
      height: 100%;
      background: rgba(0,0,0,0.5);
    }

    .vu-bar {
      width: 100%;
      position: absolute;
      bottom: 0;
      background: linear-gradient(to top, var(--accent-color) 60%, var(--yellow-color) 80%, var(--danger-color) 95%);
      box-shadow: 0 0 8px var(--accent-color);
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
  private _settings: any;
  @Input() set settings(value: any) {
    this._settings = value;
    this.mappings = this.normalizeMappings(this._settings?.mappings || []);
    this.masterVolume = this._settings?.masterVolume ?? 100;
    this.masterMuted = this._settings?.masterMuted ?? false;
    this.fadeDuration = this._settings?.fadeDuration ?? 0.5;
  }
  get settings() {
    return this._settings;
  }
  @Output() settingsChange = new EventEmitter<any>();

  mappings: MusicMapping[] = [];
  masterVolume: number = 100;
  masterMuted: boolean = false;
  fadeDuration: number = 0.5;
  private playbackStates: Map<string, PlaybackState> = new Map();
  private progressIntervals: Map<string, number> = new Map();

  // Volume drag state
  private isDragging = false;
  private dragMapping: MusicMapping | null = null;
  private dragType: 'master' | 'track' = 'track';
  private dragElement: HTMLElement | null = null;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {
    this.mappings = this.normalizeMappings(this.settings?.mappings || []);
    this.masterVolume = this.settings?.masterVolume ?? 100;
    this.masterMuted = this.settings?.masterMuted ?? false;
    this.fadeDuration = this.settings?.fadeDuration ?? 0.5;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.mappings = this.normalizeMappings(this.settings?.mappings || []);
      this.masterVolume = this.settings?.masterVolume ?? 100;
      this.masterMuted = this.settings?.masterMuted ?? false;
      this.fadeDuration = this.settings?.fadeDuration ?? 0.5;
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
    return mapping.id || mapping.key;
  }

  isPlaying(mapping: MusicMapping): boolean {
    const state = this.playbackStates.get(this.getMappingId(mapping));
    return state?.isPlaying ?? false;
  }

  isPaused(mapping: MusicMapping): boolean {
    const state = this.playbackStates.get(this.getMappingId(mapping));
    return state?.isPaused ?? false;
  }

  getProgress(mapping: MusicMapping): number {
    const state = this.playbackStates.get(this.getMappingId(mapping));
    if (!state || !state.duration) return 0;
    return (state.elapsed / state.duration) * 100;
  }

  getTimeDisplay(mapping: MusicMapping): string {
    const state = this.playbackStates.get(this.getMappingId(mapping));
    if (!state) return '--:--';
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatTime(state.elapsed)}/${formatTime(state.duration)}`;
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
      this.updateAllVolumes();
    } else if (this.dragMapping) {
      this.dragMapping.volume = Math.round(percentage);
      const state = this.playbackStates.get(this.getMappingId(this.dragMapping));
      if (state && state.audio) {
        this.applyVolume(state, this.dragMapping);
      }
    }

    // Trigger change detection since we're updating from document events
    this.cdr.detectChanges();
  }

  onMasterVolumeChange(): void {
    this.masterMuted = this.masterVolume === 0;
    this.updateAllVolumes();
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
    this.updateAllVolumes();
    this.saveSettings();
  }
  private savedMasterVolume: number = 100;

  updateAllVolumes(): void {
    this.playbackStates.forEach((state, id) => {
      if (state && state.audio) {
        const mapping = this.mappings.find(m => this.getMappingId(m) === id);
        if (mapping) {
          this.applyVolume(state, mapping);
        }
      }
    });
  }

  onTrackVolumeChange(mapping: MusicMapping): void {
    const state = this.playbackStates.get(this.getMappingId(mapping));
    if (state && state.audio) {
      this.applyVolume(state, mapping);
    }
    this.saveSettings();
  }

  private applyVolume(state: PlaybackState, mapping: MusicMapping): void {
    if (!state || !state.audio) return;
    const trackVolume = (mapping.volume ?? 100) / 100;
    const masterVol = this.masterMuted ? 0 : this.masterVolume / 100;
    state.audio.volume = trackVolume * masterVol;
  }

  toggleLoop(mapping: MusicMapping): void {
    mapping.loop = !mapping.loop;
    const state = this.playbackStates.get(this.getMappingId(mapping));
    if (state && state.audio) {
      state.audio.loop = mapping.loop;
    }
    this.saveSettings();
  }

  togglePlay(mapping: MusicMapping): void {
    if (this.isPaused(mapping)) {
      this.resumeTrack(mapping);
    } else if (this.isPlaying(mapping)) {
      this.pauseTrack(mapping);
    } else {
      this.playTrack(mapping);
    }
  }

  stopTrack(mapping: MusicMapping): void {
    const id = this.getMappingId(mapping);
    const state = this.playbackStates.get(id);
    if (state) {
      this.cleanupPlayback(state, id);
    }
  }

  pauseTrack(mapping: MusicMapping): void {
    const id = this.getMappingId(mapping);
    const state = this.playbackStates.get(id);
    if (!state || !state.audio) return;

    if (this.fadeDuration > 0) {
      this.fadeAudio(state, 0, () => {
        state.audio!.pause();
        state.isPlaying = false;
        state.isPaused = true;
        this.stopProgressTracking(id);
      });
    } else {
      state.audio.pause();
      state.isPlaying = false;
      state.isPaused = true;
      this.stopProgressTracking(id);
    }
  }

  resumeTrack(mapping: MusicMapping): void {
    const id = this.getMappingId(mapping);
    const state = this.playbackStates.get(id);
    if (!state || !state.audio) return;

    this.applyVolume(state, mapping);
    state.audio.play();
    state.isPlaying = true;
    state.isPaused = false;
    this.startProgressTracking(id, state);
  }

  playTrack(mapping: MusicMapping): void {
    if (!mapping.files || mapping.files.length === 0) return;

    if (!this.settings?.allowMultiple) {
      this.stopAllSounds();
    }

    const id = this.getMappingId(mapping);
    const existingState = this.playbackStates.get(id);
    if (existingState) {
      this.cleanupPlayback(existingState, id);
    }

    const state = this.setupPlaylist(mapping);
    state.isPlaying = true;
    state.isPaused = false;
    this.playbackStates.set(id, state);
    this.playNext(mapping, state);
  }

  private getShuffledPlayOrder(length: number): number[] {
    const order = Array.from({ length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  private setupPlaylist(mapping: MusicMapping): PlaybackState {
    if (!mapping.files || mapping.files.length === 0) {
      return {
        currentIndex: 0,
        audio: null,
        isPlaying: false,
        isPaused: false,
        playlist: [],
        playOrder: [],
        progress: 0,
        duration: 0,
        elapsed: 0
      };
    }

    const playlist = [...mapping.files];
    const playOrder = mapping.randomOrder
      ? this.getShuffledPlayOrder(playlist.length)
      : Array.from({ length: playlist.length }, (_, i) => i);

    return {
      currentIndex: 0,
      audio: null,
      isPlaying: false,
      isPaused: false,
      playlist,
      playOrder,
      progress: 0,
      duration: 0,
      elapsed: 0
    };
  }

  private playNext(mapping: MusicMapping, state: PlaybackState) {
    if (!state.playlist.length) return;

    const currentFile = state.playlist[state.playOrder[state.currentIndex]];

    const audio = new Audio(currentFile.fileDataUrl);
    audio.loop = mapping.loop ?? false;

    const trackVolume = (mapping.volume ?? 100) / 100;
    const masterVol = this.masterMuted ? 0 : this.masterVolume / 100;

    if (this.fadeDuration > 0) {
      audio.volume = 0;
    } else {
      audio.volume = trackVolume * masterVol;
    }

    audio.addEventListener('loadedmetadata', () => {
      state.duration = audio.duration || 0;
      state.elapsed = 0;
    });

    audio.addEventListener('ended', () => {
      state.currentIndex++;

      if (state.currentIndex >= state.playlist.length) {
        if (mapping.loop) {
          state.currentIndex = 0;
          if (mapping.randomOrder) {
            state.playOrder = this.getShuffledPlayOrder(state.playlist.length);
          }
          this.playNext(mapping, state);
        } else {
          state.isPlaying = false;
          state.isPaused = false;
          state.elapsed = 0;
          this.cleanupPlayback(state, this.getMappingId(mapping));
        }
      } else {
        this.playNext(mapping, state);
      }
    });

    const startPlayback = () => {
      audio.play();
      state.audio = audio;
      state.isPlaying = true;
      state.isPaused = false;

      if (this.fadeDuration > 0) {
        this.fadeAudio(state, trackVolume * masterVol);
      }

      this.startProgressTracking(this.getMappingId(mapping), state);
    };

    startPlayback();
  }

  private fadeAudio(state: PlaybackState, targetVolume: number, callback?: () => void): void {
    if (state.fadeTimeout) {
      clearTimeout(state.fadeTimeout);
    }

    if (!state.audio || this.fadeDuration <= 0) {
      if (state.audio) {
        state.audio.volume = targetVolume;
      }
      callback?.();
      return;
    }

    const startVolume = state.audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 15;
    const stepDuration = (this.fadeDuration * 1000) / steps;
    const stepVolume = volumeDiff / steps;

    let step = 0;

    const fadeStep = () => {
      step++;
      if (state.audio) {
        state.audio.volume = startVolume + (stepVolume * step);
      }

      if (step < steps) {
        state.fadeTimeout = window.setTimeout(fadeStep, stepDuration);
      } else {
        if (state.audio) {
          state.audio.volume = targetVolume;
        }
        callback?.();
      }
    };

    fadeStep();
  }

  private startProgressTracking(key: string, state: PlaybackState): void {
    this.stopProgressTracking(key);

    const intervalId = window.setInterval(() => {
      if (state.audio && !state.audio.paused && state.isPlaying) {
        state.elapsed = state.audio.currentTime;
      }
    }, 100);

    this.progressIntervals.set(key, intervalId);
  }

  private stopProgressTracking(key: string): void {
    const intervalId = this.progressIntervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.progressIntervals.delete(key);
    }
  }

  stopAllSounds() {
    this.playbackStates.forEach((state, key) => {
      this.cleanupPlayback(state, key);
    });
    this.playbackStates.clear();
  }

  private cleanupPlayback(state: PlaybackState, key: string): void {
    if (state.fadeTimeout) {
      clearTimeout(state.fadeTimeout);
    }

    this.stopProgressTracking(key);

    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      state.audio = null;
    }

    state.isPlaying = false;
    state.isPaused = false;
    state.elapsed = 0;

    this.playbackStates.delete(key);
  }

  private saveSettings(): void {
    this.settingsChange.emit({
      ...this.settings,
      mappings: this.mappings,
      masterVolume: this.masterVolume,
      masterMuted: this.masterMuted
    });
  }

  ngOnDestroy() {
    this.stopAllSounds();
  }
}
