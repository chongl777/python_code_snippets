import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';

import { Serializable } from './serializable';


class PriceSource implements Serializable<PriceSource> {
    price: number = null;
    price_prev: number = null;
    t_date: Date = new Date(null);

    constructor() { }

    get diff(): number {
        if (this.price_prev == null) {
            return 0;
        }
        return this.price - this.price_prev;
    }

    deserialize(json: any): PriceSource {
        this.t_date = new Date(json['t_date']) || this.t_date;
        this.price = json['price'] || this.price;
        this.price_prev = json['price_prev'] || this.price_prev;

        return this;
    }
}


class BBGSource extends PriceSource {
    deserialize(json: any, normalize = false): PriceSource {
        let t_date = new Date(json['t_date']) || this.t_date;
        if (normalize) {
            t_date.setHours(23);
            t_date.setMinutes(59);
        }

        if (t_date > this.t_date) {
            this.price = json['price'] || this.price;
            this.price_prev = json['price_prev'] || this.price_prev;
            this.t_date = t_date;
        }

        return this;
    }
}


class PriceData implements Serializable<PriceData> {
    securityID: number;
    bbg_price = new BBGSource();
    finra_price = new PriceSource();
    capiq_price = new PriceSource();
    manual_price = new PriceSource();
    private dates: Date[];

    constructor(securityID: number) {
        this.securityID = securityID;
    }

    private priceWaterFlow(t_dates: Date[]): number {
        if (t_dates.length == 0) {
            return null;
        }
        let t_date = t_dates[t_dates.length - 1];

        if (this.manual_price.price && this.manual_price.t_date >= t_date) {
            return this.manual_price.price;
        }

        if (this.finra_price.price && this.finra_price.t_date >= t_date) {
            return this.finra_price.price;
        }

        if (this.bbg_price.price && this.bbg_price.t_date >= t_date) {
            return this.bbg_price.price;
        }

        if (this.capiq_price.price && this.capiq_price.t_date >= t_date) {
            return this.capiq_price.price;
        }

        return this.priceWaterFlow(t_dates.slice(0, t_dates.length - 1));
    }

    get compositePrice() {
        if (this.dates == null) {
            return null;
        }
        // console.log('securityID', this.securityID);
        return this.priceWaterFlow(this.dates);
    }

    get compositePricePrev() {
        if (this.manual_price.price_prev) {
            return this.manual_price.price_prev;
        }

        if (this.finra_price.price_prev) {
            return this.finra_price.price_prev;
        }

        if (this.bbg_price.price_prev) {
            return this.bbg_price.price_prev;
        }

        if (this.capiq_price.price_prev) {
            return this.capiq_price.price_prev;
        }
        return null;
    }

    get compositeDiff() {
        return (this.compositePrice - this.compositePricePrev) || 0;
    }

    deserialize(json: Object): PriceData {
        let dateFormat = (x: Date) => (new DatePipe('en-US')).transform(x, 'y-MM-ddT00:00:00');
        let dates = [];

        if (json.hasOwnProperty('2')) {
            this.bbg_price.deserialize(json['2'], false);
        }
        if (json.hasOwnProperty('1')) {
            this.bbg_price.deserialize(json['1'], true);
        }
        if (json.hasOwnProperty('4')) {
            this.finra_price.deserialize(json['4']);
        }
        if (json.hasOwnProperty('0')) {
            this.manual_price.deserialize(json['0']);
        }
        if (json.hasOwnProperty('19')) {
            this.capiq_price.deserialize(json['19']);
        }

        this.bbg_price.t_date && dates.push(dateFormat(this.bbg_price.t_date));
        this.finra_price.t_date && dates.push(dateFormat(this.finra_price.t_date));
        this.manual_price.t_date && dates.push(dateFormat(this.manual_price.t_date));
        this.capiq_price.t_date && dates.push(dateFormat(this.capiq_price.t_date));
        this.dates = [...new Set(dates)].map((x: string) => new Date(x)).sort(
            (a: Date, b: Date) => a.getTime() - b.getTime());
        return this;
    }
}


class ShortCost implements Serializable<ShortCost> {
    rate: number;
    status: string = 'Unavailable';
    quantity: number;
    t_date: Date;

    constructor() {
        this.quantity = null;
        this.t_date = null
        this.rate = null;
    }

    deserialize(json: Object): ShortCost {
        this.quantity = (+json['quantity_filled']);
        this.rate = (+json['rate/fee']);
        this.t_date = new Date(json['short_allocated_date']);
        this.status = json['status'] || this.status;
        return this;
    }
}


class OutstandingAmt implements Serializable<OutstandingAmt> {
    value: number;
    t_date: Date;

    constructor() {
        this.value = null;
        this.t_date = null
    }

    deserialize(json: Object): OutstandingAmt {
        this.value = (+json['value']);
        this.t_date = new Date(json['t_date']);
        return this;
    }
}


