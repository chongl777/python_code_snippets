import { Direction, LotType } from './LotType';
import { Security } from '../security';
import { MarketData } from '../marketData';
import { SecurityDataObject } from '../securityDataObject';


export class MTMCash extends SecurityDataObject implements LotType {

    prev_quantity: number;
    direction: Direction;
    costBasis: number;
    accrued: number;
    realized_pnl: number
    unrealized_int_pnl: number;
    prev_unrealized_pnl: number;
    prev_realized_pnl: number;

    fut_quantity: number;
    fut_costBasis: number;

    _factor: number;

    constructor(security: Security) {
        super(security)
    }

    get unrealized_capital_pnl(): number {
        return 0;
    }

    get pnl(): number {
        return 0;
    }

    get quantity(): number {
        return (this.price - this.fut_costBasis) * this.security.multiplier * this.fut_quantity;
    }

    get factor(): number {
        return this._factor || 1;
    }

    deserialize(json: any): MTMCash {

        this.fut_quantity = parseFloat(json.fut_quantity) || 0;
        this.prev_quantity = parseFloat(json.prev_quantity) || 0;
        this.direction = json.direction ? Direction.LONG : Direction.SHORT;
        this.realized_pnl = parseFloat(json.realized_pnl) || 0;
        this.unrealized_int_pnl = parseFloat(json.unrealized_int_pnl) || 0;
        this.accrued = parseFloat(json.realized_pnl) || 0;
        this.prev_unrealized_pnl = parseFloat(json.prev_unrealized_pnl) || 0;
        this.prev_realized_pnl = parseFloat(json.prev_realized_pnl) || 0;
        this.fut_costBasis = parseFloat(json.fut_tradeBasisLoc) || 0;

        this._factor = json.factor;
        return this;
    }
}
