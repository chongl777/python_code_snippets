import { Injectable } from '@angular/core';
import { Order, DummyOrder } from '@app/models/order';
import { RxStompState } from '@stomp/rx-stomp';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { finalize, delay, take, timeout, switchMap } from 'rxjs/operators';

import { Security } from '../models/security';
import { MarketData } from '../models/marketData';
import { MsgControllerService } from './msg-controller.service';
import { IndicationOfInterestService } from './indication-of-interest.service';
import { SecurityService } from './security.service';
import { environment } from '@environments/environment';
import * as commons from '@app/models/commons';

let TIMEOUT = environment.default_timeout;


@Injectable({
    providedIn: 'root'
})
export class OrdersService {
    public loading$: BehaviorSubject<boolean>;
    public orders$ = new BehaviorSubject<Order[]>([]);
    private orders: { [order_id: string]: Order } = {};

    constructor(
        private msgController: MsgControllerService,
        private ioiService: IndicationOfInterestService,
        private securityService: SecurityService,
    ) {
        this.loading$ = this.msgController.orders_loading$;
        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.loadAllOrders();
            }
        });

        this.subscribeOrders();
        this.loading$.subscribe((load) => {
            if (!load) {
                this.update();
            }
        });
    }

    private async process_order_update(json: any): Promise<Order> {
        if (json.ClOrdID == null) {
            console.error('order with null id', json);
            return null;
        }
        if (!(json.ClOrdID in this.orders)) {
            if (json.security_id == null) {
                // throw Error("security_id is null!");
                console.error("security_id is null!");
                this.orders[json.ClOrdID] = new Order(
                    new Security(
                        null, new MarketData(null))
                );
            } else {
                let security = await this.securityService.getSecurity(json.security_id)
                this.orders[json.ClOrdID] = new Order(security);
            }
        }
        let order = this.orders[json.ClOrdID].deserialize(json);

        if (order.ioi_id != null) {
            try {
                let ioi = await this.ioiService.match_order_with_ioi(order);
                if (ioi) {
                    ioi.loading$.next(order.loading$.getValue());
                }
                if (!order.canUpdate && ioi.expired) {
                    // ioi.invalidate();
                }
            } catch (err) {
                throw err;
            }
        }
        return order
    }

    private async process_new_order(json: any): Promise<Order> {
        let order = await this.process_order_update(json);
        return order;
    }

    private async process_cancel_order(json: any): Promise<Order> {
        if (json.ClOrdID == null) {
            console.error('order with null id', json);
            return null;
        }
        let origOrderID = json.OrigClOrdID || json.ClOrdID;
        let orderID = json.ClOrdID;
        let order = await this.getOrder(origOrderID, json.security_id)
        json.ClOrdID = origOrderID;
        order.deserialize(json);
        if (order.ioi) {
            order.ioi.loading$.next(order.loading$.getValue());
            if (!order.canUpdate && order.ioi.expired) {
                order.ioi.invalidate();
            }
        }
        if (orderID != origOrderID) {
            let order = new DummyOrder();
            this.orders[orderID] = order;
        }
        return order
    }

    private async process_replace_order(json: any): Promise<Order> {
        if (json.ClOrdID == null) {
            console.error('order with null id', json);
            return null;
        }
        let orig_order_id = json.OrigClOrdID;
        let order_id = json.ClOrdID;
        let order = await this.getOrder(orig_order_id, json.security_id);
        delete this.orders[orig_order_id];
        order.deserialize(json);
        if (order.ioi) {
            order.ioi.loading$.next(order.loading$.getValue());
        }
        this.orders[order_id] = order;
        return order;
    }

    private async process_order_cancel_reject(json: any, timeout: number = TIMEOUT): Promise<Order> {
        let orig_order_id = json.OrigClOrdID
        await commons.waitUntil(() => (orig_order_id in this.orders), timeout);

        this.orders[orig_order_id].loading$.next(false);
        this.orders[orig_order_id].text = json.Text;

        let order = new DummyOrder();
        this.orders[json.ClOrdID] = order;
        return order;
    }

    private async update_order_status(order_id: string, loading: boolean, timeout: number = TIMEOUT): Promise<any> {
        await commons.waitUntil(() => (order_id in this.orders), timeout);
        this.orders[order_id].loading$.next(loading);
        return
    }

    update(): void {
        if (this.loading$.getValue()) {
            return;
        }
        this.orders$.next(Object.values(this.orders).filter((ord) => !(ord instanceof DummyOrder)));
    }

    public async getOrder(orderID: string, sid: number): Promise<Order> {

        if (!(orderID in this.orders)) {
            this.orders[orderID] = new Order(
                await this.securityService.getSecurity(sid))
        }

        return this.orders[orderID];
    }

    private async subscribeOrders(): Promise<any> {
        this.msgController.orderCancelReject$.subscribe({
            next: async (order: any) => {
                await this.process_order_cancel_reject(order);
                this.update();
            },
            error: (error: Error) => console.error(error),
        });

        this.msgController.orderStatus$.subscribe({
            next: async (resp: any) => {
                let order_id = resp[0];
                let loading = resp[1];
                try {
                    await this.update_order_status(order_id, loading);
                    this.update();
                } catch (err) {
                    console.error(err);
                }
            },
            error: (error: Error) => console.error(error),
        });

        this.msgController.orderNew$.subscribe({
            next: async (order: any) => {
                try {
                    await this.process_new_order(order);
                    this.update();
                } catch (err) {
                    console.error(err);
                }
            },
            error: (error: Error) => console.error(error),
        });

        this.msgController.orderUpdate$.subscribe({
            next: async (order: any) => {
                try {
                    await this.process_order_update(order);
                    this.update();
                } catch (err) {
                    console.error(err);
                }
            },
            error: (error: Error) => console.error(error),
        });

        this.msgController.orderCancel$.subscribe({
            next: async (order: any) => {
                try {
                    await this.process_cancel_order(order);
                    this.update();
                } catch (err) {
                    console.error(err);
                }
            },
            error: (error: Error) => console.error(error),
        });

        this.msgController.orderReplace$.subscribe({
            next: async (order: any) => {
                try {
                    await this.process_replace_order(order);
                    this.update();
                } catch (err) {
                    console.error(err);
                }
            },
            error: (error: Error) => console.error(error),
        });
    }

    private async loadAllOrders(): Promise<any> {
        console.log('load all orders...');
        this.loading$.next(true);
        let response = [];
        let sub$ = this.msgController.ordersLoad$
            .pipe(finalize(() => {
                // this.loading$.next(false);
                sub$.unsubscribe();
            }))
            .subscribe({
                next: (resp: any) => {
                    response.push(resp);
                },
                error: (error: Error) => {
                    this.loading$.next(false);
                    error.message = 'OrdersService: ' + error.message;
                    this.orders$.error(error)
                },
                complete: async () => {
                    console.log('process all orders!');
                    for (let resp of response) {
                        // console.log(resp)
                        try {
                            await this.process_order_update(resp);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    this.loading$.next(false);
                    // console.log('done');
                    this.update();
                    console.log('process all orders done!');
                }
            });
    }

    public submitOrder(orders: Order[], listId: string): Promise<any> {
        return this.msgController.sendOrders(orders, listId);
    }

    public async sendOrders(orders: Order[], listId: string): Promise<any> {
        let resp = await this.msgController.sendOrders(orders, listId);
        let ret_orders = [];
        for (let json of resp) {
            let order = await this.getOrder(json['ClOrdID'], json['security_id']);
            order.quantity = parseFloat(json.OrderQty) * ({ '1': 1, '2': -1 }[json.Side]);
            order.tgt_price = order.order_price = parseFloat(json.Price);
            ret_orders.push(order);
        }
        return ret_orders;
    }

    public async respondIOI(ord: Order, timeout: number = TIMEOUT): Promise<Order> {
        let json = await this.msgController.respondIOI(ord);
        let order_id = json.ClOrdID;
        await commons.waitUntil(() => (order_id in this.orders), timeout);
        // let order = this.process_order(orderMsg);
        return this.orders[order_id];
    }

    public async sendOrder(ord: Order, timeout: number = TIMEOUT): Promise<Order> {
        let json = await this.msgController.sendOrder(ord);
        let order_id = json.ClOrdID;
        await commons.waitUntil(() => (order_id in this.orders), timeout);
        // let order = this.process_order(orderMsg);
        return this.orders[order_id];
    }

    public async replaceOrder(ord: Order, timeout: number = TIMEOUT): Promise<Order> {
        let json = await this.msgController.replaceOrder(ord);
        let order_id = json.ClOrdID;

        await commons.waitUntil(() => (order_id in this.orders), timeout);

        if (this.orders[order_id] instanceof DummyOrder) {
            order_id = json.OrigClOrdID;
        }
        return this.orders[order_id];
    }

    public async cancelOrder(ord: Order, timeout: number = TIMEOUT): Promise<any> {
        let json = await this.msgController.cancelOrder(ord);
        let order_id = json.ClOrdID;
        await commons.waitUntil(() => (order_id in this.orders), timeout);
        return this.orders[order_id];
    }

}


export class OrdersDataService {
    public orders$ = new BehaviorSubject<Order[]>([]);
    private sortFunc: (a: Order, b: Order) => number = (a: Order, b: Order) => 0;
    public orders: Order[];
    public loading$: BehaviorSubject<boolean>;

    constructor(
        private ordersService: OrdersService,
        private filterKey: string,
    ) {
        let filterFn = {
            'ActiveIOIOrders': (x: Order) => (x.canUpdate == true) && (x.ioi_id),
            'ActiveRegOrders': (x: Order) => (x.canUpdate == true) && (!x.ioi_id),
            'FilledOrders': (x: Order) => (['1', '2'].includes(x.order_status)),
            'ExpiredOrders': (x: Order) => !(['1', '2'].includes(x.order_status)) && !x.canUpdate,
            'All': (x: Order) => true,
        }[filterKey];

        this.ordersService.orders$.subscribe({
            next: (orders: Order[]) => {
                this.orders = orders.filter(filterFn);
                this.update();
            },
            error: (err) => {
                this.orders$.error(err);
            }
        });

        this.loading$ = this.ordersService.loading$;
    }

    sort(sortFunc: (a: Order, b: Order) => number): void {
        this.sortFunc = sortFunc;
        this.update();
    }

    update(): void {
        this.orders = this.orders.sort(this.sortFunc);
        this.orders$.next(this.orders);
    }

}
