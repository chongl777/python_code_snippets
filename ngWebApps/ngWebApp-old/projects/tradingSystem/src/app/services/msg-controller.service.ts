import { Injectable } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompState } from '@stomp/rx-stomp';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MsgClient } from '../models/msgClient';
import { Order } from '../models/order';
import { AuthService } from '@app/modules/auth/auth.service';
import { BookingRxStompService, FixRxStompService } from '@app/configs/msg-queue.service.config';


@Injectable({
    providedIn: 'root'
})
export class MsgControllerService {

    readonly fixConnected$: Observable<RxStompState>;
    readonly fixConnectionState$: BehaviorSubject<RxStompState>;

    readonly bookingConnected$: Observable<RxStompState>;
    readonly bookingConnectionState$: BehaviorSubject<RxStompState>;

    public subscription = new Subscription();

    public watchlist_loading$ = new BehaviorSubject<boolean>(true);
    get watchlistLoad$(): Subject<any> {
        return this.msgClient.stream('/watchlist');
    };

    // orders
    public orders_loading$ = new BehaviorSubject<boolean>(true);
    public orderUpdate$: Subject<any>;
    public orderCancel$: Subject<any>;
    public orderCancelReject$: Subject<any>;
    public orderStatus$: Subject<any>;
    public orderReplace$: Subject<any>;
    public orderNew$: Subject<any>;
    get ordersLoad$(): Subject<any> {
        return this.msgClient.stream('/todays_orders');
    };

    // ioi
    public ioi_loading$ = new BehaviorSubject<boolean>(true);
    public ioiUpdate$: Subject<any>;
    public ioiStatus$: Subject<any>;
    get ioiLoad$(): Subject<any> {
        return this.msgClient.stream('/matched_iois');
    };

    // security
    public sec_loading$ = new BehaviorSubject<boolean>(true);
    get secLoad$(): Subject<any> {
        return this.msgClient.stream('/securities_info');
    }

    public funds_loading$ = new BehaviorSubject<boolean>(true);
    get fundsLoad$(): Subject<any> {
        return this.msgClient.stream('/funds_info');
    }

    get secUpdate$(): Subject<any> {
        return this.msgClient.signal_subsscribe(
            'trading_signal_exchange', 'broadcast_securities_info');
    }

    // market data
    public marketData_loading$ = new BehaviorSubject<boolean>(true);
    public marketDataUpdate$: Subject<any>;
    get marketDataLoad$(): Subject<any> {
        return this.msgClient.stream('/mkt_data');
    };

    // portfolio allocation
    get portfolioUpdate$(): Subject<any> {
        // portfolio
        return this.msgClient.signal_subsscribe(
            'trading_signal_exchange', 'broadcast_portfolio_allocation');
    };
    get portfolioLoad$(): Subject<any> {
        return this.msgClient.stream('/portfolio_allocation');
    };

    get portfolioReload$(): Observable<any> {
        return this.msgClient.rpc('/reload_portfolio');
    };

    // watch list
    get watchlistUpdate$(): Subject<any> {
        // watchlist service
        return this.msgClient.signal_subsscribe(
            'trading_signal_exchange', 'broadcast_watchlist');
    };

    get ticketsUpdate$(): Subject<any> {
        return this.bookingMsgClient.subscription(
            'booking_exchange', 'update_ticket');
    }

    get positionChange$(): Subject<any> {
        return this.bookingMsgClient.subscription(
            'booking_exchange', 'position_change');
    }

    public broadcastPostionChange(): Promise<any> {
        return this.bookingMsgClient.broadcast(
            'booking_exchange', 'position_change', {});
    }

    // msg control
    public mqMsg$ = new BehaviorSubject<string>('');

    private msgClient: MsgClient;
    private bookingMsgClient: MsgClient;

