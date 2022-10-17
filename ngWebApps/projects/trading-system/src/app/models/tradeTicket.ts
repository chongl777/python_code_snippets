import { Security } from './security';
import { Serializable } from './serializable';
import * as d3 from 'd3';
import { BehaviorSubject } from 'rxjs';


export function convertToDate(val: string): Date {
    return d3.timeParse("%Y-%m-%dT%H:%M:%S")(val) || d3.timeParse("%Y-%m-%dT%H:%M")(val) || d3.timeParse("%Y-%m-%d")(val);
}


export class Counterparty {
    Alias: string;
    Name: string;
    DTCC: string;
    email_trade_settlement: string;
    email_confirmation: string;
    need_to_confirm: boolean;
    productCode: number;

    constructor(json: any) {
        this.Alias = json['Alias'];
        this.Name = json['Name'];
        this.DTCC = json['DTCC'];
        this.email_trade_settlement = json['email_trade_settlement'];
        this.email_confirmation = json['email_confirmation'];
        this.need_to_confirm = json['need_to_confirm'];
        this.productCode = parseInt(json['productCode']);
    }

    get canConfirm(): boolean {
        return this.need_to_confirm && this.email_trade_settlement != null;
    }
}


export class TaxLot implements Serializable<TaxLot> {
    public quantity: number = null;
    public allocatedQty: number;
    public costBasis: number;
    public createDate: Date;

    constructor(public fundID: number, public lotID: string, public newLot: boolean, public acct?: string) {
    }

    deserialize(json: any): TaxLot {
        this.quantity = parseFloat(json['Shares']);
        this.costBasis = parseFloat(json['CostBasis']);
        this.createDate = new Date(json['InitDt']);
        this.acct = json['Account'];
        this.newLot = false;
        return this;
    }

    deserialize_confirmed(json: any): TaxLot {
        this.allocatedQty = parseFloat(json['position_size']);
        this.acct = json['set_acct'];
        this.newLot = json['new_lot'];
        return this;
    }

    get CreateDate(): Date {
        return this.createDate || new Date();
    }

    get isValid(): boolean {
        if (this.newLot) {
            return true
        }
        if (this.quantity > 0) {
            return (this.quantity >= -(this.allocatedQty || 0)) && ((this.allocatedQty || 0) <= 0);
        }

        if (this.quantity < 0) {
            return (this.quantity <= -(this.allocatedQty || 0)) && ((this.allocatedQty || 0) >= 0);
        }

        if (this.quantity == 0) {
            return this.allocatedQty == 0;
        }
        return true
    }

    to_dict(): any {
        return {
            'fund_id': this.fundID,
            'position_size': this.allocatedQty,
            'set_acct': this.acct,
            'lot_id': this.newLot ? null : this.lotID,
            'new_lot': this.newLot,
        }
    }
}


export class StrategyLot {
    allocatedQty: number;

    constructor(
        public fundID: number, public sLevel1: string,
        public sLevel2: string, public sLevel3: string) { }

    get isValid(): boolean {
        if (!this.sLevel1) {
            return false;
        }

        if (!this.sLevel2) {
            return false;
        }

        if (!this.sLevel3) {
            return false;
        }
        return true;
    }

    to_dict(): any {
        return {
            'fund_id': this.fundID,
            'position_size': this.allocatedQty,
            'tag1': this.sLevel1,
            'tag2': this.sLevel2,
            'tag3': this.sLevel3,
        }
    }
}


export class TradeTicket {
    dirty: boolean = false;
    isvalid: boolean = true;
    broker_confirmed: boolean = null;

    lotQueried: boolean = false;
    taxLots: { [lotID: string]: TaxLot } = {}
    taxLots$ = new BehaviorSubject<TaxLot[]>([]);

    straLots: StrategyLot[] = [];
    straLots$ = new BehaviorSubject<StrategyLot[]>([]);

    tradeDate: string;
    get TradeDate(): string {
        return this.tradeDate;
    }
    set TradeDate(val: string) {
        this.tradeDate = val;
    }

    accruedDate: string;
    get AccruedDate(): string {
        return this.accruedDate;
    }
    set AccruedDate(val: string) {
        this.accruedDate = val;
    }

