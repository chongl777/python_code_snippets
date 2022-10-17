import { Component, OnInit, OnDestroy, ViewChild, Input, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatRow } from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { of, interval, Subscription, Observable, merge } from "rxjs";
import { takeWhile, scan, map, tap, startWith, endWith, timeout, debounceTime, switchMap } from "rxjs/operators";
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';

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
        'Selected', 'Security', 'Event', 'EMC', 'RVS', 'ERH', 'LR', 'LR_S', 'LR_S_SW', 'FA',
        'Price', 'EqRet', 'ModifiedDur', 'YTM', 'YTW', 'YTF', 'Rating', 'MarketSeg', 'LiqScore',
        'CurrentQty', 'CurrentQtyD', 'Outstanding', 'Sector', 'Subsector'];
    columnsToDisplayShort: string[] = [
        'Selected', 'Security', 'Event', 'EMC', 'RVS', 'ERH', 'LR', 'LR_S', 'LR_S_SW', 'FA',
        'Price', 'EqRet', 'ModifiedDur', 'YTM', 'YTW', 'YTF', 'Rating', 'MarketSeg', 'LiqScore',
        'CurrentQty', 'CurrentQtyD', 'Outstanding', 'ShortInfo', 'Sector', 'Subsector'];
    columnsToDisplayheader: string[] = [
        'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty',
        'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty', 'Empty'];

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
    public dataService: PortfolioGroupDataService;

    constructor(
        private securityService: SecurityService,
        public watchlistService: WatchlistService,
        public marketDataService: MarketDataService,
        public matDialog: MatDialog,
        private portfolioService: PortfolioService,
        private eventService: EventService,
        private _cdr: ChangeDetectorRef,
    ) {
        super();
        this.dataService = new PortfolioGroupDataService(
            this.portfolioService, ['deal'], 0);

        //this._cdr.detach();
        this.loading$ = merge(
            this.watchlistService.loading$,
            this.marketDataService.loading$,
            this.securityService.loading$).pipe(
                map(() => {
                    let wl_loading = this.watchlistService.loading$.getValue();
                    let sec_loading = this.securityService.loading$.getValue();
                    let mktdata_loading = this.marketDataService.loading$.getValue();
                    return wl_loading || sec_loading || mktdata_loading;
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
        this.dataSource = new TableVirtualScrollDataSource<WatchItem>([]);
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
                this.errMsg = error.message;
            }
        }));

        this.subscription.add(this.loading$.subscribe(
            (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this._cdr.reattach();
                    this.sortData('Security', 1);
                    this._cdr.detectChanges();
                } else {
                    this._cdr.detach();
                }
            }
        ));

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
        /*
        let offset = this.selectedWatchItem ? -270 : 0;
        let elScroll = _elScroll.elementRef.nativeElement;
        let offsetAll = offset + new WebKitCSSMatrix(window.getComputedStyle(
            elScroll.querySelector('.cdk-virtual-scroll-content-wrapper')).transform).m42;

        if (this.selectedWatchItem) {
            const duration = 100;
            const _interval = 40;
            let beginTop = elScroll.scrollTop;
            let endTop = el.offsetTop + offsetAll - el.offsetHeight;

            // console.log('el.offsetTop', el.offsetTop, 'offet', offset, 'ScrollY', dd, 'beginTop', beginTop, 'endTop', endTop)
            const move = Math.abs((endTop - beginTop) * _interval / duration);
            interval(_interval).pipe(
                timeout(200),
                scan((acc, curr) => acc + move, elScroll.scrollTop),
                takeWhile(val => {
                    let offsetAll = new WebKitCSSMatrix(window.getComputedStyle(
                        elScroll.querySelector(
                            '.cdk-virtual-scroll-content-wrapper')).transform).m42;
                    endTop = el.offsetTop + offsetAll - el.offsetHeight;
                    return val < endTop;
                }, true),
                //endWith(endTop.value),
                tap((position) => {
                    elScroll.scrollTop = Math.min(position, endTop);
                }),
            ).subscribe();
        }
        */
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
                            this.portfolioService.getPosition(a.security.securityID).quantity -
                            this.portfolioService.getPosition(b.security.securityID).quantity);
                    case 'CurrentQtyD':
                        return flag * (
                            (this.dataService.getPosition(a.security.deal) || { quantity: 0 }).quantity -
                            (this.dataService.getPosition(b.security.deal) || { quantity: 0 }).quantity);
                    default:
                        return flag * SecurityDataObject.compare(a, b, field);
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
                    x.security.lastPrice,
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
                    x.security, quantity, x.security.lastPrice,
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
