import { Injectable } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompState } from '@stomp/rx-stomp';
import { catchError, finalize } from 'rxjs/operators';

import { MarketData } from '../models/marketData';
import { MsgControllerService } from './msg-controller.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';


type MarketDataMap = Record<string, MarketData>


@Injectable({
    providedIn: 'root'
})
export class MarketDataService {

    marketDataMap: MarketDataMap = {};
    public loading$ = new BehaviorSubject<boolean>(false);
    public marketDataUpdateSub = new Subscription();
    public marketDataUpdate$ = new Subject();

    constructor(
        private msgController: MsgControllerService,
    ) {
        this.loading$ = this.msgController.marketData_loading$;
        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.loadAllMarketData();
                // this.createAllMarketData()
            }
        });
        this.subscribeMktData();
    }

    private subscribeMktData(): void {
        this.msgController.marketDataUpdate$.subscribe({
            next: (mktDataList: any[]) => {
                for (let mktData of mktDataList) {
                    this.createOrUpdateMarketData(mktData);
                }
            },
            error: (error: Error) => console.error(error),
        });
    }

    ngOnDestroy() {
        this.marketDataUpdateSub.unsubscribe();
    }

    getMarketData(securityID: number): MarketData {
        if (!(securityID in this.marketDataMap)) {
            this.marketDataMap[securityID] = new MarketData(securityID);
            this.marketDataUpdateSub.add(
                this.marketDataMap[securityID].update$.subscribe(
                    () => this.marketDataUpdate$.next()));
        }
        return this.marketDataMap[securityID];
    }

    createOrUpdateMarketData(marketData: any, security_id?: number): void {
        let securityID = security_id || marketData['security_id'];
        if ((marketData == null) || securityID == null) {
            return
        }
        let data = this.getMarketData(securityID);
        data.deserialize(marketData);
    }

    // createMarketDataIfNotExist(marketData: any, security_id?: number): void {
    //     let securityID = security_id || marketData['security_id'];
    //     if ((marketData == null) || securityID == null) {
    //         return
    //     }
    //     if (!(securityID in this.marketDataMap)) {
    //         this.marketDataMap[securityID] = new MarketData(securityID);
    //         this.marketDataMap[securityID].deserialize(marketData);
    //     }
    // }

    /*
    private createAllMarketData(): void {
        this.loading$.next(true);
        let sub$ = this.msgController.marketDataLoad$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                this.loading$.next(false);
            }))
            .subscribe({
                next: (mktData: any) => {
                    this.createOrUpdateMarketData(mktData);
                },
                error: (error: Error) => {
                    console.error(error);
                },
            });
    }
    */

    private loadAllMarketData(): void {
        this.loading$.next(true);
        console.log('load all market data...');

        let sub$ = this.msgController.marketDataLoad$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                this.loading$.next(false);
                console.log('load all market done!');
            }))
            .subscribe({
                next: (resp: any) => {
                    for (let mktData of resp) {
                        try {
                            this.createOrUpdateMarketData(mktData);
                        } catch (err: unknown) {
                            console.error(err);
                        }
                    }
                },
                error: (error: Error) => {
                    console.error("load market data failed!");
                    console.error(error);
                },
            });
    }
}
