import { Component, OnInit, OnDestroy, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { interval, Subscription, Observable, merge } from "rxjs";
import { map, startWith } from "rxjs/operators";

import { Transaction } from '@app/models/transaction';
import { SecurityService } from '@app/services/security.service';
import { PortfolioService, PortfolioGroupDataService, TransactionDataService } from '@app/services/portfolio.service';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';


@Component({
    selector: 'app-trading-records',
    templateUrl: './trading-records.component.html',
    styleUrls: ['./trading-records.component.scss'],
    animations: [
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class TradingRecordsComponent implements OnInit, OnDestroy {

    dataSource: MatTableDataSource<Transaction>;

    columnsToDisplay: string[] = [
        'Side', 'TradeId', 'TradeDt', 'Security', 'Event', 'Quantity', 'Price', 'AccruedInt', 'AccruedDt',
        'CurrentQty', 'CurrentQtyD',
    ];
    errMsg: string = '';

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @Input() secDetailSize = 'small';

    transactionDataService: TransactionDataService;
    portfolioGrpService: PortfolioGroupDataService;
    loading$: Observable<boolean>;
    subscription = new Subscription();
    selectedTransaction: Transaction;


    constructor(
        private securityService: SecurityService,
        private portfolioService: PortfolioService,
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
            }
        ));

        this.subscription.add(this.transactionDataService.transactions$.subscribe({
            next: (transactions: any) => {
                this.dataSource.data = transactions;
                // this.dataSource.sort()
                // this.dataSource.dataToRender$.next(positions);
                // this.dataSource = new TableVirtualScrollDataSource<Position>(positions);
                this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        }));
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();

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
                        return flag * (a.security.marketData.priceData.compositePrice -
                            b.security.marketData.priceData.compositePrice);
                    case 'Quantity':
                        return flag * (a.quantity - b.quantity);
                    case 'TradeDt':
                        return flag * (a.dt.getTime() - b.dt.getTime());
                    case 'Sector':
                        return flag * (a.security.industry_level_1 || "").localeCompare(b.security.industry_level_1 || "");
                    case 'Subsector':
                        return flag * (a.security.industry_level_2 || "").localeCompare(b.security.industry_level_2 || "");
                }
            }
        );
    }

    onSelectTrade(txn: Transaction): void {
        this.selectedTransaction = this.selectedTransaction ? null : txn;
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

}
