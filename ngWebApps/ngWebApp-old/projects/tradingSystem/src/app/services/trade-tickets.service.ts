import { EventEmitter, Injectable } from '@angular/core';
import { Order, DummyOrder } from '@app/models/order';
import { RxStompState } from '@stomp/rx-stomp';
import { Observable, of, Subject, BehaviorSubject, Subscription, merge, combineLatest } from 'rxjs';
import { finalize, delay, take, timeout, switchMap, map, startWith } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import * as d3 from 'd3';

import { NullSecurity, Security } from '../models/security';
import { MarketData } from '../models/marketData';
import { MsgControllerService } from './msg-controller.service';
import { IndicationOfInterestService } from './indication-of-interest.service';
import { SecurityService } from './security.service';
import { environment } from '@environments/environment';
import { TradeTicket } from '@app/models/tradeTicket';
import * as commons from '@app/models/commons';
import { HttpControllerService } from './http-controller.service';
import { PortfolioService } from './portfolio.service';
import { Transaction } from '@app/models/transaction';


let TIMEOUT = environment.default_timeout;

export const AVAILABLE_STAGS: { tag1: string, tag2: string, tag3: string }[] = []

@Injectable({
    providedIn: 'root'
})
export class TradeTicketsService {
    public loading$: Observable<boolean>;
    public loading_ticket$ = new BehaviorSubject<boolean>(true);
    public loading_tags$ = new BehaviorSubject<boolean>(true);
    public loading_counterparties$ = new BehaviorSubject<boolean>(true);
    public loading_transaction$ = new BehaviorSubject<boolean>(false);
    public refreshTransactions$ = new EventEmitter<any>();

    public tickets$ = new BehaviorSubject<TradeTicket[]>([]);
    private tickets: { [ticket_id: string]: TradeTicket } = {};

    public transactions$ = new BehaviorSubject<TradeTicket[]>([]);
    private transactions: { [trade_id: number]: TradeTicket } = {};

    private subscription = new Subscription();
    public counterparties: { [alias: string]: { Alias: string, Name: string, DTCC: string } } = {};

    constructor(
        private msgController: MsgControllerService,
        private httpService: HttpControllerService,
        private securityService: SecurityService,
        private portfolioService: PortfolioService,
    ) {
        // this.subscription.add(
        this.loading$ = combineLatest(
            [this.loading_ticket$, this.loading_tags$, this.loading_counterparties$])
            .pipe(
                map(([tickt, tags, counterparties]) => {
                    return tickt || tags || counterparties;
                }));

        this.subscription.add(
            combineLatest(
                [this.msgController.bookingConnected$, this.securityService.loading$])
                .subscribe(([state, sec_loading]) => {
                    if ((state === RxStompState.OPEN) && !sec_loading) {
                        this.loadAllTickets();
                        this.loadStrategyTag();
                        this.loadCounterparties();
                    }
                }));

        this.subscribeTicketsUpdate();

        this.subscription.add(
            this.loading$.subscribe((load) => {
                if (!load) {
                    this.update();
                }
            }));
    }

    get isLoading(): boolean {
        return this.loading_ticket$.getValue() ||
            this.loading_tags$.getValue() ||
            this.loading_counterparties$.getValue();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        console.log('ticket service destroyed!');

    }

    private async process_ticket(json: any): Promise<TradeTicket> {
        if (json.TicketID == null) {
            console.error('ticket with null id', json);
            return
        }
        if (!(json.TicketID in this.tickets)) {
            let SecurityID = +json.SecurityID
            if (SecurityID == null) {
                // throw Error("security_id is null!");
                console.error("security_id is null!");
                this.tickets[json.TicketID] = new TradeTicket(
                    new NullSecurity()
                );
            } else {
                let security = await this.securityService.getSecurity(
                    SecurityID, null, 100)
                this.tickets[json.TicketID] = new TradeTicket(security);
            }
        }
        this.tickets[json.TicketID].deserialize(json);

        return this.tickets[json.TicketID];
    }

    public addNewTicket(security: Security) {

        let ticketID = uuid();
        let ticket = new TradeTicket(security)
        ticket.manualCreated = true;
        ticket.ticketID = ticketID;
        ticket.tradeDate = d3.timeFormat('%Y-%m-%dT00:00:00')(new Date());
        ticket.settleDate = d3.timeFormat('%Y-%m-%dT00:00:00')(new Date());
        this.tickets[ticketID] = ticket;

        this.update()
    }

    public invalidateTicket(ticket: TradeTicket) {
        delete this.tickets[ticket.ticketID];
        this.update()
    }

    public async submitTicket(ticket: TradeTicket): Promise<string> {
        let msg = await this.httpService.submitTradeTicket(ticket);
        delete this.tickets[ticket.ticketID];

        this.portfolioService.reloadAllPositions();
        this.msgController.broadcastPostionChange();
        this.refreshTransactions$.emit();
        this.update()
        return msg;
    }

    public async cancelTransaction(ticket: TradeTicket): Promise<string> {
        ticket.indicator = 'C';
        let msg = await this.httpService.cancelTransaction(ticket);
        // delete this.tickets[ticket.ticketID];

        this.portfolioService.reloadAllPositions();
        this.msgController.broadcastPostionChange();
        this.refreshTransactions$.emit();
        this.update();
        return msg;
    }

    async deleteTransaction(ticket: TradeTicket): Promise<any> {
        let msg = this.httpService.deleteTransaction$(ticket.tradeID);
        this.portfolioService.reloadAllPositions();
        this.msgController.broadcastPostionChange();
        this.refreshTransactions$.emit();
        this.update();

        return msg;
    }


    public async getTicket(ticketID: string): Promise<TradeTicket> {
        return this.tickets[ticketID];
    }

