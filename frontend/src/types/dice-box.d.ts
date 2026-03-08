declare module '@3d-dice/dice-box' {
  interface DiceBoxConfig {
    assetPath: string;
    theme?: string;
    themeColor?: string;
    scale?: number;
    gravity?: number;
    enableShadows?: boolean;
    lightIntensity?: number;
    settleTimeout?: number;
    id?: string;
    onBeforeRoll?: (parsedNotation: any) => void;
    onDieComplete?: (dieResult: any) => void;
    onRollComplete?: (rollResult: any[]) => void;
    onRemoveComplete?: (dieResult: any) => void;
  }

  interface DieResult {
    value: number;
    sides: number;
    groupId: number;
    rollId: number;
  }

  class DiceBox {
    constructor(selector: string, config: DiceBoxConfig);
    init(): Promise<void>;
    roll(notation: string | string[] | object | object[]): Promise<DieResult[]>;
    add(notation: string | string[] | object | object[]): Promise<DieResult[]>;
    clear(): void;
    hide(className?: string): void;
    show(): void;
    updateConfig(config: Partial<DiceBoxConfig>): void;
    getRollResults(): DieResult[];
  }

  export default DiceBox;
}
