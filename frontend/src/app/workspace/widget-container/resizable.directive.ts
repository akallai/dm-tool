import { Directive, ElementRef, EventEmitter, Input, Output, Renderer2, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';

@Directive({
  selector: '[appResizable]',
  standalone: true
})
export class ResizableDirective implements OnInit, OnChanges {
  @Input() resizableWidth = 300;
  @Input() resizableHeight = 200;
  @Output() resizeEnd = new EventEmitter<{ width: number, height: number }>();

  private dragging = false;
  private currentHandle: string = '';
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startLeft = 0;
  private startTop = 0;
  private handleSize = 6;
  private viewportWidth: number = window.innerWidth;
  private viewportHeight: number = window.innerHeight;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
  }

  ngOnInit() {
    this.initializeElement();
    this.createHandles();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resizableWidth']) {
      this.renderer.setStyle(this.el.nativeElement, 'width', this.resizableWidth + 'px');
    }
    if (changes['resizableHeight']) {
      this.renderer.setStyle(this.el.nativeElement, 'height', this.resizableHeight + 'px');
    }
  }

  private initializeElement() {
    this.renderer.setStyle(this.el.nativeElement, 'width', this.resizableWidth + 'px');
    this.renderer.setStyle(this.el.nativeElement, 'height', this.resizableHeight + 'px');
    this.renderer.setStyle(this.el.nativeElement, 'position', 'absolute');
  }

  private createHandles() {
    const handles = [
      { position: 'n', cursor: 'ns-resize', top: '0', left: '0', right: '0', height: `${this.handleSize}px` },
      { position: 's', cursor: 'ns-resize', bottom: '0', left: '0', right: '0', height: `${this.handleSize}px` },
      { position: 'e', cursor: 'ew-resize', top: '0', right: '0', bottom: '0', width: `${this.handleSize}px` },
      { position: 'w', cursor: 'ew-resize', top: '0', left: '0', bottom: '0', width: `${this.handleSize}px` },
      { position: 'ne', cursor: 'ne-resize', top: '0', right: '0', width: `${this.handleSize}px`, height: `${this.handleSize}px` },
      { position: 'nw', cursor: 'nw-resize', top: '0', left: '0', width: `${this.handleSize}px`, height: `${this.handleSize}px` },
      { position: 'se', cursor: 'se-resize', bottom: '0', right: '0', width: `${this.handleSize}px`, height: `${this.handleSize}px` },
      { position: 'sw', cursor: 'sw-resize', bottom: '0', left: '0', width: `${this.handleSize}px`, height: `${this.handleSize}px` }
    ];

    handles.forEach(handle => {
      const element = this.renderer.createElement('div');
      this.renderer.addClass(element, 'resize-handle');
      this.renderer.addClass(element, `resize-handle-${handle.position}`);
      Object.entries(handle).forEach(([key, value]) => {
        if (key !== 'position') {
          this.renderer.setStyle(element, key, value);
        }
      });
      this.renderer.setStyle(element, 'position', 'absolute');
      this.renderer.setStyle(element, 'z-index', '1000');

      this.renderer.listen(element, 'mousedown', (event: MouseEvent) => {
        this.onMouseDown(event, handle.position);
      });

      this.renderer.appendChild(this.el.nativeElement, element);
    });
  }

  private onMouseDown(event: MouseEvent, handle: string) {
    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
    this.currentHandle = handle;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.el.nativeElement.offsetWidth;
    this.startHeight = this.el.nativeElement.offsetHeight;
    this.startLeft = this.el.nativeElement.offsetLeft;
    this.startTop = this.el.nativeElement.offsetTop;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.dragging) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    let newLeft = this.startLeft;
    let newTop = this.startTop;

    // Calculate new dimensions and position based on resize handle
    switch (this.currentHandle) {
      case 'e':
        newWidth = this.startWidth + deltaX;
        break;
      case 'w':
        newWidth = this.startWidth - deltaX;
        newLeft = this.startLeft + deltaX;
        break;
      case 'n':
        newHeight = this.startHeight - deltaY;
        newTop = this.startTop + deltaY;
        break;
      case 's':
        newHeight = this.startHeight + deltaY;
        break;
      case 'ne':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight - deltaY;
        newTop = this.startTop + deltaY;
        break;
      case 'nw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight - deltaY;
        newLeft = this.startLeft + deltaX;
        newTop = this.startTop + deltaY;
        break;
      case 'se':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight + deltaY;
        break;
      case 'sw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight + deltaY;
        newLeft = this.startLeft + deltaX;
        break;
    }

    // Apply minimum size constraints
    const minWidth = 100;
    const minHeight = 100;

    // Constraint 1: Ensure widget doesn't exceed viewport bounds
    const maxWidth = this.viewportWidth;
    const maxHeight = this.viewportHeight;
    
    // Constraint 2: When adjusting width from left edge, don't allow going off left side
    if (['w', 'nw', 'sw'].includes(this.currentHandle)) {
      if (newLeft < 0) {
        const offset = -newLeft;
        newLeft = 0;
        newWidth -= offset;
      }
    }
    
    // Constraint 3: When adjusting height from top edge, don't allow going off top edge
    if (['n', 'ne', 'nw'].includes(this.currentHandle)) {
      if (newTop < 0) {
        const offset = -newTop;
        newTop = 0;
        newHeight -= offset;
      }
    }
    
    // Constraint 4: Don't allow widget to extend beyond right edge of viewport
    if (newLeft + newWidth > maxWidth) {
      if (['e', 'ne', 'se'].includes(this.currentHandle)) {
        // If dragging right edge, cap the width
        newWidth = maxWidth - newLeft;
      } else {
        // If dragging left edge, cap the left position
        const rightEdge = newLeft + newWidth;
        const overflow = rightEdge - maxWidth;
        if (overflow > 0) {
          newWidth -= overflow;
        }
      }
    }
    
    // Constraint 5: Don't allow widget to extend beyond bottom edge of viewport
    if (newTop + newHeight > maxHeight) {
      if (['s', 'se', 'sw'].includes(this.currentHandle)) {
        // If dragging bottom edge, cap the height
        newHeight = maxHeight - newTop;
      } else {
        // If dragging top edge, cap the top position
        const bottomEdge = newTop + newHeight;
        const overflow = bottomEdge - maxHeight;
        if (overflow > 0) {
          newHeight -= overflow;
        }
      }
    }

    // Apply the final dimensions and position
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
      if (['w', 'nw', 'sw'].includes(this.currentHandle)) {
        this.renderer.setStyle(this.el.nativeElement, 'left', `${newLeft}px`);
      }
    }

    if (newHeight >= minHeight && newHeight <= maxHeight) {
      this.renderer.setStyle(this.el.nativeElement, 'height', `${newHeight}px`);
      if (['n', 'ne', 'nw'].includes(this.currentHandle)) {
        this.renderer.setStyle(this.el.nativeElement, 'top', `${newTop}px`);
      }
    }
  };

  private onMouseUp = () => {
    if (this.dragging) {
      this.dragging = false;
      const newWidth = this.el.nativeElement.offsetWidth;
      const newHeight = this.el.nativeElement.offsetHeight;
      this.resizeEnd.emit({ width: newWidth, height: newHeight });
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    }
  };
}