import { Serializable } from '../serializable';
import { Security } from '../security';
import { MarketData } from '../marketData';
import { SecurityService } from '@app/services/security.service';


export class Transaction {
    security: Security;
    quantity: number;
    price: number;
    accruedInt: number;
    accruedDt: Date;
    tradeId: string;
    dt: Date;
    commission: number;
    factor: number;

    constructor(
        tradeId: string, security: Security) {
        this.tradeId = tradeId.toString();
        this.security = security;
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
        txn.price = parseFloat(json.price) || 0;
        txn.factor = parseFloat(json.factor) || 1;
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
}
