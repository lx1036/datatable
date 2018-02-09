import {AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2} from '@angular/core';
import {fromEvent} from 'rxjs/observable/fromEvent';
import {takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[resizeable]'
})
export class ResizeableDirective implements OnDestroy, AfterViewInit {

  @Input() resizeEnabled: boolean = true;
  @Input() minWidth: number;
  @Input() maxWidth: number;

  @Output() resize: EventEmitter<any> = new EventEmitter();

  element: HTMLElement;
  constructor(element: ElementRef, private renderer: Renderer2) {
    this.element = element.nativeElement;
  }

  ngOnDestroy(): void {
  }

  ngAfterViewInit(): void {
    const renderer2 = this.renderer;
    const node = renderer2.createElement('span');
    if (this.resizeEnabled) {
      renderer2.addClass(node, 'resize-handle');
    } else {
      renderer2.addClass(node, 'resize-handle--not-resizable');
    }
    renderer2.appendChild(this.element, node);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    const isHandle = (<HTMLElement>event.target).classList.contains('resize-handle');
    const initialWidth = this.element.clientWidth;
    const mouseDownScreenX = event.screenX;

    // if (isHandle) {
    //   event.stopPropagation();
    //   this.resizing = true;
    //
    //   const mouseup = fromEvent(document, 'mouseup');
    //   this.subscription = mouseup
    //     .subscribe((ev: MouseEvent) => this.onMouseup());
    //
    //   const mouseMoveSub = fromEvent(document, 'mousemove')
    //     .pipe(takeUntil(mouseup))
    //     .subscribe((e: MouseEvent) => this.move(e, initialWidth, mouseDownScreenX));
    //
    //   this.subscription.add(mouseMoveSub);
    // }
  }
}
