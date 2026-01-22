import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MusicFile {
  fileName: string;
  fileDataUrl: string;
}

export interface PlaybackState {
  widgetId: string;
  mappingId: string;
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
  volume: number;
  loop: boolean;
  randomOrder: boolean;
}

export interface MasterState {
  volume: number;
  muted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MusicPlaybackService {
  // Store playback states by a combined key of widgetId-mappingId
  private playbackStates = new Map<string, PlaybackState>();
  private progressIntervals = new Map<string, number>();

  // Master volume states per widget
  private masterStates = new Map<string, MasterState>();

  // Observable for UI updates
  private stateChange$ = new BehaviorSubject<void>(undefined);

  // Default fade duration
  private fadeDuration = 0.5;

  get stateChanges() {
    return this.stateChange$.asObservable();
  }

  private getKey(widgetId: string, mappingId: string): string {
    return `${widgetId}-${mappingId}`;
  }

  getMasterState(widgetId: string): MasterState {
    if (!this.masterStates.has(widgetId)) {
      this.masterStates.set(widgetId, { volume: 100, muted: false });
    }
    return this.masterStates.get(widgetId)!;
  }

  setMasterVolume(widgetId: string, volume: number): void {
    const state = this.getMasterState(widgetId);
    state.volume = volume;
    state.muted = volume === 0;
    this.updateAllVolumesForWidget(widgetId);
    this.notifyChange();
  }

  toggleMasterMute(widgetId: string): void {
    const state = this.getMasterState(widgetId);
    state.muted = !state.muted;
    this.updateAllVolumesForWidget(widgetId);
    this.notifyChange();
  }

  setFadeDuration(duration: number): void {
    this.fadeDuration = duration;
  }

  getPlaybackState(widgetId: string, mappingId: string): PlaybackState | undefined {
    return this.playbackStates.get(this.getKey(widgetId, mappingId));
  }

  getAllStatesForWidget(widgetId: string): Map<string, PlaybackState> {
    const result = new Map<string, PlaybackState>();
    this.playbackStates.forEach((state, key) => {
      if (state.widgetId === widgetId) {
        result.set(state.mappingId, state);
      }
    });
    return result;
  }

  isPlaying(widgetId: string, mappingId: string): boolean {
    const state = this.playbackStates.get(this.getKey(widgetId, mappingId));
    return state?.isPlaying ?? false;
  }

  isPaused(widgetId: string, mappingId: string): boolean {
    const state = this.playbackStates.get(this.getKey(widgetId, mappingId));
    return state?.isPaused ?? false;
  }

  getProgress(widgetId: string, mappingId: string): number {
    const state = this.playbackStates.get(this.getKey(widgetId, mappingId));
    if (!state || !state.duration) return 0;
    return (state.elapsed / state.duration) * 100;
  }

  getElapsed(widgetId: string, mappingId: string): number {
    const state = this.playbackStates.get(this.getKey(widgetId, mappingId));
    return state?.elapsed ?? 0;
  }

  getDuration(widgetId: string, mappingId: string): number {
    const state = this.playbackStates.get(this.getKey(widgetId, mappingId));
    return state?.duration ?? 0;
  }

  play(
    widgetId: string,
    mappingId: string,
    files: MusicFile[],
    volume: number,
    loop: boolean,
    randomOrder: boolean,
    allowMultiple: boolean
  ): void {
    // Filter out files without valid data URLs
    const validFiles = files?.filter(f => f.fileDataUrl) || [];
    if (validFiles.length === 0) {
      console.warn('No valid audio files to play (missing fileDataUrl)');
      return;
    }

    // Stop other tracks if not allowing multiple
    if (!allowMultiple) {
      this.stopAllForWidget(widgetId);
    }

    const key = this.getKey(widgetId, mappingId);
    const existingState = this.playbackStates.get(key);
    if (existingState) {
      this.cleanupPlayback(key);
    }

    const state = this.setupPlaylist(widgetId, mappingId, validFiles, volume, loop, randomOrder);
    state.isPlaying = true;
    state.isPaused = false;
    this.playbackStates.set(key, state);
    this.playNext(state);
  }

  pause(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (!state || !state.audio) return;

    if (this.fadeDuration > 0) {
      this.fadeAudio(state, 0, () => {
        state.audio!.pause();
        state.isPlaying = false;
        state.isPaused = true;
        this.stopProgressTracking(key);
        this.notifyChange();
      });
    } else {
      state.audio.pause();
      state.isPlaying = false;
      state.isPaused = true;
      this.stopProgressTracking(key);
      this.notifyChange();
    }
  }

  resume(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (!state || !state.audio) return;

    this.applyVolume(state);
    state.audio.play();
    state.isPlaying = true;
    state.isPaused = false;
    this.startProgressTracking(key, state);
    this.notifyChange();
  }

  stop(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    this.cleanupPlayback(key);
    this.notifyChange();
  }

  stopAllForWidget(widgetId: string): void {
    const keysToRemove: string[] = [];
    this.playbackStates.forEach((state, key) => {
      if (state.widgetId === widgetId) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.cleanupPlayback(key));
    this.notifyChange();
  }

  stopAll(): void {
    this.playbackStates.forEach((_, key) => {
      this.cleanupPlayback(key);
    });
    this.playbackStates.clear();
    this.notifyChange();
  }

  setTrackVolume(widgetId: string, mappingId: string, volume: number): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (state) {
      state.volume = volume;
      this.applyVolume(state);
      this.notifyChange();
    }
  }

  toggleLoop(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (state) {
      state.loop = !state.loop;
      if (state.audio) {
        state.audio.loop = state.loop;
      }
      this.notifyChange();
    }
  }

  toggleShuffle(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (state) {
      state.randomOrder = !state.randomOrder;
      // Regenerate play order if shuffling
      if (state.randomOrder) {
        state.playOrder = this.getShuffledPlayOrder(state.playlist.length);
      } else {
        state.playOrder = Array.from({ length: state.playlist.length }, (_, i) => i);
      }
      this.notifyChange();
    }
  }

  next(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (!state || state.playlist.length <= 1) return;

    // Stop current audio
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
    }

    // Move to next track
    state.currentIndex++;
    if (state.currentIndex >= state.playlist.length) {
      state.currentIndex = 0;
      // Reshuffle if at end and random order is enabled
      if (state.randomOrder) {
        state.playOrder = this.getShuffledPlayOrder(state.playlist.length);
      }
    }

    // Play next track if currently playing or paused
    if (state.isPlaying || state.isPaused) {
      this.playNext(state);
    }
  }

