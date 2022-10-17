import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of, from, BehaviorSubject, Observable } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

import { HttpMarketDataSource } from '@app/models/marketDataSource';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SearchItem, SecurityService } from '@app/services/security.service';
import { NavConfig, utils } from 'shared-library';
import { SIGNALURL } from './general-info.component';


@Component({
    selector: 'app-security-info-wrapper',
    templateUrl: './security-info-wrapper.component.html',
    styleUrls: ['./security-info-wrapper.component.scss'],
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
        },
        {
            provide: SIGNALURL, useValue: '/trading_signal'
        }
    ],
})
export class SecurityInfoWrapperComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public subscription = new Subscription();
    public errMsg = "";
    public resize = true;
    public initializing = true;


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventService: EventService,
        private securityDataSvs: SecurityService,
        private marketDataSvs: MarketDataService,
    ) {
    }

    ngOnInit(): void {
        this.subscription.add(
            this.route.queryParams.subscribe({
                next: async (params) => {
                    try {
                        if (params['sid']) {
                            let sid = params['sid'];
                            this.eventService.selectSecurity$.next(sid);
                        }
                    } catch (err) {
                        this.errMsg = utils.errMsg(err);
                        console.error(err);
                    }
                },
                error: (err) => {
                    this.errMsg = utils.errMsg(err);
                }
            }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
