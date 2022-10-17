import { Component, OnInit, OnDestroy, ViewChild, Input, AfterViewInit, ChangeDetectorRef } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { interval, Subscription, Observable, merge } from "rxjs";
import { map, startWith } from "rxjs/operators";

import { Order } from '@app/models/order';
import { PortfolioService } from '@app/services/portfolio.service';
import { OrdersService, OrdersDataService } from '@app/services/orders.service';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation, ShowHideAnimation } from '@app/animations/app.animations';
import { IoiOrderComponent } from '@app/components/ioi-order/ioi-order.component';


@Component({
    selector: 'app-order-list',
    templateUrl: './order-list.component.html',
    styleUrls: ['./order-list.component.scss'],
    animations: [
        ShowAnimation(),
        ShowHideAnimation(),
        ExpandedAnimation(),
        SlideInOutAnimation(),
    ],
})
export class OrderListComponent implements OnInit, OnDestroy, AfterViewInit {
    public dataSource: MatTableDataSource<Order>;
    public columnsToDisplay: string[] = [
        'Side',
        'Sid',
        'Security',
        'OrderType',
        'Quantity', 'CurrentQty', 'Price',
        'PriceType', 'OrderStatus',
        'IOIOrder',
        'Update',
    ];
    public errMsg: string = '';
    private dataService: OrdersDataService;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @Input() filterKey: string;
    public selectedOrder: Order;

    public loading$: Observable<boolean>;

    loadSubscription: Subscription;
    dataSubscription: Subscription;
    sortSubscription: Subscription;

    constructor(
        private ordersService: OrdersService,
        private portfolioService: PortfolioService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
    ) {
        this._cdr.detach();
    }

    ngOnInit(): void {

        this.dataService = new OrdersDataService(this.ordersService, this.filterKey);

        this.loading$ = merge(
            this.dataService.loading$).pipe(
                map(() => {
                    let orders_loading = this.dataService.loading$.getValue();
                    return orders_loading;
                }),
                startWith(true),
            );

        this.dataSource = new MatTableDataSource<Order>();
        this.dataSource.sort = this.sort;

        this.sortSubscription = this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        });

        this.loadSubscription = this.loading$.subscribe(
            (loading: boolean) => {
                this._cdr.detectChanges();
                if (!loading) {
                    this.sortData('Time', 1);
                    this._cdr.reattach();
                }
            }
        );

        this.dataSubscription = this.dataService.orders$.subscribe({
            next: (orders: any) => {
                this.dataSource.data = orders;
                this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        });
    }

    ngOnDestroy(): void {
        this.dataSubscription.unsubscribe();
        this.sortSubscription.unsubscribe();
        this.loadSubscription.unsubscribe();
    }

    ngAfterViewInit(): void {
    }

    onSelectOrder(ord: Order): void {
        this.selectedOrder = this.selectedOrder ? null : ord;
        this._cdr.detectChanges();
    }

    sortData(field: string, flag: -1 | 1): void {
        this.dataService.sort(
            (a: Order, b: Order): number => {
                switch (field) {
                    case 'Security':
                        return flag * (a.security.description || "").localeCompare(b.security.description || "");
                    case 'PriceType':
                        return flag * ((+a.price_type || 0) - (+b.price_type || 0));
                    case 'Price':
                        return flag * (a.order_price - b.order_price);
                    case 'OrderStatus':
                        return flag * (a.order_status || "").localeCompare((b.order_status || ""));
                    case 'Quantity':
                        return flag * (a.quantity - b.quantity);
                    case 'IOIOrder':
                        return flag * ((a.ioi_id ? 1 : 0) - (b.ioi_id ? 1 : 0));
                    case 'CurrentQty':
                        return flag * (
                            this.portfolioService.getPosition(a.security.securityID).quantity -
                            this.portfolioService.getPosition(b.security.securityID).quantity);
                }
            }
        );
    }

    data(): any {
        let data = [];
        this.dataSource.data.forEach((order: Order) => {
            let datum = order.to_data();
            data = Array.prototype.concat(data, datum)
        });
        return data;
    }
}
