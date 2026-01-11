import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CountdownAlertDialogComponent } from './countdown-alert-dialog.component';

interface TimerState {
  endTime: number;
  label: string;
  widgetId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountdownService {
  private dialog = inject(MatDialog);
  private activeTimers = new Map<string, TimerState>();
  private finishedTimers = new Set<string>(); // Track which timers have finished
  private checkInterval: any = null;

  constructor() {
    // Start checking for finished timers
    this.startGlobalCheck();
  }

  registerTimer(widgetId: string, endTime: number, label: string) {
    this.finishedTimers.delete(widgetId); // Clear finished state when starting new timer
    this.activeTimers.set(widgetId, { endTime, label, widgetId });
  }

  unregisterTimer(widgetId: string) {
    this.activeTimers.delete(widgetId);
  }

  getTimer(widgetId: string): TimerState | undefined {
    return this.activeTimers.get(widgetId);
  }

  hasFinished(widgetId: string): boolean {
    return this.finishedTimers.has(widgetId);
  }

  clearFinished(widgetId: string) {
    this.finishedTimers.delete(widgetId);
  }

  private startGlobalCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const now = Date.now();

      for (const [widgetId, timer] of this.activeTimers.entries()) {
        if (timer.endTime > 0 && timer.endTime <= now) {
          // Timer finished
          this.activeTimers.delete(widgetId);
          this.finishedTimers.add(widgetId); // Mark as finished
          this.showAlert(timer.label);
          this.playAlertSound();
        }
      }
    }, 500);
  }

  private showAlert(label: string) {
    this.dialog.open(CountdownAlertDialogComponent, {
      data: { label: label || 'Timer' },
      disableClose: false,
      autoFocus: true
    });
  }

  private playAlertSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 200);
    } catch (e) {
      // Audio not supported, ignore
    }
  }
}
