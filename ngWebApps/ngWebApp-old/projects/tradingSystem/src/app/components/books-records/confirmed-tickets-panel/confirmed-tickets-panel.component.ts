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
import { NullSecurity } from '@app/models/security';
import { Transaction } from '@app/models/transaction';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import * as commons from '@app/models/commons';


@Component({
    selector: 'app-confirmed-tickets-panel',
    templateUrl: './confirmed-tickets-panel.component.html',
    styleUrls: ['./confirmed-tickets-panel.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
    // providers: [TradeTicketsService, ]
})
export class ConfirmedTicketsPanelComponent implements OnInit {

    loading$: Observable<boolean>;
    subscription = new Subscription();
    errMsg: string = '';
    data: TradeTicket[] = [];
    dateRange: FormGroup;
    transaction: TradeTicket;
    columnsToDisplay = ['Select', 'Side', 'TradeId', 'TradeDt', 'Name',
        'Quantity', 'CounterPty', 'CP_Code', 'TradePrint'];

    selection = new SelectionModel<TradeTicket>(true, []);
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.data.filter(x => x.isvalid).forEach(row => this.selection.select(row));
    }

    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.data.filter(x => x.isvalid).length;
        return numSelected === numRows;
    }

    constructor(
        private securityService: SecurityService,
        public tradeTicketService: TradeTicketsService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
        private eventService: EventService,
    ) {

        this.dateRange = new FormGroup({
            start: new FormControl(new Date()),
            end: new FormControl(new Date()),
        });

        this.loading$ = combineLatest(
            [this.tradeTicketService.loading_transaction$,
            this.securityService.loading$]).pipe(
                map(([tkt_loading, sec_loading]) => {
                    return tkt_loading || sec_loading;
                }),
                startWith(true),
            );
    }

    ngOnInit(): void {
        this.subscription.add(this.tradeTicketService.transactions$.subscribe({
            next: (transactions: TradeTicket[]) => {
                this.data = transactions;
                this.selection.clear();
                this.data.filter(x => !x['tradePrint'] && (
                    x.transTyp == 0) && (x.settleAccts.includes('GS'))).forEach(
                        row => this.selection.select(row));
                this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = commons.errMsg(error);
            }
        }));

        this.subscription.add(
            this.tradeTicketService.refreshTransactions$.subscribe({
                next: () => {
                    this.refresh();
                }
            }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();

    }

    onSelect(transaction: TradeTicket, event: any): void {
        this.transaction = transaction;
        this.eventService.selectedTradeTicket$.next(transaction);
        this.eventService.selectSecurity$.next(transaction.security);
        event.stopPropagation();
    }

    onUnSelect(): void {
        this.transaction = null;
        this.eventService.selectedTradeTicket$.next(null);
        this.eventService.selectSecurity$.next(null);
    }

    async sendTradePrint(): Promise<void> {
        try {
            this.tradeTicketService.loading_transaction$.next(true);
            let msg = await this.tradeTicketService.sendTradePrint(this.selection.selected);
            this.tradeTicketService.loading_transaction$.next(false);
            alert(msg);
        } catch (err: any) {
            this.tradeTicketService.loading_transaction$.next(false);
            alert(commons.errMsg(err));
        }
    }

    async submitTradePrint(): Promise<void> {
        try {
            this.tradeTicketService.loading_transaction$.next(true);
            let msg = await this.tradeTicketService.submitTradePrint(this.selection.selected);
            this.tradeTicketService.loading_transaction$.next(false);
            alert(msg);
            this.refresh();
        } catch (err: any) {
            this.tradeTicketService.loading_transaction$.next(false);
            alert(commons.errMsg(err));
        }
    }

    async refresh(): Promise<any> {
        this.errMsg = '';
        let range = this.dateRange.controls;
        this.tradeTicketService.loadConfirmedTransactions(
            range.start.value, range.end.value);
    }
}
