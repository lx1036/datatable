
import {Directive, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';


/**
 * Draggable Directive for Angular2
 *
 * Inspiration:
 *   https://github.com/AngularClass/angular2-examples/blob/master/rx-draggable/directives/draggable.ts
 *   http://stackoverflow.com/questions/35662530/how-to-implement-drag-and-drop-in-angular2
 *
 */
@Directive({
  selector: '[drag]'
})
export class DraggableDirective implements OnDestroy, OnChanges {



  @Input() dragEventTarget: any;
  @Input() dragModel: any;
  @Input() dragX: boolean = true;
  @Input() dragY: boolean = true;

  @Output() dragStart: EventEmitter<any> = new EventEmitter();
  @Output() dragging: EventEmitter<any> = new EventEmitter();
  @Output() dragEnd: EventEmitter<any> = new EventEmitter();

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngOnDestroy(): void {
  }
}
