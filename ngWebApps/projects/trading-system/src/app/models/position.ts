import { Injectable } from '@angular/core';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Security } from './security';
import { SerializableAsync } from './serializable';

import { EventService } from '../services/event.service';
import { SecurityService } from '../services/security.service';
import { MarketData } from './marketData';
import { Lot } from './Lot';
import { SecurityDataObject } from './securityDataObject';
import { SecurityEvent } from './securityEvent';
import { FundsService } from '@app/services/funds.service';
import { Fund } from './fund';


type LotMap = Record<string, Lot>


export class Position extends SecurityDataObject implements SerializableAsync<Position> {
    public lots: LotMap = {};
    public expanded = false;

    public level = 0;

    get pos_name(): string {
        return this.security && this.security.description;
    }

    get sec_description(): string {
        return this.security && this.security.description;
    }

    get update$(): Observable<any> {
        return this.security.update$;
    };

    get children(): Lot[] {
        return Object.values(this.lots);
    }

    get fund(): Fund {
        return this.children[0].fund;
    }

    get fundName(): string {
        return this.fund.fundName;
    }

    // constructor(public security: Security | null) {
    //     super();

    // }

    to_data(): any[] {
        let data = [];
        for (let pos of Object.values(this.lots)) {
            data = data.concat(pos.to_data());
        }
        return data;
    }

    get quantity(): number {
        // console.log('quantity');
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.quantity;
            }, 0);
    }

    get qty_x_m(): number {
        // console.log('quantity');
        return this.quantity * this.multiplier;
    }

    get prev_quantity(): number {
        // console.log('quantity');
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.prev_quantity;
            }, 0);
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

    get quantity_abs(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + Math.abs(b.quantity);
            }, 0);
    }

    get fx(): number {
        return Object.values(this.lots)[0].fx;
    }

    get price(): number {
        let qty = this.quantity;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.price * b.quantity;
            }, 0);

        return total / qty;
    }

    get eq_intraday_ret(): number {
        let sec = this.security.deal_eq_sec;
        if (sec != null) {
            return sec.marketData.intradayRet.ret;
        } else {
            return null;
        }
    }

    get price_diff(): number {
        let qty = this.quantity_abs;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.price_diff * Math.abs(b.quantity);
            }, 0);

        return total / qty;
    }

    get accrued(): number {
        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + (b.accrued || 0);
            }, 0);

        return total;
    }

    get multiplier(): number {
        let qty = this.quantity;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.multiplier * b.quantity;
            }, 0);

        return total / qty;
    }

    get marketVal_clean(): number {
        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.marketVal_clean;
            }, 0);

        return total;
    }

    get exposure(): number {
        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.exposure;
            }, 0);

        return total;
    }

    get exposure_gross(): number {
        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + Math.abs(b.exposure_gross);
            }, 0);

        return total;
    }

    get marketVal(): number {

        return this.marketVal_clean + (this.accrued || 0);
    }

    get pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.pnl;
            }, 0);
    }

    get unrealized_capital_pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.unrealized_capital_pnl;
            }, 0);
    }

    get period_realized_pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.period_realized_pnl;
            }, 0);
    }

    get realized_pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.realized_pnl;
            }, 0);
    }

    get unrealized_int_pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.unrealized_int_pnl;
            }, 0);
    }

    get prev_unrealized_pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.prev_unrealized_pnl;
            }, 0);
    }

    get prev_realized_pnl(): number {
        return Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.prev_realized_pnl;
            }, 0);
    }

    get costBasis(): number {
        let cost = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                return a + b._impl.costBasis * b.quantity * b.multiplier;
            }, 0);

        let qty = this.qty_x_m;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }
        return cost / qty;
    }

    get rtg_rnk(): number {
        return this.security.marketData.rating.rtg_rnk || 100;
    }

    wavg(func: (x: Lot) => number): number {
        let qty = this.quantity;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        qty = 0;

        let total = Object.values(this.lots).reduce<number>(
            (a: number, b: Lot) => {
                let v = func(b);
                if (v == null) {
                    return a;
                } else {
                    qty += b.quantity;
                    return a + (v || 0) * b.quantity;
                }
            }, 0);

        return total / qty;
    }

    async deserialize(json: any, securityService?: SecurityService, fundsService?: FundsService): Promise<Position> {
        try {
            let lotID = json.fund_id + '|' + json.lot_id.toString() + (json.direction ? '|Long' : '|Short');
            if (this.lots[lotID] == null) {
                this.lots[lotID] = new Lot(lotID, this.security);
            }
            await this.lots[lotID].deserialize(json, securityService, fundsService);
            return this;
        } catch (err) {
            console.error(err);
            throw err;
            // return this;
        }
    }

    sum_w_ctrl(field: string, ctrl_field: string = null): number {
        return this[field];
    }

    abs_sum_w_ctrl(field: string, ctrl_field: string = null): number {
        return Math.abs(this[field]);
    }
}


