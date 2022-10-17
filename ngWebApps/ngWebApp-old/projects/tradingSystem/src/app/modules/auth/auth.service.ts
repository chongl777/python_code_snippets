import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap, finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { User } from '@models/User';
import { v4 as uuid } from 'uuid';
import { Router, NavigationEnd } from '@angular/router';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Create Auth0 web auth instance
    // Store authentication data
    expires_at: number = 0;
    user_profile: User;
    access_token: string;
    id_token: string;
    authenticated$ = new BehaviorSubject<boolean>(false);
    isLoggedIn$ = new BehaviorSubject<boolean>(false);
    auth = environment.auth;
    // ready$ = new BehaviorSubject<boolean>(false);

    get httpOptions(): any {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            responseType: 'json' as const,
            params: new HttpParams({}),
        };
    }

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(DOCUMENT) private document: Document,
    ) {
        this.authenticated$.subscribe((authenticated: boolean) => {
            this.isLoggedIn$.next(Date.now() < this.expires_at && authenticated);
        })
    }

    authenticate(next = null): void {
        this.document.location.href = `${this.auth.authUrl}?next=${encodeURIComponent(this.auth.redirect + (next ? ('?next=' + next) : ''))}`;
    }

    login() {
        this.document.location.href = `${this.auth.loginUrl}`;
    }

    handleLoginCallback(code: string, next: string) {
        // When Auth0 hash parsed, get profile
        let httpOptions = this.httpOptions;
        httpOptions.params = httpOptions.params.set('code', code);

        this.http.get<any>(this.auth.tokenUrl, httpOptions)
            .subscribe({
                next: (resp: any) => {
                    if ('error' in resp) {
                        console.error(resp['error'].toString());

                        this.logout();
                        this.errMsg = resp['error'].toString();
                        this.router.navigate(['/login'], {
                            queryParams: { next: next }
                        });
                    } else {
                        let authResult = {
                            access_token: resp.access_token,
                            id_token: resp.id_token,
                            expires_at: parseInt(resp.expires_in) * 1000 + (new Date()).valueOf(),
                            profile: resp.profile,
                        };
                        this._setSession(authResult);
                        this.loginUser(authResult.profile, authResult.expires_at);
                        this.router.navigate([next]);
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.logout();
                    this.errMsg = err.message;
                    this.router.navigate(['/login'], {
                        queryParams: { next: next }
                    });
                }
            });
    }

    loginUser(profile: any, expires_at: number): void {
        this.user_profile = new User(profile);
        this.expires_at = expires_at;
        this.errMsg = '';

        this.authenticated$.next(true);
    }

    getAccessToken(): { access_token: string, id_token: string, expires_at: number } {
        let authResult = {
            access_token: localStorage.getItem('access_token'),
            id_token: localStorage.getItem('id_token'),
            expires_at: parseInt(localStorage.getItem('expires_at')),
        };
        this.expires_at = authResult.expires_at;
        return authResult;
    }

    set errMsg(msg: string) {
        localStorage.setItem('login_error', msg);
    }

    get loadUserInfo$(): Observable<any> {
        let authResult = this.getAccessToken();
        let httpOptions = this.httpOptions;
        httpOptions.headers = httpOptions.headers.set(
            'Access-Token', authResult.access_token || '');
        // Use access token to retrieve user's profile and set session
        return this.http.post<any>(this.auth.userUrl, {}, httpOptions)
            .pipe(
                catchError((err, caught) => {
                    console.error(err);
                    this.user_profile = new User();
                    this.authenticated$.next(false);
                    this.errMsg = err.message;
                    throw err;
                }),
                timeout(2000),
                map((resp) => {
                    if ('error' in resp) {
                        console.error(resp['error']);

                        this.user_profile = new User();
                        this.errMsg = resp['error'];
                        this.authenticated$.next(false);
                    } else {
                        this.loginUser(resp['profile'], authResult.expires_at);
                    }
                }),
                finalize(() => {
                    // sub.unsubscribe();
                })
            );
    }

    private _setSession(authResult: {
        access_token: string, id_token: string, expires_at: number
    }) {
        // Save authentication data and update login status subject
        localStorage.setItem(
            'expires_at', authResult.expires_at.toString())
        localStorage.setItem(
            'access_token', authResult.access_token)
        localStorage.setItem(
            'id_token', authResult.id_token)
    }

    logout() {
        // Log out of Auth0 session
        // Ensure that returnTo URL is specified in Auth0
        // Application settings for Allowed Logout URLs
        localStorage.clear();
        this.authenticated$.next(false);
        this.user_profile = null;
    }

}


export function authenticateUser(auth: AuthService) {
    return (): Promise<boolean> => {
        return new Promise(function (resolve, reject) {
            auth.loadUserInfo$.toPromise().then(
                function (response) {
                    return resolve(true);
                }, function (error) {
                    return resolve(true);
                });
        });
    }
}
