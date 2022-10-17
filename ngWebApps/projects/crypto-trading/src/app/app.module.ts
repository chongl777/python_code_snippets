import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonLayoutComponent } from '@modules/common-layout/common-layout.component';
import { CommonLayoutModule } from '@modules/common-layout/common-layout.module';
import { TradingDashboardModule } from '@modules/trading-dashboard/trading-dashboard.module';
import { environment } from '@environments/environment';
import { StatusBarModule } from '@components/status-bar/status-bar.module';

import {
    AuthModule, AuthConfig, authenticateUser,
    AuthService, NavConfig
} from 'shared-library';



@NgModule({
    declarations: [
        AppComponent,
        // CommonLayoutComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        // AuthModule,
        TradingDashboardModule,
        // StatusBarModule,
        CommonLayoutModule,
    ],
    providers: [
        {
            provide: AuthConfig,
            useFactory: () => { return environment.auth }
        },
        {
            provide: NavConfig,
            useFactory: () => { return { title: '' } }
        },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
