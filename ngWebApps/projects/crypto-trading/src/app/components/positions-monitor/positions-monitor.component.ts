import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Account } from '@app/models/account';
import { Security } from '@app/models/security';
import { OrderService, AccountsDataService } from '@app/services/order.service';

import { BehaviorSubject, Subscription } from 'rxjs';
import { utils } from 'shared-library'


@Component({
    selector: 'app-positions-monitor',
    templateUrl: './positions-monitor.component.html',
    styleUrls: ['./positions-monitor.component.scss']
})
export class PositionsMonitorComponent implements OnInit {

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @HostBinding('class') _weight = 'widget';

    public columnsToDisplay = [
        'Type', 'Coin', 'Balance', 'Available', 'Price', 'MktVal', 'Trade'
    ];
    public dataSource = new MatTableDataSource<Account[]>();
    public accountDataService: AccountsDataService;
    public errMsg: string = '';
    public loading$: BehaviorSubject<boolean>;

    subscription = new Subscription();

    constructor(private orderService: OrderService) {
        this.accountDataService = new AccountsDataService(this.orderService);
        this.loading$ = this.accountDataService.loading$;
    }

    ngOnInit(): void {
        this.dataSource.sort = this.sort

        this.subscription.add(this.accountDataService.accounts$.subscribe({
            next: (accounts: any) => {
                this.dataSource.data = accounts;
                // this.sortData('Type', 1);
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        }));

        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

        this.subscription.add(this.accountDataService.loading$.subscribe({
            next: (loading: boolean) => {
                if (!loading) {
                    this.sortData('Type', 1);
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
        this.accountDataService.sort(
            (a: Account, b: Account): number => {
                let num1 = 0;
                let num2 = 0;
                switch (field) {
                    case 'id':
                        return flag * (a.id || "").localeCompare(b.id || "");
                    case 'Type':
                        return flag * (a['acct_type'] || "").localeCompare(b['acct_type'] || "");
                    default:
                        return flag * (a.balance - b.balance);
                }
            });
    }

    onSelectSecurity(coin: Security): void {
    }

}