    settleDate: string;
    get SettleDate(): string {
        return this.settleDate;
    }
    set SettleDate(val: string) {
        this.dirty = true;
        this.settleDate = val;
    }

    getNewLot(fundID: number, acct: string): TaxLot {
        let newLot = Object.values(this.taxLots).filter((x) => x.fundID == fundID && x.newLot);
        if (newLot.length == 1) {
            return newLot[0];
        } else if (newLot.length == 0) {
            let lot = new TaxLot(fundID, null, true, acct);
            this.taxLots['newLot-' + fundID.toString()] = lot
            this.update();
            return this.taxLots['newLot-' + fundID.toString()];
        }
        return null;
    }

    removeNewLot(fundID: number): void {
        if (this.taxLots['newLot-' + fundID.toString()]) {
            delete this.taxLots['newLot-' + fundID.toString()];
            this.update();
        }
    }

    getStraLots(fundID: number): StrategyLot[] {
        return this.straLots.filter((x) => x.fundID == fundID);
    }

    addStrategyLots(fundID: number): StrategyLot {
        let lot = new StrategyLot(fundID, null, null, null)
        this.straLots.push(lot);
        this.update();
        return lot;
    }

    removeStrategyLots(fundID: number): void {
        if (this.getStraLots(fundID).length > 0) {
            this.straLots = this.straLots.filter(x => x.fundID != fundID);
            this.update();
        }
    }

    removeStrategyLot(fundID: number, lot: StrategyLot): void {
        this.straLots = this.straLots.filter(x => x != lot);
        this.update();
    }

    update() {
        this.taxLots$.next(Object.values(this.taxLots).sort((x, y) => {
            return x.CreateDate.getTime() - y.CreateDate.getTime();
        }));

        this.straLots$.next(Object.values(this.straLots));
    }

    get buy_sell(): boolean {
        return this.quantity > 0;
    }

    set buy_sell(val: boolean) {
        this.quantity = Math.abs(this.quantity) * (val ? 1 : -1);
        if (this.accruedInt != null) {
            this.accruedInt = Math.abs(this.accruedInt) * (val ? 1 : -1);
        }
    }

    processTaxLots(lots: any[]) {
        let lotIDSet = lots.map((x) => x['LotID']);
        Object.values(this.taxLots).filter((x) => !lotIDSet.includes(x.lotID)).map(
            (x: TaxLot) => {
                delete this.taxLots[x.lotID];
            });
        for (let lot of lots) {
            if (!(lot['LotID'] in this.taxLots)) {
                this.taxLots[lot['LotID']] = new TaxLot(
                    lot['FundID'], lot['LotID'], false)
            }
            this.taxLots[lot['LotID']].deserialize(lot)
        }
        this.update();
    }

    processStraLots_confirmed(lots: any[]) {
        this.straLots = [];
        for (let lot of lots) {
            let straLot = new StrategyLot(
                lot['fund_id'], lot['tag1'], lot['tag2'], lot['tag3']);
            straLot.allocatedQty = lot['position_size']
            this.straLots.push(straLot);
        }
        this.straLots$.next(this.straLots);
    }

    processTaxLots_confirmed(lots: any[]) {
        this.taxLots = {};
        for (let lot of lots) {
            this.taxLots[lot['lot_id']] = new TaxLot(
                lot['fund_id'], lot['lot_id'], false)
            this.taxLots[lot['lot_id']].deserialize_confirmed(lot);
        }
        this.taxLots$.next(Object.values(this.taxLots));
    }

    price: number = null;
    get Price(): number {
        return this.price;
    }
    set Price(val: number) {
        this.dirty = true;
        this.price = val;
    }

    quantity: number = null;
    get Quantity(): number {
        return this.quantity;
    }
    set Quantity(val: number) {
        this.dirty = true;
        this.quantity = val;
    }


    manualCreated: boolean = false;
    orderStatus: string;
    ticketID: string;
    tradeID: number;

    transTyp: number = null;
    transTypMap = { '0': 'Trade', '4': 'Callback' }
    get availableTransTyp() {
        return Object.keys(this.transTypMap);
    }

