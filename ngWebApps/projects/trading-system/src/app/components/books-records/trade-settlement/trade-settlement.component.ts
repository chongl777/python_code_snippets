import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MsgControllerService } from '@app/services/msg-controller.service';
import { BehaviorSubject, combineLatest, merge, Observable } from 'rxjs';
import { finalize, map, startWith, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs'
import {
    TransactionGroupDataService, TradeTicketsDataService, TradeTicketsService
} from '@app/services/trade-tickets.service';
import { SecurityService } from '@app/services/security.service';
import { TradeTicket, TradeTicketCounterpartyGroup } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';
import { DialogWindowComponent } from '@app/components/dialog-window/dialog-window.component';
import { MatDialog } from '@angular/material/dialog';
import { NullSecurity } from '@app/models/security';
import { Transaction } from '@app/models/transaction';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import * as commons from '@app/models/commons';
import { HttpControllerService } from '@app/services/http-controller.service';


@Component({
    selector: 'app-trade-settlement',
    templateUrl: './trade-settlement.component.html',
    styleUrls: ['./trade-settlement.component.scss'],
})
export class TradeSettlementComponent implements OnInit {

    loading$ = new BehaviorSubject<boolean>(true);
    subscription = new Subscription();
    errMsg: string = '';
    data: TradeTicketCounterpartyGroup[] = [];

    dateRange: FormGroup;
    transaction: TradeTicket;
    columnsToDisplay = [
        'Select', 'Side', 'TradeId', 'TradeDt', 'Name',
        'Quantity', 'Price', 'BrokerConfirmed', 'CPty', 'TradePrint'];

    tradeTicketGroupService: TransactionGroupDataService;

    selection = new SelectionModel<TradeTicket>(true, []);
    masterToggle(grp: TradeTicketCounterpartyGroup) {
        let selections = this.selection.selected.filter(
            x => x.counterParty == grp.counterParty);

        this.isAllGrpSelected(grp) ?
            selections.forEach(txn => this.selection.deselect(txn)) :
            grp.children.forEach(txn => this.selection.select(txn));
    }

    isAllGrpSelected(grp: TradeTicketCounterpartyGroup) {
        let numSelected = this.selection.selected.filter(
            x => x.counterParty == grp.counterParty).length;
        const numRows = grp.children.length;
        return numSelected === numRows;
    }

    hasGrpValue(grp: TradeTicketCounterpartyGroup) {
        let numSelected = this.selection.selected.filter(
            x => x.counterParty == grp.counterParty).length;
        return numSelected ? true : false;
    }


    constructor(
        private securityService: SecurityService,
        public tradeTicketService: TradeTicketsService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
        private eventService: EventService,
        private httpService: HttpControllerService,
    ) {
        this.tradeTicketGroupService = new TransactionGroupDataService(
            this.tradeTicketService);

        this.dateRange = new FormGroup({
            start: new FormControl(new Date()),
            end: new FormControl(new Date()),
        });

        this.subscription.add(combineLatest([
            this.tradeTicketService.loading_transaction$,
            this.tradeTicketService.loading_counterparties$,
            this.securityService.loading$,
        ]).pipe(
            map(([tkt_loading, cp_loading, sec_loading]) => {
                // return true;
                this.loading$.next(tkt_loading || cp_loading || sec_loading);
            }),
            startWith([true, true, true]),
        ).subscribe());

        this.subscription.add(
            this.eventService.updateTradeSettlementComponent$.subscribe(
                (update: boolean) => update && this.refresh()
            ));
    }

    ngOnInit(): void {
        this.subscription.add(this.tradeTicketGroupService.groupedTxns$.subscribe({
            next: (txnGroups: TradeTicketCounterpartyGroup[]) => {
                try {
                    this.data = txnGroups;
                    this.selection.clear();
                    this.data.filter(x => x.cp.canConfirm).forEach(
                        tkts => tkts.children.filter(x => !x.broker_confirmed).forEach(
                            tkt => this.selection.select(tkt)
                        ));
                    this._cdr.detectChanges();
                } catch (err) {
                    console.error(err);
                }
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

    async sendToBroker(): Promise<void> {
        try {
            this.loading$.next(true);
            let tktGrp = this.tradeTicketGroupService.groupby(
                this.selection.selected, "counterParty");
            await this.httpService.sendTicketsToBrokers(tktGrp);
            await this.httpService.brokersConfirm(this.selection.selected);
            await this.refresh();
            this.loading$.next(false);
        } catch (err) {
            this.loading$.next(false);
            this.errMsg = commons.errMsg(err);
            // this.errMsg = await ((err as any).error.text() as any);
        }
    }

    async brokersConfirm(): Promise<void> {
        try {
            this.loading$.next(true);
            await this.httpService.brokersConfirm(this.selection.selected);
            await this.refresh();
            this.loading$.next(false);
        } catch (err) {
            this.loading$.next(false);
            this.errMsg = commons.errMsg(err);
            // this.errMsg = await ((err as any).error.text() as any);
        }
    }

    async refresh(): Promise<any> {
        try {
            this.errMsg = '';
            let range = this.dateRange.controls;
            await this.tradeTicketService.loadConfirmedTransactions(
                range.start.value, range.end.value);
        } catch (error) {
            console.error(error);
            this.errMsg = commons.errMsg(error);
        }
    }
}
