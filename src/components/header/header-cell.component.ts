import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, HostListener, Input, Output} from '@angular/core';
import {SelectionType, SortDirection, SortType, TableColumn} from '../../types/table-column.type';
import {nextSortDir} from '../../utils/sort';


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


  private _column: TableColumn;

  _allRowsSelected: boolean;


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

  @Input() set allRowsSelected(value: boolean) {
    this._allRowsSelected = value;
    this.cellContext.allRowsSelected = value;
  }
  get allRowsSelected(): boolean {
    return this._allRowsSelected;
  }



//////////////////////Host//////////////////////////////////////
//<editor-fold desc="Host">
  @HostListener('contextmenu', ['$event'])
  onContextmenu($event: MouseEvent): void {
    this.columnContextmenu.emit({ event: $event, column: this.column });
  }

  @HostBinding('class')
  get columnCssClasses(): any {
    let cls = 'datatable-header-cell';

    if (this.column.sortable) cls += ' sortable';
    if (this.column.resizeable) cls += ' resizeable';
    if (this.column.headerClass) {
      if (typeof this.column.headerClass === 'string') {
        cls += ' ' + this.column.headerClass;
      } else if (typeof this.column.headerClass === 'function') {
        const res = this.column.headerClass({
          column: this.column
        });

        if (typeof res === 'string') {
          cls += res;
        } else if (typeof res === 'object') {
          const keys = Object.keys(res);
          for (const k of keys) {
            if (res[k] === true) cls += ` ${k}`;
          }
        }
      }
    }

    const sortDir = this.sortDir;
    if (sortDir) {
      cls += ` sort-active sort-${sortDir}`;
    }

    return cls;
  }

  @HostBinding('attr.title')
  get name(): string {
    // guaranteed to have a value by setColumnDefaults() in column-helper.ts
    return this.column.headerTemplate === undefined ? this.column.name : undefined;
  }

  @HostBinding('style.minWidth.px')
  get minWidth(): number {
    return this.column.minWidth;
  }

  @HostBinding('style.maxWidth.px')
  get maxWidth(): number {
    return this.column.maxWidth;
  }

  @HostBinding('style.width.px')
  get width(): number {
    return this.column.width;
  }

  @HostBinding('style.height.px')
  @Input() headerHeight: number;
//</editor-fold>
//////////////////////Host//////////////////////////////////////



//////////////////////Sort//////////////////////////////////////
//<editor-fold desc="Sort">
  private _sorts: any[];
  @Input() set sorts(val: any[]) {
    this._sorts = val;
    this.sortDir = this.calcSortDir(val);
    this.cellContext.sortDir = this.sortDir;
    this.sortClass = this.calcSortClass(this.sortDir);
    this.cd.markForCheck();
  }
  get sorts(): any[] {
    return this._sorts;
  }

  calcSortDir(sorts: any[]): any {
    if (sorts && this.column) {
      const sort = sorts.find((s: any) => {
        return s.prop === this.column.prop;
      });

      if (sort) return sort.dir;
    }
  }

  @Input() sortType: SortType;
  sortDir: SortDirection;
  onSort(): void {
    if (!this.column.sortable) return;

    const newValue = nextSortDir(this.sortType, this.sortDir);
    this.sort.emit({
      column: this.column,
      prevValue: this.sortDir,
      newValue
    });
  }

//</editor-fold>
//////////////////////Sort//////////////////////////////////////
}