    get transTypStr(): string {
        return this.transTyp == null ? null : this.transTyp.toString();
    }

    set transTypStr(val: string) {
        this.dirty = true;
        this.transTyp = parseInt(val);
    }

    get OrderStatus(): string {
        if (!this.isvalid) {
            return 'Canceled'
        }
        return this.confirmed ? 'Confirmed' : this.orderStatus;
    }

    get confirmed(): boolean {
        return this.tradeID != null ? true : false;
    }

    tradeFlat: boolean = false;
    get TradeFlat(): boolean {
        return this.tradeFlat;
    }
    set TradeFlat(val: boolean) {
        this.dirty = true;
        this.tradeFlat = val;
    }

    factor: number;
    get Factor(): number {
        return this.factor;
    }

    set Factor(val: number) {
        this.dirty = true;
        this.factor = val;
    }

    clearingAgent: string;
    get ClearingAgent(): string {
        if (this.clearingAgent) {
            return this.clearingAgent;
        }

        if (this.security.ccy.short_name == "EUR") {
            this.clearingAgent = "EC";
        } else {
            if (["Corporate Bond"].includes(this.security.secType)) {
                this.clearingAgent = "DTC";
            } else {
                this.clearingAgent = "";
            }
        }
        return this.clearingAgent;
    }

    set ClearingAgent(val: string) {
        this.dirty = true;
        this.clearingAgent = val;
    }

    principal: number;
    get Principal(): number {
        if (this.principal) {
            return this.principal;
        }
        return this.security.marketData.factor * this.security.multiplier * this.Quantity *
            this.Price;
    }

    get NetAmount(): number {
        return this.Principal + (this.accruedInt || 0);
    }

    accruedInt: number;
    get AccruedInt(): number {
        return this.accruedInt;
    }
    set AccruedInt(val: number) {
        this.dirty = true;
        this.accruedInt = val;
    }

    commission: number;
    accruedIntCalc: number;
    cpCode: string;
    commCurrency: 'USD' | 'EUR';
    availableCurrency = ['USD', 'EUR'];

    description: string;
    cusip: string;
    indicator: string;

    tradePrint: string;

    cp: Counterparty;
    get counterParty(): string {
        try {
            return this.cp.Alias;
        } catch {
            return 'None';
        }
    }

    platform: string;
    coupon: number;

    // settleAcct: string;
    availableAccts = ['GS', 'IB'];
    get settleAccts(): string[] {
        return [...new Set(Object.values(this.taxLots).map(x => x.acct))];
    }

    acctName = { 'GS': 'Goldman', 'IB': 'Interactive Broker' };
    _yield: number;

    constructor(public security: Security) {
    }

    deserialize(
        json: any,
        counterparties: { [alias: string]: Counterparty }): TradeTicket {

        this.ticketID = json['TicketID'];
        this.tradeID = json['TradeID'];

        this.price = json['Price'];
        this.quantity = json['Shares'];
        this.TradeDate = json['TradeDate'];
        this.SettleDate = json['SettleDate'];
        // this.tradeDate = json['TradeDate'];
        this.TradeFlat = json['TradeFlat'];

        this.coupon = json['Coupon'];
        this.description = json['Description'];
        this.cusip = json['Cusip'];

        this.accruedDate = json['AccruedDate'];
        this.accruedInt = json['AccruedInt'];
        this.accruedIntCalc = json['AccruedIntCalc'];
        this.cpCode = json['CP_Code'];
        this.commCurrency = json['CommCurrency'];
        this.commission = json['Commission'] || 0;

        // this.counterParty = json['CounterParty'];
        this.cp = counterparties[`${this.security.productCode}.${json['CounterParty']}`]

        if (this.cp == null) {
            console.error(`did not find broker ${this.security.productCode}.${this.counterParty}`)
        }

        this.factor = json['Factor'];
        this.orderStatus = json['OrderStatus'] || ' ';
        this.platform = json['Platform'];
        this.principal = json['Principal'];
        this.transTyp = json['TransTyp'] || 0;
        this.tradePrint = json['TradePrint'];
        this._yield = parseFloat(json['Yield']);
        this.dirty = false;
        this.isvalid = Boolean(json['IsValid']);
        this.broker_confirmed = Boolean(json['Confirmed']);
        // this.settleAcct = json['SettleAcct'];

        return this;
    }

