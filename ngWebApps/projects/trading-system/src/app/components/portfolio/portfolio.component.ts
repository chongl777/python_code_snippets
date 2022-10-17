import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { interval, Subscription, Observable, merge } from "rxjs";
import { map, startWith } from "rxjs/operators";

import * as commons from '@app/models/commons';

import { PortfolioService, PortfolioDataService } from '@app/services/portfolio.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SecurityService } from '@app/services/security.service';
import { Position } from '@app/models/position';
import { Order, Side } from '@app/models/order';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';
import { _Component } from '@app/models/component';
import { OrdersComponent } from '../orders/orders.component';
import { SecurityDataObject } from '@app/models/securityDataObject';
import { EventService } from '@app/services/event.service';
import { Security } from '@app/models/security';


@Component({
    selector: 'app-portfolio',
    templateUrl: './portfolio.component.html',
    styleUrls: ['./portfolio.component.scss'],
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class PortfolioComponent extends _Component implements OnInit, OnDestroy, AfterViewInit {

    public dataSource: TableVirtualScrollDataSource<Position>;
    public columnsToDisplay = [
        'Selected', 'Security', 'SID', 'Event', 'Sector', 'EMC', 'RVS2',
        'EMCST', 'ERH', 'LR', 'Quantity', 'Price', 'Change', 'CostBasis',
        'Pnl', 'LiqScore', 'MarketSeg'];
    public errMsg: string = '';
    public selectedPosition: Position;
    public dataService: PortfolioDataService;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    public loading$: Observable<boolean>;
    private subscription = new Subscription();

    constructor(
        public portfolioService: PortfolioService,
        private marketDataService: MarketDataService,
        private securityService: SecurityService,
        public matDialog: MatDialog,
        private eventService: EventService,
        private _cdr: ChangeDetectorRef,
    ) {
        super();
        this._cdr.detach();
        this.dataService = new PortfolioDataService(this.portfolioService);

        this.loading$ = merge(
            this.portfolioService.loading$,
            this.marketDataService.loading$,
            this.securityService.loading$).pipe(
                map(() => {
                    let pf_loading = this.portfolioService.loading$.getValue();
                    let mkt_loading = this.marketDataService.loading$.getValue();
                    let sec_loading = this.securityService.loading$.getValue();
                    // console.log('port', pf_loading, 'mkt', mkt_loading, 'sec_svc', sec_loading);
                    return pf_loading || sec_loading || mkt_loading;
                }),
                startWith(true),
            );
    }

    ngOnInit(): void {
        this.dataSource = new TableVirtualScrollDataSource<Position>();
        this.dataSource.sort = this.sort;
        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

        this.subscription.add(this.loading$.subscribe({
            next: (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this._cdr.reattach();
                    this.sortData('Security', 1);
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

        this.subscription.add(this.dataService.positions$.subscribe({
            next: (positions: any) => {
                this.dataSource.data = positions;
                // this.dataSource.dataToRender$.next(positions);
                // this.dataSource = new TableVirtualScrollDataSource<Position>(positions);
                // this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = error.message;
                this._cdr.detectChanges();
            }
        }));

    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    onSelectPosition(pos: Position, _elScroll: CdkVirtualScrollViewport, el: HTMLElement): void {
        this.selectedPosition = this.selectedPosition ? null : pos;
    }

    onSelectSecurity(security: Security) {
        this.eventService.selectSecurity$.emit(security);
    }

    SecDetailBeingDestroyed(): void {
        this.selectedPosition = null;
    }

    sortData(field: string, flag: -1 | 1): void {
        this.dataService.sort(
            (a: Position, b: Position): number => {
                switch (field) {
                    case 'Security':
                        return flag * (a.pos_name || "").localeCompare(b.pos_name || "");
                    case 'Quantity':
                        return flag * (a.quantity - b.quantity);
                    case 'CostBasis':
                        return flag * (a.costBasis - b.costBasis);
                    case 'Pnl':
                        return flag * (a.pnl - b.pnl);
                    default:
                        return flag * SecurityDataObject.compare(a, b, field);
                }
            }
        );
    }

    data(): any {
        let data = [];
        this.dataSource.data.forEach((pos: Position) => {
            let datum = pos.to_data();
            data = Array.prototype.concat(data, datum)
        });
        return data;
    }

    openTradeDialog(dir: -1 | 1) {
        const dialogConfig = new MatDialogConfig<Order[]>();
        let quantity = 500000;

        // The user can't close the dialog by clicking outside its body
        dialogConfig.disableClose = false;
        dialogConfig.id = "modal-component";
        dialogConfig.height = "400px";
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = true;
        dialogConfig.data = this.dataService.positions.filter(
            (x) => x.selected).map((x) => new Order(
                x.security,
                dir == 1 ? quantity : -x.quantity,
                x.price,
                '1', // price type
                null, // settle date
                null, // ioiid
                '1', // order type
                // dir == 1 ? Side.Buy : Side.Sell, // order side
            ));
        // https://material.angular.io/components/dialog/overview
        const modalDialog = this.matDialog.open(OrdersComponent, dialogConfig);
        modalDialog.beforeClosed().subscribe((success: boolean) => {
            if (success) {
                this.dataService.allSelected = false;
            }
        });
    }
}
