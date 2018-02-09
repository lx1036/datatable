import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, HostListener, Input, Output} from '@angular/core';
import {SelectionType, SortDirection, SortType, TableColumn} from '../../types/table-column.type';


@Component({
  selector: 'lx-datatable-header-cell',
  template: `
    <div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableHeaderCellComponent {

  @Input() sortAscendingIcon: string;
  @Input() sortDescendingIcon: string;
  @Input() selectionType: SelectionType;

  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() sort: EventEmitter<any> = new EventEmitter();
  @Output() columnContextmenu = new EventEmitter<{ event: MouseEvent, column: any }>(false);



//</editor-fold>
//////////////////////Sort//////////////////////////////////////
}
