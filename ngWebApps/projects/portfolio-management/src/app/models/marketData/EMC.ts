import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';

import { TradingSignal } from './TradingSignal';

interface EMCHist { t_date: any[], score: any[], signal: any[] };


export class EMC implements TradingSignal<EMC> {
    version: number;
    last_update: Date;
    readonly securityID: number;
    public signalSrc: number;
    public sid_equity: number;
    public score: number;
    public signal: number;
    public ret_1: number;
    public ret_2: number;
    public ret_3: number;
    public ret_4: number;
    public historyData: EMCHist;

    constructor(securityID: number, signalSrc: number) {
        this.securityID = +securityID;
        this.signalSrc = signalSrc;
    }

    processHistData(json: any): EMCHist {
        let data = { t_date: [], score: [], signal: [], bond_px: [], equity_px: [] };
        data['t_date'] = json['t_date'].map((x) => new Date(x));
        data['score'] = json['score'];
        data['signal'] = json['signal'];
        data['bond_px'] = json['bond_px'];
        data['equity_px'] = json['equity_px'];
        return data;
    }

    public deserialize(json: Object): EMC {
        this.version = json['emc_details']['version'];
        this.last_update = new Date(json['emc_details']['last_update']);
        this.sid_equity = json['emc_details']['sid_equity'];

        this.score = json['emc_details']['score'];
        this.signal = json['emc_details']['signal'];
        this.ret_1 = json['emc_details']['ret_1'];
        this.ret_2 = json['emc_details']['ret_2'];
        this.ret_3 = json['emc_details']['ret_3'];
        this.ret_4 = json['emc_details']['ret_4'];
        this.historyData = this.processHistData(json['emc_hist']);
        return this;
    }
}