export class CashPosition extends Position {
    private pos: { [sid: number]: Position } = {};
    private ccy: string;
    public level = 0;

    get security(): Security {
        return Object.values(this.pos)[0].security;
    }

    set security(x: Security) { }

    constructor(ccy: string) {
        super(null);
        this.ccy = ccy;
    }

    get children(): Lot[] {
        let data = [];
        for (let pos of Object.values(this.pos)) {
            data = data.concat(pos.children);
        }
        return data;
    }

    to_data(): any[] {
        let data = [];
        for (let pos of Object.values(this.pos)) {
            data = data.concat(pos.to_data());
        }
        return data;
    }

    get rtg(): string {
        return '';
    }

    get rtg_rnk(): number {
        return 100;
    }

    async deserialize(json: any, securityService: SecurityService, fundsService: FundsService): Promise<Position> {
        let securityID = parseInt(json.security_id)
        if (!(securityID in this.pos)) {
            let security = await securityService.getSecurity(securityID);
            this.pos[securityID] = new Position(security);
        }
        await this.pos[securityID].deserialize(json, securityService, fundsService);
        return this;
    }

    get pos_name(): string {
        return this.ccy;
    }

    get price(): number {
        let qty = this.quantity_abs;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        let total = Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.price * b.quantity_abs;
            }, 0);

        return total / qty;
    }

    get eq_intraday_ret(): number {
        return null;
    }

    get factor(): number {
        return 1.0;
    }

    get price_diff(): number {
        let qty = this.quantity_abs;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        let total = Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.price_diff * b.quantity_abs;
            }, 0);

        return total / qty;
    }

    get ytm(): number {
        return 0;
    }

    get ytw(): number {
        return 0;
    }

    get ytf(): number {
        return 0;
    }

    get quantity(): number {
        // console.log('quantity');
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.quantity;
            }, 0);
    }

    get qty_x_m(): number {
        // console.log('quantity');
        return this.quantity * this.multiplier;
    }

    get book(): 'Long' | 'Short' | 'Cash' {
        return 'Cash';
    }

    get sLevel1(): string {
        return this.children[0].sLevel1;
    }

    get sLevel2(): string {
        return this.children[0].sLevel2;
    }

    get sLevel3(): string {
        return this.children[0].sLevel3;
    }

    get quantity_abs(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + Math.abs(b.quantity_abs);
            }, 0);
    }

    get fx(): number {
        return Object.values(this.pos)[0].fx;
    }

    get pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.pnl;
            }, 0);
    }

    get marketVal_clean(): number {
        let total = Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.marketVal_clean;
            }, 0);
        return total
    }

    get exposure(): number {
        if (this.security.deal == 'USD') {
            return 0;
        }

        return this.price * this.quantity * this.security.adj;
    }

    get exposure_gross(): number {
        if (this.security.deal == 'USD') {
            return 0;
        }

        return Math.abs(this.price * this.quantity * this.security.adj);
    }

    get marketVal(): number {
        return this.marketVal_clean;
    }

    get unrealized_capital_pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.unrealized_capital_pnl;
            }, 0);
    }

    get period_realized_pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.realized_pnl - b.prev_realized_pnl;
            }, 0);
    }

    get realized_pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.realized_pnl;
            }, 0);
    }

    get unrealized_int_pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.unrealized_int_pnl;
            }, 0);
    }

    get prev_unrealized_pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.prev_unrealized_pnl;
            }, 0);
    }

    get prev_realized_pnl(): number {
        return Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.prev_realized_pnl;
            }, 0);
    }

    get costBasis(): number {
        let cost = Object.values(this.pos).reduce<number>(
            (a: number, b: Position) => {
                return a + b.costBasis * b.quantity;
            }, 0);

        let qty = this.quantity;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }
        return cost / qty;
    }

    get sector(): string {
        return this.security.sector;
    }

    get deal(): string {
        return this.security.deal;
    }
}

