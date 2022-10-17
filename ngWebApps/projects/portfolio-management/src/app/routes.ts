import { Routes } from '@angular/router';
import { LoginComponent, AuthGuard, CallbackComponent as AuthCallbackComponent } from 'shared-library';
import { PopupWindowComponent } from '@components/popup-window/popup-window.component';
import { CommonLayoutComponent } from '@components/common-layout/common-layout.component';
import { TradingSignalComponent } from '@components/trading-signal/trading-signal.component';
import { SignalEMCComponent } from './components/signal-emc/signal-emc.component';
import { SignalRVSComponent } from './components/signal-rvs/signal-rvs.component';
import { TradingSignalWrapperComponent } from './components/trading-signal/trading-signals-wrapper.component';
import { SecurityLookupComponent } from './components/security-lookup/security-lookup.component';
import { SecurityInfoComponent } from './components/security-info/security-info.component';
import { SecurityInfoWrapperComponent } from './components/security-info/security-info-wrapper.component';


export const routes: Routes = [
    // {
    //     path: '', redirectTo: 'security/trading_signal', pathMatch: 'full'
    // },
    {
        path: 'security', component: CommonLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'trading_signal', component: SecurityLookupComponent,
                data: { 'title': 'Trading Signal', 'class': 'trading-signal' },
                children: [
                    {
                        path: 'index', redirectTo: '', pathMatch: 'full'
                    },
                    {
                        path: '', component: TradingSignalComponent, pathMatch: 'full',
                        data: { 'updateOnResize': false }
                    }
                ]
            },
            {
                path: 'info', component: SecurityLookupComponent,
                data: { 'title': 'Security Info', 'class': 'general-info' },
                children: [
                    {
                        path: 'index', redirectTo: '', pathMatch: 'full'
                    },
                    {
                        path: '', component: SecurityInfoComponent, pathMatch: 'full',
                        data: { 'updateOnResize': false }
                    }
                ]
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

    {
        path: 'trading_signal', component: PopupWindowComponent, data: { 'title': 'Trading Signal' },
        // canActivate: [AuthGuard],
        children: [
            {
                path: '', component: TradingSignalWrapperComponent, pathMatch: 'full',
                data: { 'allSignal': true }
            },
        ],
    },
    {
        path: 'emc', component: PopupWindowComponent, data: { 'title': 'EMC Signal' },
        // canActivate: [AuthGuard],
        children: [
            {
                path: '', component: TradingSignalWrapperComponent, pathMatch: 'full',
                data: { 'allSignal': false, signal: 1 }
            },
        ],
    },
    {
        path: 'emcst', component: PopupWindowComponent, data: { 'title': 'EMCst Signal' },
        // canActivate: [AuthGuard],
        children: [
            {
                path: '', component: TradingSignalWrapperComponent, pathMatch: 'full',
                data: { 'allSignal': false, signal: 10 }
            },
        ],
    },
    {
        path: 'rvs', component: PopupWindowComponent, data: { 'title': 'RVS Signal' },
        // canActivate: [AuthGuard],
        children: [
            {
                path: '', component: TradingSignalWrapperComponent, pathMatch: 'full',
                data: { 'allSignal': false, signal: 7 }
            },
        ],
    },
    {
        path: 'security_general_info', component: PopupWindowComponent,
        data: { 'title': 'Security Info', 'class': 'general-info' },
        // canActivate: [AuthGuard],
        children: [
            {
                path: '', component: SecurityInfoWrapperComponent, pathMatch: 'full',
                data: { 'updateOnResize': false }
            },
        ],
    },
];
