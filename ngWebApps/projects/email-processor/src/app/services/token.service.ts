import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '@environments/environment';


@Injectable({
    providedIn: 'root'
})
export class TokenService {
    private load_token_url = environment.token_url + '/load_token';
    private revoke_token_url = environment.token_url + '/revoke_token';

    constructor(
        public http: HttpClient,
    ) { }

    public get loadToken$(): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.get<any>(
            this.load_token_url,
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                withCredentials: true,
                responseType: 'json' as const,
            }
        );
    }

    public get revokeToken$(): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.post(
            this.revoke_token_url, "",
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                withCredentials: true,
                responseType: 'text',
            }
        );
    }
}
