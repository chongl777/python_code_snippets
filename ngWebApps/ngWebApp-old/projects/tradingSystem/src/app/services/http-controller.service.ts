import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@environments/environment';

import * as d3 from 'd3';
import { TradeTicket } from '@app/models/tradeTicket';


@Injectable({
    providedIn: 'root'
})
export class HttpControllerService {
    private url = environment.urls.pfmgmt_url;
    private booking_url = environment.urls.booking_url;

    constructor(
        public http: HttpClient,
    ) { }

    public async loadSignalMatrix(matrix_id: number) {
        let data = { matrix_id: matrix_id };
        let url = this.url
        // let url = 'https://localhost:9991/api/';
        let resp = await this.http.post<any>(
            url + 'signal_matrix',
            data,
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        ).toPromise();

        return resp;
    }

    public get loadPendingTickets$(): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.get<any>(
            this.booking_url + 'trading/pending_trade_tickets',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        );
    }

    public get loadCounterparties$(): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.get<any>(
            this.booking_url + 'trading/available_counterparites',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        );
    }

    public get loadStrategyTag$(): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.get<any>(
            this.booking_url + 'trading/get_strategy_designation',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        );
    }

    public loadTransactions$(start: Date, end: Date): Observable<any> {
        // let url = 'https://localhost:9991/api/';
        return this.http.get<any>(
            this.booking_url + 'trading/get_trade_transactions',
            {
                params: {
                    'start': d3.timeFormat('%Y-%m-%dT00:00:00')(start),
                    'end': d3.timeFormat('%Y-%m-%dT23:59:59')(end),
                },
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        );
    }

    public async loadTaxLots(ticket: TradeTicket) {
        let resp = await this.http.get<any>(
            this.booking_url + 'trading/get_lots_details_all_funds',
            {
                params: {
                    'security_id': ticket.security.securityID.toString(),
                },
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        ).toPromise();

        return resp;
    }

    public async loadSignalMatrixMeta() {
        let url = this.url
        // let url = 'https://localhost:9991/api/';
        let resp = await this.http.get<any>(
            url + 'signal_matrix_meta',
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json' as const,
            }
        ).toPromise();

        return resp;
    }

    public async recalcRVS(security_id: number, price: number, rating: string, isPrice: boolean) {
        if (isPrice) {
            let data = {
                security_id: security_id,
                price: price,
                rating: rating,
            }

            let resp = await this.http.post<any>(
                this.url + 'rvs_overrides_params_recalc_price_based',
                data,
                {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                    }),
                    responseType: 'json' as const,
                }
            ).toPromise();
            return resp;
        } else {
            let data = {
                security_id: security_id,
                spread: price,
                rating: rating,
            }

            let resp = await this.http.post<any>(
                this.url + 'rvs_overrides_params_recalc_spread_based',
                data,
                {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                    }),
                    responseType: 'json' as const,
                }
            ).toPromise();
            return resp;
        }
    }

    public async calcAccrued(ticket: TradeTicket): Promise<any> {
        return this.http.post(
            this.url + 'calculate_accrued',
            ticket.to_dict(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'json',
            }
        ).toPromise();
    }

    public async submitTradeTicket(ticket: TradeTicket): Promise<string> {
        let resp = await this.http.post(
            this.booking_url + 'trading/submit_trade_tkt',
            ticket.to_dict(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'text',
            }
        ).toPromise();
        return resp;
    }

    public async sendTradePrint$(tickets: TradeTicket[]): Promise<any> {
        return this.http.post(
            this.booking_url + 'trading/send_out_trading_records',
            { tickets: tickets.map(x => x.to_dict()), upload: false },
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'text',
            }
        ).toPromise();
    }

    public async submitTradePrint$(tickets: TradeTicket[]): Promise<any> {
        return this.http.post(
            this.booking_url + 'trading/send_out_trading_records',
            { tickets: tickets.map(x => x.to_dict()), upload: true },
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'text',
            }
        ).toPromise();
    }

    public async deleteTransaction$(tradeId: number): Promise<any> {
        return this.http.delete(
            this.booking_url + 'trading/delete_trading_record',
            {
                params: {
                    'trade_id': `${tradeId}`,
                },
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'text',
            }
        ).toPromise();
    }

    public async cancelTransaction(ticket: TradeTicket): Promise<string> {
        let resp = await this.http.post(
            this.booking_url + 'trading/cancel_trading_records',
            { ticket: ticket.to_dict(), upload: true },
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'text',
            }
        ).toPromise();
        return resp;
    }



}
