import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll'
// import { MatTreeModule } from '@angular/material/tree';

import { SmartTableComponent } from './smart-table.component';
import { SmartChildTableComponent } from './smart-child-table/smart-child-table.component';
import { HeaderRowOutlet, DataRowOutlet, FooterRowOutlet, NoDataRowOutlet } from './smart-table.component';


@NgModule({
    declarations: [
        SmartTableComponent,
        SmartChildTableComponent,
        HeaderRowOutlet,
        DataRowOutlet,
        FooterRowOutlet,
        NoDataRowOutlet,
    ],
    imports: [
        CommonModule,
        MatTableModule,
        MatSortModule,
        TableVirtualScrollModule,
    ],
    exports: [
        SmartTableComponent
    ],
    providers: [
    ],
})
export class SmartTableModule { }
