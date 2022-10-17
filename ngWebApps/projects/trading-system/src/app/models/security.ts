import { merge, Observable, Subject } from 'rxjs';
import * as d3 from 'd3';

import { Serializable } from './serializable';
import { MarketData } from './marketData'
import { SecurityService } from '@app/services/security.service';
import { SecurityEvent } from './securityEvent';


class SecurityImpl {
    marketData: MarketData;
    _update$: Observable<any>;

    constructor(marketData: MarketData) {
        this.marketData = marketData;
        this._update$ = this.marketData.update$.asObservable();
    }

    get expiry(): string {
        return null;
    }

    get strike(): number {
        return null;
    }

    get callPut(): string {
        return null;
    }

    get update$(): Observable<any> {
        return this._update$;
    }

    get fixSecurityID(): string {
        return null;
    }

    get fixSecurityIDSource(): number {
        return null;
    }

    get multiplier() {
        return 1.00;
    }

    get deal() {
        return 'other';
    }

    get secType(): string {
        return 'unknown';
    }

    get ccy(): string {
        return null;
    }

    get adj(): number {
        return 1;
    }

    get deal_eq_sec(): Security {
        return null;
    }

    get bbg_dpt(): string {
        return null;
    }

    get liqScore(): number {
        return null;
    }

    get marketSegment(): string {
        return null;
    }

    deserialize(json: any, securityService?: SecurityService): SecurityImpl {
        return this;
    }
}


class BondImpl extends SecurityImpl implements Serializable<BondImpl>{
    equity: Security;
    short_name: string;
    isin: string;
    coupon: number;
    _liqScore: number;
    _marketSegment: string;

    get bbg_dpt(): string {
        return 'Corp';
    }

    deserialize(json: any, securityService?: SecurityService): BondImpl {
        if (securityService && (json.equity_sid != null)) {
            securityService.getSecurity(parseInt(json.equity_sid))
                .then((x: Security) => this.equity = x);
        }
        this.short_name = json['short_name'];
        this.isin = json['isin'];
        this._liqScore = json['liqscore'];
        this._marketSegment = json['marketsegment'];
        this.coupon = json['coupon'];
        return this;
    }

    get update$(): Observable<any> {
        return merge(...[this._update$, (this.equity || {}).update$].filter(x => x != null));
    }

    get fixSecurityID(): string {
        return this.isin;
    }

    get fixSecurityIDSource(): number {
        return 4;
    }

    get multiplier(): number {
        return 0.01;
    }

    get deal(): string {
        return this.equity ? this.equity.deal : this.short_name;
    }
    get secType(): string {
        return 'Corporate Bond';
    }

    get deal_eq_sec(): Security {
        return this.equity;
    }

    get marketSegment(): string {
        return this._marketSegment;
    }

    get liqScore(): number {
        return this._liqScore;
    }
}


class CurrencyImpl extends SecurityImpl implements Serializable<CurrencyImpl>{

    _ccy: string;

    deserialize(json: any): CurrencyImpl {
        this._ccy = json['short_name'];
        return this;
    }

    get fixSecurityID(): string {
        return this._ccy;
    }

    get fixSecurityIDSource(): number {
        return 8;
    }


    get ccy(): string {
        return this._ccy;
    }

    get multiplier(): number {
        return 1;
    }

    get deal(): string {
        return this.ccy;
    }
    get secType(): string {
        return 'Currency';
    }

    get deal_eq_sec(): Security {
        return null;
    }
}


class EquityImpl extends SecurityImpl implements Serializable<EquityImpl>{

    _deal: string;
    _isin: string;
    deserialize(json: any): EquityImpl {
        this._deal = json['short_name'];
        this._isin = json['isin'];
        return this;
    }

    get bbg_dpt(): string {
        return 'Equity';
    }

    get deal_eq_sec(): Security {
        return null;
    }

    get fixSecurityID(): string {
        return this._isin;
    }

    get fixSecurityIDSource(): number {
        return 4;
    }

    get multiplier(): number {
        return 1;
    }

    get deal(): string {
        return this._deal;
    }

    get secType(): string {
        return 'Equity';
    }
}

class FundImpl extends EquityImpl implements Serializable<FundImpl>{ };

class FutureImpl extends SecurityImpl implements Serializable<FutureImpl>{

    _multiplier: number;
    _deal: string;
    _maturity: Date;
    _description: string;
    undlSecurity: Security;

    deserialize(json: any, securityService?: SecurityService): FutureImpl {
        this._multiplier = json.multiplier;
        this._deal = json['deal'];
        this._maturity = new Date(json['maturity']);
        this._description = json['description'];
        securityService.getSecurity(json['undl_security_id']).then((x: Security) => {
            this.undlSecurity = x;
        })
        return this;
    }

    get bbg_dpt(): string {
        return 'Comdty';
    }

    get fixSecurityID(): string {
        return this._description;
    }

    get fixSecurityIDSource(): number {
        return 8;
    }

    get multiplier(): number {
        return this._multiplier;
    }

    get deal(): string {
        return this._deal;
    }

    get secType(): string {
        return 'Future';
    }

    get deal_eq_sec(): Security {
        return null;
    }
}


class OptionImpl extends SecurityImpl implements Serializable<OptionImpl>{

