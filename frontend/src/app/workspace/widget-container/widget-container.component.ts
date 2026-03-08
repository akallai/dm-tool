import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WidgetInstance } from '../workspace.component';
import { WidgetType } from '../../dialogs/widget-selector-dialog/widget-selector-dialog.component';
import { ImagePdfViewerComponent } from '../../widgets/image-pdf-viewer/image-pdf-viewer.component';
import { RandomGeneratorComponent } from '../../widgets/random-generator/random-generator.component';
import { DiceToolComponent } from '../../widgets/dice-tool/dice-tool.component';
import { MusicWidgetComponent } from '../../widgets/music-widget/music-widget.component';
import { WikiWidgetComponent } from '../../widgets/wiki-widget/wiki-widget.component';
import { CombatTrackerComponent } from '../../widgets/combat-tracker/combat-tracker.component';
import { DaytimeTrackerComponent } from '../../widgets/daytime-tracker/daytime-tracker.component';
import { ResizableDirective } from './resizable.directive';
import { SettingsService } from '../../settings/services/settings.service';
import { SettingsConfig } from '../../settings/types/settings.types';
import { LlmChatComponent } from '../../widgets/llm-chat/llm-chat.component';
import { HexMapComponent } from '../../widgets/hex-map/hex-map.component';
import { NameGeneratorComponent } from '../../widgets/name-generator/name-generator.component';
import { CountdownComponent } from '../../widgets/countdown/countdown.component';
import { MusicPlaybackService } from '../../services/music-playback.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-widget-container',
  templateUrl: './widget-container.component.html',
  styleUrls: ['./widget-container.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
    ImagePdfViewerComponent,
    RandomGeneratorComponent,
    DiceToolComponent,
    MusicWidgetComponent,
    WikiWidgetComponent,
    CombatTrackerComponent,
    DaytimeTrackerComponent,
    ResizableDirective,
    LlmChatComponent,
    HexMapComponent,
    NameGeneratorComponent,
    CountdownComponent,
    MatDialogModule
  ]
})
export class WidgetContainerComponent {
  @Input() widgetData!: WidgetInstance;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>();
  @ViewChild(WikiWidgetComponent) wikiWidget?: WikiWidgetComponent;
  @ViewChild(RandomGeneratorComponent) randomGeneratorWidget?: RandomGeneratorComponent;

  isMaximized = false;
  readonly maximizedPosition = { x: 0, y: 44 };
  maximizedSize = { width: window.innerWidth, height: window.innerHeight - 44 };
  private viewportWidth: number = window.innerWidth;
  private viewportHeight: number = window.innerHeight;
  private readonly TAB_BAR_HEIGHT = 44;

  constructor(
    private settingsService: SettingsService,
    private elementRef: ElementRef,
    private musicPlaybackService: MusicPlaybackService,
    private dialog: MatDialog,
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.maximizedSize = { width: this.viewportWidth, height: this.viewportHeight - this.TAB_BAR_HEIGHT };

    // Ensure widget is still visible after resize
    if (!this.isMaximized) {
      this.ensureWidgetIsVisible();
    }
  }

  get hasSettings(): boolean {
    return !!this.getWidgetSettingsConfig(this.widgetData.type);
  }

  getTitle(type: WidgetType): string {
    if (this.widgetData.settings?.title) {
      return this.widgetData.settings.title;
    }
    const titles: Record<WidgetType, string> = {
      'IMAGE_PDF': 'Image/PDF Viewer',
      'RANDOM_GENERATOR': 'Random Generator',
      'DICE_TOOL': 'Dice Tool',
      'MUSIC_WIDGET': 'Music Widget',
      'WIKI_WIDGET': 'Wiki',
      'COMBAT_TRACKER': 'Combat Tracker',
      'DAYTIME_TRACKER': 'Daytime Tracker',
      'LLM_CHAT': 'LLM Chat',
      'HEX_MAP': 'Hex Map',
      'NAME_GENERATOR': 'Name Generator',
      'COUNTDOWN_WIDGET': 'Countdown'
    };
    return titles[type] || 'Widget';
  }

  openSettings(event: MouseEvent) {
    event.stopPropagation();
    const config = this.getWidgetSettingsConfig(this.widgetData.type);
    if (config) {
      this.settingsService.openSettings(config, this.widgetData.settings)
        .subscribe(result => {
          if (result) {
            this.widgetData.settings = result;
            this.update.emit();
          }
        });
    }
  }

