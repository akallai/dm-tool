import { Injectable, NgZone } from '@angular/core';

interface DieResult {
  value: number;
  sides: number;
  groupId: number;
  rollId: number;
}

export interface DiceRollResult {
  rolls: number[];
  sides: number;
  modifier: number;
  total: number;
  formula: string;
}

@Injectable({ providedIn: 'root' })
export class DiceRollerService {
  private diceBox: any = null;
  private overlay: HTMLElement | null = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private rolling = false;
  private dismissResolve: (() => void) | null = null;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.dismiss();
  };

  constructor(private ngZone: NgZone) {}

  /**
   * Roll dice with a 3D animation overlay.
   * Returns the result after dice settle.
   */
  async roll(formula: string): Promise<DiceRollResult | null> {
    const parsed = this.parseFormula(formula);
    if (!parsed) return null;

    // Prevent concurrent rolls
    if (this.rolling) return null;

    // dice-box only supports standard polyhedral dice
    const supportedSides = [4, 6, 8, 10, 12, 20, 100];
    if (!supportedSides.includes(parsed.sides)) {
      return this.rollMathOnly(parsed);
    }

    this.rolling = true;
    try {
      await this.ensureInitialized();
      this.showOverlay();

      const diceNotation = `${parsed.count}d${parsed.sides}`;
      const results: DieResult[] = await this.ngZone.runOutsideAngular(() =>
        this.diceBox.roll(diceNotation)
      );

      const rolls = results.map((r: DieResult) => r.value);
      const sum = rolls.reduce((a: number, b: number) => a + b, 0);
      const total = sum + parsed.modifier;

      // Show dice for a moment, or until user clicks/presses Escape
      await this.waitForDismissOrTimeout(0);
      this.diceBox.clear();
      this.hideOverlay();

      return {
        rolls,
        sides: parsed.sides,
        modifier: parsed.modifier,
        total,
        formula
      };
    } catch (err) {
      console.error('Dice roller error:', err);
      this.hideOverlay();
      return this.rollMathOnly(parsed);
    } finally {
      this.rolling = false;
    }
  }

  private parseFormula(formula: string): { count: number; sides: number; modifier: number } | null {
    const regex = /^(\d+)?[wd](\d+)([+-]\d+)?$/i;
    const match = formula.trim().match(regex);
    if (!match) return null;
    return {
      count: match[1] ? parseInt(match[1], 10) : 1,
      sides: parseInt(match[2], 10),
      modifier: match[3] ? parseInt(match[3], 10) : 0
    };
  }

  private rollMathOnly(parsed: { count: number; sides: number; modifier: number }): DiceRollResult {
    const rolls: number[] = [];
    for (let i = 0; i < parsed.count; i++) {
      rolls.push(Math.floor(Math.random() * parsed.sides) + 1);
    }
    const sum = rolls.reduce((a, b) => a + b, 0);
    return {
      rolls,
      sides: parsed.sides,
      modifier: parsed.modifier,
      total: sum + parsed.modifier,
      formula: `${parsed.count}d${parsed.sides}${parsed.modifier ? (parsed.modifier > 0 ? '+' : '') + parsed.modifier : ''}`
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this.initDiceBox().catch(err => {
      this.initializing = null; // Allow retry on next call
      throw err;
    });
    await this.initializing;
  }

  private async initDiceBox(): Promise<void> {
    // Create the overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'dice-roller-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10002;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      cursor: pointer;
    `;

    // Click overlay to dismiss early
    this.overlay.addEventListener('click', () => this.dismiss());

    // Create the dice container inside the overlay
    const diceContainer = document.createElement('div');
    diceContainer.id = 'dice-box-container';
    diceContainer.style.cssText = `
      width: 100%;
      height: 100%;
    `;
    this.overlay.appendChild(diceContainer);

    document.body.appendChild(this.overlay);

    try {
      // Dynamically import dice-box
      const { default: DiceBox } = await import('@3d-dice/dice-box');

      this.diceBox = new DiceBox('#dice-box-container', {
        assetPath: '/assets/dice-box/',
        theme: 'default',
        themeColor: '#000000',
        scale: 14,
        gravity: 8,
        delay: 5,
        enableShadows: true,
        lightIntensity: 1,
      });

      await this.ngZone.runOutsideAngular(() => this.diceBox.init());
      this.initialized = true;
    } catch (err) {
      // Clean up orphaned DOM on init failure
      this.overlay.remove();
      this.overlay = null;
      this.diceBox = null;
      throw err;
    }
  }

  private showOverlay() {
    if (!this.overlay) return;
    this.overlay.style.pointerEvents = 'auto';
    this.overlay.style.opacity = '1';
    document.addEventListener('keydown', this.keydownHandler);
  }

  private hideOverlay() {
    if (!this.overlay) return;
    this.overlay.style.opacity = '0';
    this.overlay.style.pointerEvents = 'none';
    document.removeEventListener('keydown', this.keydownHandler);
  }

  private dismiss() {
    if (this.dismissResolve) {
      this.dismissResolve();
      this.dismissResolve = null;
    }
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
  }

  /** Wait for timeout or user click/keypress, whichever comes first */
  private waitForDismissOrTimeout(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.dismissResolve = resolve;
      this.dismissTimeout = setTimeout(() => {
        this.dismissResolve = null;
        this.dismissTimeout = null;
        resolve();
      }, ms);
    });
  }
}
