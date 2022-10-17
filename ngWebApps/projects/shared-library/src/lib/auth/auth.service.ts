import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap, finalize, first } from 'rxjs/operators';

import { v4 as uuid } from 'uuid';

import { User } from './User';
import { AuthConfig } from './authConfig';
import { Mail } from './mail';


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
    // ready$ = new BehaviorSubject<boolean>(false);

    get httpOptions(): any {
        return {
            headers: new HttpHeaders({
                // 'Content-Type': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                // 'Access-Control-Allow-Credentials': 'true',
                // 'Cross-Origin-Resource-Policy': 'cross-origin',
            }),
            responseType: 'json' as const,
            withCredentials: true,
            params: new HttpParams({}),
        };
    }

    constructor(
        private http: HttpClient,
        private router: Router,
        private activatedRouter: ActivatedRoute,
        private auth: AuthConfig,
        @Inject(DOCUMENT) private document: Document,
    ) {
        this.authenticated$.subscribe((authenticated: boolean) => {
            // this.isLoggedIn$.next(Date.now() < this.expires_at && authenticated);
            this.isLoggedIn$.next(authenticated);
        })
    }


    authenticate(next = null, scope = null, redirect = null): void {
        this.document.location.href = this.build_authenticate_url(next, scope, redirect);
    }

    build_authenticate_url(next = null, scope = null, redirect = null): string {
        return `${this.auth.authUrl}?${scope ? 'scope=' + scope + '&' : ''}next=${encodeURIComponent((redirect || this.auth.redirect) + (next ? ('?next=' + next) : ''))}`;
    }

    login() {
        this.document.location.href = `${this.auth.loginUrl}`;
    }

    loginUser(profile: any): void {
        this.user_profile = new User(profile);
        // this.expires_at = expires_at;
        this.errMsg = '';
        this.authenticated$.next(true);
        // let httpOptions = this.httpOptions;
        // this.http.post<any>("https://wfiubuntu01.wfi.local/test/utils/send_email",
        //     {}, httpOptions).toPromise();
    }

    set errMsg(msg: string) {
        localStorage.setItem('login_error', msg);
    }

    public loadToken$(params: any): Observable<any> {
        let httpOptions = this.httpOptions;
        httpOptions.params = params;
        httpOptions.responseType = 'text';
        return this.http.get<any>(this.auth.loadTokenUrl, httpOptions);
    }

    get loadUserInfo$(): Observable<any> {
        // let authResult = this.getAccessToken();
        let httpOptions = this.httpOptions;
        // httpOptions.headers = httpOptions.headers.set(
        //     'Access-Token', authResult.access_token || '');
        // Use access token to retrieve user's profile and set session
        return this.http.post<any>(this.auth.userUrl, {}, httpOptions)
            .pipe(
                timeout(10000),
                catchError((err, caught) => {
                    this.user_profile = new User();
                    this.authenticated$.next(false);
                    this.errMsg = err.message;
                    console.error(err);
                    throw err;
                }),
                map((resp) => {
                    if ('error' in resp) {
                        console.error(resp['error']);

                        this.user_profile = new User();
                        this.errMsg = resp['error'];
                        this.authenticated$.next(false);
                    } else {
                        this.loginUser(resp['profile']);
                    }
                }),
                finalize(() => {
                    // sub.unsubscribe();
                })
            );
    }

    build_logout_url(next = null, scope = null): string {
        return `${this.auth.logOutUrl + '?' + 'next=' + encodeURIComponent(next ? next : this.auth.loginUrl)}`
    }

    async logout(): Promise<any> {
        // Log out of Auth0 session
        // Ensure that returnTo URL is specified in Auth0
        // Application settings for Allowed Logout URLs
        // localStorage.clear();
        let httpOptions = this.httpOptions
        httpOptions.responseType = 'text';
        return this.http.post<any>(
            this.auth.logOutUrl, {}, httpOptions).toPromise().then(
                (response) => {
                    console.log(response);
                    this.authenticated$.next(false);
                    this.user_profile = null;
                },
                (err) => {
                    console.error(err);
                }
            );
    }

    mailMarkedAsRead$(msg_id: string) {
        let httpOptions = this.httpOptions;
        httpOptions.params = { msg_id: msg_id };
        httpOptions.responseType = 'json';
        return this.http.get(this.auth.emailUrl + '/mark_email', httpOptions)
    }

    loadEmails$(
        limit: number, inbox_query: string, outbox_search: string = null,
        download_attachments: boolean = true,
        highlights: string
    ): Observable<Mail[]> {
        let params = {
            limit: limit.toString(),
            download_attachments: download_attachments ? 'true' : 'false',
            highlights: highlights,
        };
        inbox_query && (params['inbox_query'] = inbox_query);
        outbox_search && (params['outbox_search'] = '"' + outbox_search + '"');

        return this.http.get(
            this.auth.emailUrl + '/load_email',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'json',
                params: params,
                withCredentials: true,
            }).pipe(
                map((response: any[]) => {
                    let mails = [];
                    for (let res of response) {
                        mails.push(new Mail(
                            res['msg_id'], res['subject'], res['sender'],
                            new Date(res['created']), res['to'], res['cc'],
                            res['body'], res['is_read'],
                            res['has_attachments'],
                            res['flagged'],
                            res['attachments']));
                    }
                    return mails;
                })
            );
    }

    sendEmail$(title: string, body: string, to: string[], cc: string[], attachments = {}): Observable<any> {
        let httpOptions = this.httpOptions;
        httpOptions.headers = {
            'Content-Type': 'application/json',
        };

        httpOptions.responseType = 'text';
        return this.http.post(
            this.auth.emailUrl + '/send_email',
            {
                title: title,
                body: body.replace(/\n/g, '<br>'),
                to: to,
                cc: cc,
                // cc: ['chong.liu@westfieldinvestment.com'],
                attachments: attachments,
            }, httpOptions)
    }

    replyEmail$(msg_id: string, body: string, to: string[], cc: string[], attachments = {}): Observable<any> {
        let httpOptions = this.httpOptions;
        httpOptions.headers = {
            'Content-Type': 'application/json',
        };
        to = to.filter(x => x.trim());
        cc = cc.filter(x => x.trim());

        httpOptions.responseType = 'text';
        return this.http.post(
            this.auth.emailUrl + '/reply_email',
            {
                msg_id: msg_id,
                body: body.replace(/\n/g, '<br>'),
                to: to,
                cc: cc,
                // cc: ['chong.liu@westfieldinvestment.com'],
                attachments: attachments,
            }, httpOptions)
    }
}


export function authenticateUser(auth: AuthService) {
    return (): Promise<boolean> => {
        return new Promise(function (resolve, reject) {
            auth.loadUserInfo$.toPromise().then(
                (response) => {
                    return resolve(true);
                },
                (error) => {
                    return resolve(true);
                });
        });
    }
}
