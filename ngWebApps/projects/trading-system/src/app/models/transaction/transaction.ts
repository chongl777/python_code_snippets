import { Serializable } from '../serializable';
import { Security } from '../security';
import { MarketData } from '../marketData';
import { SecurityService } from '@app/services/security.service';
import { SecurityDataObject } from '../securityDataObject';
import { CacheValuesService } from '@app/services/cache-values.service';


export class Transaction extends SecurityDataObject {
    quantity: number;
    txn_price: number;
    accruedInt: number;
    accruedDt: Date;
    tradeId: string;
    dt: Date;
    commission: number;
    txn_factor: number;
    expanded = false;
    transType: number;

    get transTypeStr(): string {
        return { '0': 'Trade', '4': 'Callback' }[this.transType];
    }

    get level(): number {
        return 0;
    }

    constructor(
        tradeId: string, security: Security,
    ) {
        super(security);
        this.tradeId = tradeId.toString();

    }

    static deserialize(json: any, security: Security): Transaction {
        let txn = new Transaction(json.tradeId, security);
        txn.accruedDt = new Date(json.accruedDt);
        txn.accruedDt = isNaN(txn.accruedDt.getTime()) ? null : txn.accruedDt;
        txn.accruedInt =
            parseFloat(json.accruedInt) || 0;
        txn.quantity = parseFloat(json.quantity) || 0;
        txn.dt = new Date(json.dt);
        txn.commission = parseFloat(json.commission) || 0;
        txn.txn_price = parseFloat(json.price) || 0;
        txn.txn_factor = parseFloat(json.factor) || 1;
        return txn;
    }

    static deserializeTkt(json: any, security: Security): Transaction {
        let txn = new Transaction(json.TradeID, security);
        txn.accruedDt = new Date(json.AccruedDate);
        txn.accruedDt = isNaN(txn.accruedDt.getTime()) ? null : txn.accruedDt;
        txn.accruedInt =
            parseFloat(json.AccruedInt) || 0;
        txn.quantity = parseFloat(json.Shares) || 0;
        txn.dt = new Date(json.TradeDate);
        txn.commission = parseFloat(json.Commission) || 0;
        txn.txn_price = parseFloat(json.Price) || 0;
        txn.txn_factor = parseFloat(json.Factor) || 1;
        txn.transType = json.TransTyp
        return txn;
    }

    to_data(): any[] {
        let data = [];
        data.push({
            'tradeId': this.tradeId,
            'sid': this.security.securityID,
            'description': this.security.description,
            'quantity': this.quantity,
            'price': this.price,
        });
        return data;
    }

    get crr_price() {
        return this.price;
    }

    get txn_pnl(): number {
        return (this.price - this.txn_price) * this.quantity * this.multiplier;
    }

    get Side(): string {
        return this.quantity > 0 ? 'Buy' : 'Sell';
    }

    get groupName(): string {
        return this.Side;
    }

    // get description(): string {
    //     return this.security.description;
    // }
}


export class GroupTransaction {
    public expanded = false;
    private _children: GenericTransaction[];
    private _level = null;

    constructor(public groupName: string) {
        this._children = [];
    }

    get Side(): string {
        return this._children[0].Side;
    }

    get tradeId(): number {
        return null;
    }

    get durGroup(): string {
        return this._children[0].durGroup;
    }

    get securityID(): string {
        return this.groupName;
    }

    get transTypeStr(): string {
        return this._children[0].transTypeStr;
    }

    get description(): string {
        return "";
    }

    get quantity(): number {
        return this.sum('quantity');
    }

    get txn_pnl(): number {
        return this.sum('txn_pnl');
    }

    get children(): GenericTransaction[] {
        return this._children;
    }

    set children(value: GenericTransaction[]) {
        this._children = value;
    }

    get corpLevel(): string {
        return "";
    }

    get level(): number {
        if (this._level == null) {
            this._level = (this.children[0]['level'] || 0) + 1;
        }
        return this._level;
    }

    get rtg(): string {
        return this.median('rtg_rnk', 'rtg');
        // return '';
    }

    get rtg_normal(): string {
        return this.median('rtg_rnk', 'rtg_normal');
        // return '';
    }

    sum(field: string): number {
        return this.children.reduce<number>(
            (a: number, b: GenericTransaction) => {
                return a + (b[field] || 0);
            }, 0);
    }

    median(compare_fld: string, output_fld: string): any {
        let children = Object.values(this.children);
        children.sort((x, y) => (
            (x[compare_fld] || 100) - (y[compare_fld] || 100)));
        let i = Math.ceil(children.length / 2 - 1.)
        return children[i][output_fld];
    }

}

export type GenericTransaction = GroupTransaction | Transaction;
