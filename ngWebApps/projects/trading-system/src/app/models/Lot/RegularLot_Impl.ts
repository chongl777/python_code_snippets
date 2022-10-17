import { Direction, LotType } from './LotType';
import { Security } from '../security';
import { MarketData } from '../marketData';
import { SecurityDataObject } from '../securityDataObject';


export class RegularLot extends SecurityDataObject implements LotType {
    marketData: MarketData
    quantity: number;
    prev_quantity: number;
    direction: Direction;
    tradeBasis: number;
    commissionBasis: number;
    costBasis: number;
    accrued: number;
    realized_pnl: number
    unrealized_int_pnl: number;
    prev_unrealized_pnl: number;
    prev_realized_pnl: number;
    _factor: number;

    constructor(security: Security) {
        super(security);
    }

    get unrealized_capital_pnl(): number {
        // if (this.securityID == 9677) {
        //     console.log('fx', this.fx);
        // }
        let val = (
            this.price * this.factor * this.fx -
            this.costBasis) * this.quantity * this.security.multiplier;
        return val || 0;
    }

    get pnl(): number {
        let data = this.realized_pnl + this.unrealized_int_pnl + this.unrealized_capital_pnl
            - this.prev_unrealized_pnl - this.prev_realized_pnl;

        return data
    }

    get factor(): number {
        return this._factor || 1;
    }

    deserialize(json: any): RegularLot {
        this.quantity = parseFloat(json.quantity) || 0;
        this.prev_quantity = parseFloat(json.prev_quantity) || 0;
        this.direction = json.direction ? Direction.LONG : Direction.SHORT;
        this.realized_pnl = parseFloat(json.realized_pnl) || 0;
        this.unrealized_int_pnl = parseFloat(json.unrealized_int_pnl) || 0;
        this.accrued = parseFloat(json.accrued) || 0;
        this.prev_unrealized_pnl = parseFloat(json.prev_unrealized_pnl) || 0;
        this.prev_realized_pnl = parseFloat(json.prev_realized_pnl) || 0;
        this.tradeBasis = parseFloat(json.tradeBasis) || 0;
        this.commissionBasis = parseFloat(json.commissionBasis) || 0;
        this.costBasis = this.tradeBasis + this.commissionBasis;

        this._factor = json.factor;
        return this;
    }
}
