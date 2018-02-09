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
      <div>
        <lx-datatable-header-cell>
        </lx-datatable-header-cell>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableHeaderComponent { // resizeable,long-press,draggable
//////////////////////Key Inputs//////////////////////////////////////
  _columns: TableColumn[];
  _columnsByPin: any;
  _columnGroupWidths: any;
  @Input() set columns(val: TableColumn[]) {
    this._columns = val;
    this._columnsByPin = this.columnsByPinArr(val);
    this._columnGroupWidths = this.columnGroupWidths(this.columnsByPin(val), val);
    this.setStylesByGroup();
  }
  get columns(): TableColumn[] {
    return this._columns;
  }


//////////////////////Key Inputs//////////////////////////////////////

  @Input() sorts: any[];
  @Input() sortType: SortType;
  @Input() allRowsSelected: boolean;
  @Input() selectionType: SelectionType;
  @Input() reorderable: boolean;

  @Output() reorder: EventEmitter<any> = new EventEmitter();

  _styleByGroup = {
    left: {},
    center: {},
    right: {}
  };

  constructor(private cd: ChangeDetectorRef) { }



  trackByGroups(index: number, colGroup: any): any {
    return colGroup.type;
  }

  setStylesByGroup() {
    this._styleByGroup['left'] = this.calcStylesByGroup('left');
    this._styleByGroup['center'] = this.calcStylesByGroup('center');
    this._styleByGroup['right'] = this.calcStylesByGroup('right');
    this.cd.detectChanges();
  }

  _offsetX: number;
  @Input()
  set offsetX(val: number) {
    this._offsetX = val;
    this.setStylesByGroup();
  }
  get offsetX() { return this._offsetX; }
  _innerWidth: number;
  @Input() set innerWidth(val: number) {
    this._innerWidth = val;

    if (this._columns) {
      const colByPin = this.columnsByPin(this._columns);
      this._columnGroupWidths = this.columnGroupWidths(colByPin, this._columns);
      this.setStylesByGroup();
    }
  }
  get innerWidth(): number {
    return this._innerWidth;
  }
  calcStylesByGroup(group: string): any {
    const widths = this._columnGroupWidths;
    const offsetX = this.offsetX;

    const styles = {
      width: `${widths[group]}px`
    };

    if (group === 'center') {
      //translateXY(styles, offsetX * -1, 0);
    } else if (group === 'right') {
      const totalDiff = widths.total - this.innerWidth;
      const offset = totalDiff * -1;
      //translateXY(styles, offset, 0);
    }

    return styles;
  }



  columnsByPin(cols: TableColumn[]) {
    const rectangle: {left: any, center: any, right: any} = {
      left: [],
      center: [],
      right: []
    };

    if(cols) {
      for(const col of cols) {
        if(col.frozenLeft) {
          rectangle.left.push(col);
        } else if(col.frozenRight) {
          rectangle.right.push(col);
        } else {
          rectangle.center.push(col);
        }
      }
    }

    return rectangle;
  }

  columnsByPinArr(val: TableColumn[]): Array<{type: any, columns: any}> {
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


