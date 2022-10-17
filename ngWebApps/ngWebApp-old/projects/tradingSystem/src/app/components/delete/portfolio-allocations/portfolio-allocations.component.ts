import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { interval, Subscription, Observable, merge } from "rxjs";
import { map, startWith } from "rxjs/operators";

import { PortfolioService, PortfolioGroupDataService } from '@app/services/portfolio.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SecurityService } from '@app/services/security.service';
import { GenericPos } from '@app/models/position';
import { Order, Side } from '@app/models/order';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';
import { OrdersComponent } from '../orders/orders.component';


@Component({
    selector: 'app-portfolio-allocations',
    templateUrl: './portfolio-allocations.component.html',
    styleUrls: ['./portfolio-allocations.component.scss', './color.scss'],
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class PortfolioAllocationsComponent implements OnInit, OnDestroy, AfterViewInit {

    public dataSource: MatTableDataSource<GenericPos>;
    public columnsToDisplay = [
        'Selected', 'Security', 'SID', 'Quantity', 'CostBasis', 'Price', 'Factor',
        'YTM', 'YTW', 'YTF', 'MarketVal', 'Change', 'Pnl', 'EMC', 'RVS', 'ERH', 'LR',];
    public initialExpansion: number;

    public errMsg: string = '';
    public dataService: PortfolioGroupDataService;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    public loading$: Observable<boolean>;

    private dataSubscription: Subscription;
    private sortSubscription: Subscription;
    private loadSubscription: Subscription;

    constructor(
        public portfolioService: PortfolioService,
        private marketDataService: MarketDataService,
        private securityService: SecurityService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
    ) {
        this._cdr.detach();
        this.dataService = new PortfolioGroupDataService(
            this.portfolioService, ['book', 'sector', 'deal'], this.initialExpansion);

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
                    //return true;
                }),
                startWith(true),
            );
    }

    ngOnInit(): void {
        this.dataSource = new MatTableDataSource<GenericPos>();
        this.dataSource.sort = this.sort;
        this.sortSubscription = this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        });

        this.loadSubscription = this.loading$.subscribe(
            (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this._cdr.reattach();
                    this.sortData('Security', 1);
                } else {
                    this._cdr.detach();
                }
            }
        );

        this.dataSubscription = this.dataService.positions$.subscribe({
            next: (positions: any) => {
                this.dataSource.data = positions;
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        });

    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this.dataSubscription.unsubscribe();
        this.sortSubscription.unsubscribe();
        this.loadSubscription.unsubscribe();
    }

    onSelectPosition(pos: GenericPos): void {
        pos.expanded = !pos.expanded;
        // this.selectedPosition = this.selectedPosition ? null : pos;
    }

    SecDetailBeingDestroyed(): void {
    }

    sortData(field: string, flag: -1 | 1): void {
        this.dataSource.data = [];
        // this._cdr.detectChanges();

        this.dataService.sort(
            (a: GenericPos, b: GenericPos): number => {
                switch (field) {
                    case 'Security':
                        if (a.pos_name == 'Cash') {
                            return flag * (1);
                        }

                        if (b.pos_name == 'Cash') {
                            return flag * (-1);
                        }
                        return flag * (a.pos_name || "").localeCompare(b.pos_name || "");
                    case 'Price':
                        return flag * (a.price -
                            b.price);
                    case 'Change':
                        return flag * (a.diff -
                            b.diff);
                    case 'Quantity':
                        return flag * (a.quantity - b.quantity);
                    case 'CostBasis':
                        return flag * (a.costBasis - b.costBasis);
                    case 'Pnl':
                        return flag * (a.pnl - b.pnl);
                    case 'YTM':
                        return flag * ((a.ytm || 0) - (b.ytm || 0));
                    case 'YTW':
                        return flag * ((a.ytw || 0) - (b.ytw || 0));
                    case 'YTF':
                        return flag * ((a.ytf || 0) - (b.ytf || 0));
                    case 'ERH':
                    case 'Signals':
                        return flag * (
                            ((a.rvs_score || 0) + (a.emc_score || 0)) -
                            ((b.rvs_score || 0) + (b.emc_score || 0))
                        );
                    case 'EMC':
                        return flag * (
                            (a.emc_score || 0) - (b.emc_score || 0)
                        );
                    case 'RVS':
                        return flag * (
                            (a.rvs_score || 0) - (b.rvs_score || 0)
                        );
                    case 'LR':
                        return flag * (
                            (a.leverage_ratio || 0) - (b.leverage_ratio || 0)
                        );
                    case 'Signals':
                        return flag * (
                            (a.erh_score || 0) - (b.erh_score || 0)
                        );
                    case 'Sector':
                        return flag * (a.sector || "").localeCompare(b.sector || "");
                    case 'Subsector':
                        return flag * (a.industry_level_2 || "").localeCompare(b.industry_level_2 || "");
                }
            }
        );
        this._cdr.detectChanges();
    }

    data(): any {
        let data = [];
        this.dataSource.data.forEach((pos: GenericPos) => {
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

        dialogConfig.data = this.dataService._positions.filter(
            (x) => x.selected).map((x) => new Order(
                x.security,
                dir == 1 ? quantity : x.quantity,
                x.security.lastPrice,
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
