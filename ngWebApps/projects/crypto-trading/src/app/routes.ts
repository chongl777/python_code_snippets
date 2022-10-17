import { Routes } from '@angular/router';
import {
    LoginComponent, AuthGuard,
    CallbackComponent as AuthCallbackComponent
} from 'shared-library';
import { CommonLayoutComponent } from '@modules/common-layout/common-layout.component';
import { TradingDashboardComponent } from '@modules/trading-dashboard/trading-dashboard.component';


export const routes: Routes = [
    {
        path: '', redirectTo: 'crypto/trading_signal', pathMatch: 'full'
    },
    {
        path: 'crypto', component: CommonLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'trading_signal', component: TradingDashboardComponent,
                data: { 'title': 'Crypto Trading Dashboard', 'class': 'trading-signal' },
            },
        ],
    },
    {
        path: 'callback', component: AuthCallbackComponent, pathMatch: 'full'
    },
    {
        path: 'login', redirectTo: 'auth/login', pathMatch: 'full'
    },
    {
        path: 'auth', component: CommonLayoutComponent,
        children: [
            { path: 'login', component: LoginComponent, pathMatch: 'full' }
        ]
    },
];
