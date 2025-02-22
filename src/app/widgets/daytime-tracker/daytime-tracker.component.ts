import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-daytime-tracker',
  template: `
    <div class="daytime-tracker">
      <div class="main-row">
        <mat-icon class="time-icon">wb_sunny</mat-icon>
        <div class="slider-container">
          <div class="time-periods">
            <div class="period night" style="width: 25%"></div>
            <div class="period dawn" style="width: 12.5%"></div>
            <div class="period day" style="width: 37.5%"></div>
            <div class="period dusk" style="width: 12.5%"></div>
            <div class="period night" style="width: 12.5%"></div>
          </div>
          <mat-slider
            class="time-slider"
            [min]="0"
            [max]="23"
            [step]="1"
            [discrete]="true"
            [showTickMarks]="true">
            <input matSliderThumb [(ngModel)]="currentHour" (ngModelChange)="onTimeChange()">
          </mat-slider>
        </div>
        <span class="current-time" [style.background-color]="getCurrentBackgroundColor()" [style.color]="getTextColor()">
          {{ formatTime() }}
        </span>
        <mat-icon class="time-icon">bedtime</mat-icon>
      </div>
    </div>
  `,
  styles: [`
  .daytime-tracker {
  padding: 4px;
  border-radius: 4px;
  background: white;
}

.main-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
}

.slider-container {
  position: relative;
  flex: 1;
  min-width: 0;
}

.time-periods {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  right: 0;
  height: 8px;
  display: flex;
  z-index: 0;
  pointer-events: none;
  border-radius: 4px;
  overflow: hidden;
}

.period {
  height: 100%;
}

.period.night {
  background: #000000;
}

.period.dawn {
  background: linear-gradient(90deg, #000000 0%, #FFD700 100%);
}

.period.day {
  background: #FFD700;
}

.period.dusk {
  background: linear-gradient(90deg, #FFD700 0%, #000000 100%);
}

.time-slider {
  flex: 1;
  width: 100%;
  z-index: 1;
}

.time-icon {
  color: #666;
  font-size: 18px;
  width: 18px;
  height: 18px;
  line-height: 18px;
}

.current-time {
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  transition: background-color 0.3s ease, color 0.3s ease;
  min-width: 52px;
  text-align: center;
}

/* Override MDC slider CSS variables */
:host {
  --mdc-slider-track-active-color: transparent;
  --mdc-slider-active-track-color: transparent;
}

/* Deep overrides to adjust slider appearance */
:host ::ng-deep {
  /* Ensure thumb container stays centered */
  .mat-mdc-slider-thumb-container,
  .mdc-slider__thumb-container {
    top: 50% !important;
    transform: translateY(-50%) !important;
  }
  
  /* Ensure track container is centered */
  .mat-mdc-slider-track-container,
  .mdc-slider__track-container {
    top: 50% !important;
    transform: translateY(-50%) !important;
  }
  
  /* Hide the active (blue) track fill entirely */
  .mat-mdc-slider-track-active,
  .mdc-slider__track--active {
    display: none !important;
    background: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
  }
}

  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSliderModule,
    MatIconModule
  ]
})
export class DaytimeTrackerComponent {
  @Input() settings: any;

  currentHour: number = 12;
  readonly DAY_COLOR = '#FFD700';
  readonly NIGHT_COLOR = '#000000';

  ngOnInit() {
    if (this.settings?.hour !== undefined) {
      this.currentHour = this.settings.hour;
    }
  }

  onTimeChange() {
    if (this.settings) {
      this.settings.hour = this.currentHour;
    }
  }

  formatTime(): string {
    return `${this.currentHour.toString().padStart(2, '0')}:00`;
  }

  getCurrentBackgroundColor(): string {
    const hour = this.currentHour;

    if (hour >= 20 || hour < 5) {
      return this.NIGHT_COLOR;
    }
    if (hour >= 5 && hour < 8) {
      const progress = (hour - 5) / 3;
      return this.interpolateColor(this.NIGHT_COLOR, this.DAY_COLOR, progress);
    }
    if (hour >= 8 && hour < 17) {
      return this.DAY_COLOR;
    }
    if (hour >= 17 && hour < 20) {
      const progress = (hour - 17) / 3;
      return this.interpolateColor(this.DAY_COLOR, this.NIGHT_COLOR, progress);
    }

    return this.DAY_COLOR;
  }

  getTextColor(): string {
    const backgroundColor = this.getCurrentBackgroundColor();
    return this.isColorDark(backgroundColor) ? '#FFFFFF' : '#000000';
  }

  private interpolateColor(color1: string, color2: string, progress: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private isColorDark(color: string): boolean {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
}