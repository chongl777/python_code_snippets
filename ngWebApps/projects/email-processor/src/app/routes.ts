import { Routes } from '@angular/router';
import { LoginComponent, AuthGuard, CallbackComponent as AuthCallbackComponent } from 'shared-library';
import { ProcessMonitorComponent } from '@components/process-monitor/process-monitor.component';
import { CallbackComponent } from '@components/callback/callback.component';
import { CommonLayoutComponent } from '@components/common-layout/common-layout.component';


export const routes: Routes = [
    {
        path: '', redirectTo: 'monitor/index', pathMatch: 'full'
    },
    {
        path: 'monitor', component: CommonLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'index', component: ProcessMonitorComponent, pathMatch: 'full'
            },
        ],
    },
    // {
    //     path: 'callback', component: AuthCallbackComponent, pathMatch: 'full'
    // },
    {
        path: 'token_callback', component: CallbackComponent, pathMatch: 'full'
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
