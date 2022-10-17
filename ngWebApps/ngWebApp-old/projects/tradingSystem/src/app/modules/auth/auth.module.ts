import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { AuthService, authenticateUser } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ThemeModule } from '@theme';
import { TokenInterceptorService } from './token-interceptor.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CallbackComponent } from './callback/callback.component';


@NgModule({
    declarations: [LoginComponent, CallbackComponent],
    imports: [
        CommonModule,
        ThemeModule,
        HttpClientModule,
    ],
    providers: [
        // { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true },
        AuthService,
        AuthGuard,
        {
            provide: APP_INITIALIZER, useFactory: authenticateUser,
            deps: [AuthService], multi: true,
        }
    ]
})
export class AuthModule { }
