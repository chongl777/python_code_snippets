
export class TradingRecord {
    tradeAmount: number;
    positionSize: number;
    tradeDt: Date;
    details: any[];
    price: number;

    end: Date;

    get title() {
        let text = '<tspan x="0" dy="0em">' +
            (this.tradeAmount > 0 ? 'Buy' : 'Sell') +
            '</tspan><tspan x="0" dy="1em">' +
            (this.tradeAmount / 1000000) + 'MM' + '</tspan>';
        return text;
    }

    get klass() {
        return (this.tradeAmount > 0 ? 'positive' : 'negative')
    }

    get start() {
        return this.tradeDt;
    }

    get value() {
        return this.price;
    }

    get index() {
        return this.tradeDt;
    }

    get dir() {
        return this.tradeAmount > 0 ? 'up' : 'down';
    }

    deserialize(json: any): TradingRecord {
        this.tradeAmount = +json['trade'];
        this.positionSize = +json['position_size'];
        this.tradeDt = new Date(json['t_date']);
        this.end = json['end'] == null ? null : new Date(json['end']);
        this.details = json['data'].map(x => {
            x['trade_dt'] = new Date(x['trade_dt']);
            return x;
        })
        this.price = +json['price'];
        return this;
    }
}


export class TradingRecords {
    readonly securityID: number;
    public records: TradingRecord[] = [];

    constructor(securityID: number) {
        this.securityID = +securityID;
    }

    deserialize(json: any[]): TradingRecords {
        json.forEach(x => {
            let rec = (new TradingRecord()).deserialize(x);
            this.records.push(rec);
        });
        return this;
    }
}
