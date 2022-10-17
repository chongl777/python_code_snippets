import { Inject, Injectable } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';

import { TradingSignal, EMC, RVS, DataFrame } from '@models/marketData/index';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';

import { MarketDataSource } from '@models/marketDataSource/index';
import { TradingRecords } from '@models/tradingRecords';
import { Security } from '@app/models/security';


let SIGNALMAP = { 1: EMC, 2: EMC, 10: EMC, 7: RVS };


@Injectable({
    providedIn: 'root'
})
export class MarketDataService {

    signalData: { [sid: number]: any } = {};
    secHistData: { [sid: number]: any } = {};
    tradingRecData: { [sid: number]: any } = {};
    secAttrData: { [sid: number]: any } = {};
    priceData: { [sid: number]: DataFrame } = {};
    secRtg: { [sid: number]: any } = {};

    public updateLoading$ = new BehaviorSubject<boolean>(false);
    public subscription = new Subscription();
    public marketDataUpdate$ = new Subject();

    constructor(
        @Inject('MarketDataSource') private dataSource: MarketDataSource,
    ) {

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    async getSignalData<T>(securityID: number, signalSrc: number): Promise<T> {
        try {
            securityID = +securityID;
            this.signalData[securityID] || (this.signalData[securityID] = {});
            if (this.signalData[securityID][signalSrc] == null) {
                let json = await this.dataSource.getTradingSignal(securityID, signalSrc);
                let tradingSignal = (new SIGNALMAP[signalSrc](securityID, signalSrc)).deserialize(json);
                this.signalData[securityID][signalSrc] = tradingSignal;
            }

            return this.signalData[securityID][signalSrc];
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async getSecurityTrdingRecords(securityID: number, fundIDs: number[]): Promise<any> {
        try {
            securityID = +securityID;

            if (this.tradingRecData[securityID] == null) {
                let json = await this.dataSource.getSecurityTrdingRecords([securityID], fundIDs);
                this.tradingRecData[securityID] = new TradingRecords(securityID);
                json[securityID] && this.tradingRecData[securityID].deserialize(json[securityID]);
            }

            return this.tradingRecData[securityID];
        } catch (err) {
            console.error(err);
            return null
            //throw err;
        }
    }

    async getSecurityPriceHist(securityID: number): Promise<any> {
        try {
            securityID = +securityID;

            if (this.priceData[securityID] == null) {
                let px = await this.dataSource.getSecurityPriceHist([securityID]);
                px.forEach(x => { x['t_date'] = new Date(x['t_date']).getTime() });
                this.priceData[securityID] = (
                    new DataFrame('t_date', [securityID])).setData(px);
            }

            return this.priceData[securityID];
        } catch (err) {
            console.error(err);
            return null
            //throw err;
        }
    }

    async getSecurityAttr(securityID: number): Promise<any> {
        try {
            securityID = +securityID;

            if (this.secAttrData[securityID] == null) {
                let json = await this.dataSource.getSecurityAttr(securityID);
                json['short_lasttime'] && (json['short_lasttime'] = new Date(json['short_lasttime']));
                json['liq_lastupdate'] && (json['liq_lastupdate'] = new Date(json['liq_lastupdate']));
                this.secAttrData[securityID] = json;
            }

            return this.secAttrData[securityID];
        } catch (err) {
            console.error(err);
            return null
            //throw err;
        }
    }

    async getSecurityRtg(securityID: number): Promise<any> {
        try {
            securityID = +securityID;

            if (this.secRtg[securityID] == null) {
                let json = await this.dataSource.getSecurityRtg(securityID);
                json.forEach(x => {
                    x['t_date'] = new Date(x['t_date']);
                });
                this.secRtg[securityID] = json;
            }

            return this.secRtg[securityID];
        } catch (err) {
            console.error(err);
            return null
            //throw err;
        }
    }

    async getSecurityCurrentPx(securityID: number): Promise<any> {
        try {
            securityID = +securityID;

            let json = await this.dataSource.getSecurityCurrentPx(securityID);
            Object.keys(json).forEach(source_code => {
                json[source_code]['t_date'] = new Date(json[source_code]['t_date']);
            });
            return json
        } catch (err) {
            console.error(err);
            return null
            //throw err;
        }
    }

    async updateFinraID(security: Security): Promise<any> {
        this.updateLoading$.next(true);
        try {

            let rslt = await this.dataSource.updateFinraID(security.securityID, security.ultimateParentID);
            this.updateLoading$.next(false);
            return rslt;
        } catch (err) {
            this.updateLoading$.next(false);
            throw err
            //throw err;
        }
    }

    async updateFinraPrice(security: Security): Promise<any> {
        this.updateLoading$.next(true);
        try {
            let rslt = await this.dataSource.updateFinraPrice(security.securityID, security.ultimateParentID);
            this.updateLoading$.next(false);
            return rslt;
        } catch (err) {
            this.updateLoading$.next(false);
            throw err
            //throw err;
        }
    }

    async updateBBGPrice(security: Security): Promise<any> {
        this.updateLoading$.next(true);
        try {
            let rslt = await this.dataSource.updateBBGPrice(security.securityID, security.ultimateParentID);
            this.updateLoading$.next(false);
            return rslt;
        } catch (err) {
            this.updateLoading$.next(false);
            throw err
            //throw err;
        }
    }

    async updateCorpStructure(security: Security): Promise<any> {
        this.updateLoading$.next(true);
        try {

            let rslt = await this.dataSource.updateCorpStructure(security.ultimateParentID);
            this.updateLoading$.next(false);
            return rslt;
        } catch (err) {
            this.updateLoading$.next(false);
            throw err
            //throw err;
        }
    }

    async updateCache(all: boolean): Promise<any> {
        this.updateLoading$.next(true);
        try {
            let rslt = await this.dataSource.updateCache(all);
            this.updateLoading$.next(false);
            return rslt;
        } catch (err) {
            this.updateLoading$.next(false);
            throw err
            //throw err;
        }
    }
}
