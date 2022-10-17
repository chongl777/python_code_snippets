import { Injectable, EventEmitter } from '@angular/core';
import { Router, Event as NavigationEvent, NavigationStart, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subscription, } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';


@Injectable({
    providedIn: 'root'
})
export class EventService {
    public subscription = new Subscription();

    selectSecurity$: BehaviorSubject<number>;
    selectCompany$: BehaviorSubject<number>;
    filterCompany$: BehaviorSubject<number>;

    constructor(
    ) {
        this.selectSecurity$ = new BehaviorSubject(null);
        this.selectCompany$ = new BehaviorSubject(null);
        this.filterCompany$ = new BehaviorSubject(null);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
