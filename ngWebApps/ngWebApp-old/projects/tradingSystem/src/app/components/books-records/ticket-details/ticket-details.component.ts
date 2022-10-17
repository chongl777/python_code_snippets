import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';

import { Security } from '@app/models/security';
import { TradeTicket } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';
import { TradeTicketsService } from '@app/services/trade-tickets.service';
import { HttpControllerService } from '@app/services/http-controller.service';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, Validators } from '@angular/forms';
import * as commons from '@app/models/commons';
import { HttpHeaders } from '@angular/common/http';


enum Status {
    Loading,
    Error,
    Done,
}


export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective): boolean {
        const isSubmitted = form && form.submitted;
        return (control && control.invalid);
    }
}



@Component({
    selector: 'app-ticket-details',
    templateUrl: './ticket-details.component.html',
    styleUrls: ['./ticket-details.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailsComponent implements OnInit {
    @Input() ticket: TradeTicket;
    subscription = new Subscription();
    availableCounterpties = {};
    errorAccrued = new FormControl('', [Validators.required]);
    status: Status = Status.Done;
    statusErrorMsg: string;
    Status = Status;
    // matcher = new MyErrorStateMatcher();

    constructor(
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef,
        private tradeTicketsService: TradeTicketsService,
        private eventService: EventService,
        private httpService: HttpControllerService,
    ) {
        this.subscription.add(
            this.eventService.selectedTradeTicket$.subscribe({
                next: async (ticket: TradeTicket) => {
                    this.ticket = ticket;
                },
            })
        );

        this.subscription.add(
            this.tradeTicketsService.loading_counterparties$.subscribe({
                next: async (loading: boolean) => {
                    if (!loading) {
                        Object.values(
                            this.tradeTicketsService.counterparties).map(x => {
                                this.availableCounterpties[x.Alias] = x.Name;
                            });
                    }
                },
            })
        );
    }

    get availableCounterptiesArray(): any[] {
        return Object.keys(this.availableCounterpties);
    }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    async calcAccrued(ticket: TradeTicket): Promise<any> {
        try {
            this.status = Status.Loading;
            let res = await this.httpService.calcAccrued(ticket);
            ticket.accruedDate = res['accrued_start'];
            ticket.accruedIntCalc = ticket.accruedInt = res[
                'accrued_frac'] / res['full_period_frac'] * res[
                'full_period_int'] * ticket.quantity * ticket.security.multiplier
            this.status = Status.Done;
            ticket.factor = parseFloat(res.factor);
        } catch (err) {
            ticket.accruedIntCalc = NaN;
            this.status = Status.Error;
            this.statusErrorMsg = commons.errMsg(err) || "Unknown Error";
        }
    }
}
