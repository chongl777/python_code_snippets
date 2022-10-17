import * as d3 from 'd3';
import { merge, Observable, Subject } from 'rxjs';


class SecurityImpl {
    _update$: Observable<any>;

    constructor() {
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

    _deal = 'other';

    get deal() {
        return this._deal;
    }

    set deal(x: string) {
        this._deal = x;
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
}


class BondImpl extends SecurityImpl {
    short_name: string;
    coupon: number;
    _liqScore: number;
    _marketSegment: string;
    payment_rank: string;
    collateral_type: string;
    sinkable: string;
    callable: string;
    putable: string;
    maturity: Date;

    get bbg_dpt(): string {
        return 'Corp';
    }

    deserialize(json: any): BondImpl {
        this._marketSegment = json['marketsegment'];
        this.coupon = json['coupon'];
        this.payment_rank = json['payment_rank'];
        this.collateral_type = json['collateral_type'];
        this.deal = json['deal'];
        this.sinkable = json['sinkable'];
        this.callable = json['callable'];
        this.putable = json['putable'];
        this.maturity = new Date(json['maturity']);
        return this;
    }

    get update$(): Observable<any> {
        return this._update$;
    }

    get fixSecurityIDSource(): number {
        return 4;
    }

    get multiplier(): number {
        return 0.01;
    }

    get secType(): string {
        return 'Corporate Bond';
    }

    get marketSegment(): string {
        return this._marketSegment;
    }

    get liqScore(): number {
        return this._liqScore;
    }
}


class CurrencyImpl extends SecurityImpl {

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


class EquityImpl extends SecurityImpl {

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

class FundImpl extends EquityImpl { };

class FutureImpl extends SecurityImpl {

    _multiplier: number;
    _deal: string;
    _maturity: Date;
    _description: string;
    undlSecurity: Security;

    deserialize(json: any): FutureImpl {
        this._multiplier = json.multiplier;
        this._deal = json['deal'];
        this._maturity = new Date(json['maturity']);
        this._description = json['description'];
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


class OptionImpl extends SecurityImpl {

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
    ultimateParentID: number;
    status: any;
    region: string;
    cntry_of_risk: string;
    group_rank: number;
    group_name: string;
    parents: number[] = [];
    recent_outstdg: number;
    outstdg_date: Date;

    get undlSecurity(): Security {
        if (['Future'].includes(this.secType)) {
            return (this._impl as any).undlSecurity;
        }
        return null;
    }

    get level(): number {
        return 0;
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
    get corpLevel(): number {
        return this.parents.length;
    }

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

    constructor(securityID: number) {
        this.securityID = +securityID;
    }

    deserialize(json: any): Security {
        let generalInfo = json;
        if (this.securityID != (+generalInfo['security_id'])) {
            throw Error('Security ID does not match!');
        }

        if (generalInfo['product_code'] != null) {
            try {
                this.productCode = generalInfo['product_code'];
                this._impl = new SECTYPEMAP[this.productCode]().deserialize(json);
            } catch (err) {
                console.error(err);
                this._impl = new SecurityImpl();
            }
        } else {
            this._impl = new SecurityImpl();
        }
        this.description = generalInfo['description'];
        this.companyID = +generalInfo['company_id'];
        this.isin = generalInfo['isin'];
        this.cusip = generalInfo['cusip'];
        this.finra_ticker = generalInfo['finra_ticker'];
        this.bbg_id = generalInfo['bbg_id'];
        this.payment_rnk = generalInfo['payment_rnk'];
        this.industry_level_1 = generalInfo['industry_level_1'];
        this.industry_level_2 = generalInfo['industry_level_2'];
        this.short_name = generalInfo['short_name'];
        this.companyID = generalInfo['company_id'];
        this.ultimateParentID = generalInfo['ultimate_parent_id'];
        this.status = generalInfo['status'];
        this.region = generalInfo['region'];
        this.ccy = generalInfo['ccy'];
        this.cntry_of_risk = generalInfo['cntry_of_risk'];
        this.group_name = generalInfo['group_name'];
        this.group_rank = +generalInfo['group_rank'];
        this.parents = generalInfo['parents'] || [];

        this.recent_outstdg = generalInfo['recent_outstdg'];
        this.outstdg_date = generalInfo['outstdg_date'] && new Date(generalInfo['outstdg_date']);
        return this;
    }
}


export class NullSecurity extends Security {
    constructor() {
        super(-1);
    }
}
