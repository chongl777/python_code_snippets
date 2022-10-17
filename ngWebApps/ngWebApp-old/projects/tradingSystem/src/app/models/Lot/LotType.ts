import { Serializable } from '../serializable';


export enum Direction {
    LONG = 1,
    SHORT = 0,
}

export interface LotType extends Serializable<LotType> {
    direction: Direction;
    quantity: number;
    prev_quantity: number;
    unrealized_capital_pnl: number;
    realized_pnl: number;
    unrealized_int_pnl: number;

    prev_realized_pnl: number;
    prev_unrealized_pnl: number;
    accrued: number;

    pnl: number;
    costBasis: number;
}
