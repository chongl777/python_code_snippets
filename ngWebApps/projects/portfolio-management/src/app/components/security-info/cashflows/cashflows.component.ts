import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { SearchItem, SecurityService } from '@app/services/security.service';
import { Subscription, of, BehaviorSubject, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NavConfig, utils } from 'shared-library';

import * as d3 from 'd3';


type Datum = { 'factor': any, 'coupon': any };


@Component({
    selector: 'app-cashflows',
    templateUrl: './cashflows.component.html',
    styleUrls: ['./cashflows.component.scss'],
})
export class CashflowsComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg: string = '';
    public subscription = new Subscription();
    public cashflow: any[] = [];
    public factor: any[] = [];
    public cashflowColumns = ['Date', 'Coupon', 'Principal'];
    public factorColumns = ['Date', 'Factor'];

    constructor(
        private cdf: ChangeDetectorRef,
        private evt: EventService,
        private securityDataSvs: SecurityService,
    ) {
    }

    ngOnInit(): void {
        this.subscription.add(this.evt.selectSecurity$.pipe(
            switchMap(sid => {
                this.loading$.next(false);
                this.errMsg = "";
                return from((async (): Promise<Datum> => {
                    this.loading$.next(true);

                    if (sid != null) {
                        try {
                            let security = await this.securityDataSvs.getSecurityData(sid)
                            if (security.secType == 'Corporate Bond') {
                                let data = await this.securityDataSvs.getCashflow(sid)
                                return data;
                            } else {
                                return null;
                            }
                        } catch (err) {
                            this.errMsg = utils.errMsg(err);
                            return null;
                        }
                    } else {
                    }
                    return null;

                })());
            })
        ).subscribe(
            async (data: Datum) => {
                try {
                    if (data == null) {
                        this.loading$.next(false);
                        this.cashflow = [];
                        this.factor = [];
                        return;
                    } else {
                        this.cashflow = data.coupon;
                        this.factor = data.factor;
                    }
                } catch (err) {
                    this.errMsg = utils.errMsg(err);
                    console.error(err);
                    this.cashflow = [];
                    this.factor = [];
                }
                this.loading$.next(false);
            }
        ));
    }

    ngAfterViewInit() {
        // console.log('enter here')
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
