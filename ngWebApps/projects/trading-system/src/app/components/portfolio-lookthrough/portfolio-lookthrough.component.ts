import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit,
    ChangeDetectorRef, ViewChildren, ContentChildren, ContentChild, QueryList,
    AfterContentInit, AfterContentChecked, forwardRef, TemplateRef, ChangeDetectionStrategy, Input
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription, Observable, merge, combineLatest } from "rxjs";
import { debounceTime, map, startWith } from "rxjs/operators";

import { _Component } from '@app/models/component';

import * as commons from '@app/models/commons';
import { PortfolioService, PortfolioGroupDataService } from '@app/services/portfolio.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SecurityService } from '@app/services/security.service';
import { GenericPos, Position } from '@app/models/position';
import { Order } from '@app/models/order';

import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';
import { OrdersComponent } from '@app/components/orders/orders.component';
import { SecurityDataObject } from '@app/models/securityDataObject';
import { EventService } from '@app/services/event.service';

import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { DialogWindowComponent } from '../dialog-window/dialog-window.component';
import { SettingComponent } from './setting.component';
import { Lot } from '@app/models/Lot';
import { FundsService } from '@app/services/funds.service';


@Component({
    selector: 'app-portfolio-lookthrough',
    templateUrl: './portfolio-lookthrough.component.html',
    styleUrls: ['./portfolio-lookthrough.component.scss', './color.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
        ExpandedAnimation(),
    ],
    // providers: [MarketDataService],
})
export class PortfolioLookthroughComponent extends _Component implements OnInit, AfterViewInit {
    public dataSource = new MatTableDataSource<GenericPos>();
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    //@ViewChild('SecurityDetail') secDetailsTemplate: TemplateRef<any>;
    @ContentChild('SecurityDetail') secDetailsTemplate: TemplateRef<any>;

    @Input() cookieKey = 'pf-lookthrough';
    @Input() showTotalColumn = true;

    public errMsg: string = '';
    @Input() public columnsToDisplay = [
        'Selected', 'Security', 'SID', 'SecEvt', 'Quantity', 'CostBasis', 'Price',
        'Factor', 'ModifiedDur', 'YTM', 'YTW', 'YTF', 'MarketVal', 'NetExposure',
        'GrossExposure', 'Change', 'Pnl',
        'EqRet', 'Rtg', 'MarketSeg', 'LiqScore', 'EMC', 'RVS2', 'EMCST', 'ERH', 'FA', 'LR',
        'LR_S', 'LR_S_SW'];
    @Input() filterFn: (lot: Lot) => boolean;
    @Input() rowClassFn: (pos: any) => string = (x: any) => '';

    public totalColumns: string[];

    public availableGroupOptions = [
        'total', 'fundName', 'sLevel1', 'sLevel2', 'sLevel3', 'book', 'industry_level_1', 'industry_level_2',
        'deal', 'marketSegment', 'sec_description', 'rtg_group', 'durGroup'];

    public initialExpansion: number;
    public dataService: PortfolioGroupDataService;

    public loading$: Observable<boolean>;

    private subscription: Subscription = new Subscription();
    private groupBy: string[];

    cachedValues: CacheableObject;

    constructor(
        public portfolioService: PortfolioService,
        private fundsService: FundsService,
        private marketDataService: MarketDataService,
        private securityService: SecurityService,
        public matDialog: MatDialog,
        private eventService: EventService,
        private _cdr: ChangeDetectorRef,
        private cacheValuesService: CacheValuesService,
    ) {
        super();

        this.loading$ = combineLatest([
            this.portfolioService.loading$,
            this.fundsService.loading$,
            this.marketDataService.loading$,
            this.securityService.loading$
        ]).pipe(
            map(([pf_loading, fund_loading, mkt_loading, sec_loading]) => {
                return (pf_loading || sec_loading || mkt_loading || fund_loading);
            }),
            startWith(true),
        );
    }

    ngOnInit(): void {
        //this._cdr.detach();
        // this.dataSource = [];
        this.dataSource.sort = this.sort;
    }