export type GenericPos = (GroupedPosition | Position | Lot);

export class GroupedPosition extends SecurityDataObject {

    private _children: GenericPos[]
    get children(): GenericPos[] {
        return this._children;
    }

    set children(value: GenericPos[]) {
        this._children = value;
    }

    public expanded = false;

    private _level = null;

    constructor(public groupName: string) {
        super(null);
        this._children = [];
    }

    to_data(): any[] {
        let data = [];
        for (let child of this.children) {
            data = data.concat(child.to_data());
        }
        return data;
    }

    get pos_name(): string {
        return this.groupName || "null";
    }

    get fund(): Fund {
        return this.children[0].fund;
    }

    get fundName(): string {
        return this.children[0].fund.fundName;
    }

    get fa_score(): number {
        if (this.level <= 1) {
            let children = this.children.filter(x => x.fa_score != null);
            if (children.length != 0) {
                return Math.min(...children.map(x => x.fa_score));
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    get multiplier(): number {
        let qty = this.quantity;

        if (Math.abs(qty) < 1e-10) {
            return 0;
        }

        let total = Object.values(this.children).reduce<number>(
            (a: number, b: Lot) => {
                return a + b.multiplier * b.quantity;
            }, 0);

        return total / qty;
    }

    get level(): number {
        if (this._level == null) {
            this._level = this.children[0].level + 1;
        }
        return this._level;
    }

    get qty_x_m(): number {
        return this.quantity * this.multiplier;
    }

    get quantity(): number {
        // console.log('quantity');
        return this.children.reduce<number>(
            (a: number, b: Position) => {
                return a + b.quantity;
            }, 0);
    }

    get quantity_abs(): number {
        // console.log('quantity');
        return this.children.reduce<number>(
            (a: number, b: Position) => {
                return a + Math.abs(b.quantity_abs);
            }, 0);
    }

    get book(): 'Long' | 'Short' | 'Cash' {
        return this.children[0].book;
    }

    get price(): number {
        return this.wavg('price', 'qty_x_m');
    }

    get factor(): number {
        return this.wavg_abs('factor');
    }

    get price_diff(): number {
        return this.wavg_abs('price_diff');
    }

    get emc_score(): number {
        return this.wavg_abs('emc_score');
    }

    get emc_st_score(): number {
        return this.wavg_abs('emc_st_score');
    }

    get rvs_score(): number {
        return this.wavg_abs('rvs_score');
    }

    get rvs_score_new(): number {
        return this.wavg_abs('rvs_score_new');
    }

    get erh_score(): number {
        return this.wavg_abs('erh_score');
    }

    get leverage_ratio(): number {
        return this.wavg_abs('leverage_ratio');
    }

    get leverage_score(): number {
        return this.wavg_abs('leverage_score');
    }

    get leverage_score_secwise(): number {
        return this.wavg_abs('leverage_score_secwise');
    }


    get fx(): number {
        return this.wavg('fx');
    }

    get ytm(): number {
        return this.wavg_abs('ytm');
    }

    get ytw(): number {
        return this.wavg_abs('ytw');
    }

    get ytf(): number {
        return this.wavg_abs('ytf');
    }

    get pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.pnl;
            }, 0);
    }

