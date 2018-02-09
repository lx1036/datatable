import {
  AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, DoCheck, ElementRef,
  EventEmitter, Input, KeyValueDiffer,
  OnInit, Output,
  QueryList, SkipSelf
} from '@angular/core';
import {DataTableColumnDirective} from './columns/column.directive';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {DimensionsHelper} from '../services/dimensions-helper.service';
import {ScrollbarHelper} from '../services/scrollbar-helper.service';
import {ColumnMode, SelectionType, SortType, TableColumn} from '../types/table-column.type';
import {element} from 'protractor';


@Component({
  selector: 'lx-datatable',
  template: `
    <div
      visibilityObserver
      (visible)="recalculate()">
      <lx-datatable-header
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
      ></lx-datatable-header>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableComponent implements OnInit, DoCheck, AfterViewInit, AfterContentInit {

////////////////////constructor//////////////////////////////////////
//   element: HTMLElement;

  constructor(private cd: ChangeDetectorRef,
              private element: ElementRef,
              @SkipSelf() private scrollbarHelper: ScrollbarHelper) {
    // get ref to elm for measuring
    // this.element = element.nativeElement;
  }
////////////////////constructor//////////////////////////////////////

////////////////////LiftCycle//////////////////////////////////////
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
  }
  /**
   * Enable vertical scrollbars
   */
  @Input() scrollbarV: boolean = false;
  bodyHeight: number;
  /**
   * Recalculates the dimensions of the table size.
   * Internally calls the page size and row count calcs too.
   *
   */
  recalculateDims(): void {
    // const dims = this.dimensionsHelper.getDimensions(this.element);
    const dims = this.element.nativeElement.getBoundingClientRect();
    this._innerWidth = Math.floor(dims.width);

    if (this.scrollbarV) {
      let height = dims.height;
      if (this.headerHeight) height = height - this.headerHeight;
      if (this.footerHeight) height = height - this.footerHeight;
      this.bodyHeight = height;
    }

    console.log('datatable:', this._innerWidth, this.bodyHeight);
  }

  rowDiffer: KeyValueDiffer<{}, {}>;
  _rows: any[];
  _internalRows: any[];
  /**
   * If the table should use external sorting or
   * the built-in basic sorting.
   */
  @Input() externalSorting: boolean = false;
  _groupRowsBy: string;
  /**
   * Rows that are displayed in the table.
   */
  @Input() set rows(val: any) {
    this._rows = val;

    if (val) {
      this._internalRows = [...val];
    }

    // auto sort on new updates
    if (!this.externalSorting) {
      // this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
    }

    console.log('rows', this._internalRows.length);
    // recalculate sizes/etc
    this.recalculate();

    if (this._rows && this._groupRowsBy) {
      // If a column has been specified in _groupRowsBy created a new array with the data grouped by that row
      // this.groupedRows = this.groupArrayBy(this._rows, this._groupRowsBy);
    }

    this.cd.markForCheck();
  }
  /**
   * Gets the rows.
   */
  get rows(): any {
    return this._rows;
  }
  /**
   * Lifecycle hook that is called when Angular dirty checks a directive.
   */
  ngDoCheck(): void {
    if (this.rowDiffer.diff(this.rows)) {
      if (!this.externalSorting) {
        // this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
      } else {
        this._internalRows = [...this.rows];
      }

      this.cd.markForCheck();
    }
  }

  /**
   * Lifecycle hook that is called after a component's
   * content has been fully initialized.
   */
  ngAfterContentInit(): void {
    this.columnTemplates.changes.subscribe(v =>
      this.translateColumns(v));
  }
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
   * Translates the templates to the column objects
   */
  translateColumns(val: any) {
    if (val) {
      const arr = val.toArray();

      if (arr.length) {
        this._internalColumns = this.translateTemplates(arr);
        // this.setColumnDefaults(this._internalColumns);
        // this.recalculateColumns();
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
   * If the table should use external paging
   * otherwise its assumed that all data is preloaded.
   */
  @Input() externalPaging: boolean = false;
  /**
   * The table was paged either triggered by the pager or the body scroll.
   */
  @Output() page: EventEmitter<any> = new EventEmitter();
  _count: number = 0;
  /**
   * The total count of all rows.
   * Default value: `0`
   */
  @Input() set count(val: number) {
    this._count = val;

    // recalculate sizes/etc
    this.recalculate();
  }
  /**
   * Gets the count.
   */
  get count(): number {
    return this._count;
  }
  pageSize: number;
  _limit: number | undefined;
  /**
   * The page size to be shown.
   * Default value: `undefined`
   */
  @Input() set limit(val: number | undefined) {
    this._limit = val;

    // recalculate sizes/etc
    this.recalculate();
  }

  /**
   * Gets the limit.
   */
  get limit(): number | undefined {
    return this._limit;
  }
  /**
   * Lifecycle hook that is called after a component's
   * view has been fully initialized.
   */
  ngAfterViewInit(): void {
    if (!this.externalSorting) {
      // this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
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
////////////////////LiftCycle//////////////////////////////////////






//////////////////////Header//////////////////////////////////////
  //<editor-fold desc="Header">
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
  /**
   * The header triggered a column resize event.
   */
  /**
   * The header triggered a column re-order event.
   */
  /**
   * Toggle all row selection
   */
  /**
   * The header triggered a contextmenu event.
   */
  //</editor-fold>
//////////////////////Header//////////////////////////////////////

////////////////////Body//////////////////////////////////////
//<editor-fold desc="Body">
  /**
   * The row height; which is necessary
   * to calculate the height for the lazy rendering.
   */
  @Input() rowHeight: number = 30;
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









//</editor-fold>
////////////////////content-children//////////////////////////////////////


















}




