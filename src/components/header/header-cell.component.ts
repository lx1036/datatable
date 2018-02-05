import {ChangeDetectorRef, Component, Input} from '@angular/core';
import {TableColumn} from '../../types/table-column.type';


@Component({
  selector: 'lx-datatable-header-cell',
  template: `
    <div>
      <label
        *ngIf="isCheckboxable"
        class="datatable-checkbox">
        <input
          type="checkbox"
          [checked]="allRowsSelected"
          (change)="select.emit(!allRowsSelected)"/>
      </label>
      <span
        *ngIf="!column.headerTemplate"
        class="datatable-header-cell-wrapper">
        <span
          class="datatable-header-cell-label draggable"
          (click)="onSort()"
          [innerHTML]="name">
        </span>
      </span>
      <ng-template
        *ngIf="column.headerTemplate"
        [ngTemplateOutlet]="column.headerTemplate"
        [ngTemplateOutletContext]="cellContext">
      </ng-template>
      <span
        (click)="onSort()"
        [class]="sortClass">
      </span>
    </div>
  `
})
export class DataTableHeaderCellComponent {
  @Input() sortType: SortType;
  @Input() sortAscendingIcon: string;
  @Input() sortDescendingIcon: string;
  @Input() selectionType: SelectionType;

  private _column: TableColumn;

  cellContext: any = {
    column: this.column,
    sortDir: this.sortDir,
    sortFn: this.sortFn,
    allRowsSelected: this.allRowsSelected,
    selectFn: this.selectFn
  };

  constructor(private cd: ChangeDetectorRef) { }

  get isCheckboxable(): boolean {
    return this.column.checkboxable &&
      this.column.headerCheckboxable &&
      this.selectionType === SelectionType.checkbox;
  }

  @Input() set column(column: TableColumn) {
    this._column = column;
    this.cellContext.column = column;
    this.cd.markForCheck();
  }

  get column(): TableColumn {
    return this._column;
  }

  @Input() set allRowsSelected(value) {
    this._allRowsSelected = value;
    this.cellContext.allRowsSelected = value;
  }
  get allRowsSelected() {
    return this._allRowsSelected;
  }
}

export enum SortType {
  single = 'single',
  multi = 'multi'
}

export enum SelectionType {
  single = 'single',
  multi = 'multi',
  multiClick = 'multiClick',
  cell = 'cell',
  checkbox = 'checkbox'
}
