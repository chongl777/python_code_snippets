import { Injectable } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Security } from './security';
import { Order, Side } from './order';
import { Serializable } from './serializable';
import { SecurityDataObject } from './securityDataObject';
import * as FixMaps from './FixMaps';

import { ClockService } from '../services/clock.service';
import { EventService } from '../services/event.service';
import { SecurityService } from '../services/security.service';


@Injectable({
    providedIn: 'root'
})
export class IndicationOfInterestClassFactory {

    constructor(
        private clockService: ClockService,
        private eventService: EventService,
        private securityService: SecurityService) { }

    public async createIOI(securityID: number, ioiID: string): Promise<IndicationOfInterest> {
        let ioi = new IndicationOfInterest(
            await this.securityService.getSecurity(securityID),
            this.clockService,
            this.eventService);
        ioi.ioiID = ioiID;
        return ioi
    }

    public async deserializeIOI(securityID: number, json: Object): Promise<IndicationOfInterest> {
        let ioi = new IndicationOfInterest(
            await this.securityService.getSecurity(securityID),
            this.clockService,
            this.eventService);
        return ioi.deserialize(json);
    }
}


export class IndicationOfInterest extends SecurityDataObject implements Serializable<IndicationOfInterest> {
    ioiID: string;
    ioiQty: number;
    ioiType: number;
    side: Side;
    userRating: number;
    validUntilTime: Date;
    expireTime: Date;
    ioiResponseTime: Date;
    transactTime: Date;
    currentTime: Date;
    settlDate: Date;
    priceType: string;
    counter: boolean;
    // timeLeft: number;
    timeLeft$ = new BehaviorSubject(null);
    goodFor$ = new BehaviorSubject(null);
    loading$ = new BehaviorSubject(false);
    valid: boolean = true;
    expired: boolean = false;

    category: string;
    reasons: string;
    clockSubscription: Subscription;
    orderStatusSubscription: Subscription;

    order: Order;

    constructor(
        _security: Security,
        private clockService: ClockService,
        private eventService: EventService) {

        super(_security)
        this.clockSubscription = this.clockService.now$.subscribe(
            (date: Date) => {
                this.currentTime = date;
                let timeLeft = ((this.expireTime && this.expireTime.getTime())
                    - date.getTime());
                let goodFor = ((this.validUntilTime && this.validUntilTime.getTime())
                    - date.getTime());
                this.timeLeft$.next(timeLeft);
                this.goodFor$.next(goodFor);

                if (goodFor < 100) {
                    this.invalidate();
                }

                if ((timeLeft < 100) && !(this.expired)) {
                    this.expire();
                }
            });
    }

    get canUpdate(): boolean {
        return this.order == null ? false : this.order.canUpdate;
    }

    public setOrder(order: Order): void {
        this.orderStatusSubscription && this.orderStatusSubscription.unsubscribe();
        this.order = order;
        order.ioi = this;
        this.orderStatusSubscription = order.orderStatus$.subscribe(() => {
            if (this.expired && !order.canUpdate) {
                this.invalidate();
            }
        });
    }

    get PriceType(): string {
        let priceType = FixMaps.PRICE_TYPE_MAP[this.priceType];
        return priceType || 'N/A';
    }

    get validIOI(): boolean {
        if (!this.valid) {
            return false;
        }
        if (this.expired) {
            if (!this.order) {
                return false;
            }
            if (this.order.canUpdate) {
                return true;
            } else {
                return false;
            }
        }
        return true
    }

    public expire(emit = true): void {
        this.expired = true;
        emit && this.eventService.ioiExpired$.emit(this);
        this.timeLeft$.next(null);
        this.timeLeft$.complete();
    }

    public invalidate(): void {
        if (!this.valid) {
            return;
        }
        this.expire(false);
        this.valid = false;
        this.clockSubscription && this.clockSubscription.unsubscribe();
        this.orderStatusSubscription && this.orderStatusSubscription.unsubscribe();
        this.eventService.ioiExpired$.emit(this);
        this.goodFor$.next(null);
        this.goodFor$.complete();
    }

    get responseType(): string {
        return this.ioiResponseTime ? 'Due In' : 'ASAP';
    }

    deserialize(json: Object): IndicationOfInterest {
        this.ioiID = json['IOITransType'] == 'N' ? json['IOIID'] : json['IOIRefID'];
        if (this.ioiID == null) {
            throw Error("ioiID is null, something is wrong!");
        }
        this.ioiQty = +json['IOIQty'];
        this.ioiType = json['IOIType'];
        this.side = json['Side'] == '1' ? Side.Buy : Side.Sell;
        this.userRating = parseInt(json['UserRating']);
        this.validUntilTime = new Date(json['ValidUntilTime']);
        this.transactTime = new Date(json['TransactTime']);
        this.priceType = json['PriceType'];
        this.settlDate = new Date(json['SettlDate']);
        this.ioiResponseTime = json['IOIResponseTime'] && new Date(json['IOIResponseTime']);
        this.ioiResponseTime = ((this.ioiResponseTime instanceof Date) &&
            isNaN(this.ioiResponseTime.getTime())) ? null : this.ioiResponseTime;
        this.counter = json['Counter'] == 'Y' ? true : false;

        this.category = json['categories'];
        this.reasons = json['reasons'];

        this.expireTime = this.ioiResponseTime || this.validUntilTime;

        let timeLeft = ((this.expireTime && this.expireTime.getTime())
            - this.clockService.last_value.getTime());
        this.timeLeft$.next(timeLeft);

        let goodFor = ((this.validUntilTime && this.validUntilTime.getTime())
            - this.clockService.last_value.getTime());
        this.goodFor$.next(goodFor);

        if (goodFor < 100) {
            this.invalidate();
        }

        if ((json['IOITransType'] == 'C') || (timeLeft < 100)) {
            if (!this.ioiResponseTime) {
                this.invalidate();
            } else {
                this.expire();
            }
        }
        if (json['loading'] != null) {
            this.loading$.next(Boolean(json['loading']));
        }
        return this;
    }
}
