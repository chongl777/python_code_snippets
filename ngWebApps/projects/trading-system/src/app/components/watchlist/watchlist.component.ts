import { Component, OnInit, OnDestroy, ViewChild, Input, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatRow } from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { of, interval, Subscription, Observable, merge, combineLatest } from "rxjs";
import { takeWhile, scan, map, tap, startWith, endWith, timeout, debounceTime, switchMap } from "rxjs/operators";
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';

import * as commons from '@app/models/commons';

import { SecurityService } from '@app/services/security.service';
import { PortfolioService, PortfolioGroupDataService } from '@app/services/portfolio.service';
import { MarketDataService } from '@app/services/market-data.service';
import { WatchlistService, WatchlistDataService, WatchItem } from '@app/services/watchlist.service';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '../../animations/app.animations';

import { Order, Side } from '@app/models/order';
import { _Component } from '@app/models/component';
import { Security } from '../../models/security';
import { MarketData } from '../../models/marketData';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { OrdersComponent } from '../orders/orders.component';
import { SecurityDataObject } from '@app/models/securityDataObject';
import { EventService } from '@app/services/event.service';
import { FormControl } from '@angular/forms';
import { FundsDataService, FundsService } from '@app/services/funds.service';
import { Fund } from '@app/models/fund';


@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.scss'],
    animations: [
        ExpandedAnimation(),
        ShowAnimation(),
        SlideInOutAnimation(),
    ],
})
export class WatchlistComponent extends _Component implements OnInit, OnDestroy {

    dataSource: TableVirtualScrollDataSource<WatchItem>;

    columnsToDisplayLong: string[] = [
        'Selected', 'Security', 'TradingRnkTotal', 'Event',
        'EMC', 'RVS2', 'EMCST', 'ERH', 'LR', 'LR_S', 'LR_S_SW', 'FA',
        'Price', 'EqRet', 'ModifiedDur', 'YTM', 'YTW', 'YTF', 'Rating', 'MarketSeg', 'LiqScore',
        'CurrentQty', 'CurrentQtyD', 'Outstanding', 'Sector', 'Subsector'];
    columnsToDisplayShort: string[] = [
        'Selected', 'Security', 'TradingRnkTotal', 'Event',
        'EMC', 'RVS2', 'EMCST', 'ERH', 'LR', 'LR_S', 'LR_S_SW', 'FA',
        'Price', 'EqRet', 'ModifiedDur', 'YTM', 'YTW', 'YTF', 'Rating', 'MarketSeg', 'LiqScore',
        'CurrentQty', 'CurrentQtyD', 'Outstanding', 'ShortInfo', 'Sector', 'Subsector'];
    // columnsToDisplayheader: string[] = [
    //     'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty',
    //     'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty'];

    columnsToDisplay: string[];
    selectedWatchItem?: WatchItem;
    wlDataService: WatchlistDataService;
    errMsg: string = '';
    wl_date: Date;
    filterControl = new FormControl();

    @ViewChild(MatSort, { static: true }) sort: MatSort;

    @Input() longShort: 1 | -1 | 0;
    @Input() showValid: true | false;

    loading$: Observable<boolean>;
    subscription = new Subscription();
    public pfDataService: PortfolioGroupDataService;
    private _selectFunds: Fund[];

    get selectedFunds(): Fund[] {
        return this._selectFunds;
    };

    set selectedFunds(val: Fund[]) {
        this._selectFunds = val;
        this.pfDataService.setFilterFunds(val);
    }

    constructor(
        private securityService: SecurityService,
        public watchlistService: WatchlistService,
        public marketDataService: MarketDataService,
        public matDialog: MatDialog,
        public portfolioService: PortfolioService,
        public fundService: FundsService,
        private eventService: EventService,
        private _cdr: ChangeDetectorRef,
    ) {
        super();
        this.pfDataService = new PortfolioGroupDataService(
            this.portfolioService, ['deal'], 0);

        //this._cdr.detach();
        this.loading$ = combineLatest([
            this.watchlistService.loading$,
            this.marketDataService.loading$,
            this.securityService.loading$,
            this.fundService.loading$
        ]).pipe(
            map(([wl_loading, mkt_loading, sec_loading, fund_loading]) => {
                if (!fund_loading) {
                    this.selectedFunds = this.fundService.funds$.getValue();
                }
                return wl_loading || sec_loading || mkt_loading || fund_loading;
            }),
            startWith(true),
        );

        this.subscription.add(this.filterControl.valueChanges
            .pipe(
                debounceTime(400),
                //map(value => this._filter(value).slice(0, 10)),  // equivalent
                switchMap(value => of(value)),
            ).subscribe((filter: string) => {
                this.dataSource.filter = filter.trim().toLowerCase();
            }));
    }

