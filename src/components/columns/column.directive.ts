import {ContentChild, Directive, Input, TemplateRef} from '@angular/core';
import {DataTableColumnCellDirective} from './column-cell.directive';
import {DataTableColumnHeaderDirective} from './column-header.directive';

@Directive({
  selector: 'lx-datatable-column'
})
export class DataTableColumnDirective {

  @Input() name: string;
  @Input() width: number;
  @Input() prop: TableColumnProp;

  @Input()
  @ContentChild(DataTableColumnCellDirective, { read: TemplateRef })
  cellTemplate: TemplateRef<any>;

  @Input()
  @ContentChild(DataTableColumnHeaderDirective, { read: TemplateRef })
  headerTemplate: TemplateRef<any>;
}

/**
 * Column property that indicates how to retrieve this column's
 * value from a row.
 * 'a.deep.value', 'normalprop', 0 (numeric)
 */
export type TableColumnProp = string|number;