    constructor(
        private fixRxStompService: FixRxStompService,
        private bookingRxStompService: BookingRxStompService,
        private authService: AuthService,
    ) {
        this.msgClient = new MsgClient(this.fixRxStompService);
        this.fixConnected$ = this.fixRxStompService.connected$;
        this.fixConnectionState$ = this.fixRxStompService.connectionState$;

        this.bookingMsgClient = new MsgClient(this.bookingRxStompService);
        this.bookingConnected$ = this.bookingRxStompService.connected$;
        this.bookingConnectionState$ = this.bookingRxStompService.connectionState$;

        this.subscription.add(this.fixConnectionState$.subscribe(
            (state: RxStompState) => {
                console.log('fix connection state', state);
            }));

        this.subscription.add(this.bookingConnectionState$.subscribe(
            (state: RxStompState) => {
                console.log('booking connection state', state);
            }));

        // ioi service
        this.ioiUpdate$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_ioi');
        this.ioiStatus$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_ioi_status');

        // market data service
        this.marketDataUpdate$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_mktdata');

        // order server
        this.orderNew$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_new_order');
        this.orderReplace$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_replace_order');
        this.orderCancel$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_cancel_order');
        this.orderCancelReject$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_order_cancel_reject');
        this.orderStatus$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_order_status');
        this.orderUpdate$ = this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_order_update');

        // reloading handling
        let dt = new Date();
        let loadingMap = {
            'ioi': { 'loading$': this.ioi_loading$, 'last_update': dt },
            'watchlist': { 'loading$': this.watchlist_loading$, 'last_update': dt },
            'orders': { 'loading$': this.orders_loading$, 'last_update': dt },
            'marketdata': { 'loading$': this.orders_loading$, 'last_update': dt },
        }

        this.subscription.add(this.msgClient.subscription(
            'trading_signal_exchange', 'broadcast_reload').subscribe(
                (signal: any) => {
                    let component = signal[0];
                    let loading = signal[1];
                    loadingMap[component]['loading$'].next(loading);
                }
            ));

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    // trading system server control
    get refreshPort$(): Subject<any> {
        return this.msgClient.stream_timeout('/refresh_portfolio', 60 * 10000);
        // return this.msgClient.stream_timeout('/test', 60 * 10000);
    }

    get refreshWatchlist$(): Subject<any> {
        return this.msgClient.stream_timeout('/refresh_watchlist', 60 * 10000);
        // return this.msgClient.stream_timeout('/test', 60 * 10000);
    }

    get refreshMktData$(): Subject<any> {
        return this.msgClient.stream_timeout('/reload_mkt_data', 60 * 10000);
        // return this.msgClient.stream_timeout('/test', 60 * 10000);
    }

    get refreshAll$(): Subject<any> {
        return this.msgClient.stream_timeout('/refresh_message_handler', 60 * 10000);
        // return this.msgClient.stream_timeout('/test', 60 * 10000);
    }

    // load data
    public update_watchlist(sids: number[], valid: boolean): Observable<any> {
        return this.msgClient.rpc('/update_watchlist', sids, valid);
    }

    public sendOrders(orders: Order[], listID?: string): Promise<any> {
        let orderMsg = {
            orders: orders.map((x) => x.to_dict()),
            ListID: listID,
            Email: this.authService.user_profile.email,
        }
        return this.msgClient.rpc('/send_orders', orderMsg).toPromise();
    }

    public respondIOI(order: Order): Promise<any> {
        let orderMsg = order.to_dict()
        let user = this.authService.user_profile.email;

        return this.msgClient.rpc('/respond_ioi', orderMsg, user).toPromise();
    }

    public sendOrder(order: Order): Promise<any> {
        let orderMsg = order.to_dict();
        let user = this.authService.user_profile.email;

        return this.msgClient.rpc('/send_order', orderMsg, user).toPromise();
    }

    public replaceOrder(order: Order): Promise<any> {
        let orderMsg = order.to_dict()
        let user = this.authService.user_profile.email;

        return this.msgClient.rpc('/replace_order', orderMsg, user).toPromise();
    }

    public cancelOrder(order: Order): Promise<any> {
        let orderMsg = order.to_dict()
        let user = this.authService.user_profile.email;

        return this.msgClient.rpc('/cancel_order', orderMsg, user).toPromise();
    }

    public addSecurity(securityID: number): Promise<any> {
        return this.msgClient.rpc('/add_security', securityID).toPromise();
    }
}
