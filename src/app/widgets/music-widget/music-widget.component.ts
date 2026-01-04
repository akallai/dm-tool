import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface MusicFile {
  fileName: string;
  fileDataUrl: string;
}

export interface MusicMapping {
  key: string;
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
        <div class="fader-well">
          <div class="v-slider-container">
            <mat-slider
              [min]="0"
              [max]="100"
              discrete
              class="v-slider master-fader"
            >
              <input matSliderThumb [(ngModel)]="masterVolume" (ngModelChange)="onMasterVolumeChange()">
            </mat-slider>
          </div>
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

          <div class="fader-well">
            <!-- VU Meter effect -->
            <div class="vu-meter" *ngIf="isPlaying(mapping)">
              <div class="vu-bar" [style.height.%]="getTrackVolume(mapping)"></div>
            </div>

            <div class="v-slider-container">
              <mat-slider
                [min]="0"
                [max]="100"
                class="v-slider"
                [disabled]="!mapping.files || mapping.files.length === 0"
              >
                <input matSliderThumb [(ngModel)]="mapping.volume" (ngModelChange)="onTrackVolumeChange(mapping)">
              </mat-slider>
            </div>
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
      background: #121212;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 6px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
    }

    .divider {
      width: 2px;
      background: #333;
      margin: 0 8px;
      align-self: stretch;
      flex-shrink: 0;
      box-shadow: 1px 0 0 rgba(255,255,255,0.05);
    }

    /* Channel Strip Base */
    .master-strip, .channel-strip {
      display: flex;
      flex-direction: column;
      width: 50px;
      min-width: 50px;
      flex-shrink: 0;
      background: #222;
      border: 1px solid #000;
      border-radius: 3px;
      padding: 4px 2px;
      box-sizing: border-box;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
      position: relative;
    }

    .channel-strip.playing {
      background: #2a2a2a;
      border-color: #4caf50;
    }

    .channel-strip.paused {
      background: #2a2a2a;
      border-color: #ff9800;
    }

    .channel-label {
      font-size: 9px;
      font-weight: bold;
      color: #aaa;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      margin-bottom: 4px;
      padding: 0 2px;
    }

    .master-strip .channel-label {
      color: #4fc3f7;
    }

    /* Fader / Slider Area */
    .fader-well {
      flex: 1;
      background: #111;
      margin: 2px;
      border-radius: 20px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid #333;
      box-shadow: inset 0 0 5px #000;
      overflow: hidden;
      padding: 12px 0;
    }

    .v-slider-container {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    /* Modern Angular vertical slider rotation hack */
    .v-slider {
      width: calc(100% - 20px);
      height: 26px;
      transform: rotate(-90deg);
      transform-origin: center center;
    }

    .v-slider ::ng-deep .mdc-slider {
      width: 100% !important;
    }

    .v-slider ::ng-deep .mdc-slider__track {
      height: 6px !important;
    }

    .v-slider ::ng-deep .mdc-slider__track--inactive {
      background-color: rgba(255,255,255,0.15) !important;
      height: 6px !important;
    }

    .v-slider ::ng-deep .mdc-slider__track--active,
    .v-slider ::ng-deep .mdc-slider__track--active_fill {
      background-color: #666 !important;
      height: 6px !important;
      border-color: #666 !important;
    }

    .master-fader ::ng-deep .mdc-slider__track--active,
    .master-fader ::ng-deep .mdc-slider__track--active_fill {
      background-color: #888 !important;
      border-color: #888 !important;
    }

    .v-slider ::ng-deep .mdc-slider__thumb-knob {
      background: linear-gradient(180deg, #f5f5f5, #ccc) !important;
      border: 2px solid #222 !important;
      border-radius: 3px !important;
      width: 26px !important;
      height: 14px !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.6) !important;
    }

    .v-slider ::ng-deep .mdc-slider__thumb:hover .mdc-slider__thumb-knob {
      background: linear-gradient(180deg, #fff, #ddd) !important;
    }

    .v-slider ::ng-deep .mdc-slider__thumb {
      width: 26px !important;
      height: 26px !important;
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
      background: linear-gradient(to top, #4caf50 60%, #ffeb3b 80%, #f44336 95%);
      box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
    }

    /* Actions */
    .channel-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-top: 4px;
    }

    .action-btn {
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
      padding: 0 !important;
      background: #333 !important;
      border: 1px solid #000 !important;
      border-radius: 2px !important;
    }

    .action-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #888;
    }

    /* LED Glow Effects */
    .active { background: #d32f2f !important; }
    .active mat-icon { color: #fff !important; }

    .active-play { background: #2e7d32 !important; border-color: #4caf50 !important; animation: led-pulse-green 1.5s infinite; }
    .active-play mat-icon { color: #fff !important; }

    .active-pause { background: #ef6c00 !important; border-color: #ff9800 !important; }
    .active-pause mat-icon { color: #fff !important; }

    .active-loop { background: #1565c0 !important; border-color: #2196f3 !important; }
    .active-loop mat-icon { color: #fff !important; }

    @keyframes led-pulse-green {
      0% { box-shadow: 0 0 2px #4caf50; }
      50% { box-shadow: 0 0 8px #4caf50; }
      100% { box-shadow: 0 0 2px #4caf50; }
    }

    .channel-value {
      font-size: 9px;
      font-family: monospace;
      color: #777;
      text-align: center;
      margin-top: 2px;
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

    .channels-container::-webkit-scrollbar {
      height: 4px;
    }

    .channels-container::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 2px;
    }

    /* Mini Progress Strip */
    .mini-progress-well {
      position: absolute;
      right: 2px;
      top: 20px;
      bottom: 20px;
      width: 2px;
      background: rgba(0,0,0,0.3);
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
      background: #4fc3f7;
    }

    .empty-channels {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #444;
      font-size: 11px;
      gap: 4px;
    }

    .empty-channels mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSliderModule, MatTooltipModule]
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
      volume: m.volume ?? 100,
      loop: m.loop ?? false,
      randomOrder: m.randomOrder ?? false
    }));
  }

  isPlaying(mapping: MusicMapping): boolean {
    const state = this.playbackStates.get(mapping.key);
    return state?.isPlaying ?? false;
  }

  isPaused(mapping: MusicMapping): boolean {
    const state = this.playbackStates.get(mapping.key);
    return state?.isPaused ?? false;
  }

  getProgress(mapping: MusicMapping): number {
    const state = this.playbackStates.get(mapping.key);
    if (!state || !state.duration) return 0;
    return (state.elapsed / state.duration) * 100;
  }

  getTimeDisplay(mapping: MusicMapping): string {
    const state = this.playbackStates.get(mapping.key);
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
    this.playbackStates.forEach((state, key) => {
      if (state && state.audio) {
        const mapping = this.mappings.find(m => m.key === key);
        if (mapping) {
          this.applyVolume(state, mapping);
        }
      }
    });
  }

  onTrackVolumeChange(mapping: MusicMapping): void {
    const state = this.playbackStates.get(mapping.key);
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
    const state = this.playbackStates.get(mapping.key);
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
    const state = this.playbackStates.get(mapping.key);
    if (state) {
      this.cleanupPlayback(state, mapping.key);
    }
  }

  pauseTrack(mapping: MusicMapping): void {
    const state = this.playbackStates.get(mapping.key);
    if (!state || !state.audio) return;

    if (this.fadeDuration > 0) {
      this.fadeAudio(state, 0, () => {
        state.audio!.pause();
        state.isPlaying = false;
        state.isPaused = true;
        this.stopProgressTracking(mapping.key);
      });
    } else {
      state.audio.pause();
      state.isPlaying = false;
      state.isPaused = true;
      this.stopProgressTracking(mapping.key);
    }
  }

  resumeTrack(mapping: MusicMapping): void {
    const state = this.playbackStates.get(mapping.key);
    if (!state || !state.audio) return;

    this.applyVolume(state, mapping);
    state.audio.play();
    state.isPlaying = true;
    state.isPaused = false;
    this.startProgressTracking(mapping.key, state);
  }

  playTrack(mapping: MusicMapping): void {
    if (!mapping.files || mapping.files.length === 0) return;

    if (!this.settings?.allowMultiple) {
      this.stopAllSounds();
    }

    const existingState = this.playbackStates.get(mapping.key);
    if (existingState) {
      this.cleanupPlayback(existingState, mapping.key);
    }

    const state = this.setupPlaylist(mapping);
    state.isPlaying = true;
    state.isPaused = false;
    this.playbackStates.set(mapping.key, state);
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
          this.cleanupPlayback(state, mapping.key);
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

      this.startProgressTracking(mapping.key, state);
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
