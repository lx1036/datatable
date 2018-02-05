import {
  AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, DoCheck, ElementRef,
  EventEmitter, Input,
  OnInit, Output,
  QueryList, SkipSelf
} from '@angular/core';
import {DataTableColumnDirective} from './columns/column.directive';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {SelectionType} from './header/header.component';
import {DimensionsHelper} from '../services/dimensions-helper.service';
import {ScrollbarHelper} from '../services/scrollbar-helper.service';
import {adjustColumnWidths, forceFillColumnWidths} from '../utils/math';


@Component({
  selector: 'lx-datatable',
  template: `
    <div
      visibilityObserver
      (visible)="recalculate()">
      <datatable-header
        *ngIf="headerHeight"
        [sorts]="sorts"
        [sortType]="sortType"
        [scrollbarH]="scrollbarH"
        [innerWidth]="_innerWidth"
        [offsetX]="_offsetX | async"
        [dealsWithGroup]="groupedRows"
        [columns]="_internalColumns"
        [headerHeight]="headerHeight"
        [reorderable]="reorderable"
        [sortAscendingIcon]="cssClasses.sortAscending"
        [sortDescendingIcon]="cssClasses.sortDescending"
        [allRowsSelected]="allRowsSelected"
        [selectionType]="selectionType"
        (sort)="onColumnSort($event)"
        (resize)="onColumnResize($event)"
        (reorder)="onColumnReorder($event)"
        (select)="onHeaderSelect($event)"
        (columnContextmenu)="onColumnContextmenu($event)">
      </datatable-header>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableComponent implements OnInit, DoCheck, AfterViewInit, AfterContentInit {

////////////////////constructor//////////////////////////////////////
  element: HTMLElement;

  constructor(private cd: ChangeDetectorRef,
              @SkipSelf() private dimensionsHelper: DimensionsHelper,
              element: ElementRef,
              @SkipSelf() private scrollbarHelper: ScrollbarHelper) {
    // get ref to elm for measuring
    this.element = element.nativeElement;
  }
////////////////////constructor//////////////////////////////////////


//////////////////////Header//////////////////////////////////////
  //<editor-fold desc="Header">
  /**
   * The minimum header height in pixels.
   * Pass a false for no header
   */
  @Input() headerHeight: any = 30;
  /**
   * The type of sorting
   */
  @Input() sortType: SortType = SortType.single;
  /**
   * Enable horz scrollbars
   */
  @Input() scrollbarH: boolean = false;

  /**
   * Array of sorted columns by property and type.
   * Default value: `[]`
   */
  @Input() sorts: any[] = [];
  _innerWidth: number;
  _offsetX = new BehaviorSubject(0);
  /**
   * This attribute allows the user to set a grouped array in the following format:
   *  [
   *    {groupid=1} [
   *      {id=1 name="test1"},
   *      {id=2 name="test2"},
   *      {id=3 name="test3"}
   *    ]},
   *    {groupid=2>[
   *      {id=4 name="test4"},
   *      {id=5 name="test5"},
   *      {id=6 name="test6"}
   *    ]}
   *  ]
   */
  @Input() groupedRows: any[];
  _internalColumns: TableColumn[];
  /**
   * The minimum header height in pixels.
   * Pass a falsey for no header
   */
  @Input() headerHeight: any = 30;
  /**
   * Enable/Disable ability to re-order columns
   * by dragging them.
   */
  @Input() reorderable: boolean = true;
  /**
   * Css class overrides
   */
  @Input() cssClasses: any = {
    sortAscending: 'datatable-icon-up',
    sortDescending: 'datatable-icon-down',
    pagerLeftArrow: 'datatable-icon-left',
    pagerRightArrow: 'datatable-icon-right',
    pagerPrevious: 'datatable-icon-prev',
    pagerNext: 'datatable-icon-skip'
  };
  //endregion
  /**
   * Returns if all rows are selected.
   */
  readonly allRowsSelected: boolean;
  /**
   * Type of row selection. Options are:
   *
   *  - `single`
   *  - `multi`
   *  - `chkbox`
   *  - `multiClick`
   *  - `cell`
   *
   * For no selection pass a `falsey`.
   * Default value: `undefined`
   */
  @Input() selectionType: SelectionType;
  /**
   * The header triggered a column sort event.
   */
  onColumnSort(event: any): void {
    // clean selected rows
    if (this.selectAllRowsOnPage) {
      this.selected = [];
      this.select.emit({
        selected: this.selected
      });
    }

    const { sorts } = event;

    // this could be optimized better since it will resort
    // the rows again on the 'push' detection...
    if (this.externalSorting === false) {
      // don't use normal setter so we don't resort
      this._internalRows = sortRows(this._internalRows, this._internalColumns, sorts);
    }

    this.sorts = sorts;
    // Always go to first page when sorting to see the newly sorted data
    this.offset = 0;
    this.bodyComponent.updateOffsetY(this.offset);
    this.sort.emit(event);
  }
  /**
   * The header triggered a column resize event.
   */
  onColumnResize({ column, newValue }: any): void {
    /* Safari/iOS 10.2 workaround */
    if (column === undefined) {
      return;
    }

    let idx: number;
    const cols = this._internalColumns.map((c, i) => {
      c = { ...c };

      if (c.$$id === column.$$id) {
        idx = i;
        c.width = newValue;

        // set this so we can force the column
        // width distribution to be to this value
        c.$$oldWidth = newValue;
      }

      return c;
    });

    this.recalculateColumns(cols, idx);
    this._internalColumns = cols;

    this.resize.emit({
      column,
      newValue
    });
  }
  /**
   * The header triggered a column re-order event.
   */
  onColumnReorder({ column, newValue, prevValue }: any): void {
    const cols = this._internalColumns.map(c => {
      return { ...c };
    });

    const prevCol = cols[newValue];
    cols[newValue] = column;
    cols[prevValue] = prevCol;

    this._internalColumns = cols;

    this.reorder.emit({
      column,
      newValue,
      prevValue
    });
  }
  /**
   * Toggle all row selection
   */
  onHeaderSelect(event: any): void {
    if (this.selectAllRowsOnPage) {
      // before we splice, chk if we currently have all selected
      const first = this.bodyComponent.indexes.first;
      const last = this.bodyComponent.indexes.last;
      const allSelected = this.selected.length === (last - first);

      // remove all existing either way
      this.selected = [];

      // do the opposite here
      if (!allSelected) {
        this.selected.push(...this._internalRows.slice(first, last));
      }
    } else {
      // before we splice, chk if we currently have all selected
      const allSelected = this.selected.length === this.rows.length;
      // remove all existing either way
      this.selected = [];
      // do the opposite here
      if (!allSelected) {
        this.selected.push(...this.rows);
      }
    }

    this.select.emit({
      selected: this.selected
    });
  }
  /**
   * The header triggered a contextmenu event.
   */
  onColumnContextmenu({ event, column }: any): void {
    this.tableContextmenu.emit({ event, type: ContextmenuType.header, content: column });
  }
  //</editor-fold>
//////////////////////Header//////////////////////////////////////

////////////////////Body//////////////////////////////////////
  //<editor-fold desc="Body">

  /**
   * Enable vertical scrollbars
   */
  @Input() scrollbarV: boolean = false;
  /**
   * Property to which you can use for determining select all
   * rows on current page or not.
   *
   * @type {boolean}
   * @memberOf DatatableComponent
   */
  @Input() selectAllRowsOnPage = false;
  /**
   * A cell or row was selected.
   */
  @Output() select: EventEmitter<any> = new EventEmitter();
  /**
   * List of row objects that should be
   * represented as selected in the grid.
   * Default value: `[]`
   */
  @Input() selected: any[] = [];
  bodyHeight: number;
  /**
   * Type of column width distribution formula.
   * Example: flex, force, standard
   */
  @Input() columnMode: ColumnMode = ColumnMode.standard;

  //</editor-fold>
////////////////////Body//////////////////////////////////////





////////////////////Foot//////////////////////////////////////
  /**
   * The minimum footer height in pixels.
   * Pass falsey for no footer
   */
  @Input() footerHeight: number = 0;

////////////////////Foot//////////////////////////////////////






////////////////////ContentChildren//////////////////////////////////////
//<editor-fold desc="ContentChildren">
  _columnTemplates: QueryList<DataTableColumnDirective>;
  /**
   * Column templates gathered from `ContentChildren`
   * if described in your markup.
   */
  @ContentChildren(DataTableColumnDirective)
  set columnTemplates(val: QueryList<DataTableColumnDirective>) {
    this._columnTemplates = val;
    this.translateColumns(val);
  }
  /**
   * Returns the column templates.
   */
  get columnTemplates(): QueryList<DataTableColumnDirective> {
    return this._columnTemplates;
  }
  /**
   * Lifecycle hook that is called after a component's
   * content has been fully initialized.
   */
  ngAfterContentInit(): void {
    this.columnTemplates.changes.subscribe(v =>
      this.translateColumns(v));
  }
  /**
   * Translates the templates to the column objects
   */
  translateColumns(val: any) {
    if (val) {
      const arr = val.toArray();

      if (arr.length) {
        this._internalColumns = this.translateTemplates(arr);
        this.setColumnDefaults(this._internalColumns);
        this.recalculateColumns();
        this.cd.markForCheck();
      }
    }
  }

  /**
   * Translates templates definitions to objects
   */
  translateTemplates(templates: DataTableColumnDirective[]): any[] {
    const result: any[] = [];

    for(const template of templates) {
      const col: any = {};

      const props = Object.getOwnPropertyNames(template);

      for(const prop of props) {
        col[prop] = template[prop];
      }

      if(template.headerTemplate) {
        col.headerTemplate = template.headerTemplate;
      }

      if(template.cellTemplate) {
        col.cellTemplate = template.cellTemplate;
      }

      result.push(col);
    }

    return result;
  }

  /**
   * Sets the column defaults
   */
  setColumnDefaults(columns: TableColumn[]) {
    if(!columns) return;

    for(const column of columns) {
      if(!column.$$id) {
        column.$$id = id();
      }

      // prop can be numeric; zero is valid not a missing prop
      // translate name => prop
      if(this.isNullOrUndefined(column.prop) && column.name) {
        column.prop = camelCase(column.name);
      }

      if (!column.$$valueGetter) {
        column.$$valueGetter = getterForProp(column.prop);
      }

      // format props if no name passed
      if(!this.isNullOrUndefined(column.prop) && this.isNullOrUndefined(column.name)) {
        column.name = deCamelCase(String(column.prop));
      }

      if(this.isNullOrUndefined(column.prop) && this.isNullOrUndefined(column.name)) {
        column.name = ''; // Fixes IE and Edge displaying `null`
      }

      if(!column.hasOwnProperty('resizeable')) {
        column.resizeable = true;
      }

      if(!column.hasOwnProperty('sortable')) {
        column.sortable = true;
      }

      if(!column.hasOwnProperty('draggable')) {
        column.draggable = true;
      }

      if(!column.hasOwnProperty('canAutoResize')) {
        column.canAutoResize = true;
      }

      if(!column.hasOwnProperty('width')) {
        column.width = 150;
      }
    }
  }

  isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined;
  }
//</editor-fold>
////////////////////content-children//////////////////////////////////////






  /**
   * Lifecycle hook that is called after data-bound
   * properties of a directive are initialized.
   */
  ngOnInit(): void {
    // need to call this immediatly to size
    // if the table is hidden the visibility
    // listener will invoke this itself upon show
    this.recalculate();
  }

  /**
   * Recalc's the sizes of the grid.
   *
   * Updated automatically on changes to:
   *
   *  - Columns
   *  - Rows
   *  - Paging related
   *
   * Also can be manually invoked or upon window resize.
   */
  recalculate(): void {
    this.recalculateDims();
    this.recalculateColumns();
  }

  /**
   * Recalculates the dimensions of the table size.
   * Internally calls the page size and row count calcs too.
   *
   */
  recalculateDims(): void {
    const dims = this.dimensionsHelper.getDimensions(this.element);
    this._innerWidth = Math.floor(dims.width);

    if (this.scrollbarV) {
      let height = dims.height;
      if (this.headerHeight) height = height - this.headerHeight;
      if (this.footerHeight) height = height - this.footerHeight;
      this.bodyHeight = height;
    }

    // this.recalculatePages();
  }

  /**
   * Recalulcates the column widths based on column width
   * distribution mode and scrollbar offsets.
   */
  recalculateColumns(
    columns: any[] = this._internalColumns,
    forceIdx: number = -1,
    allowBleed: boolean = this.scrollbarH): any[] | undefined {

    if (!columns) return undefined;

    let width = this._innerWidth;

    if (this.scrollbarV) {
      width = width - this.scrollbarHelper.width;
    }

    if (this.columnMode === ColumnMode.force) {
      forceFillColumnWidths(columns, width, forceIdx, allowBleed);
    } else if (this.columnMode === ColumnMode.flex) {
      adjustColumnWidths(columns, width);
    }

    return columns;
  }

  /**
   * Lifecycle hook that is called when Angular dirty checks a directive.
   */
  ngDoCheck(): void {
    if (this.rowDiffer.diff(this.rows)) {
      if (!this.externalSorting) {
        this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
      } else {
        this._internalRows = [...this.rows];
      }

      this.recalculatePages();
      this.cd.markForCheck();
    }
  }




  /**
   * If the table should use external sorting or
   * the built-in basic sorting.
   */
  @Input() externalSorting: boolean = false;

  /**
   * Lifecycle hook that is called after a component's
   * view has been fully initialized.
   */
  ngAfterViewInit(): void {
    if (!this.externalSorting) {
      this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
    }

    // this has to be done to prevent the change detection
    // tree from freaking out because we are readjusting
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }

    requestAnimationFrame(() => {
      this.recalculate();

      // emit page for virtual server-side kickoff
      if (this.externalPaging && this.scrollbarV) {
        this.page.emit({
          count: this.count,
          pageSize: this.pageSize,
          limit: this.limit,
          offset: 0
        });
      }
    });
  }
}


/**
 * Column Type
 * @type {object}
 */
export interface TableColumn {

  /**
   * Internal unique id
   *
   * @type {string}
   * @memberOf TableColumn
   */
  $$id?: string;

  /**
   * Internal for column width distributions
   *
   * @type {number}
   * @memberOf TableColumn
   */
  $$oldWidth?: number;

  /**
   * Internal for setColumnDefaults
   *
   * @type {ValueGetter}
   * @memberOf TableColumn
   */
  $$valueGetter?: ValueGetter;

  /**
   * Determines if column is checkbox
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  checkboxable?: boolean;

  /**
   * Determines if the column is frozen to the left
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  frozenLeft?: boolean;

  /**
   * Determines if the column is frozen to the right
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  frozenRight?: boolean;

  /**
   * The grow factor relative to other columns. Same as the flex-grow
   * API from http =//www.w3.org/TR/css3-flexbox/. Basically;
   * take any available extra width and distribute it proportionally
   * according to all columns' flexGrow values.
   *
   * @type {number}
   * @memberOf TableColumn
   */
  flexGrow?: number;

  /**
   * Min width of the column
   *
   * @type {number}
   * @memberOf TableColumn
   */
  minWidth?: number;

  /**
   * Max width of the column
   *
   * @type {number}
   * @memberOf TableColumn
   */
  maxWidth?: number;

  /**
   * The default width of the column, in pixels
   *
   * @type {number}
   * @memberOf TableColumn
   */
  width?: number;

  /**
   * Can the column be resized
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  resizeable?: boolean;

  /**
   * Custom sort comparator
   *
   * @type {*}
   * @memberOf TableColumn
   */
  comparator?: any;

  /**
   * Custom pipe transforms
   *
   * @type {PipeTransform}
   * @memberOf TableColumn
   */
  pipe?: PipeTransform;

  /**
   * Can the column be sorted
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  sortable?: boolean;

  /**
   * Can the column be re-arranged by dragging
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  draggable?: boolean;

  /**
   * Whether the column can automatically resize to fill space in the table.
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  canAutoResize?: boolean;

  /**
   * Column name or label
   *
   * @type {string}
   * @memberOf TableColumn
   */
  name?: string;

  /**
   * Property to bind to the row. Example:
   *
   * `someField` or `some.field.nested`, 0 (numeric)
   *
   * If left blank, will use the name as camel case conversion
   *
   * @type {TableColumnProp}
   * @memberOf TableColumn
   */
  prop?: TableColumnProp;

  /**
   * Cell template ref
   *
   * @type {*}
   * @memberOf TableColumn
   */
  cellTemplate?: any;

  /**
   * Header template ref
   *
   * @type {*}
   * @memberOf TableColumn
   */
  headerTemplate?: any;

  /**
   * CSS Classes for the cell
   *
   *
   * @memberOf TableColumn
   */
  cellClass?: string | ((data: any) => string|any);

  /**
   * CSS classes for the header
   *
   *
   * @memberOf TableColumn
   */
  headerClass?: string | ((data: any) => string|any);

  /**
   * Header checkbox enabled
   *
   * @type {boolean}
   * @memberOf TableColumn
   */
  headerCheckboxable?: boolean;

}

export enum SortType {
  single = 'single',
  multi = 'multi'
}

export enum ContextmenuType {
  header = 'header',
  body = 'body'
}

export enum ColumnMode {
  standard = 'standard',
  flex = 'flex',
  force = 'force'
}
