import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MatCheckboxModule } from '@angular/material/checkbox';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop'

import { OverlayContainer } from '@angular/cdk/overlay';
import { OVERLAY_CONTAINER_PROVIDER, OVERLAY_CONTAINER_PROVIDER_FACTORY } from '@angular/cdk/overlay/overlay-container';

import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { ThemeModule } from '@theme';

import { NguCarouselModule } from '@ngu/carousel';
import { CommonComponentsModule } from '@app/modules/common-components/common-components.module';

// import { TabsComponent } from '../../components/tabs/tabs.component';
// import { TradingDashboardComponent } from './trading-dashboard.component'

import { OrdersService } from '@app/services/orders.service';
import { RippleGlobalOptions, MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';

import { DataUpdateComponent } from './data-update.component';



@NgModule({
    declarations: [
        DataUpdateComponent
    ],
    imports: [
        CommonModule,
        CommonComponentsModule,

        DragDropModule,
        FlexLayoutModule,
        NguCarouselModule,
        ThemeModule,
        FormsModule,
        MatListModule,
        MatTableModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        MatSortModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ScrollingModule,
    ]
})
export class DataUpdateModule { }
