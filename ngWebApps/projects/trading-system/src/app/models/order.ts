import { formatDate } from '@angular/common';
import { Subscription, BehaviorSubject } from 'rxjs';

import { Security } from './security';
import { Serializable } from './serializable';
import { IndicationOfInterest } from './IndicationOfInterest';
import * as FixMaps from './FixMaps';


export enum Side {
    Buy = '1',
    Sell = '2',
}


export class Order implements Serializable<Order> {
    public security: Security;
    public sid: string;
    public side: Side;
    public id_source: number;
    public _quantity: number;
    public quantity_filled: number;
    public last_px: number;
    public tgt_price: number;
    public order_price: number;
    public _order_status: string;
    public order_type: string;
    public settle_date?: string;
    public order_id?: string;
    public ioi_id: string;
    public orig_order_id: string;
    public text: string;
    public ioi: IndicationOfInterest;
    public price_type: string;
    public loading$ = new BehaviorSubject(false);
    public orderStatus$ = new BehaviorSubject(null);

    public set quantity(x) {
        this._quantity = Math.abs(x);
        this.side = x > 0 ? Side.Buy : Side.Sell;
    }

    public get quantity() {
        return this._quantity;
    }

    constructor(
        security: Security, quantity?: number, tgt_price?: number,
        price_type?: string, settlDate?: string, ioi_id?: string, order_type?: string,
        side?: Side
    ) {
        this.security = security
        this.quantity = quantity;
        this.tgt_price = tgt_price;
        this.price_type = price_type;
        this.side = side || this.side;
        this.ioi_id = ioi_id;
        this.settle_date = settlDate;
        this.order_type = order_type;
    }

    to_data(): any[] {
        return [this.to_dict()];
    }

    set order_status(x) {
        this._order_status = x;
        this.orderStatus$.next(x);
        if (!this.canUpdate) {
            this.orderStatus$.complete();
        }
    }

    get order_status(): string {
        return this._order_status;
    }

    get OrderStatus(): string {
        let status = FixMaps.STATUS_MAP[this._order_status];
        return status || 'N/A';
    }

    get OrderType(): string {
        let typeText = FixMaps.ORDER_TYPE_MAP[this.order_type];
        return typeText || 'N/A';
    }

    get PriceType(): string {
        let priceType = FixMaps.PRICE_TYPE_MAP[this.price_type];
        return priceType || 'N/A';
    }

    get canUpdate(): boolean {
        return this.canReplace || this.canCancel;
    }

    get canReplace(): boolean {
        if (['0', '1'].includes(this.order_status)) {
            if (this.order_type == '2') {
                return true;
            }
        }

        return false;
    }

    get isBuy(): boolean {
        return this.side == Side.Buy ? true : false;
    }

    set isBuy(is_buy: boolean) {
        if (is_buy) {
            this.side = Side.Buy;
        } else {
            this.side = Side.Sell;
        }
    }

    get canCancel(): boolean {
        if (['0', '1'].includes(this.order_status)) {
            return true;
        }

        return false;
    }

    to_dict(): any {
        let dict = {
            SecurityID: this.security.fixSecurityID,
            SecurityIDSource: this.security.fixSecurityIDSource,
            Side: this.side,
            OrderQty: this.quantity,
            OrdType: this.order_type,
            Price: this.tgt_price,
            PriceType: this.price_type,
            ClOrdID: this.order_id,
            IOIID: this.ioi_id,
            SettlDate: this.settle_date,
            OrigClOrdID: this.orig_order_id,
        };
        return dict;
    }

    deserialize(json: any): Order {
        this.order_id = json.ClOrdID;
        this.ioi_id = json.IOIID || this.ioi_id;
        if (!json.OrdStatus) {
            return this;
        }

        this.order_status = json.OrdStatus;
        this.text = json.Text;

        this.order_type = json.OrdType;

        this.last_px = parseFloat(json.LastPx);

        this.quantity = parseFloat(json.OrderQty);
        this.side = json.Side == '1' ? Side.Buy : Side.Sell;
        this.settle_date = json.SettlDate;
        this.tgt_price = this.order_price = parseFloat(json.Price);
        this.price_type = json.PriceType;

        if ((json['loading'] != null) && json.OrdStatus) {
            this.loading$.next(Boolean(json['loading']));
        }
        return this;
    }
}


export class DummyOrder extends Order {
    constructor() {
        super(null);
    }
}
