import { Injectable, NgZone } from '@angular/core';
import { environment } from '@environments/environment';

import {
    ConnectableObservable, Observable, timer, of, UnaryFunction,
    empty, interval, Subject
} from 'rxjs';
import { map, takeWhile, every, filter, multicast } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class ClockService {
    last_value: Date = new Date();

    // public now$: Observable<Date> = timer(0, 100)
    public now$: ConnectableObservable<Date> = interval(100)
        .pipe(
            filter(() => {
                let millisec = (new Date()).getMilliseconds();
                return Math.floor(millisec / 100) == 0;
            }))
        .pipe(
            map(() => {
                // console.log('map2', (new Date()).getMilliseconds());
                this.last_value = new Date()
                return this.last_value;
            }))
        .pipe(multicast(() => new Subject())) as ConnectableObservable<Date>;

    constructor(private zone: NgZone) {
        // this.now$.connect();
        let self = this;
        this.zone.runOutsideAngular(() => {
            self.now$.connect();
        });
        // console.log('redirect', environment.auth.redirect);
    }
}
