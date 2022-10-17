import { Injectable } from '@angular/core';
import { CollectionViewer, DataSource } from "@angular/cdk/collections";

import { RxStompService } from '@stomp/ng2-stompjs';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { finalize, delay, take, timeout, switchMap } from 'rxjs/operators';
import { RxStompState } from '@stomp/rx-stomp';

import { Security } from '../models/security';
import { SecurityDataObject } from '../models/securityDataObject';
import { Order } from '../models/order';
import { SecurityService } from './security.service';
import { MsgControllerService } from './msg-controller.service';


export class WatchItem extends SecurityDataObject {
    t_date: Date;
    long_short: 1 | -1;
    category: string;
    reasons: string;
    is_new: boolean;
    comments: string;
    sid_equity: number;
    valid: boolean;
    trading_rnk_total: number;
    trading_rnk: number;

    constructor(security: Security,) {
        super(security);
    }

    deserialize(json: Object): WatchItem {
        this.t_date = json['t_date'] && new Date(json['t_date']);
        this.long_short = json['long_short'] == 1 ? 1 : -1;
        this.is_new = json['is_new'] == 1 ? true : false;
        this.category = json['categories'];
        this.reasons = json['reasons'];
        this.comments = json['comments'];
        this.sid_equity = json['side_equity'];
        this.valid = json['valid'];
        this.trading_rnk_total = json['trading_rnk_total'];
        this.trading_rnk = json['trading_rnk'];

        this._selected = false;

        return this;
    }

    public static compare(a: WatchItem, b: WatchItem, field: string): number {
        switch (field) {
            case 'TradingRnk':
                return a.trading_rnk - b.trading_rnk;
            case 'TradingRnkTotal':
                return a.trading_rnk_total - b.trading_rnk_total;
            default:
                return SecurityDataObject.compare(a, b, field);
        }
    }

    to_data(): any[] {
        return [{
            'security': this.security.description,
            'sid': this.security.securityID,
            'emc_score': this.emc_score,
            'rvs_score': this.rvs_score,
            'erh_score': this.rvs_score + this.emc_score,
            't_date': this.t_date,
            'long_short': this.long_short,
            'is_new': this.is_new,
            'category': this.category,
            'reasons': this.reasons,
            'comments': this.comments,
            'rtg': this.security.marketData.rating.rtg,
            'ytw': this.ytw,
            'price': this.price,
            'outstanding_amt': this.security.marketData.outstandingAmt.value,
        }];
    }
}


@Injectable({
    providedIn: 'root'
})
export class WatchItemClassFactory {

    constructor(private securityService: SecurityService,) { }

    async deserialize(json: Object): Promise<WatchItem> {
        json['security_id'] = parseInt(json['security_id']);
        let wi = new WatchItem(
            await this.securityService.getSecurity(json['security_id']));
        return wi.deserialize(json);
    }
}


@Injectable({
    providedIn: 'root'
})
export class WatchlistService {

    public watchListSubject = new BehaviorSubject<WatchItem[]>([]);
    public loading$: BehaviorSubject<boolean>;
    watchList: { [ls_sid: string]: WatchItem } = {};

    constructor(
        private msgController: MsgControllerService,
        private wiFactory: WatchItemClassFactory,
    ) {

        this.loading$ = this.msgController.watchlist_loading$;
        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.loadWatchlist();
            }
        });
        this.subscribeWatchlist();
        this.loading$.subscribe((load) => {
            if (!load) {
                this.update();
            }
        });
    }

    update(): void {
        if (this.loading$.getValue()) {
            return
        }
        this.watchListSubject.next(Object.values(this.watchList));
    }

    private async process_wi(json: Object): Promise<any> {
        let wi = await this.wiFactory.deserialize(json)
        this.watchList[wi.long_short + '_' + wi.security.securityID] = wi;
    }

    private subscribeWatchlist(): void {
        this.msgController.watchlistUpdate$.subscribe({
            next: async (wl: any) => {
                this.loading$.next(true);
                this.watchList = {};
                this.update();
                for (let resp of wl) {
                    await this.process_wi(resp);
                }

                setTimeout(() => {
                    this.loading$.next(false);
                    this.update();
                }, 0);
            },
            error: (error: Error) => {
                console.error(error);
                error.message = 'WatchlistService: ' + error.message;
                this.loading$.error(error);
            },
        });
    }

    public invalidate(sids: number[], valid: boolean): void {
        this.loading$.next(true);
        let sub$ = this.msgController.update_watchlist(sids, valid)
            .pipe(
                finalize(() => {
                    this.loading$.next(false);
                    sub$.unsubscribe();
                })).subscribe();
    }

    private loadWatchlist(): void {
        let response = [];
        this.loading$.next(true);
        let sub$ = this.msgController.watchlistLoad$
            .pipe(finalize(() => {
                this.loading$.next(false);
                sub$.unsubscribe();
            }))
            .subscribe({
                next: (resp: Object) => {
                    response = response.concat(resp);
                },
                error: (error: Error) => this.watchListSubject.error(error),
                complete: async () => {
                    this.watchList = {};
                    for (let resp of response) {
                        await this.process_wi(resp);
                    }
                    this.loading$.next(false);
                    // this.update();
                }
            });
    }

    public sendOrders(orders: any[], listId?: string): Promise<any> {
        return this.msgController.sendOrders(orders, listId);
    }

}

export class WatchlistDataService {
    public watchListSubject = new BehaviorSubject<WatchItem[]>([]);
    private sortFunc: (a: WatchItem, b: WatchItem) => number = (a, b) => 0;
    public watchlist: WatchItem[];
    public loading$: Observable<boolean>;
    get allSelected(): boolean {
        for (let x of this.watchlist) {
            if (!x.selected) {
                return false;
            }
        }
        return true;
    }

    set allSelected(val) {
        for (let x of this.watchlist) {
            x.selected = val;
        }
    }

    get anySelected(): boolean {
        for (let x of this.watchlist) {
            if (x.selected) {
                return true;
            }
        }
        return false;
    }

    constructor(
        private watchlistService: WatchlistService,
        longShortFlag: 1 | -1 | 0,
        showValid: true | false,
    ) {
        this.watchlistService.watchListSubject.subscribe({
            next: (watchlist: WatchItem[]) => {
                this.watchlist = watchlist.filter(
                    x => {
                        let shouldShow: boolean;
                        if (longShortFlag == 0) {
                            shouldShow = true
                        } else if (x['long_short'] == longShortFlag) {
                            shouldShow = true;

                        } else {
                            shouldShow = false;
                        }
                        shouldShow = shouldShow && (x['valid'] == showValid);
                        return shouldShow;
                    }).sort(this.sortFunc);
                this.update();
            },
            error: (err) => {
                this.watchListSubject.error(err);
            }
        });

        this.loading$ = this.watchlistService.loading$.asObservable();
    }

    sort(sortFunc: (a: WatchItem, b: WatchItem) => number): void {
        this.sortFunc = sortFunc;
        this.watchlist = this.watchlist.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.watchListSubject.next(
            this.watchlist);
    }

    invalidate(value: boolean): void {
        let selected_sids = this.watchlist.filter(
            (x) => x.selected).map((x) => x.security.securityID);
        this.watchlistService.invalidate(selected_sids, value);
    }
}
