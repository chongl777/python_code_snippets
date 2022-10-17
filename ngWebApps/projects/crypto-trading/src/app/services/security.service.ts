import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RxStompState } from '@stomp/rx-stomp';
import { RxStompService } from '@stomp/ng2-stompjs';

import { Security } from '../models/security';
// import { MsgClient } from '../models/msgClient';
// import { MarketDataService } from './market-data.service';
import { BehaviorSubject } from 'rxjs';
import { MsgControllerService } from './msg-controller.service';
import { environment } from '@environments/environment';
import { MarketDataService } from './market-data.service';


@Injectable({
    providedIn: 'root'
})
export class SecurityService {

    securitiesMap: { [sid: number]: Security } = {};
    public loading$ = new BehaviorSubject<boolean>(true);
    public securities$ = new BehaviorSubject<Security[]>([]);

    constructor(
        private msgController: MsgControllerService,
        private mktDataService: MarketDataService,
    ) {
        // this.loading$ = this.msgController.sec_loading$;
        this.msgController.mktConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.createAllSecurities();
            }
        });
        // this.subscribeSecurityData();
    }

    private createAllSecurities(): void {
        console.log('load all securities info...');

        this.loading$.next(true);
        let sub$ = this.msgController.secList$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                this.securities$.next(Object.values(this.securitiesMap))
                this.loading$.next(false);
                console.log('load all securities info done!');
            }))
            .subscribe({
                next: (secInfo: any) => {
                    this.createOrUpdateSecurity(secInfo['security_id'], secInfo);
                },
                error: (error: Error) => {
                    // this.loading$.error(error);
                    error.message = 'SecurityService: ' + error.message;
                    this.loading$.error(error);
                    console.error(error);
                },
            });
    }

    public createOrUpdateSecurity(securityID: number, json: Object): Security {
        if (securityID == null) {
            console.error('empty security encoutered');
            return null;
        }

        securityID = +securityID;
        if (!((securityID) in this.securitiesMap)) {
            this.securitiesMap[securityID] = new Security(
                securityID, this.mktDataService);
        }
        let security = this.securitiesMap[securityID];

        if (!(json == null)) {
            security.deserialize(json);
        }
        return security;
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


export class SecurityDataService {
    public securities$ = new BehaviorSubject<Security[]>([]);
    private sortFunc: (a: Security, b: Security) => number = (a, b) => 0;
    private seclist: Security[];
    public loading$: BehaviorSubject<boolean>;
    constructor(
        private securityService: SecurityService
    ) {
        this.loading$ = this.securityService.loading$;
        this.securityService.securities$.subscribe({
            next: (seclist: Security[]) => {
                this.seclist = seclist;

                this.update();
            }
        })
    }

    sort(sortFunc: (a: Security, b: Security) => number): void {
        this.sortFunc = sortFunc;
        this.seclist = this.seclist.sort(this.sortFunc);
        this.update();
    }

    update(): void {
        this.securities$.next(this.seclist);
    }
}
