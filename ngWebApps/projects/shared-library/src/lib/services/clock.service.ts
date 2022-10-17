import { Injectable, NgZone } from '@angular/core';

import {
    ConnectableObservable, interval, Subject
} from 'rxjs';
import { map, filter, multicast } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class ClockService {
    last_value: Date = new Date();

    public now$: ConnectableObservable<Date> = interval(100)
        .pipe(
            filter(() => {
                let millisec = (new Date()).getMilliseconds();
                return Math.floor(millisec / 100) == 0;
            }))
        .pipe(
            map(() => {
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
    }
}
