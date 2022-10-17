import {
    Component, OnInit, Input, ContentChildren, QueryList, TemplateRef, ViewChild,
    HostBinding, Directive, ElementRef, ViewContainerRef, ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'shared-library';

import { TokenService } from '@services/token.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '@environments/environment';


@Component({
    selector: 'app-process-monitor]',
    templateUrl: './process-monitor.component.html',
    styleUrls: ['./process-monitor.component.scss']
})
export class ProcessMonitorComponent implements OnInit {

    errMsg: string = '';
    token: string = 'token not loaded';
    token_callback = environment.token_callback;
    loading$ = new BehaviorSubject<boolean>(true);

    constructor(
        private authService: AuthService,
        private activatedRouter: ActivatedRoute,
        private tokenService: TokenService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.loadToken();
    }

    loadToken() {
        this.loading$.next(true);
        this.tokenService.loadToken$.subscribe({
            next: (token: any) => {
                this.loading$.next(false);
                this.token = token;
                this.token['expires_at'] = new Date(this.token['expires_at']);
                this.token['cached_at'] = new Date(this.token['cached_at']);
                this.errMsg = '';
            },
            error: (err) => {
                this.loading$.next(false);
                this.errMsg = err.error;
            }
        });
    }

    revokeToken() {
        this.loading$.next(true);
        this.tokenService.revokeToken$.subscribe({
            next: (token: any) => {
                this.loading$.next(false);
                this.loadToken();
            },
            error: (err) => {
                this.loading$.next(false);
                this.errMsg = err.error;
                console.error(err);
            }
        });
    }

    ngOnDestroy(): void {
    }

    refreshToken(): void {
        // this.authService.authenticate();
        let url = this.authService.build_authenticate_url(
            '/', 'mail_scope', this.token_callback);
        let wd = window.open(
            url,
            "Ratting",
            "width=700,height=500,left=150,top=200,toolbar=0,status=0,");
        let refresh = setInterval(() => {
            if (wd.closed) {
                clearInterval(refresh);
                this.loadToken();
            }
        }, 200)
    }
}
