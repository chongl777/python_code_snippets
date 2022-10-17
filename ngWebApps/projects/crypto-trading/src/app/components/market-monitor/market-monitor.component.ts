import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Security } from '@app/models/security';
import { SecurityService, SecurityDataService } from '@app/services/security.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { utils } from 'shared-library'

@Component({
    selector: 'app-market-monitor',
    templateUrl: './market-monitor.component.html',
    styleUrls: ['./market-monitor.component.scss']
})
export class MarketMonitorComponent implements OnInit {

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @HostBinding('class') _weight = 'widget';

    public columnsToDisplay = [
        'Ticker', 'Name', 'BidSize', 'BidPrice', 'AskPrice', 'AskSize', 'Price', 'Size',
        'Time', 'MoMShort', 'MoMMedian', 'MoMLong', 'CombinedSignal', 'SignalTime', 'Trade'];
    public dataSource = new MatTableDataSource<Security>();
    public securityDataService: SecurityDataService;
    public errMsg: string = '';
    public loading$: BehaviorSubject<boolean>;

    subscription = new Subscription();

    constructor(private securityService: SecurityService) {
        this.securityDataService = new SecurityDataService(this.securityService);
        this.loading$ = this.securityDataService.loading$;
    }

    ngOnInit(): void {
        this.dataSource.sort = this.sort

        this.subscription.add(this.securityDataService.securities$.subscribe({
            next: (securities: any) => {
                this.dataSource.data = securities;
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        }));

        this.subscription.add(this.sort.sortChange.subscribe((x: any) => {
            let flag: 1 | -1 = x.direction === 'asc' ? 1 : -1;
            this.sortData(x.active, flag);
        }));

        this.subscription.add(this.securityDataService.loading$.subscribe({
            next: (loading: boolean) => {
                if (!loading) {
                    this.sortData('Ticker', 1);
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
        this.securityDataService.sort(
            (a: Security, b: Security): number => {
                let num1 = 0;
                let num2 = 0;
                switch (field) {
                    case 'Ticker':
                        return flag * (a.ticker || "").localeCompare(b.ticker || "");
                    case 'Name':
                        return flag * (a.description || "").localeCompare(b.description || "");
                    case 'MoMShort':

                        try {
                            num1 = (+a.marketData.tsmom.ts_s.u)
                        } catch {
                        }

                        try {
                            num2 = (+b.marketData.tsmom.ts_s.u)
                        } catch {
                        }
                        return flag * (num1 - num2);
                    case 'MoMMedian':
                        try {
                            num1 = (+a.marketData.tsmom.ts_m.u)
                        } catch {
                        }

                        try {
                            num2 = (+b.marketData.tsmom.ts_m.u)
                        } catch {
                        }
                        return flag * (num1 - num2);
                    case 'MoMLong':
                        try {
                            num1 = (+a.marketData.tsmom.ts_l.u)
                        } catch {
                        }

                        try {
                            num2 = (+b.marketData.tsmom.ts_l.u)
                        } catch {
                        }
                        return flag * (num1 - num2);
                    case 'CombinedSignal':
                        try {
                            num1 = (+a.marketData.tsmom.u)
                        } catch {
                        }

                        try {
                            num2 = (+b.marketData.tsmom.u)
                        } catch {
                        }
                        return flag * (num1 - num2);

                    default:
                        return flag * (a.description || "").localeCompare(b.description || "");
                }
            });
    }

    onSelectSecurity(coin: Security): void {
    }

}
