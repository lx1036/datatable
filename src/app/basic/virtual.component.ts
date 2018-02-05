import {Component} from '@angular/core';


@Component({
  selector: 'virtual-scroll-demo',
  template: `
    <div>
      <h3>
        Virtual Scrolling with 10k Rows
        <small>
          <a href="https://github.com/swimlane/ngx-datatable/blob/master/demo/basic/virtual.component.ts" target="_blank">
            Source
          </a>
        </small>
      </h3>
      <lx-datatable
        class='material'
        [rows]='rows'
        [columnMode]="'force'"
        [headerHeight]="50"
        [footerHeight]="50"
        [rowHeight]="getRowHeight"
        [scrollbarV]="true"
        (page)="onPage($event)">
        <lx-datatable-column name="Name" width="300">
          <ng-template let-value="value" lx-datatable-cell-template>
            <strong>---{{value}}---</strong>
          </ng-template>
        </lx-datatable-column>
        <lx-datatable-column name="Gender" width="300">
          <ng-template let-row="row" let-value="value" lx-datatable-cell-template>
            <i [innerHTML]="row['name']"></i> and <i>{{value}}</i>
          </ng-template>
        </lx-datatable-column>
        <lx-datatable-column name="Row Height" prop="height" width="80">
        </lx-datatable-column>
      </lx-datatable>
    </div>
  `
})
export class VirtualScrollComponent {

}
