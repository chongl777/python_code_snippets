import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';

// import { MarketDataSource } from './marketDataSource';


@Injectable({
    providedIn: 'root'
})
export class HttpMarketDataSource {
    private trading_signal_url = environment.urls.trading_signal_url;
    private sec_info_url = environment.urls.sec_info_url;

    constructor(
        private http: HttpClient,
    ) {
    }

    getTradingSignal(securityID: number, signal_src: number): Promise<any> {
        return this.http.get(
            this.trading_signal_url + '/trading_signal',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sid': securityID.toString(),
                    'signal_src': signal_src.toString(),
                },
                responseType: 'json',
            }
        ).toPromise();
    };

    getSecurityData(securityID: number): Promise<any> {
        return this.http.get(
            this.sec_info_url + '/get_security_general_info',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sid': securityID.toString(),
                },
                responseType: 'json',
            }
        ).toPromise();
    };

    getSecurityTrdingRecords(securityIDs: number[], fundIDs: number[]): Promise<any> {
        return this.http.get(
            this.sec_info_url + '/security_trading_records',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sids': JSON.stringify(securityIDs),
                    'fund_ids': JSON.stringify(fundIDs),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    getSecurityPriceHist(securityIDs: number[]): Promise<any> {
        return this.http.get(
            this.sec_info_url + '/security_price_hist',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sids': JSON.stringify(securityIDs),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    allSecuritiesInParent(parentID: number): Promise<any> {
        return this.http.get(
            this.sec_info_url + '/get_all_securities_in_parent',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'pid': JSON.stringify(parentID),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    getSecuritiesIndex(): Promise<any> {
        return this.http.get(
            this.sec_info_url + '/securities_index',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'json',
            }
        ).toPromise();
    }

    getSecurityAttr(securityID: number) {
        return this.http.get(
            this.sec_info_url + '/get_security_additional_info',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sid': JSON.stringify(securityID),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    getSecurityRtg(securityID: number) {
        return this.http.get(
            this.sec_info_url + '/get_security_latest_rtg',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sid': JSON.stringify(securityID),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    getSecurityCurrentPx(securityID: number) {
        return this.http.get(
            this.sec_info_url + '/get_security_latest_price',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sid': JSON.stringify(securityID),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    getCashflow(securityID: number) {
        return this.http.get(
            this.sec_info_url + '/get_security_info_cash_flow',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                params: {
                    'sid': JSON.stringify(securityID),
                },
                responseType: 'json',
            }
        ).toPromise();
    }

    updateFinraID(securityID: number, parentID: number) {
        let params = new URLSearchParams();
        params.set('sid', securityID.toString());
        params.set('cid', parentID.toString());

        return this.http.post<any>(
            this.sec_info_url + '/update_finra_id',
            params.toString(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'json',
            }
        ).toPromise();
    }

    updateFinraPrice(securityID: number, parentID: number) {
        let params = new URLSearchParams();
        params.set('sid', securityID.toString());
        params.set('cid', parentID.toString());

        return this.http.post(
            this.sec_info_url + '/update_sec_price_finra',
            params.toString(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'text',
            }
        ).toPromise();
    }

    updateBBGPrice(securityID: number, parentID: number) {
        let params = new URLSearchParams();
        params.set('sid', securityID.toString());
        params.set('cid', parentID.toString());

        return this.http.post(
            this.sec_info_url + '/update_sec_price_bbg',
            params.toString(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'text',
            }
        ).toPromise();
    }

    updateCorpStructure(parentID: number) {
        let params = new URLSearchParams();
        params.set('cid', parentID.toString());

        return this.http.post(
            this.sec_info_url + '/update_corp_structure_bbg',
            params.toString(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'text',
            }
        ).toPromise();
    }

    updateCache(all: boolean): Promise<string> {
        let params = new URLSearchParams();
        params.set('all', all.toString());

        return this.http.post(
            this.sec_info_url + '/update_cached_value',
            params.toString(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                responseType: 'text' as const,
            }
        ).toPromise();
    }
}
