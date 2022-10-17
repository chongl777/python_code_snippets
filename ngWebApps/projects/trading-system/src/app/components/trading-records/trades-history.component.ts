import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MsgControllerService } from '@app/services/msg-controller.service';
import { combineLatest, merge, Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs'
import { SecurityService } from '@app/services/security.service';
import { TradeTicket } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';
import { DialogWindowComponent } from '@app/components/dialog-window/dialog-window.component';
import { MatDialog } from '@angular/material/dialog';
import { utils } from 'shared-library';

import { NullSecurity } from '@app/models/security';
import { Transaction, GenericTransaction, GroupTransaction } from '@app/models/transaction';

import { FormControl, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import * as commons from '@app/models/commons';
import { PortfolioGroupDataService, PortfolioService, TransactionHistoryService } from '@app/services/portfolio.service';
import { MarketDataService } from '@app/services/market-data.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpControllerService } from '@app/services/http-controller.service';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { SecurityDataObject } from '@app/models/securityDataObject';

import { SettingComponent } from './setting.component';


@Component({
    selector: 'app-trades-history',
    templateUrl: './trades-history.component.html',
    styleUrls: ['./trades-history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    // providers: [TradeTicketsService, ]
})
export class TradesHisotryComponent implements OnInit {

    dataSource: MatTableDataSource<Transaction>;
    loading$: Observable<boolean>;
    subscription = new Subscription();
    errMsg: string = '';
    selectedTransaction: Transaction;
    private groupBy: string[];
    private initialExpansion: number;

    dateRange: FormGroup;
    transactions: Transaction[];
    columnsToDisplay: string[] = [
        'Side', 'TradeId', 'TradeDt', 'TransType', 'Security',
        'Event', 'Sector', 'Quantity', 'ModifiedDur', 'TxnPrice', 'Price',
        'PriceDt', 'TxnPnL', 'AccruedInt', 'AccruedDt', 'CurrentQty',
        'CurrentQtyD',
    ];
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ContentChild('TxnSecurityDetail') secDetailsTemplate: TemplateRef<any>;

    transactionDataService: TransactionHistoryService;
    portfolioGrpService: PortfolioGroupDataService;
    cachedValues: CacheableObject;
    @Input() cookieKey = 'pf-transaction-history';
    @Input() secDetailSize = 'xlarge';

    public availableGroupOptions = [
        'total', 'Side', 'Security', 'TradeDt', 'transTypeStr', 'rtg_group', 'durGroup'];

    constructor(
        private securityService: SecurityService,
        private marketDataService: MarketDataService,
        private httpService: HttpControllerService,
        public portfolioService: PortfolioService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
        private eventService: EventService,
        private cacheValuesService: CacheValuesService,
    ) {

        this.dateRange = new FormGroup({
            start: new FormControl(new Date()),
            end: new FormControl(new Date()),
        });

        this.transactionDataService = new TransactionHistoryService(httpService, securityService);
        this.portfolioGrpService = new PortfolioGroupDataService(
            this.portfolioService, ['deal'], 0);

        this.loading$ = combineLatest(
            [this.transactionDataService.loading$,
            this.securityService.loading$]).pipe(
                map(([tkt_loading, sec_loading]) => {
                    return tkt_loading || sec_loading;
                }),
                startWith(true),
            );
    }

    ngOnInit(): void {
        this.dataSource = new MatTableDataSource<Transaction>();
        this.dataSource.sort = this.sort;
    }

    ngAfterViewInit(): void {
        //this._cdr.reattach();
        this.cachedValues = this.cacheValuesService.createCachable(
            this.cookieKey, ['group_by', 'initial_expanded_level']);
        this.validateCache();
        this.groupBy = this.cachedValues['group_by'];
        this.initialExpansion = this.cachedValues['initial_expanded_level'];

        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);

            this.update();
        }));

        this.subscription.add(this.marketDataService.marketDataUpdate$
            .pipe(debounceTime(100))
            .subscribe({
                next: () => {
                    this._cdr.detectChanges()
                }
            }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();

    }

    onSelect(transaction: TradeTicket, event: any): void {
        this.eventService.selectedTradeTicket$.next(transaction);
        this.eventService.selectSecurity$.next(transaction.security);
        event.stopPropagation();
    }

    OpenSettingDialog() {
        let sub = DialogWindowComponent.OpenSetting(
            this.matDialog, SettingComponent,
            {
                groupBy: this.groupBy,
                availableOptions: this.availableGroupOptions,
                initialExpansion: this.initialExpansion,
            }).subscribe((data) => {
                this.updateSetting(data);
                sub.unsubscribe();
            });
        this.subscription.add(sub)
    }

    updateSetting(data: any): void {
        if (data == null) {
            return;
        }
        this.cachedValues.save_from(data);
        this.validateCache();
        this.groupBy = this.cachedValues['group_by'];
        this.initialExpansion = this.cachedValues['initial_expanded_level'];
        this.transactionDataService.loading$.next(true);

        setTimeout(() => {
            try {
                this.update();
                this.errMsg = '';
            } catch (err: any) {
                this.errMsg = utils.errMsg(err);
            } finally {
                this.transactionDataService.loading$.next(false);
            }
        }, 0);
    }

    update(): void {
        this.transactions.forEach(x => x.expanded = false);
        let txnGrp = this.groupby(this.transactions, this.groupBy);
        this.setExpansion(txnGrp, this.initialExpansion);
        this.dataSource.data = txnGrp;
    }

    validateCache(): void {
        if (
            (this.cachedValues['group_by'] == null) ||
            (this.cachedValues['group_by'].length == null) ||
            (this.cachedValues['group_by'].length == 0)
        ) {
            this.cachedValues['group_by'] = ['total', 'TransTypeStr', 'Side'];
        };
        let group_by = this.cachedValues['group_by'];
        if (!this.availableGroupOptions.includes(group_by[0])) {
            group_by[0] = 'total';
        }
        for (let i in group_by) {
            if (!this.availableGroupOptions.includes(group_by[i])) {
                group_by[i] = null;
            }
        }
        this.cachedValues['group_by'] = group_by.filter((x: string) => x != null);
        // this.cachedValues['group_by'][0] = 'total';
        let initExp = this.cachedValues['initial_expanded_level'];
        initExp = Math.round(initExp) || 2;
        this.cachedValues['initial_expanded_level'] = initExp;

        this.cachedValues['sort'] = this.cachedValues['sort'] || ['tradeID', 1];
        if (this.cachedValues['sort'].length != 2) {
            this.cachedValues['sort'] = ['TradeId', 1];
            if (!this.columnsToDisplay.includes(this.cachedValues['sort'][0])) {
                this.cachedValues['sort'][0] = 'TradeId';
            }
            if (![1, -1].includes(this.cachedValues['sort'][1])) {
                this.cachedValues['sort'][1] = 1;
            }
        }
    }

    sortData(field: string, flag: -1 | 1): void {
        this.transactions.sort(
            (a: Transaction, b: Transaction): number => {
                switch (field) {
                    case 'TradeId':
                        return flag * (a.tradeId || "").localeCompare(b.tradeId || "");
                    case 'Side':
                        return flag * (a.quantity - b.quantity);
                    case 'TransType':
                        return flag * (a.transType - b.transType);
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
                    default:
                        return flag * SecurityDataObject.compare(a, b, field);
                }
            }
        );
    }

    setExpansion(txnGrp: GenericTransaction[], level: number): void {
        if (level > 0) {
            for (let txn of txnGrp) {
                txn.expanded = true;
                if ((level > 0) && txn['children']) {
                    this.setExpansion(txn['children'], level - 1);
                }
            }
        }
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
            gSec.expanded = false;
            if (groupBy.length == 0) {
                gSec.children = txns;
            } else {
                gSec.children = this.groupby(txns, groupBy);
            }
            res2.push(gSec);
        }
        return res2;
    }

    async refresh(): Promise<any> {
        try {
            this.errMsg = '';
            let range = this.dateRange.controls;
            this.transactions = await this.transactionDataService.loadTxnHistory(
                range.start.value, range.end.value);
            this.update();
        } catch (error) {
            console.error(error);
            this.errMsg = commons.errMsg(error);
        }
    }

    onSelectTrade(txn: GenericTransaction): void {
        txn.expanded = !txn.expanded;
    }

    emitTrade(txn: GenericTransaction): void {
        if (txn.level > 0) {
            return null
        }
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
