import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subscription, } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { Security } from '@app/models/security';
import { TradeTicket } from '@app/models/tradeTicket';
import { Transaction } from '@app/models/transaction';
import { IndicationOfInterest } from '@app/models/IndicationOfInterest'
import { MsgControllerService } from './msg-controller.service';
import { SecurityService } from './security.service';


class SelectSecurityEvent {
    event$ = new BehaviorSubject<Security>(null);
    public subscription = new Subscription();

    constructor(
        private msgControllerService: MsgControllerService,
        private securityService: SecurityService,
    ) {
        this.subscription.add(
            this.msgControllerService.securitySelect$.subscribe(
                async (sid: any) => {
                    let security = await this.securityService.getSecurity(sid, null, 5)
                    this.event$.next(security);
                }));
    }

    public subscribe(fn: (x: Security) => any) {
        return this.event$.subscribe(fn);
    }

    public emit(security: Security) {
        security && this.msgControllerService.emitSecuritySelect(security.securityID);
    }

    public next(security: Security) {
        this.emit(security);
    }

    public getValue() {
        return this.event$.getValue();
    }
}

@Injectable({
    providedIn: 'root'
})
export class EventService {
    _z_index: number = 1000;

    public subscription = new Subscription();

    ioiExpired$ = new EventEmitter<IndicationOfInterest>();
    selectSecurity$: SelectSecurityEvent;
    selectedTradeTicket$ = new BehaviorSubject<TradeTicket>(null);
    selectedTransaction$ = new BehaviorSubject<Transaction>(null);
    updateTradeSettlementComponent$ = new EventEmitter<boolean>();

    constructor(
        private msgControllerService: MsgControllerService,
        private securityService: SecurityService
    ) {

        this.selectSecurity$ = new SelectSecurityEvent(
            this.msgControllerService, this.securityService);
        this.subscription.add(this.selectSecurity$.subscription);
        this.subscription.add(this.selectedTransaction$.subscribe((x: Transaction) => {
            try {
                this.selectSecurity$.emit(x.security);
            } catch (err) {
            }
        }));
    }

    get z_index() {
        this._z_index++;
        return this._z_index;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
