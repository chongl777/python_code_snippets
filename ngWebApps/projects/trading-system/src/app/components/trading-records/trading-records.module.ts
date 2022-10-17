import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingComponent } from './setting.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SecurityEventsModule } from '@app/components/security-events/security-events.module';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { TradingRecordsComponent } from './trading-records.component';
import { TradesHisotryComponent } from './trades-history.component';

import { MatTableExpandableModule } from 'shared-library';
import { SpinnerOrErrorModule } from 'shared-library';


@NgModule({
    declarations: [
        TradingRecordsComponent,
        TradesHisotryComponent,
        SettingComponent,
    ],
    imports: [
        CommonModule,
        DragDropModule,
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatSelectModule,
        MatInputModule,
        MatDialogModule,
        MatButtonModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        TableVirtualScrollModule,
        SpinnerOrErrorModule,
        ScrollingModule,
        SecurityEventsModule,
        MatTableExpandableModule,
    ],
    exports: [
        TradingRecordsComponent,
        TradesHisotryComponent,
    ]
})
export class TradingRecordsModule { }
