import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

interface MusicMapping {
  key: string;
  fileName?: string;
  fileDataUrl?: string;
}

@Component({
  selector: 'app-music-widget',
  templateUrl: './music-widget.component.html',
  styleUrls: ['./music-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class MusicWidgetComponent implements OnInit, OnChanges {
  @Input() settings: any;
  mappings: MusicMapping[] = [];

  // Track the currently playing audio and its mapping
  currentAudio: HTMLAudioElement | null = null;
  currentMapping: MusicMapping | null = null;

  ngOnInit() {
    this.mappings = this['settings']?.mappings || [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.mappings = this['settings']?.mappings || [];
    }
  }

  playSound(mapping: MusicMapping) {
    // If clicking on the mapping that is already playing, stop the sound.
    if (this.currentMapping === mapping) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      this.currentAudio = null;
      this.currentMapping = null;
      return;
    }

    // If another sound is playing, stop it.
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    // Play the new sound if available.
    if (mapping.fileDataUrl) {
      const audio = new Audio(mapping.fileDataUrl);
      audio.play();

      // When the audio ends, clear the current mapping so the button visual resets.
      audio.addEventListener('ended', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentMapping = null;
        }
      });

      this.currentAudio = audio;
      this.currentMapping = mapping;
    }
  }
}
