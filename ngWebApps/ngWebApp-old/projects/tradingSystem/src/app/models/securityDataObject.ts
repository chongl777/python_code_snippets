import { Security } from './security';
import { SecurityEvent } from './securityEvent';

export class SecurityDataObject {
    private _security: Security;
    public _selected: boolean;

    constructor(security: Security) {
        this._security = security;
    }

    public static compare(a: SecurityDataObject, b: SecurityDataObject, field: string): number {
        switch (field) {
            case 'Security':
                return (a.description || "").localeCompare(b.description || "");
            case 'Price':
                return (a.price - b.price);
            case 'Change':
                return (a.diff - b.diff);
            case 'YTM':
                return ((a.ytm || 0) - (b.ytm || 0));
            case 'YTW':
                return ((a.ytw || 0) - (b.ytw || 0));
            case 'YTF':
                return ((a.ytf || 0) - (b.ytf || 0));
            case 'FA':
                return (a.fa_score || 100) - (b.fa_score || 100);
            case 'EqRet':
                return ((a.eq_intraday_ret || 0) - (b.eq_intraday_ret || 0));
            case 'ERH':
            case 'ModifiedDur':
                return (
                    (a.modified_dur || 0) - (b.modified_dur || 0)
                );

            case 'Signals':
                return (
                    (a.erh_score || 0) - (b.erh_score || 0)
                );

            case 'LiqScore':
                return (
                    (a.liqScore || -1) - (b.liqScore || -1)
                );
            case 'EMC':
                return (
                    (a.emc_score || 0) - (b.emc_score || 0)
                );
            case 'RVS':
                return (
                    (a.rvs_score || 0) - (b.rvs_score || 0)
                );
            case 'LR_S':
            case 'Leverage':
            case 'LR':
                return (
                    (a.leverage_ratio || 0) - (b.leverage_ratio || 0)
                );
            case 'Outstanding':
                return (a.outstandingAmt || 0) - (b.outstandingAmt || 0);
            case 'ShortInfo':
                return (a.short_cost_rate || 0) - (b.short_cost_rate || 0);
            case 'Rating':
                return (a.rtg_rnk || 0) - (b.rtg_rnk || 0);
            case 'Sector':
                return (a.sector || "").localeCompare(b.sector || "");
            case 'Subsector':
                return (a.industry_level_2 || "").localeCompare(b.industry_level_2 || "");
            case 'MarketSeg':
                return (a.marketSegment || "").localeCompare(b.marketSegment || "");
            case 'Event':
                return (a.security.secEvt.all_codes || "").localeCompare(b.security.secEvt.all_codes || "");
            default:
                return null;
        }
    }

    get security(): Security {
        return this._security;
    }

    get secEvt(): SecurityEvent {
        try {
            return this._security.secEvt;
        } catch (err) {
            return null;
        }
    }

    get description(): string {
        try {
            return this.security.description
        } catch (err) {
            return null;
        }
    }

    get securityID(): number {
        try {
            return this.security.securityID;
        } catch (err) {
            return null;
        }
    }

    get outstandingAmt(): number {
        try {
            return this.security.marketData.outstandingAmt.value;
        } catch (err) {
            return null;
        }
    }

    get short_cost_rate(): number {
        try {
            return this.security.marketData.shortCost.rate;
        } catch (err) {
            return null;
        }
    }

    get rtg_rnk(): number {
        try {
            return this.security.marketData.rating.rtg_rnk;
        } catch (err) {
            return null;
        }
    }

    get selected(): boolean {
        return this._selected;
    }

    set selected(val: boolean) {
        this._selected = val;
    }


    get factor(): number {
        return this.security.marketData.factor;
    }

    get price(): number {
        return this.security.marketData.priceData.compositePrice;
    }

    get diff(): number {
        return this.security.marketData.priceData.compositeDiff;
    }

    get ytm() {
        return this.security.marketData.yieldData.ytm.yld;
    }

    get ytw() {
        try {
            let val = this.security.marketData.yieldData.ytw.yld;
            if (['Future'].includes(this.security.secType) && (val == null)) {
                let undlSec = this.security.undlSecurity;
                return undlSec.marketData.yieldData.ytw.yld;
            } else {
                return val;
            }
        } catch (err) {
            return null;
        }
    }

    get modified_dur() {
        try {
            let val = this.security.marketData.yieldData.ytw.modified_dur;
            if (['Future'].includes(this.security.secType) && (val == null)) {
                let undlSec = this.security.undlSecurity;
                return undlSec.marketData.yieldData.ytw.modified_dur;
            } else {
                return val;
            }
        } catch (err) {
            return null;
        }
    }

    get ytf() {
        return this.security.marketData.yieldData.ytf.yld;
    }

    get deal(): string {
        return this.security && this.security.deal;
    }

    get emc_score(): number {
        return this.security.marketData.emcScoreData.emc_score;
    }

    get rvs_score(): number {
        return this.security.marketData.rvsScoreData.rvs_score;
    }

    get erh_score(): number {
        return this.emc_score + this.rvs_score;
    }

    get fa_score(): number {
        return this.security.marketData.fallenAngleData.num_of_month_in_indx;
    }

    get leverage_ratio(): number {
        return this.security.marketData.rvsScoreData.leverage_ratio;
    }

    get leverage_score(): number {
        return this.security.marketData.rvsScoreData.leverage_score;
    }

    get leverage_score_secwise(): number {
        return this.security.marketData.rvsScoreData.leverage_score_secwise;
    }

    get sector(): string {
        return this.security.sector;
    }

    get multiplier(): number {
        return this.security.multiplier;
    }

    get industry_level_1(): string {
        return this.security.sector;
    }

    get industry_level_2(): string {
        return this.security.industry_level_2;
    }

    get eq_intraday_ret(): number {
        let sec = this.security.deal_eq_sec;
        if (sec != null) {
            return sec.marketData.intradayRet.ret;
        } else {
            return null;
        }
    }

    get marketSegment(): string {
        return this.security.marketSegment;
    }

    get liqScore(): number {
        return this.security.liqScore;
    }

    get total(): string {
        return 'Total';
    }
}
