import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

interface MusicMapping {
  key: string;
  fileName?: string;
  fileDataUrl?: string;
}

@Component({
  selector: 'app-music-widget',
  template: `
    <div class="music-widget">
      <div class="button-grid">
        <button mat-raised-button 
                *ngFor="let mapping of mappings" 
                (click)="playSound(mapping)" 
                [disabled]="!mapping.fileDataUrl"
                [class.playing]="isPlaying(mapping)">
          {{ mapping.key || 'No Key' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .music-widget {
      padding: 8px;
    }
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
  @Input() settings: any;
  mappings: MusicMapping[] = [];
  activeAudios: Map<string, HTMLAudioElement> = new Map();

  ngOnInit() {
    this.mappings = this.settings?.mappings || [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.mappings = this.settings?.mappings || [];
    }
  }

  isPlaying(mapping: MusicMapping): boolean {
    const audio = this.activeAudios.get(mapping.key);
    return !!audio && !audio.paused;
  }

  playSound(mapping: MusicMapping) {
    // If this mapping is already playing
    if (this.activeAudios.has(mapping.key)) {
      const existingAudio = this.activeAudios.get(mapping.key)!;
      existingAudio.pause();
      existingAudio.currentTime = 0;
      this.activeAudios.delete(mapping.key);
      return;
    }

    // If we don't allow multiple sounds and something is playing
    if (!this.settings.allowMultiple) {
      this.stopAllSounds();
    }

    if (mapping.fileDataUrl) {
      const audio = new Audio(mapping.fileDataUrl);
      
      // Set loop based on settings
      audio.loop = this.settings.loopEnabled;

      audio.play();

      // Add event listener for when the audio ends
      audio.addEventListener('ended', () => {
        if (!audio.loop) {
          this.activeAudios.delete(mapping.key);
        }
      });

      this.activeAudios.set(mapping.key, audio);
    }
  }

  private stopAllSounds() {
    this.activeAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeAudios.clear();
  }

  ngOnDestroy() {
    this.stopAllSounds();
  }
}