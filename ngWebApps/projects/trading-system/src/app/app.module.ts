import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll'
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ThemeModule } from '@theme';

import {
    InjectableRxStompConfig, RxStompService, rxStompServiceFactory,
    RxStompRPCService, InjectableRxStompRPCConfig,
} from '@stomp/ng2-stompjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// import { StatusBarComponent } from './components/status-bar/status-bar.component';
import {
    BookingRxStompService, BookingRxStompServiceFactory,
    EventRxStompService, EventRxStompServiceFactory,
    FixRxStompService, FIXRxStompServiceFactory,
    RxStompConfigFactory
} from './configs/msg-queue.service.config';
import { AuthModule, AuthConfig, authenticateUser, AuthService } from 'shared-library';
import { LayoutsModule } from './modules/layouts';
import { TradingDashboardModule } from './modules/trading-dashboard/trading-dashboard.module';
import { PortAllocationsModule } from './modules/port-allocations/port-allocations.module';
import { TradesConfirmationModule } from './modules/trades-confirmation/trades-confirmation.module';
import { TradesSettlementModule } from './modules/trades-settlement/trades-settlement.module';

import { DataUpdateModule } from './modules/data-update/data-update.module';
import { CookieService } from 'ngx-cookie-service';
import { MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions } from '@angular/material/core';
import { environment } from '@environments/environment';
// import { SharedLibraryModule } from 'shared-library';


const globalRippleConfig: RippleGlobalOptions = {
    disabled: false,
    animation: {
        enterDuration: 300,
        exitDuration: 0,
    }
};


@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        MatTableModule,
        MatTabsModule,
        MatToolbarModule,
        MatButtonModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatSortModule,
        ScrollingModule,
        TableVirtualScrollModule,
        FlexLayoutModule,
        HttpClientModule,
        LayoutsModule,
        DragDropModule,
        TradingDashboardModule,
        PortAllocationsModule,
        TradesConfirmationModule,
        TradesSettlementModule,
        DataUpdateModule,
        AuthModule,
        // SharedLibraryModule,
    ],
    providers: [
        CookieService,
        {
            provide: InjectableRxStompConfig,
            useFactory: RxStompConfigFactory,
        },
        {
            provide: FixRxStompService,
            useFactory: FIXRxStompServiceFactory,
            //useFactory: rxStompServiceFactory,
            //deps: [InjectableRxStompConfig]
        },
        {
            provide: BookingRxStompService,
            useFactory: BookingRxStompServiceFactory,
        },
        {
            provide: EventRxStompService,
            useFactory: EventRxStompServiceFactory,
        },
        {
            provide: AuthConfig,
            useFactory: () => { return environment.auth }
        },
        {
            provide: APP_INITIALIZER, useFactory: authenticateUser,
            deps: [AuthService], multi: true,
        }
        // MsgQueueServic,
        // ClockService,
        // { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig },
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }
