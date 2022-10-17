import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradingDashboardComponent } from './trading-dashboard.component';
import { MarketRxStompService, RxStompServiceFactory } from '@configs/msg-queue.service.config';
import { MsgControllerService } from '@services/msg-controller.service';
import { MarketMonitorComponent } from '@components/market-monitor/market-monitor.component';
import { PositionsMonitorComponent } from '@components/positions-monitor/positions-monitor.component';
import { OrdersMonitorComponent } from '@components/orders-monitor/orders-monitor.component';
import { TradeButtonComponent } from '@components/trade-button/trade-button.component';

import { CommonComponentsModule } from '@modules/common-modules/common-components.modules';

import { StatusBarModule } from '@components/status-bar/status-bar.module';
import { SpinnerOrErrorModule } from 'shared-library';

import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '@modules/overlay-container/customOverlayContainer';
import { CommonLayoutModule } from '../common-layout/common-layout.module';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
    declarations: [
        TradingDashboardComponent,
        MarketMonitorComponent,
        PositionsMonitorComponent,
        OrdersMonitorComponent,
        TradeButtonComponent,
    ],
    imports: [
        CommonModule,
        CommonLayoutModule,
        StatusBarModule,
        SpinnerOrErrorModule,
        // MatDialogModule,
    ],
    providers: [
        {
            provide: MarketRxStompService,
            useFactory: RxStompServiceFactory,
        },
        {
            provide: MsgControllerService,
        },
    ],
})
export class TradingDashboardModule { }
