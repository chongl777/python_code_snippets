import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from "rxjs";
import { finalize, takeWhile, scan, tap, timeout } from "rxjs/operators";

import { PortfolioService, PortfolioGroupDataService } from '@app/services/portfolio.service';
import { Side } from '@app/models/order';
import { _Component } from '@app/models/component';

import { IndicationOfInterestService, IndicationOfInterestDataService } from '../../services/indication-of-interest.service';
import { IndicationOfInterest } from '../../models/IndicationOfInterest';
import { ShowAnimation, ExpandedAnimation, ShowHideAnimation, SlideInOutAnimation } from '../../animations/app.animations';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { SecurityDataObject } from '@app/models/securityDataObject';
import { EventService } from '@app/services/event.service';
import { Security } from '@app/models/security';
import { MatTableDataSource } from '@angular/material/table';


@Component({
    selector: 'app-ioi-list',
    templateUrl: './ioi-list.component.html',
    styleUrls: ['./ioi-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        ShowAnimation(),
        ExpandedAnimation(),
        ShowHideAnimation(),
        SlideInOutAnimation(),
    ],
})
export class IoiListComponent extends _Component implements OnInit {

    // dataSource: IOIDataSource;

    dataSource: TableVirtualScrollDataSource<IndicationOfInterest>;
    // dataSource: MatTableDataSource<IndicationOfInterest>;

    selectedIOI?: IndicationOfInterest;
    columnsToDisplay: string[];

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @Input() showValid: boolean;
    errMsg: string = '';
    public pfDataService: PortfolioGroupDataService;
    public dataService: IndicationOfInterestDataService;

    // loadSubscription: Subscription;
    dataSubscription: Subscription;
    sortSubscription: Subscription;

    constructor(
        private _elm: ElementRef,
        private portfolioService: PortfolioService,
        public ioiService: IndicationOfInterestService,
        private eventService: EventService) {
        super();

        this.pfDataService = new PortfolioGroupDataService(
            this.portfolioService, ['deal'], 0);
    }

    ngOnInit(): void {
        // this.showValid = this.route.snapshot.params.showValid == "true" ? true : false;
        if (this.showValid) {
            this.columnsToDisplay = [
                'Side', 'IOITime', 'Security', 'Quantity', 'Event', 'TimeLeft',
                'Signals', 'Leverage', 'FA', 'EqRet', 'Price', 'PriceType', 'ModifiedDur',
                'YTM', 'YTW', 'YTF', 'CurrentQty', 'CurrentQtyD', 'ShortInfo',
                'LiqScore', 'Sector', 'Rating', 'AON', 'UserRating'];
        } else {
            this.columnsToDisplay = [
                'Side', 'IOITime', 'Security', 'Quantity', 'Event',
                'Signals', 'Leverage', 'FA', 'EqRet', 'Price', 'PriceType', 'ModifiedDur',
                'YTM', 'YTW', 'YTF', 'CurrentQty', 'CurrentQtyD', 'ShortInfo', 'LiqScore',
                'Sector', 'Rating', 'AON', 'UserRating'];

            this.columnsToDisplay = [
                'Side', 'IOITime', 'Security', 'Quantity',
                'Signals', 'Leverage'];
        }

        this.dataSource = new TableVirtualScrollDataSource<IndicationOfInterest>();
        // this.dataSource = new MatTableDataSource<IndicationOfInterest>();
        this.dataSource.sort = this.sort;

        this.dataService = new IndicationOfInterestDataService(
            this.ioiService, this.showValid);

        // this.dataSource = new IOIDataSource(this.ioiService, this.showValid);
        this.dataSubscription = this.dataService.ioiList$.subscribe({
            next: (ioiList: IndicationOfInterest[]) => {
                this.dataSource.data = ioiList;
                // this.dataSource = new TableVirtualScrollDataSource<WatchItem>(watchlist);
            },
            error: (err) => {
                this.errMsg = err.message;
            }
        });

        this.sortSubscription = this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        });
    }

    ngAfterViewInit(): void {
        console.log(this._elm);
        let navElm = this._elm.nativeElement;
        let header = navElm.querySelector('.mat-header-row');
        navElm.querySelector('.mat-header-row').remove();
        navElm.querySelector('cdk-virtual-scroll-viewport').prepend(header);
    }

    ngOnDestroy(): void {
        this.dataSubscription.unsubscribe();
        this.sortSubscription.unsubscribe();
        // this.loadSubscription.unsubscribe();
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

    onSelectIOI(ioi: IndicationOfInterest, elScroll: HTMLElement, el: HTMLElement): void {
        this.selectedIOI = this.selectedIOI === ioi ? null : ioi;

        // if (el.parentElement.classList.contains('selected')) {
        //     el.parentElement.classList.remove('selected')
        // } else {
        //     el.parentElement.classList.add('selected')
        // }
        // if (this.selectedIOI) {
        //     let div = document.createElement('mat-row');
        //     div.classList.add('sec-details');
        //     div.classList.add('mat-row');
        //     div.classList.add('cdk-row');
        //     div.classList.add('ng-star-inserted');

        //     el.parentElement.parentElement.insertBefore(div, el.parentElement.nextSibling)
        // }

    }

    onSelectSecurity(security: Security) {
        this.eventService.selectSecurity$.emit(security);
    }
}
