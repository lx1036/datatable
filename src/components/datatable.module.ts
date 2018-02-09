import {NgModule} from '@angular/core';
import {DatatableComponent} from './datatable.component';
import {DataTableHeaderComponent} from './header/header.component';
import {DataTableHeaderCellComponent} from './header/header-cell.component';
import {VisibilityDirective} from '../directives/visibility.directive';
import {ScrollbarHelper} from '../services/scrollbar-helper.service';
import {CommonModule} from '@angular/common';


@NgModule({
  declarations: [
    DatatableComponent,
    DataTableHeaderComponent,
    DataTableHeaderCellComponent,
  ],
  imports: [
    CommonModule,
  ],
  providers: [
    VisibilityDirective,
    ScrollbarHelper,
  ],
  exports: [
    DatatableComponent,

  ],
})
export class DatatableModule { }
