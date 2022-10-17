import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
// import { MatTreeModule } from '@angular/material/tree';

import {
    MatTableExpandableComponent, HeaderRowOutlet, DataRowOutlet,
    FooterRowOutlet, NoDataRowOutlet
} from './mat-table-expandable.component';


@NgModule({
    declarations: [
        MatTableExpandableComponent,
        HeaderRowOutlet,
        DataRowOutlet,
        FooterRowOutlet,
        NoDataRowOutlet,
    ],
    imports: [
        CommonModule,
        MatTableModule,
        MatSortModule,
    ],
    exports: [
        MatTableExpandableComponent
    ],
    providers: [
    ],
})
export class MatTableExpandableModule { }

export { MatTableExpandableComponent } from './mat-table-expandable.component';
