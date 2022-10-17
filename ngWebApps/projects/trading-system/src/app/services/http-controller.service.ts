import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@environments/environment';

import * as d3 from 'd3';
import { TradeTicket, TradeTicketCounterpartyGroup, convertToDate } from '@app/models/tradeTicket';
import { AuthService, Mail } from 'shared-library';


@Injectable({
    providedIn: 'root'
})
export class HttpControllerService {
    private url = environment.urls.pfmgmt_url;
    private booking_url = environment.urls.booking_url;
    private download_url = environment.util.downloadUrl;

    constructor(
        public http: HttpClient,
        private authService: AuthService,
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

    public async loadTaxLots(ticket: TradeTicket, fundIds: string[]) {
        let resp = await this.http.get<any>(
            this.booking_url + 'trading/get_lots_details_all_funds',
            {
                params: {
                    'security_id': ticket.security.securityID.toString(),
                    'fund_ids': JSON.stringify(fundIds),
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

    public async invalidateTicket(ticket: TradeTicket): Promise<string> {
        return this.http.post(
            this.booking_url + 'trading/invalidate_trading_ticket',
            ticket.to_dict(),
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                responseType: 'text',
            }
        ).toPromise();
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

    public async sendTicketsToBroker(tktGrp: TradeTicketCounterpartyGroup): Promise<boolean> {
        try {
            let data = []
            for (let tkt of tktGrp.children) {
                data.push({
                    'TradeID': tkt.ticketID,
                    'Description': tkt.security.description,
                    'Security identifier': tkt.security.isin,
                    'Broker': tktGrp.counterParty,
                    'Custodain': tkt.settleAccts[0],
                    'Transaction typ': tkt.quantity > 0 ? 'Buy' : 'Sell',
                    'Currency Code': tkt.security.currency,
                    'Trade Date': d3.timeFormat('%Y-%m-%d')(convertToDate(tkt.tradeDate)),
                    'Settle Date': d3.timeFormat('%Y-%m-%d')(convertToDate(tkt.settleDate)),
                    'Quantity': tkt.quantity,
                    'Price': tkt.price,
                    'Accrued Interest': tkt.accruedInt,
                    'Net Amount': tkt.NetAmount,
                    'Principal': tkt.Principal,
                });
            }

            let attachment = await this.http.post(
                this.download_url, data, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }),
                //responseType: 'arraybuffer',
                //responseType: 'blob',
                responseType: 'text',
                withCredentials: true,
            }).toPromise();

            let attachments = {};
            // attachments[`${tktGrp.counterParty} Trades - Westfield ${data[0]['Trade Date']}.csv`] = await attachment.text();
            attachments[`${tktGrp.counterParty} Trades - Westfield ${data[0]['Trade Date']}.csv`] = attachment;


            await this.authService.sendEmail$(
                `${tktGrp.counterParty} - Westfield Trades`,
                `Please see attached our trades details for ${data[0]['Trade Date']}.\n thanks,`,
                tktGrp.cp.email_trade_settlement.split(';').map(x => x.trim()),
                ['ops@westfieldinvestment.com'],
                attachments = attachments,
            ).toPromise();
            return true
        } catch (err) {
            throw err;
        }
    }

    public async sendTicketsToBrokers(tktGrps: TradeTicketCounterpartyGroup[]): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            let rslt = []
            for (let tktGrp of tktGrps) {
                this.sendTicketsToBroker(tktGrp).then(
                    (success: boolean) => {
                        rslt.push(success);
                        if (rslt.length == tktGrps.length) {
                            resolve(true);
                        }
                    },
                    (err) => {
                        reject(err);
                    }
                );
            }
        });
    }

    public async brokersConfirm(tkts: TradeTicket[]): Promise<any> {
        let tkt_ids = { 'trade_ids': tkts.map(x => x.tradeID) };
        return this.http.post(
            this.booking_url + '/trading/brokers_confirm', tkt_ids, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }),
            responseType: 'text',
        }).toPromise();
    }

    public async loadEmails(tkt: TradeTicket): Promise<Mail[]> {
        if (tkt == null || tkt.cp.email_confirmation == null) {
            return [];
        }
        let inbox_query = '(' + tkt.cp.email_confirmation.split(';').map(
            x => `from/emailAddress/address eq '${x}'`).join(' or ') + ')';

        // let outbox_search = '(' + tkt.cp.email_confirmation.split(';').map(
        //     x => `recipients:${x}`).join(' or ') + ')';

        let s_date = d3.timeFormat('%Y-%m-%d')(convertToDate(tkt.tradeDate))

        let query_date = `(ReceivedDateTime ge ${s_date})`

        return this.authService.loadEmails$(
            50, [inbox_query, query_date].join(' and '),
            null, true,
            JSON.stringify([
                tkt.security.isin, tkt.security.cusip, tkt.security.description])
        ).toPromise();
    }

    public async markedAsRead(mail: Mail): Promise<Mail> {
        let markedMail = await this.authService.mailMarkedAsRead$(mail.msg_id).toPromise();
        mail.isRead = markedMail['is_read'];
        return mail;
    }
}