    get unrealized_capital_pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.unrealized_capital_pnl;
            }, 0);
    }

    get period_realized_pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.realized_pnl - b.prev_realized_pnl;
            }, 0);
    }

    get realized_pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.realized_pnl
            }, 0);
    }

    get unrealized_int_pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.unrealized_int_pnl;
            }, 0);
    }

    get prev_unrealized_pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.prev_unrealized_pnl;
            }, 0);
    }

    get prev_realized_pnl(): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + b.prev_realized_pnl;
            }, 0);
    }

    get costBasis(): number {
        return this.wavg('costBasis');
    }

    get sector(): string {
        return this.industry_level_1;
    }

    get industry_level_2(): string {
        return this.children[0].industry_level_2;
    }

    get industry_level_1(): string {
        return this.children[0].industry_level_1;
    }

    get secEvt(): SecurityEvent {
        let unique_deal = [... new Set(this.children.map(x => x.deal).filter(x => x))];
        if (unique_deal.length == 1) {
            return this.children[0].secEvt;
        } else {
            return null
        }
    }

    get rtg(): string {
        return this.median('rtg_rnk', 'rtg');
        // return '';
    }

    get rtg_rnk(): number {
        // return this.median('rtg_rnk', 'rtg_rnk');
        return this.median('rtg_rnk', 'rtg_rnk');
    }

    get marketVal_clean(): number {
        return this.sum('marketVal_clean');
    }

    get exposure(): number {
        return this.sum('exposure');
    }

    get exposure_gross(): number {
        return this.sum('exposure_gross');
    }

    get marketVal(): number {
        return this.sum('marketVal');
    }

    get eq_intraday_ret(): number {
        return this.wavg_abs('eq_intraday_ret');
    }

    get marketSegment(): string {
        return this.children[0].marketSegment;
    }

    get liqScore(): number {
        return this.wavg('liqScore');
    }

    get modified_dur(): number {
        return this.wavg('modified_dur', 'exposure');
    }

    get durGroup(): string {
        return this.children[0].durGroup;
    }

    sum(field: string): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                return a + (b[field] || 0);
            }, 0);
    }

    sum_w_ctrl(field: string, ctrl_field: string): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                let v = b[ctrl_field];
                return a + (v == null ? 0 : (b.sum_w_ctrl(field, ctrl_field) || 0));
            }, 0);
    }

    abs_sum_w_ctrl(field: string, ctrl_field: string): number {
        return this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                let v = b[ctrl_field];
                return a + (v == null ? 0 : (b.abs_sum_w_ctrl(field, ctrl_field) || 0));
            }, 0);
    }

    median(compare_fld: string, output_fld: string): any {
        let children = Object.values(this.children);
        children.sort((x, y) => (
            (x[compare_fld] || 100) - (y[compare_fld] || 100)));
        let i = Math.ceil(children.length / 2 - 1.)
        return children[i][output_fld];
    }

    wavg(field: string, ctrl_field: string = 'qty_x_m'): number {
        let lvl = this.level;
        let qty = 0;
        let total = this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                let v = b[field]
                if (isNaN(v) || v == null) {
                    return a;
                } else {
                    let q = b.sum_w_ctrl(ctrl_field, field);
                    qty += q;
                    if ((a + (v || 0) * q) == null) {
                        console.log(a);
                    }
                    return a + (v || 0) * q;
                }
            }, 0);

        if (Math.abs(qty) < 1e-10) {
            return null;
        }

        return (total / qty);
    }

    wavg_abs(field: string): number {
        let qty = 0;

        let total = this.children.reduce<number>(
            (a: number, b: GenericPos) => {
                let v = b[field];
                if (isNaN(v) || v == null) {
                    return a;
                } else {
                    // let q = b.quantity_abs;
                    let q = b.abs_sum_w_ctrl('qty_x_m', field);
                    qty += q;

                    return a + (v || 0) * q;
                }
            }, 0);

        if (Math.abs(qty) < 1e-10) {
            return null;
        }

        return total / qty;
    }
}
