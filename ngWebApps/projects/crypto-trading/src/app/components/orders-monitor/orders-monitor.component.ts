import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Account } from '@app/models/account';
import { Order } from '@app/models/order';
import { Security } from '@app/models/security';
import { OrderService, OrdersDataService } from '@app/services/order.service';

import { BehaviorSubject, Subscription } from 'rxjs';
import { utils } from 'shared-library'


@Component({
    selector: 'app-orders-monitor',
    templateUrl: './orders-monitor.component.html',
    styleUrls: ['./orders-monitor.component.scss']
})
export class OrdersMonitorComponent implements OnInit {

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @HostBinding('class') _weight = 'widget';

    public columnsToDisplay = [
        'ID', 'Side', 'Coin', 'Price', 'Size', 'FilledSize',
        'FilledPrice', 'FilledAmount', 'OrderTime', 'Status',
    ];

    public fillColumnsToDisplay = ['ID', 'Match-Size', 'Match-Price', 'Liquidity', 'TradeTS'];

    public dataSource = new MatTableDataSource<Order[]>();
    public ordersDataService: OrdersDataService;
    public errMsg: string = '';
    public loading$: BehaviorSubject<boolean>;

    subscription = new Subscription();

    constructor(private orderService: OrderService) {
        this.ordersDataService = new OrdersDataService(this.orderService);
    }

    ngOnInit(): void {
        this.dataSource.sort = this.sort;

        this.subscription.add(this.ordersDataService.orders$.subscribe({
            next: (orders: any) => {
                this.dataSource.data = orders;
                // this.sortData('Type', 1);
            },
            error: (error: Error) => {
                this.errMsg = utils.errMsg(error);
            }
        }));

        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

        this.subscription.add(this.ordersDataService.loading$.subscribe({
            next: (loading: boolean) => {
                if (!loading) {
                    this.sortData('id', 1);
                }
            },
            error: (error: Error) => {
                this.errMsg = utils.errMsg(error);
                this.subscription.unsubscribe();
            }
        }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    sortData(field: string, flag: -1 | 1): void {
        this.ordersDataService.sort(
            (a: Order, b: Order): number => {
                let num1 = 0;
                let num2 = 0;
                switch (field) {
                    case 'id':
                        return flag * (a.order_id || "").localeCompare(b.order_id || "");
                    case 'Type':
                        return flag * (a['acct_type'] || "").localeCompare(b['acct_type'] || "");
                    default:
                        return flag * (a.security.securityID - b.security.securityID);
                }
            });
    }

    onSelectOrder(order: Order): void {
        order.selected = !order.selected;
    }

}
