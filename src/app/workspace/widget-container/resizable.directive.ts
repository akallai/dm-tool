import { Directive, ElementRef, EventEmitter, Input, Output, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appResizable]',
  standalone: true
})
export class ResizableDirective implements OnInit {
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

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.initializeElement();
    this.createHandles();
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

    if (newWidth >= minWidth) {
      this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
      if (['w', 'nw', 'sw'].includes(this.currentHandle)) {
        this.renderer.setStyle(this.el.nativeElement, 'left', `${newLeft}px`);
      }
    }

    if (newHeight >= minHeight) {
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