  private getWidgetSettingsConfig(type: WidgetType): SettingsConfig | null {
    switch (type) {
      case 'DICE_TOOL':
        return {
          title: 'Dice Tool Settings',
          fields: [
            {
              key: 'enableD4',
              type: 'checkbox',
              label: 'Enable d4',
              defaultValue: true
            },
            {
              key: 'enableD6',
              type: 'checkbox',
              label: 'Enable d6',
              defaultValue: true
            },
            {
              key: 'enableD8',
              type: 'checkbox',
              label: 'Enable d8',
              defaultValue: true
            },
            {
              key: 'enableD10',
              type: 'checkbox',
              label: 'Enable d10',
              defaultValue: true
            },
            {
              key: 'enableD12',
              type: 'checkbox',
              label: 'Enable d12',
              defaultValue: true
            },
            {
              key: 'enableD20',
              type: 'checkbox',
              label: 'Enable d20',
              defaultValue: true
            },
            {
              key: 'enableD100',
              type: 'checkbox',
              label: 'Enable d100',
              defaultValue: true
            },
            {
              key: 'customButtons',
              type: 'mapping',
              label: 'Custom Dice Buttons',
              mappingConfig: {
                keyLabel: 'Button Label (e.g. "Fireball", "Attack")',
                valueType: 'text',
                valueLabel: 'Formula (e.g. "8d6", "1d20+5")'
              }
            },
            {
              key: 'showCustomDiceInput',
              type: 'checkbox',
              label: 'Show Manual Input Field'
            }
          ]
        };
      case 'MUSIC_WIDGET':
        return {
          title: 'Music Widget Settings',
          fields: [
            {
              key: 'allowMultiple',
              type: 'checkbox',
              label: 'Allow multiple simultaneous playback'
            },
            {
              key: 'fadeDuration',
              type: 'number',
              label: 'Fade duration (seconds)',
              defaultValue: 0.5
            },
            {
              key: 'mappings',
              type: 'mapping',
              label: 'Sound Tracks',
              mappingConfig: {
                keyLabel: 'Label',
                valueType: 'file',
                valueLabel: 'Audio Files',
                fileAccept: 'audio/*',
                multiple: true
              }
            }
          ]
        };
      case 'RANDOM_GENERATOR':
        return {
          title: 'Random Generator Settings',
          fields: [
            {
              key: 'useWeightedSelection',
              type: 'checkbox',
              label: 'Use weighted selection and hide number prefixes',
              defaultValue: true
            },
            {
              key: 'mappings',
              type: 'mapping',
              label: 'Random Lists',
              mappingConfig: {
                keyLabel: 'List Name',
                valueType: 'textarea',
                valueLabel: 'Items (one per line)'
              }
            },
            {
              key: 'mappingCategories',
              type: 'mapping',
              label: 'Categorize Lists (Optional)',
              mappingConfig: {
                keyLabel: 'List Name (must match above)',
                valueType: 'text',
                valueLabel: 'Category (leave empty for no category)'
              }
            }
          ]
        };
      case 'COMBAT_TRACKER':
        return {
          title: 'Combat Tracker Settings',
          fields: [
            {
              key: 'gameMode',
              type: 'select',
              label: 'Game Mode',
              options: [
                { value: 'general', label: 'General' },
                { value: 'mutant_year_zero', label: 'Mutant Year Zero' },
                { value: 'dnd_5e', label: 'D&D 5e' }
              ],
              defaultValue: 'general'
            },
            {
              key: 'defaultInitiative',
              type: 'text',
              label: 'Default Initiative (number or dice: 1D6, 1d20, 2W4+1)',
              defaultValue: '0'
            }
          ]
        };
      case 'WIKI_WIDGET':
        return null;
        case 'LLM_CHAT':
        return {
          title: 'LLM Chat Settings',
          fields: [
            {
              key: 'temperature',
              type: 'number',
              label: 'Temperature (leave empty for default)',
              required: false,
              min: 0,
              max: 2
            },
            {
              key: 'prompt',
              type: 'textarea',
              label: 'Prompt',
              placeholder: 'Enter your prompt here',
              required: true,
              defaultValue: 'You are an very experience DM. I\'m running a mutant year zero campaign. My current campaign notes include details about people, locations, scenes and more. I\'m looking for fresh ideas to enhance the story. Please help me the during my dm session, which I am currently holding, with questions where i might need inspiration or have other questions.'
            }
          ]
        };
      case 'HEX_MAP':
        return {
          title: 'Hex Map Settings',
          fields: [
            {
              key: 'gridWidth',
              type: 'number',
              label: 'Grid Width (columns)',
              defaultValue: 10
            },
            {
              key: 'gridHeight',
              type: 'number',
              label: 'Grid Height (rows)',
              defaultValue: 8
            },
            {
              key: 'hexSize',
              type: 'number',
              label: 'Hex Size (pixels)',
              defaultValue: 30
            },
            {
              key: 'defaultColor',
              type: 'text',
              label: 'Default Hex Color',
              placeholder: '#374151',
              defaultValue: '#374151'
            },
            {
              key: 'showCoordinates',
              type: 'checkbox',
              label: 'Show coordinates in empty hexes'
            }
          ]
        };
      default:
        return null;
    }
  }

