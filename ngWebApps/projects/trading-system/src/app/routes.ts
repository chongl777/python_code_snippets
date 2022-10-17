import { Routes } from '@angular/router';
import { LoginComponent, AuthGuard, CallbackComponent } from 'shared-library';

import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { CommonLayoutComponent } from './modules/layouts/common-layout/common-layout.component';
import { TradingDashboardComponent } from './modules/trading-dashboard/trading-dashboard.component';
import { PortAllocationComponent } from './modules/port-allocations/port-allocations.component';
import { DataUpdateComponent } from './modules/data-update/data-update.component';
import { TradesConfirmationComponent } from './modules/trades-confirmation/trades-confirmation.component';
import { TradesSettlementLayoutComponent } from './modules/trades-settlement/trades-settlement.component';
import { PopupDialogWindowComponent } from './components/popup-dialog-window/popup-dialog-window.component';


export const routes: Routes = [
    {
        path: '', redirectTo: 'trading/dashboard', pathMatch: 'full'
    },
    {
        path: 'trading', component: CommonLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: 'dashboard', component: TradingDashboardComponent, pathMatch: 'full' },
            { path: 'port_allocations', component: PortAllocationComponent, pathMatch: 'full' },
            { path: 'trades_confirmation', component: TradesConfirmationComponent, pathMatch: 'full' },
            { path: 'trades_settlement', component: TradesSettlementLayoutComponent, pathMatch: 'full' },
            { path: 'data_update', component: DataUpdateComponent, pathMatch: 'full' },
        ],
    },
    // {
    //     path: 'login', component: LoginComponent
    // },
    {
        path: 'login', redirectTo: 'layout/login', pathMatch: 'full'
    },
    {
        path: 'callback', component: CallbackComponent, pathMatch: 'full'
    },

    {
        path: 'layout', component: CommonLayoutComponent,
        children: [
            { path: 'login', component: LoginComponent, pathMatch: 'full' },
        ],
    },
    {
        path: 'popup-window/:widget', component: PopupDialogWindowComponent, pathMatch: 'full'
    },
];
