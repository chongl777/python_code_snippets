import { SerializableAsync } from '../serializable';
import { Security } from '../security';
import { MarketData } from '../marketData';
import { SecurityDataObject } from '../securityDataObject';

import { MTMCash, } from './MTMLot_Impl';
import { RegularLot } from './RegularLot_Impl';
import { Direction, LotType, } from './LotType';
import { SecurityService } from '@app/services/security.service';
import { Fund } from '../fund';
import { FundsService } from '@app/services/funds.service';


export class Lot extends SecurityDataObject implements SerializableAsync<Lot> {
    _impl: LotType;
    marketData: MarketData;
    lotID: string;
    sLevel1: string;
    sLevel2: string;
    sLevel3: string;
    fundID: number;
    fund: Fund;

    public expanded = false;

    public level = 0;

    constructor(
        lotID: string, security: Security) {
        super(security);
        this.marketData = security.marketData;
        this.lotID = lotID;
    }

    get pos_name(): string {
        return this.security.description;
    }

    get fundName(): string {
        return this.fund.fundName;
    }

    get sec_description(): string {
        return this.security && this.security.description;
    }

    get fx(): number {
        let val = 1;
        if (this.security.ccy != null) {
            val = new SecurityDataObject(this.security.ccy).price;
        }
        return val;
    }

    get qty_x_m(): number {
        // console.log('quantity');
        return this.quantity * this.multiplier;
    }

    get marketVal_clean(): number {
        if (this.security.secType == 'Future') {
            return 0;
        }

        return this.marketData.factor * this.multiplier * this.quantity *
            this.price * this.fx;
    }

    get exposure(): number {
        return this.marketData.factor * this.multiplier * this.quantity *
            this.price * this.fx + this.accrued;
    }

    get exposure_gross(): number {
        return Math.abs(this.exposure);
    }

    get marketVal(): number {
        return this.marketVal_clean + (this.accrued || 0);
    }

    get unrealized_capital_pnl(): number {
        return this._impl.unrealized_capital_pnl;
    }

    get period_realized_pnl(): number {
        return this.realized_pnl - this.prev_realized_pnl;
    }

    get realized_pnl(): number {
        return this._impl.realized_pnl;
    }

    get prev_realized_pnl(): number {
        return this._impl.prev_realized_pnl;
    }

    get prev_unrealized_pnl(): number {
        return this._impl.prev_unrealized_pnl;
    }

    get unrealized_int_pnl(): number {
        return this._impl.unrealized_int_pnl;
    }

    get pnl(): number {
        return this._impl.pnl;
    }

    get costBasis(): number {
        return this._impl.costBasis;
    }

    get quantity(): number {
        return this._impl.quantity;
    }

    get prev_quantity(): number {
        return this._impl.prev_quantity;
    }

    get accrued(): number {
        return this._impl.accrued;
    }

    get rtg(): string {
        return this.security.marketData.rating.rtg;
    }

    get book(): 'Long' | 'Short' | 'Cash' {
        if (this.quantity > 0) {
            return 'Long';
        } else if (this.quantity < 0) {
            return 'Short';
        } else {
            return this.prev_quantity > 0 ? 'Long' : 'Short';
        }
    }

    sum_w_ctrl(field: string, ctrl_field: string = null): number {
        return this[field];
    }

    abs_sum_w_ctrl(field: string, ctrl_field: string = null): number {
        return Math.abs(this[field]);
    }

    to_data(): any[] {
        let data = [];
        data.push({
            'lot_id': this.lotID,
            'deal': this.security.deal,
            'sid': this.security.securityID,
            'description': this.security.description,
            'quantity': this.quantity,
            'pnl': this.pnl,
            'price': this.price,
            'fx': this.fx,
            'costBasis': this.costBasis,
            'prev_unrealized_pnl': this.prev_unrealized_pnl,
            'prev_realized_pnl': this.prev_realized_pnl,
            'unrealized_capital_pnl': this.unrealized_capital_pnl,
            'realized_pnl': this.realized_pnl,
            'unrealized_int_pnl': this.unrealized_int_pnl,
            'fut_quantity': (this._impl as any).fut_quantity,
            'fut_costBasis': (this._impl as any).fut_costBasis,
        });
        return data;
    }

    async deserialize(json: any, securityService?: SecurityService, fundsService?: FundsService): Promise<Lot> {
        this.fundID = json['fund_id'];
        this.fund = fundsService.getFund(this.fundID);

        if (this.security.secType == 'Currency') {
            this.sLevel1 = 'Cash';
            this.sLevel2 = 'Cash';
            this.sLevel3 = 'Cash';
        } else if (typeof (json.lot_id) != 'string') {
            try {
                this.sLevel1 = json.lot_id[0];
                this.sLevel2 = json.lot_id[1];
                this.sLevel3 = json.lot_id[2];
            } catch (err) {
                console.error(err);
            }
        }

        this._impl = json.lot_type == 'mtm_cash' ? new MTMCash(
            await securityService.getSecurity(json.fut_sid)) : new RegularLot(this.security);
        this._impl.deserialize(json);
        return this;
    }
}
