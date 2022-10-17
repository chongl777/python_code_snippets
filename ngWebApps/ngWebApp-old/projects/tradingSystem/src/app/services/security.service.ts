import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RxStompState } from '@stomp/rx-stomp';
import { RxStompService } from '@stomp/ng2-stompjs';

import { Security } from '../models/security';
import { MsgClient } from '../models/msgClient';
import { MarketDataService } from './market-data.service';
import { BehaviorSubject } from 'rxjs';
import { MsgControllerService } from './msg-controller.service';
import { environment } from '@environments/environment';
import * as commons from '@app/models/commons';

type SecurityMap = Record<string, Security>
let TIMEOUT = environment.default_timeout;


@Injectable({
    providedIn: 'root'
})
export class SecurityService {

    securitiesMap: SecurityMap = {};
    public loading$: BehaviorSubject<boolean>;

    constructor(
        private msgController: MsgControllerService,
        private marketDataService: MarketDataService,
    ) {
        this.loading$ = this.msgController.sec_loading$;
        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.createAllSecurities();
            }
        });
        this.subscribeSecurityData();
    }

    private createAllSecurities(): void {
        console.log('load all securities info...');

        this.loading$.next(true);
        let sub$ = this.msgController.secLoad$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                this.loading$.next(false);
                console.log('load all securities info done!');
            }))
            .subscribe({
                next: (resp: any) => {
                    for (let secInfo of resp) {
                        this.createOrUpdateSecurity(secInfo['security_id'], secInfo);
                    }
                },
                error: (error: Error) => {
                    console.error(error);
                },
            });
    }

    private subscribeSecurityData(): void {
        this.msgController.secUpdate$.subscribe({
            next: (resp: any) => {
                for (let secInfo of resp) {
                    this.createOrUpdateSecurity(secInfo['security_id'], secInfo);
                }
            },
            error: (error: Error) => {
                console.error(error);
            },
        });
    }

    async getSecurity(securityID: number, product_code = null, timeout = 30 * 1000): Promise<Security> {
        // securityID += 0;
        try {
            await commons.waitUntil(() => (securityID in this.securitiesMap), timeout);
            return this.securitiesMap[securityID];
        } catch (err) {
            console.error(err, 'securityID', securityID);
            // throw err;
            this.addSecurity(securityID);
            return this.createOrUpdateSecurity(
                securityID, { security_id: securityID, product_code: product_code });
        }
    }

    async addSecurity(securityID: number): Promise<void> {
        await this.msgController.addSecurity(securityID);
    }

    public createOrUpdateSecurity(securityID: number, json: Object): Security {
        if (json == null || securityID == null) {
            console.error('empty security encoutered')
            return
        }

        securityID = +securityID;
        if (!((securityID) in this.securitiesMap)) {
            this.securitiesMap[securityID] = new Security(
                securityID, this.marketDataService.getMarketData(securityID));
        }
        let security = this.securitiesMap[securityID];

        security.deserialize(json, this);
        return security;
    }
}
