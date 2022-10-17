import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '@modules/overlay-container/customOverlayContainer';

// import { MarketDataSource, HttpMarketDataSource } from '@models/marketDataSource/index';
// import { MarketDataService } from '@app/services/market-data.service';
// import { SIGNALURL } from '../security-info/general-info.component';


@Component({
    selector: 'app-common-layout',
    templateUrl: './common-layout.component.html',
    styleUrls: ['./common-layout.component.scss'],
    providers: [
        // {
        //     provide: 'MarketDataSource',
        //     useClass: HttpMarketDataSource,
        // },
        // {
        //     provide: MarketDataService,
        // },
        // {
        //     provide: SIGNALURL, useValue: '/security/trading_signal/index'
        // }
    ]
})
export class CommonLayoutComponent implements OnInit {

    @ViewChild('hostElement', { static: true }) _elm: ElementRef;

    constructor(
        private overlayContainer: OverlayContainer,
    ) {
    }

    ngOnInit(): void {
        (this.overlayContainer as CustomOverlayContainer).setContainerParent(this._elm);
    }
}