class IntradayRet implements Serializable<IntradayRet> {
    ret: number;
    t_date: Date;

    constructor() {
        this.ret = null;
        this.t_date = null
    }

    deserialize(json: Object): IntradayRet {
        this.ret = (+json['ret']);
        this.t_date = new Date(json['t_date']);
        return this;
    }
}


class Rating implements Serializable<Rating> {
    rtg: string;
    rtg_normal: string;
    rtg_prev: string;
    rtg_date: Date;
    rtg_rnk: number;

    constructor() {
        this.rtg = null;
        this.rtg_prev = null;
    }

    deserialize(json: Object): Rating {
        this.rtg = json['rtg'];
        this.rtg_prev = json['rtg_prev'];
        this.rtg_date = new Date(json['rtg_date']);
        this.rtg_rnk = (+json['rtg_rnk']) || 100;
        this.rtg_normal = json['rtg_normal'];
        return this;
    }
}


class YieldData implements Serializable<YieldData> {
    public ytw: { yld?: number, t_date?: Date, modified_dur?: number } = {};
    public ytm: { yld?: number, t_date?: Date, modified_dur?: number } = {};
    public ytf: { yld?: number, t_date?: Date, modified_dur?: number } = {};

    constructor() {
    }

    deserialize(json: Object): YieldData {
        function parseYield(json: Object): { yld: number, t_date: Date, modified_dur: number } {
            return {
                yld: parseFloat(json['yld']),
                modified_dur: parseFloat(json['modified_dur']),
                t_date: new Date(json['t_date']),
            }
        }
        if (json.hasOwnProperty('ytm')) {
            this.ytm = parseYield(json['ytm']);
        }

        if (json.hasOwnProperty('ytw')) {
            this.ytw = parseYield(json['ytw']);
        }

        if (json.hasOwnProperty('ytf')) {
            this.ytf = parseYield(json['ytf']);
        }

        return this;
    }
}


export class MarketData implements Serializable<MarketData>  {
    readonly securityID: number;
    readonly shortCost: ShortCost = new ShortCost();
    readonly outstandingAmt: OutstandingAmt = new OutstandingAmt();
    readonly intradayRet: IntradayRet = new IntradayRet();
    readonly rating: Rating = new Rating();
    readonly yieldData: YieldData = new YieldData();
    readonly priceData: PriceData;
    public callDates: any[];
    public factor: number;

    public update$ = new Subject();

    emcScoreData = {
        emc_score: null
    };
    rvsScoreData = {
        rvs_score: null,
        leverage: null,
        leverage_ratio: null,
        leverage_score: null,
        leverage_score_secwise: null,
        total_debt: null,
        eqt_mktcap: null,
    };

    fallenAngleData = {
        first_date: null,
        num_of_month_in_indx: null,
    };

    public setCallDts(callDates: any[]) {
        this.callDates = callDates;
        this.update$.next();
    }

    constructor(securityID: number) {
        this.securityID = +securityID;
        this.priceData = new PriceData(this.securityID);
    }

    deserialize(json: Object): MarketData {
        let need_update = false;

        if (this.securityID != (+json['security_id'])) {
            throw Error('Security ID does not match!');
        }

        if (json.hasOwnProperty('mkt_px')) {
            this.priceData.deserialize(json['mkt_px']);
            need_update = true;
        }

        if (json.hasOwnProperty('yield')) {
            this.yieldData.deserialize(json['yield']);
            need_update = true;
        }

        if (json.hasOwnProperty('outstanding_amt')) {
            this.outstandingAmt.deserialize(json['outstanding_amt']);
            need_update = true;
        }

        if (json.hasOwnProperty('intraday_ret')) {
            this.intradayRet.deserialize(json['intraday_ret']);
            need_update = true;
        }

        if (json.hasOwnProperty('short_info')) {
            this.shortCost.deserialize(json['short_info']);
            need_update = true;
        }

        if (json.hasOwnProperty('rtg')) {
            this.rating.deserialize(json['rtg']);
            need_update = true;
        }

        if (json.hasOwnProperty('rvs_score')) {
            this.rvsScoreData = {
                ...this.rvsScoreData,
                ...json['rvs_score'],
            }
            this.rvsScoreData.leverage_ratio = (
                this.rvsScoreData.total_debt + this.rvsScoreData.eqt_mktcap) /
                this.rvsScoreData.eqt_mktcap;
            need_update = true;
        }

        if (json.hasOwnProperty('emc_score')) {
            this.emcScoreData = {
                ...this.emcScoreData,
                ...json['emc_score'],
            }
            need_update = true;
        }

        if (json.hasOwnProperty('fa_info')) {
            this.fallenAngleData = {
                ...this.fallenAngleData,
                ...json['fa_info'],
            }
            need_update = true;
        }

        if (need_update) {
            this.update$.next();
        }

        this.factor = json['factor'] || this.factor || 1;

        return this;
    }
}