    deserialize_confirmed(
        json: any,
        counterparties: { [alias: string]: Counterparty }): TradeTicket {
        this.deserialize(json, counterparties);
        this.processTaxLots_confirmed(json['TaxLots']);
        this.processStraLots_confirmed(json['StraLots']);
        return this;
    }

    validity(): [boolean, string] {
        if (this.security.securityID == -1) {
            return [false, 'Unknown security'];
        }

        if (this.security.secType == 'unknown') {
            return [false, 'Unknown security type'];
        }

        if (this.counterParty == null || this.cp == null) {
            return [false, 'Counterparty cannot be null'];
        }

        if (this.Quantity == null) {
            return [false, 'Trade quantity cannot be null'];
        }

        if (convertToDate(this.tradeDate) == null) {
            return [false, 'Trade date is invalid'];
        }

        if (this.price == null) {
            return [false, 'Trade price cannot be null'];
        }

        if (convertToDate(this.settleDate) == null) {
            return [false, 'Settle date is invalid'];
        }

        if (this.transTyp == null) {
            return [false, 'Transaction type cannot be null'];
        }

        if (['Corporate Bond'].includes(this.security.secType)) {
            if (this.factor == null) {
                return [false, 'Factor cannot be null'];
            }

            if (convertToDate(this.accruedDate) == null) {
                return [false, 'Accrued date is invalid'];
            }

            if (this.accruedInt == null) {
                return [false, 'Accrued interest cannot be null'];
            }
        }

        if (this.commission == null) {
            return [false, 'Commission cannot be null'];
        }

        if (this.commCurrency == null) {
            return [false, 'Commission currency cannot be null'];
        }

        return [true, ''];
    }

    to_dict(): any {
        let secObj = {
            'securty_id': this.security.securityID,
            'description': this.security.description,
            'isin': this.security.isin,
            'cusip': this.security.cusip,
            'sec_type': this.security.secType,
            'call_put': this.security._impl.callPut,
            'strike': this.security._impl.strike,
            'expiry': this.security._impl.expiry,
            'ccy': this.security.ccy.short_name,
        }
        let dict = {
            'id': this.ticketID,
            'ProductType': this.security.secType,
            'security_id': this.security.securityID,
            'security': secObj,
            'isin': this.security.isin,
            'cusip': this.cusip,
            'price': this.price,
            'factor': this.factor,
            'multiplier': this.security.multiplier,
            'description': this.security.description,
            'trans_typ': this.transTyp,
            'quantity': this.quantity,
            'commission': this.commission,
            'commission_ccy': this.commCurrency,
            'accrued_int': this.accruedInt,
            'accrued_dt': this.accruedDate,
            'counterparty': this.counterParty,
            'yield': this._yield,
            'set_dt': this.SettleDate,
            'trade_dt': this.TradeDate,
            'trade_flat': this.tradeFlat,
            'coupon': this.coupon || this.security.coupon,
            'principal': this.principal,
            'taxLot': Object.values(this.taxLots).filter(x => x.allocatedQty).map(x => x.to_dict()),
            'straLot': Object.values(this.straLots).filter(x => x.allocatedQty).map(x => x.to_dict()),
        };
        if (this.confirmed) {
            dict['trade_id'] = this.tradeID;
            dict['clearing_agent'] = this.ClearingAgent;
            dict['indicator'] = this.indicator;
        }
        return dict;
    }
}

export class TradeTicketCounterpartyGroup {
    private _children: TradeTicket[] = [];

    constructor(public cp: Counterparty) {
    }

    get children(): TradeTicket[] {
        return this._children;
    }

    get counterParty(): string {
        try {
            return this.cp.Alias;
        } catch {
            return 'None';
        }
    }

    get CanSendSettlementEmail(): boolean {
        return this.cp != null && this.cp.email_trade_settlement != null;
    }
}
