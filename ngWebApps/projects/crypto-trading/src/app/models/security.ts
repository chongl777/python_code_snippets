import { MarketDataService } from '@app/services/market-data.service';
import * as d3 from 'd3';
import { merge, Observable, Subject } from 'rxjs';
import { MarketData } from './market';


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


class CryptoImpl extends SecurityImpl {

    _ccy: string;

    deserialize(json: any): CryptoImpl {
        this._ccy = 'USDT';
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
        return 'Crypto';
    }
}


let SECTYPEMAP = {
    19: CryptoImpl,
}


export class Security {
    readonly securityID: number;
    _impl: SecurityImpl;

    productCode: number;
    description: string = null;
    ticker: string;


    get update$(): Observable<any> {
        return this._impl.update$;
    };

    _marketData: MarketData;

    get marketData(): MarketData {
        if (this._marketData == null) {
            this._marketData = this.mktDataService.marketDataMap[this.securityID];
        }
        return this._marketData;
    }

    constructor(securityID: number, private mktDataService: MarketDataService) {
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
        this.description = generalInfo['name'];
        this.ticker = generalInfo['ticker'];
        return this;
    }
}
