import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { CountdownService } from './countdown.service';

@Component({
  selector: 'app-countdown',
  template: `
    <div class="countdown-container">
      <div class="time-display" [class.running]="isRunning" [class.finished]="totalSeconds === 0 && !isRunning">
        <div class="time-inputs" *ngIf="!isRunning && totalSeconds === 0">
          <div class="time-field">
            <input type="number" [(ngModel)]="inputHours" min="0" max="99" placeholder="00">
            <span class="label">h</span>
          </div>
          <span class="separator">:</span>
          <div class="time-field">
            <input type="number" [(ngModel)]="inputMinutes" min="0" max="59" placeholder="00">
            <span class="label">m</span>
          </div>
          <span class="separator">:</span>
          <div class="time-field">
            <input type="number" [(ngModel)]="inputSeconds" min="0" max="59" placeholder="00">
            <span class="label">s</span>
          </div>
        </div>
        <div class="time-value" *ngIf="isRunning || totalSeconds > 0">
          {{ formatTime() }}
        </div>
      </div>

      <div class="controls">
        <button mat-mini-fab color="primary" (click)="toggleTimer()" [disabled]="!canStart()">
          <mat-icon>{{ isRunning ? 'pause' : 'play_arrow' }}</mat-icon>
        </button>
        <button mat-mini-fab (click)="resetTimer()" [disabled]="totalSeconds === 0 && !isRunning">
          <mat-icon>stop</mat-icon>
        </button>
      </div>

      <div class="label-input" *ngIf="!isRunning && totalSeconds === 0">
        <mat-form-field appearance="outline" class="label-field">
          <mat-label>Timer Label</mat-label>
          <input matInput [(ngModel)]="timerLabel" placeholder="e.g., Rest break">
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .countdown-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      gap: 16px;
      height: 100%;
      box-sizing: border-box;
    }

    .time-display {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      background: var(--glass-bg, rgba(255,255,255,0.1));
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .time-display.running {
      border-color: var(--accent-color, #4CAF50);
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
    }

    .time-display.finished {
      border-color: #f44336;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 5px rgba(244, 67, 54, 0.3); }
      50% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.6); }
    }

    .time-inputs {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .time-field {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .time-field input {
      width: 50px;
      padding: 8px;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      background: transparent;
      border: 1px solid var(--text-secondary, rgba(255,255,255,0.3));
      border-radius: 4px;
      color: var(--text-primary, #fff);
      font-family: monospace;
    }

    .time-field input:focus {
      outline: none;
      border-color: var(--accent-color, #4CAF50);
    }

    .time-field input::-webkit-inner-spin-button,
    .time-field input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .time-field .label {
      font-size: 14px;
      color: var(--text-secondary, rgba(255,255,255,0.6));
    }

    .separator {
      font-size: 24px;
      font-weight: bold;
      color: var(--text-primary, #fff);
      margin: 0 4px;
    }

    .time-value {
      font-size: 36px;
      font-weight: bold;
      font-family: monospace;
      color: var(--text-primary, #fff);
      letter-spacing: 2px;
    }

    .controls {
      display: flex;
      gap: 12px;
    }

    .label-input {
      width: 100%;
      max-width: 250px;
    }

    .label-field {
      width: 100%;
    }

    :host ::ng-deep .label-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule
  ]
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input() settings: any;
  @Input() widgetId: string = '';

  private countdownService = inject(CountdownService);
  private cdr = inject(ChangeDetectorRef);
  private intervalId: any = null;

  inputHours: number = 0;
  inputMinutes: number = 5;
  inputSeconds: number = 0;
  totalSeconds: number = 0;
  isRunning: boolean = false;
  timerLabel: string = '';
  private endTime: number = 0; // Timestamp when timer should end

  ngOnInit() {
    if (this.settings) {
      // Restore saved state first
      if (this.settings.timerLabel) {
        this.timerLabel = this.settings.timerLabel;
      }
      if (this.settings.inputHours !== undefined) {
        this.inputHours = this.settings.inputHours;
      }
      if (this.settings.inputMinutes !== undefined) {
        this.inputMinutes = this.settings.inputMinutes;
      }
      if (this.settings.inputSeconds !== undefined) {
        this.inputSeconds = this.settings.inputSeconds;
      }

      // Check if service says this timer finished while we were away
      if (this.widgetId && this.countdownService.hasFinished(this.widgetId)) {
        this.countdownService.clearFinished(this.widgetId);
        // Reset state since timer finished
        this.totalSeconds = 0;
        this.isRunning = false;
        this.settings.isRunning = false;
        this.settings.endTime = 0;
        this.settings.totalSeconds = 0;
        return; // Don't try to restore running timer
      }

      // Restore running timer using endTime
      if (this.settings.endTime && this.settings.isRunning) {
        this.endTime = this.settings.endTime;
        const remaining = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
        if (remaining > 0) {
          this.totalSeconds = remaining;
          this.isRunning = true;
          // Re-register with service in case it was lost
          this.countdownService.registerTimer(this.widgetId, this.endTime, this.timerLabel);
          this.startInterval();
        } else {
          // Timer already finished while away - service will have handled the popup
          this.totalSeconds = 0;
          this.isRunning = false;
          this.settings.isRunning = false;
          this.settings.endTime = 0;
        }
      } else if (this.settings.totalSeconds !== undefined) {
        // Paused timer - restore remaining seconds
        this.totalSeconds = this.settings.totalSeconds;
      }
    }
  }

  ngOnDestroy() {
    // Only clear local interval, don't unregister from service so it keeps running
    this.clearInterval();
  }

  canStart(): boolean {
    if (this.isRunning) return true; // Can always pause
    if (this.totalSeconds > 0) return true; // Can resume
    // Check if any input value is set
    return this.inputHours > 0 || this.inputMinutes > 0 || this.inputSeconds > 0;
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.totalSeconds === 0) {
      // Convert input to total seconds
      this.totalSeconds =
        (this.inputHours || 0) * 3600 +
        (this.inputMinutes || 0) * 60 +
        (this.inputSeconds || 0);
    }

    if (this.totalSeconds > 0) {
      this.isRunning = true;
      this.endTime = Date.now() + this.totalSeconds * 1000;
      // Register with service so it can show popup even when component is destroyed
      this.countdownService.registerTimer(this.widgetId, this.endTime, this.timerLabel);
      this.saveState();
      this.startInterval();
    }
  }

  pauseTimer() {
    this.isRunning = false;
    this.endTime = 0;
    this.countdownService.unregisterTimer(this.widgetId);
    this.clearInterval();
    this.saveState();
  }

  resetTimer() {
    this.isRunning = false;
    this.totalSeconds = 0;
    this.endTime = 0;
    this.countdownService.unregisterTimer(this.widgetId);
    this.clearInterval();
    this.saveState();
  }

  private startInterval() {
    this.clearInterval();
    this.intervalId = setInterval(() => {
      if (this.endTime > 0) {
        const remaining = Math.ceil((this.endTime - Date.now()) / 1000);
        this.totalSeconds = Math.max(0, remaining);
        this.cdr.detectChanges();

        if (this.totalSeconds === 0) {
          this.timerFinished();
        }
      }
    }, 100); // Check more frequently for accuracy
  }

  private clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private timerFinished() {
    this.isRunning = false;
    this.endTime = 0;
    this.clearInterval();
    this.saveState();
    // Service handles the popup and sound
  }

  formatTime(): string {
    const hours = Math.floor(this.totalSeconds / 3600);
    const minutes = Math.floor((this.totalSeconds % 3600) / 60);
    const seconds = this.totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private saveState() {
    if (this.settings) {
      this.settings.totalSeconds = this.totalSeconds;
      this.settings.isRunning = this.isRunning;
      this.settings.timerLabel = this.timerLabel;
      this.settings.inputHours = this.inputHours;
      this.settings.inputMinutes = this.inputMinutes;
      this.settings.inputSeconds = this.inputSeconds;
      this.settings.endTime = this.endTime;
    }
  }
}
