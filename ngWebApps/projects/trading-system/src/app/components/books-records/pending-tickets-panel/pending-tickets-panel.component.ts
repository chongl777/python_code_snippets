import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MsgControllerService } from '@app/services/msg-controller.service';
import { combineLatest, merge, Observable } from 'rxjs';
import { finalize, map, startWith, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs'
import { TradeTicketsDataService, TradeTicketsService } from '@app/services/trade-tickets.service';
import { SecurityService } from '@app/services/security.service';
import { TradeTicket } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';
import { DialogWindowComponent } from '@app/components/dialog-window/dialog-window.component';
import { MatDialog } from '@angular/material/dialog';
import { NewTicketComponent } from './new-ticket.component';
import { NullSecurity } from '@app/models/security';
import * as commons from '@app/models/commons';

@Component({
    selector: 'app-pending-tickets-panel',
    templateUrl: './pending-tickets-panel.component.html',
    styleUrls: ['./pending-tickets-panel.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
    // providers: [TradeTicketsService, ]
})
export class PendingTicketsPanelComponent implements OnInit {

    tradeTicketDataService: TradeTicketsDataService;
    loading$: Observable<boolean>;
    subscription = new Subscription();
    errMsg: string = '';
    data: TradeTicket[] = [];

    constructor(
        private securityService: SecurityService,
        public tradeTicketService: TradeTicketsService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
        public eventService: EventService,
    ) {
        this.tradeTicketDataService = new TradeTicketsDataService(this.tradeTicketService);

        this.loading$ = combineLatest(
            [this.tradeTicketService.loading$,
            this.securityService.loading$]).pipe(
                map(([tkt_loading, sec_loading]) => {
                    return tkt_loading || sec_loading;
                }),
                startWith(true),
            );
    }

    ngOnInit(): void {
        this.subscription.add(this.tradeTicketDataService.tickets$.subscribe({
            next: (tickets: TradeTicket[]) => {
                this.data = tickets;
                // this.dataSource.sort()
                // this.dataSource.dataToRender$.next(positions);
                // this.dataSource = new TableVirtualScrollDataSource<Position>(positions);
                this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = commons.errMsg(error);
            }
        }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();

    }

    onSelect(): (ticket: TradeTicket, event) => void {
        return (ticket: TradeTicket, event) => {
            this.eventService.selectedTradeTicket$.next(ticket);
            this.eventService.selectSecurity$.next(ticket.security);
            event.stopPropagation();
        }
    }

    onUnSelect(): void {
        this.eventService.selectedTradeTicket$.next(null);
        this.eventService.selectSecurity$.next(null);
    }

    openNewTicket(event?: any): void {
        this.subscription.add(
            DialogWindowComponent
                .OpenNewTicket(
                    this.matDialog,
                    NewTicketComponent,
                    null,
                )
                .subscribe((security) => {
                    if (security == null) {
                        return;
                    }
                    this.addNewTicket(security)
                })
        );
    }

    addNewTicket(security: any): void {
        this.tradeTicketService.addNewTicket(security);
    }

    async refresh(): Promise<any> {
        try {
            this.errMsg = '';
            await this.tradeTicketService.loadAllTickets();
        } catch (error) {
            console.error(error);
            this.errMsg = commons.errMsg(error);
        }
    }
}
