import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { LoginComponent } from './login/login.component';
import { AuthService, authenticateUser } from './auth.service';
import { AuthGuard } from './auth.guard';

import { TokenInterceptorService } from './token-interceptor.service';
import { CallbackComponent } from './callback/callback.component';
import { NavBarComponent, NavConfig } from './nav-bar/nav-bar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
    declarations: [LoginComponent, CallbackComponent, NavBarComponent],
    imports: [
        CommonModule,
        HttpClientModule,
        MatToolbarModule,
        MatTableModule,
        MatButtonModule,
    ],
    providers: [
        // { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true },
        AuthService,
        AuthGuard,
        // {
        //     provide: APP_INITIALIZER, useFactory: authenticateUser,
        //     deps: [AuthService], multi: true,
        // }
    ],
    exports: [
        NavBarComponent,
    ]
})
export class AuthModule { }

export {
    AuthGuard, CallbackComponent, AuthService,
    authenticateUser, LoginComponent, NavBarComponent, NavConfig
};
export { AuthConfig } from './authConfig';
export { User } from './User';
export { Mail, Recipient } from './mail';
