import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
      <div class="button-row">
        <button mat-stroked-button class="time-adjust-btn" (click)="adjustTime(-5)">-5</button>
        <button mat-stroked-button class="time-adjust-btn" (click)="adjustTime(-1)">-1</button>
        <button mat-stroked-button class="time-adjust-btn" (click)="adjustTime(1)">+1</button>
        <button mat-stroked-button class="time-adjust-btn" (click)="adjustTime(5)">+5</button>
      </div>
    </div>
  `,
  styles: [`
  .daytime-tracker {
    padding: 8px;
    border-radius: 4px;
    background: transparent; /* Rely on container background */
    color: var(--text-primary);
  }

  .main-row {
    display: flex;
    align-items: center;
    gap: 12px;
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
    height: 10px;
    display: flex;
    z-index: 0;
    pointer-events: none;
    border-radius: 5px;
    overflow: hidden;
    opacity: 0.8; /* Slight transparency for blending */
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .period {
    height: 100%;
  }

  .period.night {
    background: #0d1117; /* Dark blue-black instead of pure black */
  }

  .period.dawn {
    background: linear-gradient(90deg, #0d1117 0%, #FFD700 100%);
  }

  .period.day {
    background: #FFD700;
  }

  .period.dusk {
    background: linear-gradient(90deg, #FFD700 0%, #0d1117 100%);
  }

  .time-slider {
    flex: 1;
    width: 100%;
    z-index: 1;
  }

  .time-icon {
    color: var(--text-primary);
    font-size: 20px;
    width: 20px;
    height: 20px;
    line-height: 20px;
    opacity: 0.8;
  }

  .current-time {
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    transition: background-color 0.3s ease, color 0.3s ease;
    min-width: 52px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .button-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }

  .time-adjust-btn {
    min-width: 40px;
    padding: 0 8px;
    font-size: 0.85em;
    height: 28px;
    line-height: 28px;
    border-color: var(--text-primary);
    color: var(--text-primary);
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .time-adjust-btn:hover {
    opacity: 1;
  }

  /* Override MDC slider CSS variables */
  :host {
    --mdc-slider-track-active-color: transparent;
    --mdc-slider-active-track-color: transparent;
    --mdc-slider-handle-color: var(--text-primary);
    --mdc-slider-focus-handle-color: var(--accent-color);
    --mdc-slider-hover-handle-color: var(--text-primary);
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

    /* Thumb Styling */
    .mdc-slider__thumb-knn {
      background-color: var(--text-primary) !important;
      border: 2px solid var(--glass-bg) !important;
    }
  }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSliderModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class DaytimeTrackerComponent {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<void>();

  currentHour: number = 12;
  readonly DAY_COLOR = '#FFD700';
  readonly NIGHT_COLOR = '#0d1117'; // Updated to match CSS

  ngOnInit() {
    if (this.settings?.hour !== undefined) {
      this.currentHour = this.settings.hour;
    }
  }

  onTimeChange() {
    if (this.settings) {
      this.settings.hour = this.currentHour;
      this.settingsChange.emit();
    }
  }

  adjustTime(hours: number) {
    let newHour = this.currentHour + hours;
    // Wrap around 24-hour cycle
    newHour = ((newHour % 24) + 24) % 24;
    this.currentHour = newHour;
    this.onTimeChange();
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