  onDragEnd(event: CdkDragEnd) {
    if (this.isMaximized) return;

    const dragDistance = event.distance;

    // Calculate new position
    const newX = this.widgetData.position.x + dragDistance.x;
    const newY = this.widgetData.position.y + dragDistance.y;

    // Get widget dimensions
    const widgetWidth = this.widgetData.size.width;
    const widgetHeight = this.widgetData.size.height;

    // Ensure the widget stays completely within bounds
    // Left boundary: Can't be less than 0
    // Right boundary: Can't be greater than viewport width - widget width
    // Top boundary: Can't be less than tab bar height (52px)
    // Bottom boundary: Can't be greater than viewport height - widget height
    const boundedX = Math.max(0, Math.min(newX, this.viewportWidth - widgetWidth));
    const boundedY = Math.max(
      this.TAB_BAR_HEIGHT,
      Math.min(newY, this.viewportHeight - widgetHeight)
    );

    // Update widget position with the bounded coordinates
    this.widgetData.position = {
      x: boundedX,
      y: boundedY
    };

    this.update.emit();
  }

  onResizeEnd(event: { width: number, height: number, offsetLeft: number, offsetTop: number }) {
    if (this.isMaximized) return;

    this.widgetData.size = { width: event.width, height: event.height };

    // The resizable directive sets top/left CSS during edge resizes (N, W, NW, NE, SW).
    // These offsets must be folded into the CDK drag position so boundaries stay correct.
    if (event.offsetLeft || event.offsetTop) {
      this.widgetData.position = {
        x: this.widgetData.position.x + event.offsetLeft,
        y: this.widgetData.position.y + event.offsetTop
      };
    }

    // After resizing, ensure the widget is still visible
    this.ensureWidgetIsVisible();

    this.update.emit();
  }

  private ensureWidgetIsVisible() {
    // Get widget dimensions
    const widgetWidth = this.widgetData.size.width;
    const widgetHeight = this.widgetData.size.height;
    const currentX = this.widgetData.position.x;
    const currentY = this.widgetData.position.y;

    // Ensure widget is completely within viewport
    // Handle case where widget is larger than viewport - resize it to fit
    let newWidth = widgetWidth;
    let newHeight = widgetHeight;

    if (widgetWidth > this.viewportWidth) {
      newWidth = this.viewportWidth;
    }

    if (widgetHeight > this.viewportHeight - this.TAB_BAR_HEIGHT) {
      newHeight = this.viewportHeight - this.TAB_BAR_HEIGHT;
    }

    // If dimensions changed, update them
    if (newWidth !== widgetWidth || newHeight !== widgetHeight) {
      this.widgetData.size = {
        width: newWidth,
        height: newHeight
      };
    }

    // Calculate bounded position (respecting tab bar at top)
    const boundedX = Math.max(0, Math.min(currentX, this.viewportWidth - newWidth));
    const boundedY = Math.max(
      this.TAB_BAR_HEIGHT,
      Math.min(currentY, this.viewportHeight - newHeight)
    );

    // Only update if position needs adjustment
    if (boundedX !== currentX || boundedY !== currentY) {
      this.widgetData.position = {
        x: boundedX,
        y: boundedY
      };
    }

    this.update.emit();
  }

  toggleMaximize(event: MouseEvent) {
    event.stopPropagation();
    this.isMaximized = !this.isMaximized;
  }

  close(event: MouseEvent) {
    event.stopPropagation();
    if (this.hasUnsavedChanges()) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Close anyway?',
          confirmText: 'Close',
          warn: true,
        },
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.performClose();
        }
      });
    } else {
      this.performClose();
    }
  }

  private performClose() {
    if (this.widgetData.type === 'MUSIC_WIDGET') {
      this.musicPlaybackService.stopAllForWidget(this.widgetData.id);
    }
    this.closeEvent.emit();
  }

  async saveWidget(): Promise<void> {
    if (this.wikiWidget) {
      await this.wikiWidget.saveWikiToServer();
    }
    if (this.randomGeneratorWidget) {
      await this.randomGeneratorWidget.saveTableToServer();
    }
  }

  hasUnsavedChanges(): boolean {
    return (this.wikiWidget?.wikiDirty ?? false) || (this.randomGeneratorWidget?.tableDirty ?? false);
  }

  onSettingsChange() {
    this.update.emit();
  }
}