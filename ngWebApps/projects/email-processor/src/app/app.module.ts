import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AuthModule, AuthConfig, authenticateUser, AuthService, NavConfig } from 'shared-library';
import { SpinnerOrErrorModule } from 'shared-library';
import { CommonLayoutComponent } from '@components/common-layout/common-layout.component';
import { ProcessMonitorComponent } from '@components/process-monitor/process-monitor.component';
import { CallbackComponent } from '@components/callback/callback.component';
import { environment } from '@environments/environment';


@NgModule({
    declarations: [
        AppComponent,
        ProcessMonitorComponent,
        CallbackComponent,
        CommonLayoutComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,

        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatInputModule,

        AuthModule,
        SpinnerOrErrorModule,
    ],
    providers: [
        {
            provide: AuthConfig,
            useFactory: () => { return environment.auth }
        },
        {
            provide: NavConfig,
            useFactory: () => { return { title: 'Email Processor Monitor' } }
        },
        {
            provide: APP_INITIALIZER, useFactory: authenticateUser,
            deps: [AuthService], multi: true,
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
