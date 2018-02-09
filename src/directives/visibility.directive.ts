import {Directive, ElementRef, EventEmitter, HostBinding, NgZone, OnDestroy, OnInit, Output} from '@angular/core';

/**
 * Visibility Observer Directive
 *
 * Usage:
 *
 * 		<div
 * 			visibilityObserver
 * 			(visible)="onVisible($event)">
 * 		</div>
 *
 */
@Directive({
  selector: '[visibilityObserver]'
})
export class VisibilityDirective implements OnInit, OnDestroy {
  @HostBinding('class.visible')
  isVisible: boolean = false;

  @Output() visible: EventEmitter<any> = new EventEmitter();

  timeout: any;

  constructor(private element: ElementRef, private zone: NgZone) { }

  ngOnInit(): void {
    console.log('xx');
    this.runCheck();
  }

  runCheck(): void {
    const check = () => {
      // https://davidwalsh.name/offsetheight-visibility
      const { offsetHeight, offsetWidth } = <HTMLElement>this.element.nativeElement;

      console.log(offsetHeight && offsetWidth);

      if (offsetHeight && offsetWidth) {
        this.onVisibilityChange();
      } else {
        this.zone.runOutsideAngular(() => {
          this.timeout = setTimeout(() => check(), 50);
        });
      }

      clearTimeout(this.timeout);
    };

    this.timeout = setTimeout(() => check());
  }

  onVisibilityChange(): void {
    // trigger zone recalc for columns
    this.zone.run(() => {
      this.isVisible = true;
      this.visible.emit(true);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeout);
  }

}
