import {
    Component, OnInit, ViewChild, Input, ChangeDetectionStrategy,
    ChangeDetectorRef, ContentChild, ViewChildren, QueryList
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from "rxjs";
import { finalize, takeWhile, scan, tap, timeout, delay } from "rxjs/operators";
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatColumnDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
// import { utils } from 'shared-library';
import * as commons from '@app/models/commons';

import { PortfolioService, PortfolioGroupDataService } from '@app/services/portfolio.service';
import { Side } from '@app/models/order';
import { _Component } from '@app/models/component';
import { IndicationOfInterestService, IndicationOfInterestDataService } from '@app/services/indication-of-interest.service';
import { IndicationOfInterest } from '@app/models/IndicationOfInterest';
import {
    ShowAnimation, ExpandedAnimation, SlideInOutAnimation,
    ExpandCollapseAnimation,
} from '@app/animations/app.animations';

import { SecurityDataObject } from '@app/models/securityDataObject';
import { EventService } from '@app/services/event.service';
import { Security } from '@app/models/security';
import { DialogWindowComponent } from '@app/components/dialog-window/dialog-window.component';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { MatDialog } from '@angular/material/dialog';

import { SettingComponent } from './settings/setting.component';


@Component({
    selector: 'app-ioi-list',
    templateUrl: './ioi-list.component.html',
    styleUrls: ['./ioi-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        ShowAnimation(),
        ExpandedAnimation(),
        SlideInOutAnimation(),
        // ShowHideAnimation(),
        // ECAnimation(),
        ExpandCollapseAnimation(),
    ],
})
export class IoiListComponent extends _Component implements OnInit {

    // dataSource: IOIDataSource;

    dataSource: MatTableDataSource<IndicationOfInterest>;

    selectedIOI?: IndicationOfInterest;
    columnsToDisplay: string[];
    minimalQty: number;

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    // @ContentChild(MatSort) sort: MatSort;
    @Input() showValid: boolean;

    private _animated: boolean = false;
    get animated(): boolean {
        return this._animated;
    }
    set animated(val: boolean) {
        if (this._animated != val) {
            this._animated = val;
            this._cdr.detectChanges();
        }

        setTimeout(() => {
            this._animated = false;
        }, 1);
    }

    @ViewChildren(MatColumnDef) _viewChildrenColDefs: QueryList<MatColumnDef>;
    @ViewChild(MatTable) _viewMatTable: MatTable<IndicationOfInterest>;

    errMsg: string = '';
    public pfDataService: PortfolioGroupDataService;
    public dataService: IndicationOfInterestDataService;
    subscription = new Subscription();

    @Input() cookieKey = 'ioi-panel';
    cachedValues: CacheableObject;

    constructor(
        public portfolioService: PortfolioService,
        public ioiService: IndicationOfInterestService,
        private eventService: EventService,
        private cacheValuesService: CacheValuesService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
    ) {
        super();

        this.pfDataService = new PortfolioGroupDataService(
            this.portfolioService, ['deal'], 0);
    }

    ngOnInit(): void {
        this.dataService = new IndicationOfInterestDataService(
            this.ioiService, this.showValid);

        if (this.showValid) {
            this.dataSource = new MatTableDataSource<IndicationOfInterest>();
        } else {
            this.dataSource = new TableVirtualScrollDataSource<IndicationOfInterest>();
        }
    }

    ngAfterViewInit(): void {
        this.cachedValues = this.cacheValuesService.createCachable(
            this.cookieKey, ['minimal_quantity']);
        this.validateCache();

        for (let colDef of this._viewChildrenColDefs) {
            this._viewMatTable.addColumnDef(colDef);
        }

        if (this.showValid) {
            this.columnsToDisplay = [
                'Side', 'IOITime', 'Security', 'Quantity', 'Event', 'TimeLeft',
                // 'Signals',
                'EMC', 'RVS2', 'EMCST', 'ERH',
                // 'Leverage',
                'LR', 'LR_S',
                'FA', 'EqRet', 'Price', 'PriceType', 'ModifiedDur',
                'YTM', 'YTW', 'YTF', 'CurrentQty', 'CurrentQtyD', 'ShortInfo',
                'LiqScore', 'Sector', 'Rating', 'AON', 'UserRating'];
        } else {
            this.columnsToDisplay = [
                'Side', 'IOITime', 'Security', 'Quantity', 'Event',
                // 'Signals',
                'EMC', 'RVS2', 'EMCST', 'ERH',
                // 'Leverage',
                'LR', 'LR_S',
                'FA', 'EqRet', 'Price', 'PriceType', 'ModifiedDur',
                'YTM', 'YTW', 'YTF', 'CurrentQty', 'CurrentQtyD', 'ShortInfo', 'LiqScore',
                'Sector', 'Rating', 'AON', 'UserRating'];
        }

        this.subscription.add(this.dataService.ioiList$.subscribe({
            next: (ioiList: IndicationOfInterest[]) => {
                ioiList = ioiList.filter(x => this.filterIOI(x));
                if (Math.abs(ioiList.length - this.dataSource.data.length) <= 10) {
                    this.animated = true;
                } else {
                    this.animated = false;
                }

                this.dataSource.data = ioiList;
            },
            error: (err) => {
                this.errMsg = commons.errMsg(err);
            }
        }));

        this.dataSource.sort = this.sort;
        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

    }

    validateCache(): void {
        let minimalQty = this.cachedValues['minimal_quantity'] || 20000;
        this.cachedValues['minimal_quantity'] = minimalQty;
        this.minimalQty = this.cachedValues['minimal_quantity'];
    }

    filterIOI(ioi: IndicationOfInterest) {
        return ioi.ioiQty > this.cachedValues['minimal_quantity'];
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    rowAnimation(ioi: IndicationOfInterest): string {
        if (!this.showValid) {
            return 'static';
        } else {
            if (!this.animated) {
                return 'static';
            }
            return 'expand';
        }
    }

    sortData(field: string, flag: -1 | 1): void {
        this.dataService.sort((a: IndicationOfInterest, b: IndicationOfInterest): number => {
            switch (field) {
                case 'Side':
                    return flag * ((a.side == Side.Buy ? 1 : 0) - (b.side == Side.Buy ? 1 : 0));
                case 'IOITime':
                    return (a.transactTime.getTime() - b.transactTime.getTime()) * flag;
                case 'TimeLeft':
                    if (a.canUpdate && !b.canUpdate) {
                        return -1;
                    } else if (!a.canUpdate && b.canUpdate) {
                        return 1;
                    }
                    return (a.expireTime.getTime() - b.expireTime.getTime()) * flag;
                case 'Quantity':
                    return (a.ioiQty - b.ioiQty) * flag;
                case 'CurrentQty':
                    return flag * (
                        this.portfolioService.getPosition(a.security.securityID).quantity -
                        this.portfolioService.getPosition(b.security.securityID).quantity);
                case 'CurrentQtyD':
                    return flag * (
                        (this.pfDataService.getPosition(a.security.deal) || { quantity: 0 }).quantity -
                        (this.pfDataService.getPosition(b.security.deal) || { quantity: 0 }).quantity);
                default:
                    return flag * SecurityDataObject.compare(a, b, field);
            }
        });
    }

    onSelectIOI(ioi: IndicationOfInterest): void {
        this.selectedIOI = this.selectedIOI === ioi ? null : ioi;
    }

    onSelectSecurity(security: Security) {
        this.eventService.selectSecurity$.emit(security);
    }

    OpenSettingDialog() {
        let sub = DialogWindowComponent.OpenSetting(
            this.matDialog, SettingComponent,
            {
                minimalQty: this.minimalQty,
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

        setTimeout(() => {
            try {
                this.update();
                this.errMsg = '';
            } catch (err: any) {
                this.errMsg = commons.errMsg(err);
            }
        }, 0);
    }

    update(): void {
        this.dataService.update();
    }

}
