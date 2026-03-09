import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-daytime-tracker',
  template: `
    <div class="daytime-tracker" [class.is-night]="isNight()">
      <div class="main-row">
        
        <div class="time-readout-container">
           <span class="current-time" [style.background-color]="getCurrentBackgroundColor()" [style.color]="getTextColor()" [style.box-shadow]="getGlow()">
             {{ formatTime() }}
           </span>
        </div>

        <div class="slider-container">
          <div class="track-background"></div>
          <input 
            type="range" 
            class="time-slider" 
            min="0" 
            max="23" 
            step="1" 
            [(ngModel)]="currentHour" 
            (ngModelChange)="onTimeChange()"
            [style.--thumb-color]="getThumbColor()"
            [style.--thumb-glow]="getThumbGlow()"
          />
        </div>
        
      </div>
      
      <div class="button-row">
        <button class="glass-btn" (click)="adjustTime(-5)" title="Minus 5 Hours">
            <mat-icon>keyboard_double_arrow_left</mat-icon>
            <span class="btn-text">5h</span>
        </button>
        <button class="glass-btn" (click)="adjustTime(-1)" title="Minus 1 Hour">
            <mat-icon>keyboard_arrow_left</mat-icon>
            <span class="btn-text">1h</span>
        </button>
        
        <div class="spacer"></div>
        <mat-icon class="status-icon">{{ isNight() ? 'bedtime' : 'wb_sunny' }}</mat-icon>
        <div class="spacer"></div>

        <button class="glass-btn" (click)="adjustTime(1)" title="Plus 1 Hour">
             <span class="btn-text">1h</span>
             <mat-icon>keyboard_arrow_right</mat-icon>
        </button>
        <button class="glass-btn" (click)="adjustTime(5)" title="Plus 5 Hours">
            <span class="btn-text">5h</span>
            <mat-icon>keyboard_double_arrow_right</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
  .daytime-tracker {
    padding: 16px;
    border-radius: 12px;
    background: var(--glass-bg, rgba(30, 30, 30, 0.6));
    color: var(--text-primary, #fff);
    border: var(--glass-border, 1px solid rgba(255, 255, 255, 0.1));
    backdrop-filter: var(--glass-backdrop, blur(10px));
    transition: background-color 0.5s ease;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .daytime-tracker.is-night {
    background: rgba(10, 12, 16, 0.7);
  }

  .main-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .time-readout-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .current-time {
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 1.1em;
    font-variant-numeric: tabular-nums;
    transition: background-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease;
    min-width: 60px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .slider-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    height: 32px;
  }

  .track-background {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 8px;
    transform: translateY(-50%);
    border-radius: 4px;
    background: linear-gradient(90deg,
      #0a0c10 0%,
      #0a0c10 16%,
      #4a3728 25%,
      #FFD700 37%,
      #FFD700 70%,
      #4a3728 83%,
      #0a0c10 91%,
      #0a0c10 100%
    );
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.1);
    pointer-events: none;
  }

  .time-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    background: transparent;
    outline: none;
    margin: 0;
    z-index: 1;
    cursor: pointer;
  }

  /* WebKit Thumb */
  .time-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--thumb-color, #FFF);
    box-shadow: var(--thumb-glow, 0 0 10px rgba(255,255,255,0.5)), 0 2px 4px rgba(0,0,0,0.5);
    border: 2px solid rgba(255, 255, 255, 0.8);
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
  }

  /* Mozilla Thumb */
  .time-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--thumb-color, #FFF);
    box-shadow: var(--thumb-glow, 0 0 10px rgba(255,255,255,0.5)), 0 2px 4px rgba(0,0,0,0.5);
    border: 2px solid rgba(255, 255, 255, 0.8);
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
  }

  .button-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  
  .spacer {
    flex: 1;
  }

  .status-icon {
    color: var(--text-primary);
    opacity: 0.8;
    transition: opacity 0.3s ease, transform 0.3s ease, color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .daytime-tracker:not(.is-night) .status-icon {
    color: #FFD700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  }

  .daytime-tracker.is-night .status-icon {
    color: #b0c4de;
    text-shadow: 0 0 10px rgba(176, 196, 222, 0.4);
  }

  .glass-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    height: 32px;
    min-width: 48px;
  }

  .glass-btn mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }

  .glass-btn .btn-text {
    font-size: 0.85em;
    font-weight: 500;
    margin: 0 2px;
  }

  .glass-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .glass-btn:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  `],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ]
})
export class DaytimeTrackerComponent {
  @Input() settings: any;
  @Output() settingsChange = new EventEmitter<void>();

  currentHour: number = 12;
  readonly DAY_COLOR = '#FFD700';
  readonly NIGHT_COLOR = '#1a2233'; // Slightly lighter than black for UI elements
  readonly DAWN_DUSK_COLOR = '#ff8c00'; // Orange for transitions

  ngOnInit() {
    if (this.settings?.hour !== undefined) {
      this.currentHour = this.settings.hour;
    }
  }

  onTimeChange() {
    // Ensure it's treated as a number
    this.currentHour = Number(this.currentHour);
    if (this.settings) {
      this.settings.hour = this.currentHour;
      this.settingsChange.emit();
    }
  }

  adjustTime(hours: number) {
    let newHour = Number(this.currentHour) + hours;
    // Wrap around 24-hour cycle
    newHour = ((newHour % 24) + 24) % 24;
    this.currentHour = newHour;
    this.onTimeChange();
  }

  formatTime(): string {
    return `${this.currentHour.toString().padStart(2, '0')}:00`;
  }

  isNight(): boolean {
    return this.currentHour >= 20 || this.currentHour <= 4;
  }

  getCurrentBackgroundColor(): string {
    const hour = this.currentHour;

    if (hour >= 20 || hour <= 4) {
      return this.NIGHT_COLOR;
    }
    if (hour >= 5 && hour <= 7) {
      const progress = (hour - 5) / 2;
      return this.interpolateColor(this.NIGHT_COLOR, this.DAY_COLOR, progress);
    }
    if (hour >= 8 && hour <= 16) {
      return this.DAY_COLOR;
    }
    if (hour >= 17 && hour <= 19) {
      const progress = (hour - 17) / 2;
      return this.interpolateColor(this.DAY_COLOR, this.NIGHT_COLOR, progress);
    }

    return this.DAY_COLOR;
  }
  
  getGlow(): string {
    const bg = this.getCurrentBackgroundColor();
    return `0 0 15px ${bg}80`;
  }

  getThumbColor(): string {
    const hour = this.currentHour;
    if (hour >= 20 || hour <= 4) return '#e6e6fa';
    if (hour >= 5 && hour <= 7) return this.DAWN_DUSK_COLOR;
    if (hour >= 8 && hour <= 16) return '#ffffff';
    if (hour >= 17 && hour <= 19) return this.DAWN_DUSK_COLOR;
    return '#ffffff';
  }

  getThumbGlow(): string {
    const hour = this.currentHour;
    if (hour >= 20 || hour <= 4) return '0 0 12px rgba(230, 230, 250, 0.6)';
    if (hour >= 5 && hour <= 7) return '0 0 15px rgba(255, 140, 0, 0.8)';
    if (hour >= 8 && hour <= 16) return '0 0 20px rgba(255, 215, 0, 0.9)';
    if (hour >= 17 && hour <= 19) return '0 0 15px rgba(255, 140, 0, 0.8)';
    return 'none';
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
