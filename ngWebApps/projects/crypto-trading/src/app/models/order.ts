import { Security } from '@app/models/security';
import { v4 as uuid } from 'uuid';


export enum Side {
    Buy = '1',
    Sell = '2',
}

export enum OrderType {
    Market = '1',
    Limit = '2',
}


export class Fill {
    constructor(
        public trade_id: string,
        public match_size: number,
        public match_price: number,
        public liquidity: string,
        public time: Date,
    ) { }
}


export class Order {
    constructor(public security: Security) {
        this.order_type = OrderType.Limit;
        this.client_oid = uuid();
        this.side = Side.Buy;
    };
    public order_id: string;
    public side: Side;
    public quantity: number;
    public price: number;
    public order_type: OrderType;
    public client_oid: string;
    public order_time: Date;
    public status: string;
    public selected = false;
    public fills: { [id: string]: Fill } = {};
    public filled_size: number;
    public filled_price: number;

    private filled_size_calc() {
        return Object.values(this.fills).reduce((x: number, y: Fill) => x + y.match_size, 0);
    }

    private filled_price_calc() {
        let v1 = this.filled_size;
        if (v1 == 0) {
            return 0;
        }
        let v = Object.values(this.fills).reduce(
            (x: number, y: Fill) => x + y.match_price * y.match_size, 0)
        return v / this.filled_size;
    }

    get fills_array() {
        return Object.values(this.fills);
    }

    public to_dict(): any {
        return {
            sid: this.security.securityID,
            side: this.side == Side.Buy ? 'buy' : 'sell',
            quantity: this.quantity,
            order_type: this.order_type,
            price: this.price,
            client_oid: this.client_oid,
            status: this.status,
            order_time: this.order_time,
        }
    }

    public add_fill(json: any) {
        this.fills[json['tradeId']] = new Fill(
            json['tradeId'],
            (+json['matchSize']),
            (+json['matchPrice']),
            json['liquidity'],
            new Date(json['ts'] / 1000000),
        )

        if (Object.values(this.fills).length != 0) {
            console.log(this.fills);
        }

        this.filled_size = this.filled_size_calc();
        this.filled_price = this.filled_price_calc();
    }
}
