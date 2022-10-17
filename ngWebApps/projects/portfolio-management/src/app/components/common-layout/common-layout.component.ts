import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { MarketDataSource, HttpMarketDataSource } from '@models/marketDataSource/index';
import { MarketDataService } from '@app/services/market-data.service';
import { SIGNALURL } from '../security-info/general-info.component';


@Component({
    selector: 'app-common-layout',
    templateUrl: './common-layout.component.html',
    styleUrls: ['./common-layout.component.scss'],
    providers: [
        {
            provide: 'MarketDataSource',
            useClass: HttpMarketDataSource,
        },
        {
            provide: MarketDataService,
        },
        {
            provide: SIGNALURL, useValue: '/security/trading_signal/index'
        }
    ]
})
export class CommonLayoutComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }
}
