import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface MusicFile {
  fileName: string;
  fileDataUrl: string;
}

interface MusicMapping {
  key: string;
  files?: MusicFile[];
}

interface PlaybackState {
  currentIndex: number;
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  playlist: MusicFile[];
  playOrder: number[];
}

@Component({
  selector: 'app-music-widget',
  template: `
    <div class="music-widget">
      <div class="button-grid">
        <button mat-raised-button 
                *ngFor="let mapping of mappings" 
                (click)="playSound(mapping)" 
                [disabled]="!mapping.files || mapping.files.length === 0"
                [class.playing]="isPlaying(mapping)">
          {{ mapping.key || 'No Key' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .music-widget { padding: 8px; }
    .button-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      min-width: 60px;
      transition: background-color 0.2s;
    }
    button.playing {
      background-color: #4caf50 !important;
      color: white;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class MusicWidgetComponent implements OnInit, OnChanges, OnDestroy {
  private _settings: any;
  @Input() set settings(value: any) {
    this._settings = value;
    this.mappings = this._settings?.mappings || [];
  }
  get settings() {
    return this._settings;
  }
  @Output() settingsChange = new EventEmitter<any>();

  mappings: MusicMapping[] = [];
  private playbackStates: Map<string, PlaybackState> = new Map();

  ngOnInit() {
    this.mappings = this.settings?.mappings || [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.mappings = this.settings?.mappings || [];
    }
  }

  isPlaying(mapping: MusicMapping): boolean {
    const state = this.playbackStates.get(mapping.key);
    return state?.isPlaying || false;
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
        playlist: [],
        playOrder: []
      };
    }

    const playlist = [...mapping.files];
    const playOrder = this.settings.randomOrder 
      ? this.getShuffledPlayOrder(playlist.length)
      : Array.from({ length: playlist.length }, (_, i) => i);

    return {
      currentIndex: 0,
      audio: null,
      isPlaying: false,
      playlist,
      playOrder
    };
  }

  private playNext(mapping: MusicMapping, state: PlaybackState) {
    if (!state.playlist.length) return;

    // Get the next file to play
    const currentFile = state.playlist[state.playOrder[state.currentIndex]];
    
    // Create and setup the audio element
    const audio = new Audio(currentFile.fileDataUrl);
    
    audio.addEventListener('ended', () => {
      state.currentIndex++;
      
      // Check if we've reached the end of the playlist
      if (state.currentIndex >= state.playlist.length) {
        if (this.settings.loopEnabled) {
          // If loop is enabled, reset index and potentially reshuffle
          state.currentIndex = 0;
          if (this.settings.randomOrder) {
            state.playOrder = this.getShuffledPlayOrder(state.playlist.length);
          }
          this.playNext(mapping, state);
        } else {
          // If not looping, stop playback
          state.isPlaying = false;
          state.audio = null;
          this.playbackStates.delete(mapping.key);
        }
      } else {
        // Play the next file in the playlist
        this.playNext(mapping, state);
      }
    });

    // Start playback
    audio.play();
    state.audio = audio;
  }

  playSound(mapping: MusicMapping) {
    // If already playing, stop the current playback
    if (this.playbackStates.has(mapping.key)) {
      const existingState = this.playbackStates.get(mapping.key)!;
      if (existingState.audio) {
        existingState.audio.pause();
        existingState.audio.currentTime = 0;
      }
      this.playbackStates.delete(mapping.key);
      return;
    }

    // If multiple sounds are not allowed, stop all currently playing sounds
    if (!this.settings.allowMultiple) {
      this.stopAllSounds();
    }

    // Setup new playback state
    const state = this.setupPlaylist(mapping);
    if (state.playlist.length > 0) {
      state.isPlaying = true;
      this.playbackStates.set(mapping.key, state);
      this.playNext(mapping, state);
    }
  }

  private stopAllSounds() {
    this.playbackStates.forEach((state) => {
      if (state.audio) {
        state.audio.pause();
        state.audio.currentTime = 0;
      }
    });
    this.playbackStates.clear();
  }

  ngOnDestroy() {
    this.stopAllSounds();
  }
}