    private async subscribeTicketsUpdate(): Promise<any> {

        this.msgController.ticketsUpdate$.subscribe({
            next: async (resp: string) => {
                try {
                    let tickets = JSON.parse(resp);
                    this.loading_ticket$.next(true);
                    await this.process_tickets_update(tickets);
                    this.loading_ticket$.next(false);
                    this.update();
                } catch (err) {
                    console.error(err);
                    this.loading_ticket$.next(false);
                    this.tickets$.error(err);
                }
            },
            error: (error: Error) => console.error(error),
        });

        this.msgController.positionChange$.subscribe({
            next: async () => {
                for (let ticket of Object.values(this.tickets)) {
                    ticket.lotQueried = false;
                }
            }
        });
    }

    private async process_tickets_update(response: any[]): Promise<any> {
        let allTicketIDs = response.map((x) => x.TicketID);
        for (let ticketID in this.tickets) {
            if (!allTicketIDs.includes(ticketID) && !this.tickets[ticketID].manualCreated) {
                delete this.tickets[ticketID];
            }
        }

        for (let json of response) {
            await this.process_ticket(json);
        }
    }

    private async loadStrategyTag(): Promise<any> {
        this.loading_tags$.next(true);
        this.httpService.loadStrategyTag$
            .subscribe({
                next: async (resp: any) => {
                    while (AVAILABLE_STAGS.length > 0) {
                        AVAILABLE_STAGS.pop();
                    }
                    for (let tags of resp) {
                        AVAILABLE_STAGS.push(tags);
                    }
                    this.loading_tags$.next(false);
                },
                error: (error: Error) => {
                    this.loading_tags$.next(false);
                    console.error(error);
                },
                complete: async () => {
                }
            });
    }

    public async loadAllTickets(): Promise<any> {
        console.log('load all tickets...');
        this.loading_ticket$.next(true);
        this.httpService.loadPendingTickets$
            .subscribe({
                next: async (resp: any) => {
                    await this.process_tickets_update(resp);
                    this.loading_ticket$.next(false);
                    this.update();
                    console.log('process all tickets done!');
                },
                error: (error: Error) => {
                    this.loading_ticket$.next(false);
                    this.tickets$.error(error);
                    console.error(error);
                },
                complete: async () => {
                }
            });
    }

    private async loadCounterparties(): Promise<any> {
        console.log('load all counterparties...');
        this.loading_counterparties$.next(true);
        this.httpService.loadCounterparties$
            .subscribe({
                next: async (counterparties: any[]) => {
                    for (let counterpty of counterparties) {
                        this.counterparties[counterpty['Alias']] = counterpty;
                    }
                    this.loading_counterparties$.next(false);
                    this.update();
                    console.log('load all counterparties done!');
                },
                error: (error: Error) => {
                    this.loading_counterparties$.next(false);
                    this.tickets$.error(error)
                    console.error(error);
                },
                complete: async () => {
                }
            });
    }

    private async process_transaction(json: any): Promise<TradeTicket> {
        if (json.TradeID == null) {
            console.error('transaction with null TradeID', json);
            return
        }
        let SecurityID = +json.SecurityID
        if (SecurityID == null) {
            // throw Error("security_id is null!");
            console.error("security_id is null!");
            this.transactions[json.TradeID] = new TradeTicket(
                new NullSecurity());
        } else {
            let security = await this.securityService.getSecurity(
                SecurityID, null, 1)
            this.transactions[json.TradeID] = new TradeTicket(security);
        }

        this.transactions[json.TradeID].deserialize_confirmed(json);

        return this.transactions[json.TradeID];
    }

    private async process_transactions(response: any[]): Promise<any> {
        this.transactions = {}
        for (let json of response) {
            await this.process_transaction(json);
        }
    }

    public async loadConfirmedTransactions(start: Date, end: Date): Promise<any> {
        this.loading_transaction$.next(true);
        this.httpService.loadTransactions$(start, end)
            .subscribe({
                next: async (transactions: any[]) => {
                    await this.process_transactions(transactions);
                    this.transactions$.next(Object.values(this.transactions));
                    this.loading_transaction$.next(false);
                },
                error: (error: Error) => {
                    this.loading_transaction$.next(false);
                    this.transactions$.error(error);
                    console.error(error);
                },
                complete: async () => {
                }
            });
    }

    update(): void {
        if (this.isLoading) {
            return;
        }
        this.tickets$.next(Object.values(this.tickets));
    }

    async loadLots(ticket: TradeTicket): Promise<any> {
        let lots = await this.httpService.loadTaxLots(ticket);
        ticket.processTaxLots(lots);
        ticket.lotQueried = true;
    }

    async sendTradePrint(tickets: TradeTicket[]): Promise<any> {
        tickets.map(x => x.indicator = 'N');
        return this.httpService.sendTradePrint$(tickets);
    }

    async submitTradePrint(tickets: TradeTicket[]): Promise<any> {
        tickets.map(x => x.indicator = 'N');
        return this.httpService.submitTradePrint$(tickets);
    }
}


export class TradeTicketsDataService {
    public tickets$ = new BehaviorSubject<TradeTicket[]>([]);
    public tickets: TradeTicket[];
    public loading$: Observable<boolean>;

    constructor(
        private ticketsService: TradeTicketsService,
    ) {

        this.ticketsService.tickets$.subscribe({
            next: (tickets: TradeTicket[]) => {
                this.tickets = tickets;
                this.update();
            },
            error: (err) => {
                this.tickets$.error(err);
            }
        });

        this.loading$ = this.ticketsService.loading$;
    }

    update(): void {
        this.tickets$.next(this.tickets);
    }

}
