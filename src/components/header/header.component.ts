import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {SelectionType, SortType, TableColumn} from '../../types/table-column.type';

@Component({
  selector: 'lx-datatable-header',
  template: `
    <div
      orderable
      (reorder)="onColumnReordered($event)"
      [style.width.px]="_columnGroupWidths.total"
      class="datatable-header-inner">
      <div
        *ngFor="let colGroup of _columnsByPin; trackBy: trackByGroups"
        [class]="'datatable-row-' + colGroup.type"
        [ngStyle]="_styleByGroup[colGroup.type]">
        <lx-datatable-header-cell
          *ngFor="let column of colGroup.columns"
          resizeable
          [resizeEnabled]="column.resizeable"
          (resize)="onColumnResized($event, column)"
          long-press
          [pressModel]="column"
          [pressEnabled]="reorderable && column.draggable"
          (longPressStart)="onLongPressStart($event)"
          (longPressEnd)="onLongPressEnd($event)"
          drag
          [dragX]="reorderable && column.draggable && column.dragging"
          [dragY]="false"
          [dragModel]="column"
          [dragEventTarget]="dragEventTarget"
          [headerHeight]="headerHeight"
          [column]="column"
          [sortType]="sortType"
          [sorts]="sorts"
          [selectionType]="selectionType"
          [sortAscendingIcon]="sortAscendingIcon"
          [sortDescendingIcon]="sortDescendingIcon"
          [allRowsSelected]="allRowsSelected"
          (sort)="onSort($event)"
          (select)="select.emit($event)"
          (columnContextmenu)="columnContextmenu.emit($event)">
        </lx-datatable-header-cell>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableHeaderComponent {
  @Input() sorts: any[];
  @Input() sortType: SortType;
  @Input() allRowsSelected: boolean;
  @Input() selectionType: SelectionType;
  @Input() reorderable: boolean;

  @Output() reorder: EventEmitter<any> = new EventEmitter();

  _columnsByPin: any;
  _styleByGroup = {
    left: {},
    center: {},
    right: {}
  };
  _columnGroupWidths: any;

  constructor(private cd: ChangeDetectorRef) { }

  _columns: TableColumn[];
  @Input() set columns(val: TableColumn[]) {
    this._columns = val;
    const colsByPin = this.columnsByPin(val);
    this._columnsByPin = this.columnsByPinArr(val);
    this._columnGroupWidths = this.columnGroupWidths(colsByPin, val);
    this.setStylesByGroup();
  }
  get columns(): any[] {
    return this._columns;
  }

  trackByGroups(index: number, colGroup: any): any {
    return colGroup.type;
  }

  setStylesByGroup() {
    this._styleByGroup['left'] = this.calcStylesByGroup('left');
    this._styleByGroup['center'] = this.calcStylesByGroup('center');
    this._styleByGroup['right'] = this.calcStylesByGroup('right');
    this.cd.detectChanges();
  }
  calcStylesByGroup(group: string): any {
    const widths = this._columnGroupWidths;
    const offsetX = this.offsetX;

    const styles = {
      width: `${widths[group]}px`
    };

    if (group === 'center') {
      translateXY(styles, offsetX * -1, 0);
    } else if (group === 'right') {
      const totalDiff = widths.total - this.innerWidth;
      const offset = totalDiff * -1;
      translateXY(styles, offset, 0);
    }

    return styles;
  }
  columnsByPin(cols: TableColumn[]) {
    const ret: {left: any, center: any, right: any} = {
      left: [],
      center: [],
      right: []
    };

    if(cols) {
      for(const col of cols) {
        if(col.frozenLeft) {
          ret.left.push(col);
        } else if(col.frozenRight) {
          ret.right.push(col);
        } else {
          ret.center.push(col);
        }
      }
    }

    return ret;
  }
  columnsByPinArr(val: TableColumn[]) {
    const colsByPinArr = [];
    const colsByPin = this.columnsByPin(val);

    colsByPinArr.push({ type: 'left', columns: colsByPin['left'] });
    colsByPinArr.push({ type: 'center', columns: colsByPin['center'] });
    colsByPinArr.push({ type: 'right', columns: colsByPin['right'] });

    return colsByPinArr;
  }
  onColumnReordered({ prevIndex, newIndex, model }: any): void {
    this.reorder.emit({
      column: model,
      prevValue: prevIndex,
      newValue: newIndex
    });
  }
  /**
   * Returns the widths of all group sets of a column
   */
  columnGroupWidths(groups: any, all: TableColumn[]) {
    return {
      left: this.columnTotalWidth(groups.left),
      center: this.columnTotalWidth(groups.center),
      right: this.columnTotalWidth(groups.right),
      total: Math.floor(this.columnTotalWidth(all))
    };
  }
  /**
   * Calculates the total width of all columns and their groups
   */
  columnTotalWidth(columns: any[], prop?: string) {
    let totalWidth = 0;

    if(columns) {
      for(const c of columns) {
        const has = prop && c[prop];
        const width = has ? c[prop] : c.width;
        totalWidth = totalWidth + parseFloat(width);
      }
    }

    return totalWidth;
  }
}


