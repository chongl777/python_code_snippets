import { Injectable } from '@angular/core';
import { CollectionViewer, DataSource } from "@angular/cdk/collections";

import { RxStompService } from '@stomp/ng2-stompjs';
import { Observable, of, Subject, BehaviorSubject, Subscription, interval, timer } from 'rxjs';
import { buffer, finalize, delay, take, timeout, switchMap, filter, debounce, debounceTime, map } from 'rxjs/operators';
import { RxStompState } from '@stomp/rx-stomp';

import { MsgControllerService } from './msg-controller.service';
import { IndicationOfInterest } from '../models/IndicationOfInterest';
import { Order } from '@app/models/order';
import { PortfolioService } from '@app/services/portfolio.service';
import { IndicationOfInterestClassFactory } from '../models/IndicationOfInterest';
import { SecurityService } from './security.service';
import { EventService } from './event.service';
import { environment } from '@environments/environment';
import * as commons from '@app/models/commons';

let TIMEOUT = environment.default_timeout;


type IOIsMap = Record<string, IndicationOfInterest>


@Injectable({
    providedIn: 'root'
})
export class IndicationOfInterestService {

    private ioilist: IOIsMap = {};
    private ioiIdMap: { [ioiid: string]: string } = {};

    public ioiList$ = new BehaviorSubject<IndicationOfInterest[]>([]);
    public loading$ = new BehaviorSubject<boolean>(false);

