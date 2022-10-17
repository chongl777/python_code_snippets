import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '@environments/environment';


@Injectable({
    providedIn: 'root'
})
export class HttpService {
    constructor(
        public http: HttpClient,
    ) { }

    public saveToken$(token: string): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.post(
            environment.token_url + 'save_token', token,
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
