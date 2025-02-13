import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appResizable]',
    standalone: true
  })
export class ResizableDirective {
  @Input() resizableWidth = 300;
  @Input() resizableHeight = 200;
  @Output() resizeEnd = new EventEmitter<{ width: number, height: number }>();

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private handleSize = 10;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    // set initial size
    this.renderer.setStyle(this.el.nativeElement, 'width', this.resizableWidth + 'px');
    this.renderer.setStyle(this.el.nativeElement, 'height', this.resizableHeight + 'px');
    // add a simple resize handle
    const handle = this.renderer.createElement('div');
    this.renderer.addClass(handle, 'resize-handle');
    this.renderer.setStyle(handle, 'width', this.handleSize + 'px');
    this.renderer.setStyle(handle, 'height', this.handleSize + 'px');
    this.renderer.setStyle(handle, 'position', 'absolute');
    this.renderer.setStyle(handle, 'right', '0');
    this.renderer.setStyle(handle, 'bottom', '0');
    this.renderer.setStyle(handle, 'cursor', 'se-resize');
    this.renderer.appendChild(this.el.nativeElement, handle);

    // listen for mousedown on handle
    this.renderer.listen(handle, 'mousedown', this.onMouseDown.bind(this));
  }

  onMouseDown(event: MouseEvent) {
    event.stopPropagation();
    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.el.nativeElement.offsetWidth;
    this.startHeight = this.el.nativeElement.offsetHeight;
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.dragging) return;
    const width = this.startWidth + (event.clientX - this.startX);
    const height = this.startHeight + (event.clientY - this.startY);
    this.renderer.setStyle(this.el.nativeElement, 'width', width + 'px');
    this.renderer.setStyle(this.el.nativeElement, 'height', height + 'px');
  };

  onMouseUp = (event: MouseEvent) => {
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
