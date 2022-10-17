import { Injectable } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompState } from '@stomp/rx-stomp';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { models } from 'shared-library';
import { environment } from '@environments/environment'
import { MarketRxStompService } from '@app/configs/msg-queue.service.config';
import { Order } from '@app/models/order';


let MQCONFIG = environment.msg_queue_config;


@Injectable({
    providedIn: 'root'
})
export class MsgControllerService {

    public subscription = new Subscription();
    readonly mktConnected$: Observable<RxStompState>;
    readonly mktConnectionState$: BehaviorSubject<RxStompState>;

    // msg control
    public mqMsg$ = new BehaviorSubject<string>('');
    private signalMsgClient: models.MsgClient;
    private mktdataMsgClient: models.MsgClient;
    private ordMsgClient: models.MsgClient;
    private strategyMsgClient: models.MsgClient;

    constructor(
        private mktRxStompService: MarketRxStompService,
    ) {
        this.mktConnected$ = this.mktRxStompService.connected$;
        this.signalMsgClient = new models.MsgClient(
            this.mktRxStompService,
            {
                msgQueue: 'kucoin_signal_stream', timeOut: MQCONFIG.time_out,
                durable: "false",
            });

        this.mktdataMsgClient = new models.MsgClient(
            this.mktRxStompService,
            {
                msgQueue: 'kucoin_mktdata', timeOut: MQCONFIG.time_out,
                durable: "false",
            });

        this.ordMsgClient = new models.MsgClient(
            this.mktRxStompService,
            {
                msgQueue: 'kucoin_order_handler', timeOut: MQCONFIG.time_out,
                durable: "false",
            });

        this.strategyMsgClient = new models.MsgClient(
            this.mktRxStompService,
            {
                msgQueue: 'trading_engine', timeOut: MQCONFIG.time_out,
                durable: "true",
            });

        this.mktConnected$ = this.mktRxStompService.connected$;
        this.mktConnectionState$ = this.mktRxStompService.connectionState$;

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    get orderList$(): Observable<any> {
        return this.strategyMsgClient.rpc('/get_open_orders');
    };

    get secList$(): Observable<any> {
        return this.signalMsgClient.stream('/list_coins');
    };

    get signalList$(): Observable<any> {
        return this.signalMsgClient.rpc('/crypto_signals');
    };

    get accountList$(): Observable<any> {
        return this.ordMsgClient.rpc('/accounts');
    };

    get accountUpdate$(): Observable<any> {
        // return this.signalMsgClient.stream('/crypto_signals');
        return this.ordMsgClient.subscription('crypto_order_exchange', 'account_update',
            { "auto-delete": "false" });
    };

    get orderUpdate$(): Observable<any> {
        // return this.signalMsgClient.stream('/crypto_signals');
        return this.ordMsgClient.subscription('crypto_order_exchange', 'order_update',
            { "auto-delete": "true" });
    };

    get marketData$(): Observable<any> {
        return this.mktdataMsgClient.subscription('crypto_price_exchange', 'broadcast_mktdata');
    };

    get signalData$(): Observable<any> {
        return this.signalMsgClient.subscription('crypto_trading_signal_exchange', 'broadcast_signal');
    };

    public sendOrder$(order: Order): Promise<any> {
        let orderMsg = order.to_dict();
        return this.ordMsgClient.rpc('/send_order', orderMsg).toPromise();
    }
}
