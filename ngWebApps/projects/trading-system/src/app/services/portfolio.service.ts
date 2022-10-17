import { Injectable } from '@angular/core';
import { SecurityService } from './security.service';
import { Observable, of, Subject, BehaviorSubject, Subscription, merge, throwError } from 'rxjs';
import { finalize, delay, take, timeout, switchMap, debounceTime, catchError, map } from 'rxjs/operators';

import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompState } from '@stomp/rx-stomp';

import { MsgControllerService } from './msg-controller.service';

import { Position, CashPosition, GenericPos, GroupedPosition } from '../models/position';
import { Transaction } from '../models/transaction';
import { Security } from '../models/security';
import { MsgClient } from '../models/msgClient';
import { MarketDataService } from './market-data.service';
import { Lot } from '@app/models/Lot';
import { FundsService } from './funds.service';
import { Fund } from '@app/models/fund';
import { HttpControllerService } from './http-controller.service';
// import { PositionClassFactory } from '../models/Position';


type PositionsMap = Record<any, Position>
type TransactionMap = Record<string, Transaction>


@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    public positions: PositionsMap = {};
    public transactions: TransactionMap = {};
    public positions$ = new BehaviorSubject<Position[]>([]);
    public transactions$ = new BehaviorSubject<Transaction[]>([]);
    public loading$ = new BehaviorSubject<boolean>(true);
    public ref_date: Date;
    public pos_date: Date;

    constructor(
        private msgController: MsgControllerService,
        private securityService: SecurityService,
        private fundsService: FundsService,
        // private positionFactory: PositionClassFactory,
    ) {

        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.loadAllPositions();
            }
        });

        this.subscribePortfolioUpdate();
    }

    update(): void {
        if (this.loading$.getValue()) {
            return
        }
        this.positions$.next(
            Object.values(this.positions));
        this.transactions$.next(
            Object.values(this.transactions));
    }

    getPosition(securityID: number) {
        return this.positions[securityID] || { quantity: 0 };
    }

    getQuantity(securityID: number, filterFunds: Fund[]): number {
        let pos = this.positions[securityID];
        if (!pos) {
            return 0;
        }
        let filtered_pos = Object.values(pos.lots).filter(
            (lot: Lot) => filterFunds.includes(lot.fund));

        return filtered_pos.reduce<number>(
            (a: number, b: Lot) => {
                return a + b.quantity;
            }, 0);
    }

    private async process_lot(json: any): Promise<any> {
        let securityID = parseInt(json.security_id)
        try {

            let security = await this.securityService.getSecurity(securityID);
            if (security.secType == 'Currency') {
                if (!(security.currency in this.positions)) {
                    this.positions[security.currency] = new CashPosition(security.currency);
                }
                await this.positions[security.currency].deserialize(json, this.securityService, this.fundsService);
            } else {
                if (!(securityID in this.positions)) {
                    this.positions[securityID] = new Position(security);
                }
                await this.positions[securityID].deserialize(json, this.securityService, this.fundsService);
            }
        } catch (err) {
            console.error('error in process_lot, json:', json, ', error:', err);
        }
    }

    private async process_txn(json: any): Promise<any> {
        try {
            let tradeId = parseInt(json.tradeId)

            if (!(tradeId in this.transactions)) {
                let security = await this.securityService.getSecurity(json.security['sid']);
                this.transactions[tradeId] = Transaction.deserialize(
                    json, security);
            }
        } catch (err) {
            console.error('error in process_txn, json:', json, ', error:', err);
        }
    }

    async reloadAllPositions(): Promise<any> {
        return this.msgController.portfolioReload$.toPromise<any>();
    }

    async loadAllPositions(): Promise<any> {
        console.log('load all positions...');
        this.loading$.next(true);
        let response = {
            'lot': [],
            'txn': [],
        }
        let sub$ = this.msgController.portfolioLoad$
            .pipe(finalize(() => {
                // this.loading$.next(false);
                sub$.unsubscribe();
            }))
            .subscribe({
                next: (responseMsg: any[]) => {
                    // i++; console.log(i);
                    for (let resp of responseMsg) {
                        if (resp['type'] == 'lot') {
                            response['lot'].push(resp);
                        } else if (resp['type'] == 'txn') {
                            response['txn'].push(resp);
                        } else if (resp['type'] == 'pos_date') {
                            this.pos_date = new Date(resp['content'])
                        } else if (resp['type'] == 'ref_date') {
                            this.ref_date = new Date(resp['content'])
                        }
                    }
                },
                error: (error: Error) => {
                    error.message = 'PortfolioService: ' + error.message;
                    console.error('load all positions failed');
                    console.error(error);
                    this.positions$.error(error);
                    this.loading$.next(false);
                    this.loading$.error(error);
                },
                complete: async () => {
                    console.log('load all positions done! start processing');
                    for (let resp of response['lot']) {
                        try {
                            await this.process_lot(resp['content']);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    for (let resp of response['txn']) {
                        try {
                            await this.process_txn(resp['content']);
                        } catch (err) {
                            console.error(err);
                        }
                    }

                    this.loading$.next(false);
                    this.update();
                    console.log('process all positions done!');
                }
            });
    }

    private async subscribePortfolioUpdate(): Promise<any> {
        this.msgController.portfolioUpdate$.subscribe({
            next: async (responseMsg: any[]) => {
                this.positions = {};
                this.transactions = {};
                this.update();
                this.loading$.next(true);
                for (let resp of responseMsg) {
                    if (resp['type'] == 'lot') {
                        await this.process_lot(resp['content']);
                    } else if (resp['type'] == 'txn') {
                        await this.process_txn(resp['content']);
                    } else if (resp['type'] == 'pos_date') {
                        this.pos_date = new Date(resp['content'])
                    } else if (resp['type'] == 'ref_date') {
                        this.ref_date = new Date(resp['content'])
                    }
                }
                setTimeout(() => {
                    this.loading$.next(false);
                    this.update();
                }, 0);
            },
            error: (error: Error) => console.error(error),
        });
    }
}


export class PortfolioDataService {
    public positions$ = new BehaviorSubject<Position[]>([]);
    private sortFunc: (a: Position, b: Position) => number = (a: Position, b: Position) => 0;
    public positions: Position[];
    public loading$: BehaviorSubject<boolean>;
    public ref_date: Date;
    public pos_date: Date;

    constructor(
        private portfolioService: PortfolioService,
    ) {
        this.portfolioService.positions$.subscribe({
            next: (positions: Position[]) => {
                this.ref_date = this.portfolioService.ref_date;
                this.pos_date = this.portfolioService.pos_date;
                this.positions = positions.filter(
                    (pos: Position) => {
                        return !(pos.quantity == 0) || !(pos.period_realized_pnl == 0);
                    });
                this.update();
            },
            error: (err) => {
                this.positions$.error(err);
            }
        });

        this.loading$ = this.portfolioService.loading$;
    }

    sort(sortFunc: (a: Position, b: Position) => number): void {
        this.sortFunc = sortFunc;
        //this.positions = this.positions.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.positions = this.positions.sort(this.sortFunc);
        this.positions$.next(this.positions);
    }

    get totalPnl(): number {
        // console.log('totalPnl');
        return this.positions.reduce<number>(
            (a: number, b: Position) => {
                return a + b.pnl;
            }, 0);
    }

    get totalQuantity(): number {
        return this.positions.reduce<number>(
            (a: number, b: Position) => {
                return a + b.quantity;
            }, 0);
    }

    get anySelected(): boolean {
        for (let x of this.positions) {
            if (x.selected) {
                return true;
            }
        }
        return false;
    }

    get allSelected(): boolean {
        for (let x of this.positions) {
            if (!x.selected) {
                return false;
            }
        }
        return true;
    }

    set allSelected(val) {
        for (let x of this.positions) {
            x.selected = val;
        }
    }
}


export class PortfolioGroupDataService {
    public positions$ = new BehaviorSubject<GenericPos[]>([]);
    private sortFunc: (a: GenericPos, b: GenericPos) => number = (a: GenericPos, b: GenericPos) => 0;
    public groupedPositions: GenericPos[];
    // public _positions: Position[];
    public _lots: Lot[];
    public loading$: BehaviorSubject<boolean>;
    public ref_date: Date;
    public pos_date: Date;
    public filterFunds: Fund[] = null;
    public setFilterFunds(filterFunds: Fund[]) {
        this.filterFunds = filterFunds;
        this.portfolioService.update();
    }

    constructor(
        private portfolioService: PortfolioService,
        public groupBy: string[],
        public initialExpansion: number,
        private filter?: (lot: Lot) => boolean,
    ) {
        this.filter = this.filter || ((lot: Lot) => true);
        this.portfolioService.positions$.subscribe({
            next: (positions: Position[]) => {
                this.ref_date = this.portfolioService.ref_date;
                this.pos_date = this.portfolioService.pos_date;

                let ans = positions.map((x) => x.children);
                if (ans.length == 0) {
                    this._lots = [];
                } else {
                    this._lots = positions.map((x) => x.children).reduce((a, b) => a.concat(b)).filter(
                        (lot: Lot) => {
                            if (this.filterFunds == null) {
                                return !(lot.quantity == 0) || !(lot.period_realized_pnl == 0);
                            } else {
                                return (!(lot.quantity == 0) || !(lot.period_realized_pnl == 0))
                                    && this.filterFunds.includes(lot.fund);
                            }
                        });
                }
                // this._positions = posFiltered;
                this.groupedPositions = this.groupby(
                    this._lots.filter(this.filter), groupBy);
                this.setExpansion(this.groupedPositions, initialExpansion);
                this.update();

                // this.marketDataUpdateSubscription.add(
                //     merge(...this._positions.map(x => x.update$))
                //         .pipe(debounceTime(1)).subscribe(() => {
                //             this.marketDataUpdate$.next();
                //         }));
                // this.updateSetting(groupBy, initialExpansion);
            },
            error: (err) => {
                this.positions$.error(err);
            }
        });

        this.loading$ = this.portfolioService.loading$;
    }

    updateSetting(
        groupBy: string[], initialExpansion: number
    ) {
        let lots = this._lots.filter(this.filter);
        this.groupedPositions = this.groupby(lots, groupBy);
        this.setExpansion(this.groupedPositions, initialExpansion);
        this.update();
    }

    setExpansion(positions: GenericPos[], level: number): void {
        if (level > 0) {
            for (let pos of positions) {
                if (pos.pos_name == 'Cash') {
                    pos.expanded = false;
                } else {
                    pos.expanded = true;
                    if ((level > 0) && pos['children']) {
                        this.setExpansion(pos['children'], level - 1);
                    }
                }
            }
        }
    }

    groupby(positions: GenericPos[], groupBy: string[]): GenericPos[] {

        let res = new Map<string, GenericPos[]>();

        let groupField = groupBy[0]
        groupBy = groupBy.slice(1);
        for (let pos of positions) {
            let groupValue = pos[groupField];
            if (res.has(groupValue)) {
                res.get(groupValue).push(pos);
            } else {
                res.set(groupValue, [pos]);
            }
        }

        let res2 = [];
        for (let [key, positions] of res) {
            let gPos = new GroupedPosition(key);
            if (groupBy.length == 0) {
                gPos.children = positions;
            } else {
                gPos.children = this.groupby(positions, groupBy);
            }
            res2.push(gPos);
        }

        return res2;
    }

    sort(sortFunc: (a: GenericPos, b: GenericPos) => number): void {
        this.sortFunc = sortFunc;
        //this.positions = this.positions.sort(this.sortFunc);
        this.update();
    }

    sortItems(items: GenericPos[], sortFunc: (a: GenericPos, b: GenericPos) => number): void {
        items.sort(sortFunc);
        for (let item of items) {
            if (item['children']) {
                this.sortItems(item['children'], sortFunc);
            }
        }
    }

    update(): void {
        this.sortItems(this.groupedPositions, this.sortFunc);
        this.positions$.next(this.groupedPositions);
    }

    get totalPnl(): number {
        // console.log('totalPnl');
        return this._lots.reduce<number>(
            (a: number, b: Lot) => {
                return a + b.pnl;
            }, 0);
    }

    get totalQuantity(): number {
        return this._lots.reduce<number>(
            (a: number, b: Lot) => {
                return a + b.quantity;
            }, 0);
    }

    get anySelected(): boolean {
        for (let x of this._lots) {
            if (x.selected) {
                return true;
            }
        }
        return false;
    }

    get allSelected(): boolean {
        for (let x of this._lots) {
            if (!x.selected) {
                return false;
            }
        }
        return true;
    }

    set allSelected(val) {
        for (let x of this._lots) {
            x.selected = val;
        }
    }

    getPosition(name: string) {
        let ans = this.groupedPositions.filter((x) => x.pos_name == name);
        if (ans.length > 0) {
            return ans[0];
        }
        return null;
    }

    getQuantity(name: string): number {
        let ans = this.groupedPositions.filter((x) => x.pos_name == name);
        if (ans.length > 0) {
            return ans[0].quantity;
        }
        return 0;
    }
}


export class TransactionDataService {
    public transactions$ = new BehaviorSubject<Transaction[]>([]);
    private sortFunc: (a: Transaction, b: Transaction) => number = (a: Transaction, b: Transaction) => 0;
    public transactions: Transaction[];
    public loading$: BehaviorSubject<boolean>;
    public loadingTxnHistory$ = new BehaviorSubject<boolean>(false);

    constructor(
        private portfolioService: PortfolioService,
    ) {
        this.portfolioService.transactions$.subscribe({
            next: (transactions: Transaction[]) => {
                this.transactions = transactions;
                this.update();
            },
            error: (err) => {
                this.transactions$.error(err);
            }
        });

        this.loading$ = this.portfolioService.loading$;
    }

    sort(sortFunc: (a: Transaction, b: Transaction) => number): void {
        this.sortFunc = sortFunc;
        //this.positions = this.positions.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.transactions = this.transactions.sort(this.sortFunc);
        this.transactions$.next(this.transactions);
    }
}


export class TransactionHistoryService {
    public transactions: Transaction[];
    public loading$: BehaviorSubject<boolean>;

    constructor(
        private httpService: HttpControllerService,
        private securityService: SecurityService,
    ) {
        this.loading$ = new BehaviorSubject<boolean>(false);
    }

    public async loadTxnHistory(start: Date, end: Date): Promise<any> {
        this.loading$.next(true);

        return this.httpService.loadTransactions$(start, end)
            .pipe(
                catchError((error) => {
                    this.loading$.next(false);
                    return throwError(error);
                }),
                map(async (transactions: any[]) => {
                    try {
                        let txns = [];
                        for (let txn of transactions) {
                            txns.push(await this.processHistTxn(txn));
                        }
                        this.loading$.next(false);
                        return txns;
                    } catch (error) {
                        this.loading$.next(false);
                        throw error;
                    }
                })).toPromise();
    }

    private async processHistTxn(json: any): Promise<any> {
        try {
            let security = await this.securityService.getSecurity(json.SecurityID, null, 1);
            return Transaction.deserializeTkt(json, security);
        } catch (err) {
            console.error('error in process_txn, json:', json, ', error:', err);
            throw err;
        }
    }
}
