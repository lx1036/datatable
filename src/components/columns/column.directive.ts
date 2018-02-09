import {ContentChild, Directive, Input, TemplateRef} from '@angular/core';
import {DataTableColumnCellDirective} from './column-cell.directive';
import {DataTableColumnHeaderDirective} from './column-header.directive';
import {TableColumnProp} from '../../types/table-column.type';

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