    ngAfterViewInit(): void {
        //this._cdr.reattach();
        this.cachedValues = this.cacheValuesService.createCachable(
            this.cookieKey, ['group_by', 'initial_expanded_level', 'sort']);
        this.validateCache();
        this.groupBy = this.cachedValues['group_by'];
        this.initialExpansion = this.cachedValues['initial_expanded_level'];

        this.dataService = new PortfolioGroupDataService(
            this.portfolioService, this.groupBy,
            this.initialExpansion, this.filterFn);

        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

        // this._cdr.detach();

        this.subscription.add(this.loading$.subscribe({
            next: (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this._cdr.reattach();
                    this.sortData(this.cachedValues['sort'][0], this.cachedValues['sort'][1]);
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
            next: (positions: any[]) => {
                this.dataSource.data = positions;
            },
            error: (error: Error) => {
                this.errMsg = commons.errMsg(error);
                this._cdr.detectChanges();
                console.error(error);
            }
        }));

        this.subscription.add(this.marketDataService.marketDataUpdate$
            .pipe(debounceTime(100))
            .subscribe({
                next: () => {
                    this._cdr.detectChanges()
                },
                error: (error: Error) => {
                    this.errMsg = commons.errMsg(error);
                    this._cdr.detectChanges();
                    console.error(error);
                }
            }));

        this._cdr.detectChanges();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    refresh(): void {
        this.dataService.updateSetting(
            this.groupBy, this.initialExpansion);
    }

    validateCache(): void {
        if (
            (this.cachedValues['group_by'] == null) ||
            (this.cachedValues['group_by'].length == null) ||
            (this.cachedValues['group_by'].length == 0)
        ) {
            this.cachedValues['group_by'] = ['total', 'sLevel1', 'book', 'industry_level_1', 'deal'];
        };
        let group_by = this.cachedValues['group_by']
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
        initExp = Math.round(initExp) || 3;
        this.cachedValues['initial_expanded_level'] = initExp;

        this.cachedValues['sort'] = this.cachedValues['sort'] || ['Security', 1];
        if (this.cachedValues['sort'].length != 2) {
            this.cachedValues['sort'] = ['Security', 1];
            if (!this.columnsToDisplay.includes(this.cachedValues['sort'][0])) {
                this.cachedValues['sort'][0] = 'Security';
            }
            if (![1, -1].includes(this.cachedValues['sort'][1])) {
                this.cachedValues['sort'][1] = 1;
            }
        }
    }

    data(): any {
        let data = [];
        this.dataSource.data.forEach((pos: GenericPos) => {
            let datum = pos.to_data();
            data = Array.prototype.concat(data, datum)
        });
        return data;
    }

    sortData(field: string, flag: -1 | 1): void {
        this.dataSource.data = [];

        console.log(this.cachedValues['sort']);
        console.log(this.cachedValues.key + ': ' + field);

        this.cachedValues['sort'] = [field, flag];
        this.cachedValues.save();

        // this._cdr.detectChanges();

        this.dataService.sort(
            (a: GenericPos, b: GenericPos): number => {
                try {
                    switch (field) {
                        case 'Security':
                            if (a.pos_name == 'Cash') {
                                return flag * (1);
                            }

                            if (b.pos_name == 'Cash') {
                                return flag * (-1);
                            }
                            return flag * (a.pos_name || "").localeCompare(b.pos_name || "");
                        case 'Quantity':
                            return flag * (a.quantity - b.quantity);
                        case 'CostBasis':
                            return flag * (a.costBasis - b.costBasis);
                        case 'NetExposure':
                            return flag * (a.exposure - b.exposure);
                        case 'GrossExposure':
                            return flag * (a.exposure_gross - b.exposure_gross);
                        case 'MarketVal':
                            return flag * (a.marketVal - b.marketVal);
                        case 'Pnl':
                            return flag * (a.pnl - b.pnl);
                        case 'Rtg':
                            return flag * (b.rtg_rnk - a.rtg_rnk);
                        default:
                            return flag * SecurityDataObject.compare(a, b, field);
                    }
                } catch (err) {
                    console.error(err);
                    throw err;
                }
            }
        );
        this._cdr.detectChanges();
    }

    onSelectPosition(item: GenericPos): void {
        item.expanded = !item.expanded;
    }

    onSelectSecurity(item: GenericPos) {
        if (item.level > 0) {
            return;
        }
        if (item.security != null) {
            this.eventService.selectSecurity$.emit(item.security);
        }
    }

    updateSetting(data: any): void {
        if (data == null) {
            return;
        }
        this.cachedValues.save_from(data);
        this.validateCache();
        this.groupBy = this.cachedValues['group_by'];
        this.initialExpansion = this.cachedValues['initial_expanded_level'];
        this.portfolioService.loading$.next(true);

        setTimeout(() => {
            try {
                this.dataService.updateSetting(this.groupBy, this.initialExpansion)
                this.errMsg = '';
            } catch (error: any) {
                this.errMsg = error.message;
            } finally {
                this.portfolioService.loading$.next(false);
            }
        }, 0);
    }

    OpenSettingDialog() {
        let sub = DialogWindowComponent.OpenSetting(
            this.matDialog, SettingComponent,
            {
                group_by: this.groupBy,
                initial_expanded_level: this.initialExpansion,
                availableOptions: this.availableGroupOptions,
            }).subscribe((data) => {
                this.updateSetting(data);
                sub.unsubscribe();
            });
        this.subscription.add(sub)
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

        dialogConfig.data = this.dataService._lots.filter(
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
