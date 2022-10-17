import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';

import { Security } from '@app/models/security';
import { TradeTicket } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';


@Component({
    selector: 'app-pending-ticket',
    templateUrl: './pending-ticket.component.html',
    styleUrls: ['./pending-ticket.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingTicketComponent implements OnInit {
    @Input() ticket: TradeTicket;
    @Input() onFocus: (ticket: TradeTicket, event: MouseEvent) => void;

    constructor(
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef,
    ) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {

    }
}
