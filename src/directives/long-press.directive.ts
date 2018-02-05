import {Directive, EventEmitter, HostBinding, HostListener, Input, OnDestroy, Output} from '@angular/core';

@Directive({
  selector: '[long-press]'
})
export class LongPressDirective implements OnDestroy {

  @Input() pressEnabled: boolean = true;
  @Input() pressModel: any;

  @Output() longPressStart: EventEmitter<any> = new EventEmitter();
  @Output() longPressing: EventEmitter<any> = new EventEmitter();
  @Output() longPressEnd: EventEmitter<any> = new EventEmitter();


  @HostBinding('class.press')
  get press(): boolean { return this.pressing; }

  @HostBinding('class.longpress')
  get isLongPress(): boolean {
    return this.isLongPressing;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {

  }

  ngOnDestroy(): void {
  }
}