    constructor(
        private msgController: MsgControllerService,
        private ioiFactory: IndicationOfInterestClassFactory,
        private securityService: SecurityService,
        private eventService: EventService,
        private portfolioService: PortfolioService,
    ) {
        this.loading$ = this.msgController.ioi_loading$;


        this.eventService.ioiExpired$.pipe(
            debounceTime(400),
            switchMap((x) => of(x)),
        ).subscribe(
            () => {
                this.update()
            });
        this.subscribeIOI();

        // this.loading$.next(true);
        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.loadAllIOIs();
            } else {
            }
        });
    }

    private update(): void {
        if (this.loading$.getValue()) {
            return
        }

        this.ioiList$.next(
            Object.values(this.ioilist));
        // .filter((ioi) => ioi.valid)
        // .sort(this.sortFunc));
    }

    public async getIOI(ioi_id: string, timeout = TIMEOUT): Promise<IndicationOfInterest> {
        let ioilist = this.ioilist;
        let ioiIdMap = this.ioiIdMap;
        try {
            await commons.waitUntil(
                () => (ioi_id in ioilist) || (ioi_id in ioiIdMap), timeout);
        } catch (err) {
            console.error('IOI_ID', ioi_id, "not exist");
        }

        function get_ioi(ioi_id: string) {
            if (ioi_id in ioilist) {
                return ioilist[ioi_id];
            } else if (ioi_id in ioiIdMap) {
                return get_ioi(ioiIdMap[ioi_id]);
            } else {
                console.error('IOI_ID', ioi_id, "not exist");
                return null;
            }
        }

        return get_ioi(ioi_id);
    }

    public async match_order_with_ioi(order: Order, timeout = TIMEOUT): Promise<IndicationOfInterest> {
        // return null;
        if (order.ioi_id == null) {
            return null;
        }

        try {
            let ioi = await this.getIOI(order.ioi_id);

            ioi.setOrder(order);
            return ioi;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    private async updateIOIStatus(ioi_id: string, loading: boolean, timeout = TIMEOUT): Promise<any> {
        await commons.waitUntil(() => (ioi_id in this.ioilist), timeout)
        this.ioilist[ioi_id].loading$.next(loading);
        return
    }

    private additionalConditionTest(ioi: Object) {
        return true;
        // if (Math.abs(ioi['IOIQty']) >= 100000) {
        //     return true;
        // } else {
        //     let pos = this.portfolioService.getPosition(ioi['security_id']);
        //     if (pos && pos.quantity != 0) {
        //         return true
        //     }
        // }
        // return false;
    }

    private async process_ioi(ioi: Object): Promise<boolean> {
        this.securityService.createOrUpdateSecurity(
            ioi['security_id'], ioi['security_info']);

        // this.marketDataService.createOrUpdateMarketData(
        //     ioi['market_data'], ioi['security_id']);

        if (!this.additionalConditionTest(ioi)) {
            return null;
        };

        if (ioi['IOITransType'] == 'N') {
            if (!(ioi['IOIID'] in this.ioilist)) {
                this.ioilist[ioi['IOIID']] = await this.ioiFactory.deserializeIOI(
                    ioi['security_id'], ioi);
                return true;
            } else {
                this.ioilist[ioi['IOIID']].deserialize(ioi);
            }
            return false
        } else if (ioi['IOITransType'] == 'C') {
            if (ioi['IOIRefID'] in this.ioilist) {
                this.ioilist[ioi['IOIRefID']].deserialize(ioi);
            } else {
                this.ioilist[ioi['IOIRefID']] = await this.ioiFactory.deserializeIOI(
                    ioi['security_id'], ioi);
            }
            this.ioilist[ioi['IOIRefID']].expire();

            this.ioiIdMap[ioi['IOIID']] = ioi['IOIRefID'];
            return true;
        } else if (ioi['IOITransType'] == 'R') {
            if (ioi['IOIRefID'] in this.ioilist) {
                let refIOI = this.ioilist[ioi['IOIRefID']];
                this.ioilist[ioi['IOIID']] = refIOI.deserialize(ioi);
                delete this.ioilist[ioi['IOIRefID']];
            } else {
                this.ioilist[ioi['IOIID']] = await this.ioiFactory.deserializeIOI(
                    ioi['security_id'], ioi);
            }
            this.ioiIdMap[ioi['IOIID']] = ioi['IOIRefID'];
            return true;
        }
        throw new Error('Unknow IOI' + ioi);
    }

    private subscribeIOI(): void {
        this.msgController.ioiUpdate$
            .pipe(
                buffer(interval(1000)),
                filter(x => { return x.length > 0 }),
            )
            .subscribe({
                next: async (iois: any[]) => {
                    for (let ioi of iois) {
                        await this.process_ioi(ioi);
                    }
                    this.update();
                },
                error: (error: Error) => console.error(error),
            });

        this.msgController.ioiStatus$.subscribe({
            next: (resp: any) => {
                let ioi_id = resp[0];
                let loading = resp[1];
                this.updateIOIStatus(ioi_id, loading);
            },
            error: (error: Error) => console.error(error),
        });
    }

    private async loadAllIOIs(): Promise<any> {
        // let i = 0
        console.log('load all iois...')

        let response = [];
        this.loading$.next(true);
        let sub$ = this.msgController.ioiLoad$
            .pipe(finalize(() => {
                //this.loading$.next(false);
                sub$.unsubscribe();
            }))
            .subscribe({
                next: (resp: any) => {
                    response.push(resp);
                },
                error: (error: Error) => {
                    error.message = 'IndicationOfInterestService: ' + error.message;

                    console.error(error);
                    console.log('load all iois error');
                    this.loading$.next(false);
                    this.ioiList$.error(error)
                },
                complete: async () => {
                    await commons.waitUntil(() => this.portfolioService.loading$.getValue() == false, TIMEOUT);

                    for (let resp of response) {
                        await this.process_ioi(resp);
                    }
                    this.loading$.next(false);
                    this.update();

                    console.log('load all iois done!')
                }
            });
    }
}

export class IOIDataSource implements DataSource<IndicationOfInterest> {
    private ioiList$ = new BehaviorSubject<IndicationOfInterest[]>([]);
    private sortFunc: (a: IndicationOfInterest, b: IndicationOfInterest) => number = (a, b) => 0;

    private ioilist: IndicationOfInterest[];
    public loading$: Observable<boolean>;

    constructor(
        private ioiService: IndicationOfInterestService,
        validFlag: boolean
    ) {
        this.ioiService.ioiList$.subscribe({
            next: (ioilist) => {
                this.ioilist = ioilist.filter(
                    x => validFlag ? x.validIOI : !x.validIOI).sort(this.sortFunc);
                this.update();
            },
            error: (err) => {
                this.ioiList$.error(err);
            }
        });

        this.loading$ = this.ioiService.loading$.asObservable();
    }

    connect(collectionViewer: CollectionViewer): Observable<IndicationOfInterest[]> {
        return this.ioiList$.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.ioiList$.complete();
    }

    sort(sortFunc: (a: IndicationOfInterest, b: IndicationOfInterest) => number): void {
        this.sortFunc = sortFunc;
        this.ioilist = this.ioilist.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.ioiList$.next(this.ioilist);
    }
}

export class IndicationOfInterestDataService {
    public ioiList$ = new BehaviorSubject<IndicationOfInterest[]>([]);
    private sortFunc: (a: IndicationOfInterest, b: IndicationOfInterest) => number = (a, b) => 0;

    private ioilist: IndicationOfInterest[];
    public loading$: Observable<boolean>;

    constructor(
        private ioiService: IndicationOfInterestService,
        validFlag: boolean
    ) {
        this.ioiService.ioiList$
            .pipe(debounceTime(50))
            .subscribe({
                next: (ioilist) => {
                    this.ioilist = ioilist.filter(
                        x => validFlag ? x.validIOI : !x.validIOI).sort(this.sortFunc);
                    this.update();
                },
                error: (err) => {
                    this.ioiList$.error(err);
                }
            });

        this.loading$ = this.ioiService.loading$.asObservable();
    }

    sort(sortFunc: (a: IndicationOfInterest, b: IndicationOfInterest) => number): void {
        this.sortFunc = sortFunc;
        this.ioilist = this.ioilist.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.ioiList$.next(this.ioilist);
    }

}
