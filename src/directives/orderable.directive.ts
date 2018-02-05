import {AfterContentInit, Directive, EventEmitter, OnDestroy} from '@angular/core';

@Directive({
  selector: '[orderable]'
})
export class OrderableDirective implements AfterContentInit, OnDestroy {

  reorder: EventEmitter<any>;

  constructor() {

  }

  ngOnDestroy(): void {
  }

  ngAfterContentInit(): void {
  }

}
