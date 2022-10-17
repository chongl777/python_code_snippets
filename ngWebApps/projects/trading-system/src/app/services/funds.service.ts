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
import { Fund } from '@app/models/fund';


@Injectable({
    providedIn: 'root'
})
export class FundsService {

    fundsMap: { [fund_id: number]: Fund } = {};
    funds$ = new BehaviorSubject<Fund[]>([]);
    public loading$: BehaviorSubject<boolean>;

    constructor(
        private msgController: MsgControllerService,
    ) {
        this.loading$ = this.msgController.funds_loading$;
        this.msgController.fixConnected$.subscribe((state: RxStompState) => {
            if (state === RxStompState.OPEN) {
                this.createAllFunds();
            }
        });
    }

    private createAllFunds(): void {
        console.log('load all funds info...');

        this.loading$.next(true);
        let sub$ = this.msgController.fundsLoad$
            .pipe(finalize(() => {
                sub$.unsubscribe();
                this.loading$.next(false);
                console.log('load all funds info done!');
            }))
            .subscribe({
                next: (resp: any) => {
                    for (let fundInfo of resp) {
                        this.createOrUpdateFund(fundInfo['fund_id'], fundInfo);
                    }
                    this.funds$.next(
                        Object.values(this.fundsMap));
                },
                error: (error: Error) => {
                    error.message = 'FundsService: ' + error.message;
                    this.funds$.error(error);
                    this.loading$.error(error);
                    console.error(error);
                },
            });
    }

    getFund(fundID: number): Fund {
        return this.fundsMap[fundID];
    }

    public createOrUpdateFund(fundID: number, json: Object): Fund {
        fundID = +fundID;
        if (!((fundID) in this.fundsMap)) {
            this.fundsMap[fundID] = new Fund(fundID);
        }
        let fund = this.fundsMap[fundID];

        fund.deserialize(json);
        return fund;
    }
}

export class FundsDataService {
    public funds$ = new BehaviorSubject<Fund[]>([]);
    public funds: Fund[];
    public loading$: BehaviorSubject<boolean>;

    constructor(
        private fundsService: FundsService,
    ) {

        this.fundsService.funds$.subscribe({
            next: (funds: Fund[]) => {
                this.funds = funds;
                this.update();
            },
            error: (err) => {
                this.funds$.error(err);
            }
        });

        this.loading$ = this.fundsService.loading$;
    }

    update(): void {
        this.funds$.next(this.funds);
    }

}
