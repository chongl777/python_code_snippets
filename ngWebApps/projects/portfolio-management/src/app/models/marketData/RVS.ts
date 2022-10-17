import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { DataFrame } from './DataFrame';

import { TradingSignal } from './TradingSignal';

export class RVS implements TradingSignal<RVS> {
    public version: number;
    public last_update: Date;
    readonly securityID: number;
    public signalSrc: number;
    public sid_equity: number;
    public score: number;
    public signal: number;

    public bond_ytw: number;
    public bond_ytw_log: number;
    public bond_px: number;
    public eqt_mkt: number;
    public total_debt: number;

    // loadings
    public interceptor: number;
    public industry_level_2: string;
    public industry_level_2_beta: number;
    public bond_mat: number;
    public bond_mat_beta: number;
    public rating: number;
    public rating_beta: number;
    public leverage: number
    public leverage_beta: number;

    public bond_fair_ytw: number;

    public historyData: DataFrame = new DataFrame('t_date', ['score', 'signal']);
    public availableRtg: string[];

    get ev(): number {
        return this.eqt_mkt + this.total_debt;
    }

    // other fundamentals

    constructor(securityID: number, signalSrc: number) {
        this.securityID = +securityID;
        this.signalSrc = signalSrc;
    }

    processHistData(data: any): DataFrame {
        data.forEach(x => {
            x['t_date'] = new Date(x['t_date']).getTime();
            x['score'] = +x['score'];
            x['signal'] = +x['signal'];
        });
        this.historyData.setData(data)
        return this.historyData;
    }

    public deserialize(json: Object): RVS {
        this.version = json['rvs_details']['version'];
        this.last_update = new Date(json['rvs_details']['last_update']);
        this.sid_equity = json['rvs_details']['sid_equity'];

        let rvs_details = json['rvs_details']
        let loadings = json['loadings']

        this.score = +rvs_details['score'];
        this.signal = +rvs_details['signal'];

        this.bond_px = +rvs_details['bond_px'];
        this.bond_ytw = +rvs_details['bond_ytw'];
        this.bond_ytw_log = +loadings['bond_ytw_log'];

        this.bond_fair_ytw = +loadings['bond_fair_ytw'];
        this.bond_mat = +loadings['bond_mat'];
        this.bond_mat_beta = +loadings['bond_mat_beta'];

        this.interceptor = +loadings['const']

        this.rating = loadings['rating'];
        this.rating_beta = +loadings['rating_beta'];

        this.industry_level_2 = loadings['industry_level_2'];
        this.industry_level_2_beta = +loadings['industry_level_2_beta'];

        this.leverage = +loadings['leverage'];
        this.leverage_beta = +loadings['leverage_beta'];

        this.availableRtg = json['available_rtg'];

        // other fundamentals
        this.total_debt = rvs_details['total_debt'];
        this.eqt_mkt = rvs_details['eqt_mkt'];

        this.processHistData(json['rvs_hist']);
        return this;
    }
}
