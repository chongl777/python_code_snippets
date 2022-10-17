import { SecurityService } from '@app/services/security.service';
import * as d3 from 'd3';
import { merge, Observable, Subject } from 'rxjs';
import { MarketData } from './market';
import { Security } from './security';



export class Account {
    public coin: string;
    public acct_type: string;
    public balance: number;
    public available: number;
    private _security: Security;
    private securityID: number;
    private _marketData: MarketData;

    get security(): Security {
        if (this._security == null) {
            this._security = this._securityService.securitiesMap[this.securityID];
        }
        return this._security;
    }

    get marketData(): MarketData {
        if (this._marketData == null) {
            if (this.security != null) {
                this._marketData = this.security.marketData;
            }
        }
        return this._marketData;
    }

    get lastPrice(): number {
        if (this.securityID == 24287) {
            return 1;
        }
        return this.marketData && this.marketData.lastPrice;
    }

    get marketVal(): number {
        return this.lastPrice * this.balance;
    }

    constructor(public id: string, private _securityService: SecurityService) {
    }

    deserialize(json: any): Account {
        this.acct_type = json['type'];
        this.coin = json['currency'];
        this.balance = +json['balance'];
        this.available = +json['available'];
        this.securityID = +json['sid'];
        return this;
    }
}