    _multiplier: number;
    _deal: string;
    _maturity: Date;
    _description: string;
    _callPut: string;
    _strike: number;

    deserialize(json: any): OptionImpl {
        this._multiplier = json.multiplier;
        this._deal = json['deal'];
        this._maturity = new Date(json['maturity']);
        this._description = json['description'];
        this._callPut = json['callPut'];
        this._strike = json['strike'];
        return this;
    }

    get strike(): number {
        return this._strike;
    }

    get callPut(): string {
        return this._callPut;
    }

    get expiry(): string {
        return d3.timeFormat("%Y-%m-%dT%H:%M:%S")(this._maturity);
    }

    get bbg_dpt(): string {
        return 'Comdty';
    }

    get fixSecurityID(): string {
        return this._description;
    }

    get fixSecurityIDSource(): number {
        return 8;
    }

    get multiplier(): number {
        return this._multiplier;
    }

    get deal(): string {
        return this._deal;
    }

    get secType(): string {
        return 'Option';
    }

    get deal_eq_sec(): Security {
        return null;
    }
}


let SECTYPEMAP = {
    0: CurrencyImpl,
    2: OptionImpl,
    1: BondImpl,
    3: EquityImpl,
    5: FundImpl,
    6: SecurityImpl,
    7: FutureImpl,
}


export class Security {
    readonly securityID: number;
    _impl: SecurityImpl;

    productCode: number;
    description: string = null;
    companyID: number;
    industry_level_1: string;
    industry_level_2: string;
    payment_rnk: string;
    short_name: string;
    isin: string;
    cusip: string;
    finra_ticker: string;
    bbg_id: string;
    ccy: Security;
    secEvt: SecurityEvent;

    marketData: MarketData;

    get undlSecurity(): Security {
        if (['Future'].includes(this.secType)) {
            return (this._impl as any).undlSecurity;
        }
        return null;
    }

    get multiplier(): number {
        return this._impl.multiplier;
    }

    get coupon(): number {
        return this._impl['coupon'];
    }

    get bbg_links(): string {
        if (this._impl.bbg_dpt) {
            return `http://blinks.bloomberg.com/securities/${this.bbg_id}%20${this._impl.bbg_dpt}/`;
        }
        return null;
    }

    get sector(): string {
        if (this.secType == 'Currency') {
            return 'Cash';
        } else {
            return this.industry_level_1;
        }
    }

    get liqScore(): number {
        return this._impl.liqScore;
    }

    get fixSecurityID(): string {
        return this._impl.fixSecurityID;
    }

    get fixSecurityIDSource(): number {
        return this._impl.fixSecurityIDSource;
    }

    get secType(): string {
        return this._impl.secType;
    }

    get deal(): string {
        try {
            return this._impl.deal;
        } catch (err) {
            return 'other';
        }
    }

    get deal_eq_sec(): Security {
        try {
            return this._impl.deal_eq_sec;
        } catch (err) {
            return null;
        }
    }

    // get lastPrice(): number {
    //     return this._impl.compositePrice;
    // }

    get marketSegment(): string {
        return this._impl.marketSegment;
    }

    get adj(): number {
        return this._impl.adj;
    }

    get currency(): string {
        if (this.secType == 'Currency') {
            return this._impl.ccy;
        } else {
            return this.ccy.short_name;
        }
    }

    get update$(): Observable<any> {
        return this._impl.update$;
    };

    constructor(securityID: number, marketData: MarketData) {
        this.securityID = +securityID;
        this.marketData = marketData;
        this._impl = new SecurityImpl(marketData);
        this.secEvt = new SecurityEvent();
    }

    async deserialize(json: any, securityService?: SecurityService): Promise<Security> {
        if (this.securityID != (+json['security_id'])) {
            throw Error('Security ID does not match!');
        }

        if (json['product_code'] != null) {
            try {
                this.productCode = json['product_code'];
                this._impl = new SECTYPEMAP[this.productCode](
                    this.marketData).deserialize(json, securityService);
            } catch (err) {
                console.error(err);
                this._impl = new SecurityImpl(this.marketData);
            }
        } else {
            this._impl = new SecurityImpl(this.marketData);
        }
        this.description = json['description'];
        this.companyID = +json['company_id'];
        this.isin = json['isin'];
        this.cusip = json['cusip'];
        this.finra_ticker = json['finra_ticker'];
        this.bbg_id = json['bbg_id'];
        this.payment_rnk = json['payment_rnk'];
        this.industry_level_1 = json['industry_level_1'];
        this.industry_level_2 = json['industry_level_2'];
        this.short_name = json['short_name'];
        this.secEvt.deserialize(json['sec_evt']);

        if (!['Currenty', 'Unknown'].includes(this.secType)) {
            if ((json['ccy_sid'] != null) && securityService) {
                // securityService.getSecurity(parseInt(json['ccy_sid']), 0).then((x) => {
                //     this.ccy = x;
                // });

                this.ccy = await securityService.getSecurity(parseInt(json['ccy_sid']), 0);
            }
        }
        return this;
    }

    set_ccy(ccy: Security): void {
        this.ccy = ccy;
    }
}


export class NullSecurity extends Security {
    constructor() {
        super(-1, new MarketData(-1));
    }
}
