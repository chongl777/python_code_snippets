import { Direction, LotType } from './LotType';
import { Security } from '../security';
import { MarketData } from '../marketData';


export class RegularLot implements LotType {
    security: Security;
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

    constructor(security: Security) {
        this.security = security;
        this.marketData = security.marketData;
    }

    get fx(): number {
        let val = 1;
        if (this.security.ccy != null) {
            val = this.security.ccy.marketData.priceData.compositePrice;
        }
        return val;
    }

    get unrealized_capital_pnl(): number {
        let val = (
            this.marketData.priceData.compositePrice * this.marketData.factor * this.fx -
            this.costBasis) * this.quantity * this.security.multiplier;
        return val || 0;
    }

    get pnl(): number {
        return this.realized_pnl + this.unrealized_int_pnl + this.unrealized_capital_pnl
            - this.prev_unrealized_pnl - this.prev_realized_pnl;
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
        return this;
    }
}
