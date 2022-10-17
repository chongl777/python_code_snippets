import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop'
import { OverlayContainer } from '@angular/cdk/overlay';

import { ThemeModule } from '@theme';

import { TableVirtualScrollModule } from 'ng-table-virtual-scroll'

import { TabsComponent } from '@app/components/tabs/tabs.component';
import { IoiListComponent } from '@app/components/ioi-list/ioi-list.component';
import { IoiOrderComponent } from '@app/components/ioi-order/ioi-order.component';
import { PortfolioComponent } from '@app/components/portfolio/portfolio.component';
import { PortfolioLookthroughComponent } from '@app/components/portfolio-lookthrough/portfolio-lookthrough.component';


import { IoiStatusComponent } from '@app/components/ioi-list/ioi-status/ioi-status.component';
import { WatchlistComponent } from '@app/components/watchlist/watchlist.component';
import { StatusBarComponent } from '@app/components/status-bar/status-bar.component';

import { TradingRecordsComponent } from '@app/components/trading-records/trading-records.component';
import { OrdersComponent } from '@app/components/orders/orders.component';
import { OrderListComponent } from '@app/components/order-list/order-list.component';
import { OrderStatusComponent } from '@app/components/order-list/order-status/order-status.component';

import { DataUpdatePanelComponent } from '@app/components/data-update-panel/data-update-panel.component';
import { DebugMsgComponent } from '@app/components/debug-msg/debug-msg.component';

import { DialogWindowComponent, WinDirective } from '@app/components/dialog-window/dialog-window.component';
import { ToolBarComponent } from '@app/components/tool-bar/tool-bar.component';
import { SecurityLookupComponent } from '@app/components/security-lookup/security-lookup.component';
import { SecurityDetailsModule } from '@app/components/security-details/security-details.module';
import { PortfolioLookthroughModule } from '@app/components/portfolio-lookthrough/portfolio-lookthrough.module';
import { SpinnerOrErrorModule } from '@app/components/spinner-or-error/spinner-or-error.module';
import { TradeButtonsModule } from '@app/components/trade-buttons/trade-buttons.module';
import { SecurityEventsModule } from '@app/components/security-events/security-events.module';


@NgModule({
    declarations: [
        DialogWindowComponent,
        //TradeButtonsComponent,
        TabsComponent,
        IoiListComponent,
        IoiStatusComponent,
        IoiOrderComponent,
        WatchlistComponent,
        PortfolioComponent,
        TradingRecordsComponent,
        OrdersComponent,
        OrderListComponent,
        OrderStatusComponent,
        DataUpdatePanelComponent,
        DebugMsgComponent,
        // PortfolioLookthroughComponent,
        // SmartTableComponent,
        // SmartChildTableComponent,
        // SecurityEventsComponent,
        // SecurityEventsListComponent,
        ToolBarComponent,
        WinDirective,
        SecurityLookupComponent,
    ],
    imports: [
        CommonModule,
        DragDropModule,
        FlexLayoutModule,
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
        MatAutocompleteModule,
        MatIconModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ScrollingModule,
        TableVirtualScrollModule,
        SecurityDetailsModule,
        PortfolioLookthroughModule,
        SpinnerOrErrorModule,
        TradeButtonsModule,
        SecurityEventsModule,
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
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

        // TradeButtonsComponent,
        TabsComponent,
        IoiListComponent,
        IoiStatusComponent,
        IoiOrderComponent,
        WatchlistComponent,
        //SpinnerOrErrorComponent,
        PortfolioComponent,
        TradingRecordsComponent,
        OrdersComponent,
        OrderListComponent,
        OrderStatusComponent,
        DataUpdatePanelComponent,
        DebugMsgComponent,
        ToolBarComponent,
        DialogWindowComponent,
        WinDirective,
        SecurityLookupComponent,
        PortfolioLookthroughModule,
        TradeButtonsModule,
        SecurityDetailsModule,
        SecurityEventsModule,
    ]
})
export class CommonComponentsModule { }
