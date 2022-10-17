import { Injectable, EventEmitter } from '@angular/core';
import { Security } from '@app/models/security';
import { TradeTicket } from '@app/models/tradeTicket';
import { Transaction } from '@app/models/transaction';
import { BehaviorSubject } from 'rxjs';
import { IndicationOfInterest } from '../models/IndicationOfInterest'

@Injectable({
    providedIn: 'root'
})
export class EventService {
    _z_index: number = 1000;

    ioiExpired$ = new EventEmitter<IndicationOfInterest>();
    selectSecurity$ = new EventEmitter<Security>();
    selectedTradeTicket$ = new BehaviorSubject<TradeTicket>(null);
    selectedTransaction$ = new BehaviorSubject<Transaction>(null);

    constructor() {
    }

    get z_index() {
        this._z_index++;
        return this._z_index;
    }
}