  previous(widgetId: string, mappingId: string): void {
    const key = this.getKey(widgetId, mappingId);
    const state = this.playbackStates.get(key);
    if (!state || state.playlist.length <= 1) return;

    // If more than 3 seconds into the track, restart it instead of going to previous
    if (state.audio && state.audio.currentTime > 3) {
      state.audio.currentTime = 0;
      state.elapsed = 0;
      this.notifyChange();
      return;
    }

    // Stop current audio
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
    }

    // Move to previous track
    state.currentIndex--;
    if (state.currentIndex < 0) {
      state.currentIndex = state.playlist.length - 1;
    }

    // Play previous track if currently playing or paused
    if (state.isPlaying || state.isPaused) {
      this.playNext(state);
    }
  }

  private updateAllVolumesForWidget(widgetId: string): void {
    this.playbackStates.forEach((state) => {
      if (state.widgetId === widgetId && state.audio) {
        this.applyVolume(state);
      }
    });
  }

  private applyVolume(state: PlaybackState): void {
    if (!state.audio) return;
    const master = this.getMasterState(state.widgetId);
    const trackVolume = state.volume / 100;
    const masterVol = master.muted ? 0 : master.volume / 100;
    state.audio.volume = trackVolume * masterVol;
  }

  private setupPlaylist(
    widgetId: string,
    mappingId: string,
    files: MusicFile[],
    volume: number,
    loop: boolean,
    randomOrder: boolean
  ): PlaybackState {
    const playlist = [...files];
    const playOrder = randomOrder
      ? this.getShuffledPlayOrder(playlist.length)
      : Array.from({ length: playlist.length }, (_, i) => i);

    return {
      widgetId,
      mappingId,
      currentIndex: 0,
      audio: null,
      isPlaying: false,
      isPaused: false,
      playlist,
      playOrder,
      progress: 0,
      duration: 0,
      elapsed: 0,
      volume,
      loop,
      randomOrder
    };
  }

  private getShuffledPlayOrder(length: number): number[] {
    const order = Array.from({ length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  private playNext(state: PlaybackState): void {
    if (!state.playlist.length) return;

    const key = this.getKey(state.widgetId, state.mappingId);
    const currentFile = state.playlist[state.playOrder[state.currentIndex]];

    const audio = new Audio(currentFile.fileDataUrl);
    audio.loop = state.loop;

    const master = this.getMasterState(state.widgetId);
    const trackVolume = state.volume / 100;
    const masterVol = master.muted ? 0 : master.volume / 100;

    if (this.fadeDuration > 0) {
      audio.volume = 0;
    } else {
      audio.volume = trackVolume * masterVol;
    }

    audio.addEventListener('loadedmetadata', () => {
      state.duration = audio.duration || 0;
      state.elapsed = 0;
      this.notifyChange();
    });

    audio.addEventListener('ended', () => {
      state.currentIndex++;

      if (state.currentIndex >= state.playlist.length) {
        if (state.loop) {
          state.currentIndex = 0;
          if (state.randomOrder) {
            state.playOrder = this.getShuffledPlayOrder(state.playlist.length);
          }
          this.playNext(state);
        } else {
          state.isPlaying = false;
          state.isPaused = false;
          state.elapsed = 0;
          this.cleanupPlayback(key);
          this.notifyChange();
        }
      } else {
        this.playNext(state);
      }
    });

    audio.play();
    state.audio = audio;
    state.isPlaying = true;
    state.isPaused = false;

    if (this.fadeDuration > 0) {
      this.fadeAudio(state, trackVolume * masterVol);
    }

    this.startProgressTracking(key, state);
    this.notifyChange();
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
        this.notifyChange();
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

  private cleanupPlayback(key: string): void {
    const state = this.playbackStates.get(key);
    if (!state) return;

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

  private notifyChange(): void {
    this.stateChange$.next();
  }
}
