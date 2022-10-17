import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingComponent } from './setting.component';
import { PortfolioLookthroughComponent } from './portfolio-lookthrough.component'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableExpandableModule } from 'shared-library';
import { SpinnerOrErrorModule } from 'shared-library';


import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { TradeButtonsModule } from '@app/components/trade-buttons/trade-buttons.module';
import { SecurityEventsModule } from '@app/components/security-events/security-events.module';
import { ScrollingModule } from '@angular/cdk/scrolling';


@NgModule({
    declarations: [
        PortfolioLookthroughComponent,
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
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        TableVirtualScrollModule,
        SpinnerOrErrorModule,
        TradeButtonsModule,
        ScrollingModule,
        SecurityEventsModule,
        MatTableExpandableModule,
    ],
    exports: [
        PortfolioLookthroughComponent,
    ]
})
export class PortfolioLookthroughModule { }
