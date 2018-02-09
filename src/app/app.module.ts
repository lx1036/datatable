import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import {VirtualScrollComponent} from './basic/virtual.component';
import {DatatableModule} from '../components/datatable.module';


@NgModule({
  declarations: [
    AppComponent,
    VirtualScrollComponent,
  ],
  imports: [
    BrowserModule,
    DatatableModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
