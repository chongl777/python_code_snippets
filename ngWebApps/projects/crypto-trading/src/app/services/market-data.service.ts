import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RxStompState } from '@stomp/rx-stomp';
import { RxStompService } from '@stomp/ng2-stompjs';

import { MarketData } from '@models/market';
// import { MsgClient } from '../models/msgClient';
// import { MarketDataService } from './market-data.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MsgControllerService } from './msg-controller.service';
import { environment } from '@environments/environment';


@Injectable({
    providedIn: 'root'
})
export class MarketDataService {

    marketDataMap: { [sid: number]: MarketData } = {};
    marketDataSub$ = new Subscription();
    connectionSub$ = new Subscription();
    public loading$ = new BehaviorSubject<boolean>(false);

    constructor(
        private msgController: MsgControllerService,
    ) {
        // this.loading$ = this.msgController.sec_loading$;
        this.subscribeMarketsData();
        this.subscribeSignalData();

        this.msgController.mktConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.createAllSignal();
            }
        });
    }

    ngOnDestroy() {
        console.log('destruct marketdata service');
        this.marketDataSub$.unsubscribe();
    }

    private subscribeMarketsData(): void {
        console.log('subscribe market data...');

        this.marketDataSub$.add(this.msgController.marketData$
            .subscribe({
                next: (mktdata: any) => {
                    this.createOrUpdateMarketData(mktdata['sid'], mktdata, 'mkt');
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    this.loading$.error(error);
                    console.error(error);
                },
            }));
    }

    private createAllSignal(): void {
        console.log('load all securities signal...');

        this.loading$.next(true);
        let sub$ = this.msgController.signalList$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                // this.securities$.next(Object.values(this.securitiesMap))
                this.loading$.next(false);
            }))
            .subscribe({
                next: (signalsData: any[]) => {
                    signalsData.forEach((signalData) => {
                        this.createOrUpdateMarketData(signalData['sid'], signalData, 'signal');
                    })
                    console.log('load all securities signal done!');
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    error.message = 'SecurityService: ' + error.message;
                    this.loading$.error(error);
                    console.error(error);
                    console.log('load all securities signal error!');
                },
            });
    }

    private subscribeSignalData(): void {
        console.log('subscribe signal data...');

        this.marketDataSub$.add(this.msgController.signalData$
            .subscribe({
                next: (signalData: any) => {
                    this.createOrUpdateMarketData(signalData['sid'], signalData, 'signal');
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    this.loading$.error(error);
                    console.error(error);
                },
            }));
    }

    public createOrUpdateMarketData(
        securityID: number, json: Object, kind: 'mkt' | 'signal'): MarketData {
        if (json == null || securityID == null) {
            console.error('empty security encoutered');
            return null;
        }

        securityID = +securityID;
        if (!((securityID) in this.marketDataMap)) {
            this.marketDataMap[securityID] = new MarketData(
                securityID);
        }
        let mktdata = this.marketDataMap[securityID];

        if (kind == 'mkt') {
            mktdata.deserializeMktData(json);
        } else if (kind == 'signal') {
            mktdata.deserializeSignalData(json);
        }
        return mktdata;
    }

    // private subscribeSecurityData(): void {
    //     this.msgController.secUpdate$.subscribe({
    //         next: (resp: any) => {
    //             for (let secInfo of resp) {
    //                 this.createOrUpdateSecurity(secInfo['security_id'], secInfo);
    //             }
    //         },
    //         error: (error: Error) => {
    //             console.error(error);
    //         },
    //     });
    // }

    // async getSecurity(securityID: number, product_code = null, timeout = 30 * 1000): Promise<Security> {
    //     // securityID += 0;
    //     try {
    //         await commons.waitUntil(() => (securityID in this.securitiesMap), timeout);
    //         return this.securitiesMap[securityID];
    //     } catch (err) {
    //         console.error(err, 'securityID', securityID);
    //         // throw err;
    //         this.addSecurity(securityID);
    //         return this.createOrUpdateSecurity(
    //             securityID, { security_id: securityID, product_code: product_code });
    //     }
    // }

    // async addSecurity(securityID: number): Promise<void> {
    //     await this.msgController.addSecurity(securityID);
    // }

    // public async createOrUpdateSecurityAsync(securityID: number, json: Object): Promise<Security> {
    //     if (json == null || securityID == null) {
    //         console.error('empty security encoutered');
    //         return null;
    //     }

    //     securityID = +securityID;
    //     if (!((securityID) in this.securitiesMap)) {
    //         this.securitiesMap[securityID] = new Security(
    //             securityID, this.marketDataService.getMarketData(securityID));
    //     }
    //     let security = this.securitiesMap[securityID];

    //     await security.deserialize(json, this);
    //     return security;
    // }
}
