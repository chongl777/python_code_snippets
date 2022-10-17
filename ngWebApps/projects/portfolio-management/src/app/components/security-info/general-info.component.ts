import { ChangeDetectorRef, Component, Inject, InjectionToken, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMarketDataSource } from '@app/models/marketDataSource';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SearchItem, SecurityService } from '@app/services/security.service';
import { Subscription, of, BehaviorSubject, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NavConfig, utils } from 'shared-library';

import * as d3 from 'd3';
import { TradingRecords } from '@app/models/tradingRecords';
import { DataFrame } from '@app/models/marketData';
import { LinesConfig, NaviConfig } from '@components/plot-chart/plot-chart.component';


export const SIGNALURL = new InjectionToken<string>('signal_url');


@Component({
    selector: 'app-security-general-info',
    templateUrl: './general-info.component.html',
    styleUrls: ['./general-info.component.scss'],
    providers: [
        {
            provide: 'MarketDataSource',
            useClass: HttpMarketDataSource,
        },
        {
            provide: MarketDataService,
        },
        {
            provide: SecurityService,
        }
    ],
})
export class GeneralInfoComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg: string = '';
    public subscription = new Subscription();

    constructor(
        private cdf: ChangeDetectorRef,
        private evt: EventService,
        private securityDataSvs: SecurityService,
        private marketDataSvs: MarketDataService,
        private route: ActivatedRoute,
        private router: Router,
        @Inject(SIGNALURL) private signalUrl: string,
    ) {
    }

    ngOnInit(): void {

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    goToTradingSignal() {
        this.router.navigate(
            [this.signalUrl],
            // ['/security/trading_signal/index'],
            { relativeTo: this.route, queryParamsHandling: "merge" });
    }
}
