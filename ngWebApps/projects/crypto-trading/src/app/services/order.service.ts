import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RxStompState } from '@stomp/rx-stomp';
import { RxStompService } from '@stomp/ng2-stompjs';

import { MarketData } from '@models/market';
import { Account } from '@models/account';
// import { MsgClient } from '../models/msgClient';
// import { MarketDataService } from './market-data.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MsgControllerService } from './msg-controller.service';
import { environment } from '@environments/environment';
import { SecurityService } from './security.service';
import { Order, Side, OrderType } from '@app/models/order';


// export type Account = {
//     'id': string, 'balance': number, 'coin': string, 'type': string,
//     'available': number
// };


@Injectable({
    providedIn: 'root'
})
export class OrderService {
    accounts: { [id: string]: Account } = {};
    orders: { [id: string]: Order } = {};
    public orders$ = new BehaviorSubject<Order[]>([]);
    public loading$ = new BehaviorSubject<boolean>(false);
    public accounts$ = new BehaviorSubject<Account[]>([]);
    public subscription = new Subscription();

    constructor(
        private msgController: MsgControllerService,
        private securityService: SecurityService,
    ) {
        // this.loading$ = this.msgController.sec_loading$;
        this.subscribeAccountsUpdate();
        this.subscribeOrdersUpdate();

        this.msgController.mktConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.loadAccounts();
                this.loadOrders();
            }
        });
    }

    loadOrders(): void {
        console.log('load all orders...');
        this.loading$.next(true);
        let sub$ = this.msgController.orderList$
            .pipe(finalize(() => {
                sub$.unsubscribe();
            }))
            .subscribe({
                next: (orders: any[]) => {
                    orders.forEach((order: any, i: number) => {
                        this.createOrUpdateOrderV2(order);
                    })
                    this.orders$.next(Object.values(this.orders));
                    this.loading$.next(false);
                    console.log('load all orders done!');
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    error.message = 'loadOrders: ' + error.message;
                    this.loading$.error(error);
                    console.error(error);
                    console.log('load all accounts error!');
                },
            });
    }

    loadAccounts(): void {
        console.log('load all accounts...');

        this.loading$.next(true);
        let sub$ = this.msgController.accountList$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                // this.securities$.next(Object.values(this.securitiesMap))
                // this.loading$.next(false);
            }))
            .subscribe({
                next: (accounts: any[]) => {
                    Object.values(accounts).forEach((account: any, i: number) => {
                        this.createOrUpdateAccount(account);
                    })
                    this.accounts$.next(Object.values(this.accounts));
                    this.loading$.next(false);
                    console.log('load all accounts done!');
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    error.message = 'OrderService: ' + error.message;
                    this.loading$.error(error);
                    console.error(error);
                    console.log('load all accounts error!');
                },
            });
    }

    createOrUpdateAccount(json: any): void {
        let id = json['id'];
        if (this.accounts[id] == null) {
            this.accounts[id] = new Account(id, this.securityService);
        }
        this.accounts[id].deserialize(json);
    }

    getOrder(json): Order {
        if (this.orders[json['orderId']] == null) {
            let security = this.securityService.createOrUpdateSecurity(json['sid'], null);
            this.orders[json['orderId']] = new Order(security);
            let order = this.orders[json['orderId']]
            order.client_oid = json['clientOid'];
            order.side = json['side'] == 'buy' ? Side.Buy : Side.Sell;
            order.price = +json['price']
            order.order_type = json['orderType'] == 'limit' ? OrderType.Limit : OrderType.Market;
            order.order_id = json['orderId'];
            order.quantity = +json['size'];
            order.order_time = new Date(json['orderTime'] / 1000000);
            order.status = json['status'];
        }
        return this.orders[json['orderId']];
    }

    createOrUpdateOrder(json: any): void {
        if (json['type'] == 'trade') {
            return this.createOrUpdateAccount(json);
        }
        let order = this.getOrder(json);

        if (json['type'] == 'open') {
            if (order.status != 'done') {
                order.status = 'open';
            }
        } else if (json['type'] == 'match') {
            if (order.status != 'done') {
                order.status = 'open';
            }
            order.add_fill(json);
        } else if (json['type'] == 'filled') {
            order.status = 'done';
        } else if (json['type'] == 'canceled') {
            order.status = 'done';
        }
    }

    createOrUpdateOrderV2(json: any): void {
        let order = this.getOrder(json);
        Object.values(json.fills).forEach(
            (fill, i) => {
                order.add_fill(fill);
            }
        )
    }

    subscribeOrdersUpdate(): void {
        this.subscription.add(
            this.msgController.orderUpdate$.subscribe({
                next: (order: any) => {
                    this.createOrUpdateOrder(order);
                    this.orders$.next(Object.values(this.orders));
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    error.message = 'OrderService: ' + error.message;
                    this.loading$.error(error);
                    console.error(error);
                },
            })
        );
    }

    subscribeAccountsUpdate(): void {
        this.subscription.add(
            this.msgController.accountUpdate$.subscribe({
                next: (account: any) => {
                    this.createOrUpdateAccount(account);
                    this.accounts$.next(Object.values(this.accounts));
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    error.message = 'OrderService: ' + error.message;
                    this.loading$.error(error);
                    console.error(error);
                },
            })
        );
    }

    async sendOrder(order: Order): Promise<Order> {
        let rslt = await this.msgController.sendOrder$(order);
        return order;
    }
}


export class AccountsDataService {
    public accounts$ = new BehaviorSubject<Account[]>([]);
    private sortFunc: (a: Account, b: Account) => number = (a, b) => 0;
    private acctlist: Account[];
    public loading$: BehaviorSubject<boolean>;
    constructor(
        private orderService: OrderService
    ) {
        this.loading$ = this.orderService.loading$;
        this.orderService.accounts$.subscribe({
            next: (accts: Account[]) => {
                this.acctlist = accts.sort(this.sortFunc);
                this.update();
            }
        })
    }

    sort(sortFunc: (a: Account, b: Account) => number): void {
        this.sortFunc = sortFunc;
        this.acctlist = this.acctlist.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.accounts$.next(this.acctlist);
    }
}


export class OrdersDataService {
    public orders$ = new BehaviorSubject<Order[]>([]);
    private sortFunc: (a: Order, b: Order) => number = (a, b) => 0;
    private orderlist: Order[];
    public loading$: BehaviorSubject<boolean>;
    constructor(
        private orderService: OrderService
    ) {
        this.loading$ = this.orderService.loading$;
        this.orderService.orders$.subscribe({
            next: (orders: Order[]) => {
                this.orderlist = orders.sort(this.sortFunc);
                this.update();
            }
        })
    }

    sort(sortFunc: (a: Order, b: Order) => number): void {
        this.sortFunc = sortFunc;
        this.orderlist = this.orderlist.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.orders$.next(this.orderlist);
    }
}