    ngOnInit(): void {
        this.columnsToDisplay = this.longShort == 1 ? this.columnsToDisplayLong : this.columnsToDisplayShort;
        this.wlDataService = new WatchlistDataService(this.watchlistService, this.longShort, this.showValid);
        this.dataSource = new TableVirtualScrollDataSource<WatchItem>();
        this.dataSource.sort = this.sort;

        this.dataSource.filterPredicate = (data: WatchItem, filter: string) => {
            let security = data.security;
            const dataStr = [
                security.deal, security.description,
                security.industry_level_1, security.industry_level_2,
            ].join('◬').trim().toLowerCase();
            const transformedFilter = filter.trim().toLowerCase();
            return dataStr.indexOf(transformedFilter) != -1;
        };

        this.subscription.add(this.wlDataService.watchListSubject.subscribe({
            next: (watchlist: any) => {
                this.dataSource.data = watchlist;
                this.wl_date = watchlist.length == 0 ? null : watchlist[0].t_date;
                // this._cdr.detectChanges();
                //this.dataSource = new TableVirtualScrollDataSource<WatchItem>(watchlist);
                // setTimeout(() => this._cdr.detectChanges(), 1000);
            },
            error: (error: Error) => {
                this.errMsg = commons.errMsg(error);
            }
        }));

        this.subscription.add(this.loading$.subscribe({
            next: (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this._cdr.reattach();
                    this.sortData('TradingRnkTotal', 1);
                    this._cdr.detectChanges();
                } else {
                    this._cdr.detach();
                }
            },
            error: (error: Error) => {
                this.errMsg = commons.errMsg(error);
                this.subscription.unsubscribe();
                this._cdr.detectChanges();
            }
        }));

        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    onSelectedWatchItem(wi: WatchItem): void {
        // wi.selected = !wl.selected;
    }

    SecDetailBeingDestroyed(): void {
        this.selectedWatchItem = null;
    }

    onSelectSecurity(security: Security) {
        this.eventService.selectSecurity$.emit(security);
    }

    onExpandWatchItem(wi: WatchItem, _elScroll: CdkVirtualScrollViewport, el: HTMLElement): void {
        this.selectedWatchItem = this.selectedWatchItem ? null : wi;
    }

    sortData(field: string, flag: -1 | 1): void {
        this.wlDataService.sort(
            (a: WatchItem, b: WatchItem): number => {
                switch (field) {
                    case 'Category':
                        return flag * (a.category || "").localeCompare(b.category || "");
                    case 'Selected':
                        return flag * ((+a.selected) - (+b.selected));
                    case 'CurrentQty':
                        return flag * (
                            this.portfolioService.getQuantity(a.security.securityID, this.selectedFunds) -
                            this.portfolioService.getQuantity(b.security.securityID, this.selectedFunds));
                    case 'CurrentQtyD':
                        return flag * (
                            this.pfDataService.getQuantity(a.security.deal) -
                            this.pfDataService.getQuantity(b.security.deal));
                    default:
                        return flag * WatchItem.compare(a, b, field);
                }
            });
    }

    openTradeDialog(close_pos = false) {

        const dialogConfig = new MatDialogConfig<Order[]>();
        let self = this;
        // The user can't close the dialog by clicking outside its body
        dialogConfig.disableClose = false;
        dialogConfig.id = "modal-component";
        dialogConfig.height = "400px";
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = true;
        if (close_pos) {
            dialogConfig.data = this.wlDataService.watchlist.filter(
                (x: WatchItem) => x.selected && (
                    self.portfolioService.getPosition(
                        x.security.securityID).quantity != 0))
                .map((x) => new Order(
                    x.security,
                    self.portfolioService.getPosition(x.security.securityID).quantity * -1,
                    x.price,
                    '1', // price type
                    null, // settle date
                    null, // ioiid
                    '1', // order type
                    null,
                ));
        } else {
            let quantity = 1000000 * this.longShort;
            dialogConfig.data = this.wlDataService.watchlist.filter(
                (x: WatchItem) => x.selected).map((x) => new Order(
                    x.security, quantity, x.price,
                    '1', // price type
                    null, // settle date
                    null, // ioiid
                    '1', // order type
                    this.longShort == 1 ? Side.Buy : Side.Sell, // order side
                ));
        }
        // https://material.angular.io/components/dialog/overview
        const modalDialog = this.matDialog.open(OrdersComponent, dialogConfig);
        modalDialog.beforeClosed().subscribe((success: boolean) => {
            if (success) {
                this.wlDataService.allSelected = false;
            }
        })
    }

    data(): any {
        let data = [];
        this.dataSource.data.forEach((order: WatchItem) => {
            let datum = order.to_data();
            data = Array.prototype.concat(data, datum)
        });
        return data;
    }
}
