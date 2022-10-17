import * as d3 from 'd3';
import { merge, Observable, Subject } from 'rxjs';


class TSMOM {
    ewa_s: number;
    ewa_l: number;
    u: number;

    deserialize(json: any): TSMOM {
        this.ewa_s = json['ewa_s'];
        this.ewa_l = json['ewa_u'];
        this.u = json['u'];
        return this;
    }
}


class TSMOMCombined {
    ts_s = new TSMOM();
    ts_m = new TSMOM();
    ts_l = new TSMOM();
    u: number;
    last_update: Date;

    deserialize(json: any): TSMOMCombined {
        this.ts_s.deserialize(json['u1']);
        this.ts_m.deserialize(json['u2']);
        this.ts_l.deserialize(json['u3']);
        this.u = (this.ts_s.u + this.ts_m.u + this.ts_l.u) / 3;
        this.last_update = new Date(json['t_date']);
        return this
    }
}


export class MarketData {
    readonly securityID: number;
    bidPrice: number;
    bidSize: number;

    askPrice: number;
    askSize: number;

    lastPrice: number;
    lastSize: number

    lastTime: Date;

    tsmom = new TSMOMCombined();

    constructor(securityID: number) {
        this.securityID = +securityID;
    }

    deserializeMktData(json: any): MarketData {
        this.bidPrice = parseFloat(json['bestBid']);
        this.bidSize = parseFloat(json['bestBidSize']);

        this.askPrice = parseFloat(json['bestAsk']);
        this.askSize = parseFloat(json['bestAskSize']);
        this.lastPrice = parseFloat(json['price']);
        this.lastSize = parseFloat(json['size']);
        this.lastTime = new Date(json['time']);
        return this;
    }

    deserializeSignalData(json: any): MarketData {
        this.tsmom.deserialize(json);
        return this
    }
}
