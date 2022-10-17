import { Component, OnInit, OnDestroy, ViewChild, Input, ChangeDetectorRef, ContentChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { interval, Subscription, Observable, merge } from "rxjs";
import { debounceTime, map, startWith } from "rxjs/operators";

import { Transaction, GroupTransaction, GenericTransaction } from '@app/models/transaction';
import { SecurityService } from '@app/services/security.service';
import { PortfolioService, PortfolioGroupDataService, TransactionDataService } from '@app/services/portfolio.service';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';
import { EventService } from '@app/services/event.service';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { MarketDataService } from '@app/services/market-data.service';


@Component({
    selector: 'app-trading-records',
    templateUrl: './trading-records.component.html',
    styleUrls: ['./trading-records.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class TradingRecordsComponent implements OnInit, OnDestroy {
    dataSource: MatTableDataSource<Transaction>;
    transactions: Transaction[];
    // columnsToDisplay: string[] = [
    //     'Side', 'TradeId', 'TradeDt', 'Security', 'Event', 'Sector', 'Quantity',
    //     'TxnPrice', 'Price', 'TxnPnL', 'AccruedInt', 'AccruedDt',
    //     'CurrentQty', 'CurrentQtyD',
    // ];

    columnsToDisplay: string[] = [
        'Side', 'TradeId', 'TradeDt',
        'Security',
        'Event',
        'Sector', 'Quantity',
        'TxnPrice', 'Price', 'TxnPnL', 'AccruedInt', 'AccruedDt',
        'CurrentQty', 'CurrentQtyD',
    ];
    errMsg: string = '';

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ContentChild('TxnSecurityDetail') secDetailsTemplate: TemplateRef<any>;
    // @Input() secDetailSize = 'small';

    transactionDataService: TransactionDataService;
    portfolioGrpService: PortfolioGroupDataService;
    loading$: Observable<boolean>;
    subscription = new Subscription();
    selectedTransaction: Transaction;
    cachedValues: CacheableObject;
    @Input() cookieKey = 'pf-transaction';
    @Input() secDetailSize = 'xlarge';

    constructor(
        private securityService: SecurityService,
        public portfolioService: PortfolioService,
        private eventService: EventService,
        private cacheValuesService: CacheValuesService,
        private marketDataService: MarketDataService,
        private _cdr: ChangeDetectorRef,
    ) {
        this._cdr.detach();
        this.transactionDataService = new TransactionDataService(this.portfolioService);
        this.portfolioGrpService = new PortfolioGroupDataService(
            this.portfolioService, ['deal'], 0);

        this.loading$ = merge(
            this.portfolioService.loading$,
            this.securityService.loading$).pipe(
                map(() => {
                    let pf_loading = this.portfolioService.loading$.getValue();
                    let sec_loading = this.securityService.loading$.getValue();
                    return pf_loading || sec_loading;
                }),
                startWith(true),
            );
    }

    ngOnInit(): void {
        this.dataSource = new MatTableDataSource<Transaction>();
        this.dataSource.sort = this.sort;
        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

        this.subscription.add(this.loading$.subscribe(
            (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this._cdr.reattach();
                    this.sortData('TradeDt', 1);
                } else {
                    // this._cdr.detach();
                }
                this._cdr.detectChanges();
            }
        ));

        this.subscription.add(this.transactionDataService.transactions$.subscribe({
            next: (transactions: any) => {
                this.transactions = transactions;
                this.dataSource.data = this.groupby(transactions, ['Side']);
                // this.dataSource.sort()
                // this.dataSource.dataToRender$.next(positions);
                // this.dataSource = new TableVirtualScrollDataSource<Position>(positions);
                this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        }));

        this.subscription.add(this.marketDataService.marketDataUpdate$
            .pipe(debounceTime(100))
            .subscribe({
                next: () => {
                    this._cdr.detectChanges()
                }
            }));
    }

    ngAfterViewInit(): void {
        this.cachedValues = this.cacheValuesService.createCachable(
            this.cookieKey, ['group_by']);
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    groupby(transactions: GenericTransaction[], groupBy: string[]) {
        let res = new Map<string, GenericTransaction[]>();

        let groupField = groupBy[0]
        groupBy = groupBy.slice(1);
        for (let sec of transactions) {
            let groupValue = sec[groupField];
            if (res.has(groupValue)) {
                res.get(groupValue).push(sec);
            } else {
                res.set(groupValue, [sec]);
            }
        }

        let res2 = [];
        for (let [key, txns] of res) {
            let gSec = new GroupTransaction(key);
            gSec.expanded = true;
            if (groupBy.length == 0) {
                gSec.children = txns;
            } else {
                gSec.children = this.groupby(txns, groupBy);
            }
            res2.push(gSec);
        }

        return res2;
    }

    sortData(field: string, flag: -1 | 1): void {
        this.transactionDataService.sort(
            (a: Transaction, b: Transaction): number => {
                switch (field) {
                    case 'TradeId':
                        return flag * (a.tradeId || "").localeCompare(b.tradeId || "");
                    case 'Side':
                        return flag * (a.quantity - b.quantity);
                    case 'Security':
                        return flag * (a.security.description || "").localeCompare(b.security.description || "");
                    case 'Price':
                        return flag * (a.price - b.price);
                    case 'Quantity':
                        return flag * (a.quantity - b.quantity);
                    case 'TxnPnL':
                        return flag * (a.txn_pnl - b.txn_pnl);
                    case 'TradeDt':
                        return flag * (a.dt.getTime() - b.dt.getTime());
                    case 'Sector':
                        return flag * (a.security.industry_level_1 || "").localeCompare(b.security.industry_level_1 || "");
                    case 'Subsector':
                        return flag * (a.security.industry_level_2 || "").localeCompare(b.security.industry_level_2 || "");
                }
                return 0;
            }
        );
    }

    onSelectTrade(txn: GenericTransaction): void {
        if (txn.level > 0) {
            return null
        }
        txn.expanded = !txn.expanded;
        this.eventService.selectedTransaction$.next(txn as any);
        this._cdr.detectChanges();
    }

    data(): any {
        let data = [];
        this.dataSource.data.forEach((pos: Transaction) => {
            let datum = pos.to_data();
            data = Array.prototype.concat(data, datum)
        });
        return data;
    }

    rowAnimation(txn: Transaction): string {
        return txn == this.selectedTransaction ? 'expanded' : 'collapsed';
    }

}
