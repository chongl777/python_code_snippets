import { MatTableDataSource } from '@angular/material/table';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { MatSort } from '@angular/material/sort';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { Order } from '@app/models/order';
import { OrdersService } from '@app/services/orders.service';
import { WatchlistDataService } from '@app/services/watchlist.service';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation, ShowHideAnimation } from '@app/animations/app.animations';
import { BehaviorSubject } from 'rxjs';


@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss'],
    animations: [
        ShowAnimation(),
        ShowHideAnimation(),
        SlideInOutAnimation(),
    ],
})
export class OrdersComponent implements OnInit {
    public listName: string = 'List_' + (new DatePipe('en-US')).transform(
        new Date(), 'MM/dd/yy_hh:mm');

    private _quantity: number = 0;
    public set Quantity(x: number) {
        this._quantity = x;
    }
    public get Quantity(): number {
        return this._quantity
    }
    public invalid: boolean;
    public orders: Order[];
    public orderForm: FormGroup;
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg = "";
    public columnsToDisplay = ['Security', 'Side', 'Quantity', 'Price', 'Status']
    public dataSource: TableVirtualScrollDataSource<Order>;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: Order[],
        private ordersService: OrdersService,
        public dialogRef: MatDialogRef<OrdersComponent>,
    ) {
        this.orders = data;
        this.dataSource = new TableVirtualScrollDataSource<Order>(this.orders);
        this.dataSource.sort = this.sort;
        this.invalid = false;
        if (data[0]) {
            this._quantity = data[0].quantity / 1000;
        }
    }

    ngOnInit(): void {
    }

    public changeQuantity(quantity: number): void {
        this.orders.forEach((ord: Order) => { ord.quantity = quantity * 1000 });
    }

    public onSendOrders(): void {
        // this.dialogRef.beforeClosed();
        this.invalid = true;
        this.loading$.next(true);
        this.ordersService.sendOrders(this.orders, this.listName)
            .then(
                (x) => {
                    this.orders = x;
                    this.dataSource.data = this.orders;
                    // self.dialogRef.close(true);
                }
            ).catch(
                (error: Error) => {
                    this.errMsg = error.message;
                }
            ).finally(() => {
                this.loading$.next(false);
            });
    }
}
