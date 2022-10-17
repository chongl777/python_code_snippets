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


@Component({
    selector: 'app-trading-signals-wrapper',
    templateUrl: './trading-signals-wrapper.component.html',
    styleUrls: ['./trading-signals-wrapper.component.scss'],
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
export class TradingSignalWrapperComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public subscription = new Subscription();
    public errMsg = "";
    public resize = true;
    public signalSrc: number;
    public allSignal = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventService: EventService,
        private securityDataSvs: SecurityService,
        private marketDataSvs: MarketDataService,
    ) {
    }

    ngOnInit(): void {
        this.subscription.add(this.route.data
            .subscribe(data => {
                if (data['allSignal']) {
                    this.allSignal = true;
                    this.resize = false;
                } else if (data['signal']) {
                    this.signalSrc = +data['signal'];
                    this.allSignal = false;
                    this.resize = true;
                }
            }));

        this.subscription.add(this.route.queryParams
            .pipe(
                switchMap((params) => {
                    this.loading$.next(false);
                    return from((async () => {
                        if (params['sid']) {
                            let sid = params['sid'];
                            try {
                                this.loading$.next(true)
                                await Promise.all([
                                    this.securityDataSvs.getSecurityData(sid),
                                    this.marketDataSvs.getSecurityTrdingRecords(sid, null),
                                ]);
                            } catch (err) {
                                throw err;
                            }
                        }

                        return params;
                    })());
                })
            ).subscribe({
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
                    this.loading$.next(false);
                },
                error: (err) => {
                    this.errMsg = utils.errMsg(err);
                    this.loading$.next(false);
                }
            }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    goToGeneralInfo() {
        this.router.navigate(
            ['/security_general_info'],
            { relativeTo: this.route, queryParamsHandling: "merge" });
    }

}
