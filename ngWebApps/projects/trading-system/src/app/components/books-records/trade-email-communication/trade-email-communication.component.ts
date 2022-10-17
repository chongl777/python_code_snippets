import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroupDirective, Validators } from '@angular/forms';

import { BehaviorSubject, Subscription } from 'rxjs';
import * as d3 from 'd3';

import { Mail } from 'shared-library';

import { Security } from '@app/models/security';
import { TradeTicket } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';
import { HttpControllerService } from '@app/services/http-controller.service';
import * as commons from '@app/models/commons';
import { MatDialog } from '@angular/material/dialog';
import { DialogWindowComponent } from '@app/components/dialog-window/dialog-window.component';
import { EmailDialogComponent } from '@app/components/email-dialog/email-dialog.component';


type MailsGroup = { t_date: Date, children: Mail[] };


@Component({
    selector: 'app-trade-email-communication',
    templateUrl: './trade-email-communication.component.html',
    styleUrls: ['./trade-email-communication.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeEmailCommunication implements OnInit {
    ticket: TradeTicket;
    loading$ = new BehaviorSubject<boolean>(true);
    subscription = new Subscription();
    mails: Mail[];
    mailsGroup: MailsGroup[];
    selectedMail: Mail;
    errMsg: string = "";

    constructor(
        private eventService: EventService,
        private httpService: HttpControllerService,
        public matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef,
    ) {
        this.subscription.add(
            this.eventService.selectedTradeTicket$.subscribe({
                next: async (ticket: TradeTicket) => {
                    this.ticket = ticket;
                    this.loading$.next(true);
                    this.loadEmail();
                },
            }));
    }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.mails = [];
        this.mailsGroup = []
    }

    async loadEmail() {
        try {
            this.errMsg = "";
            this.mails = await this.httpService.loadEmails(this.ticket);
            this.mails.sort((a: Mail, b: Mail) => b.created.getTime() - a.created.getTime());
            this.groupMail();
            this.selectedMail = null;
            this.loading$.next(false);
        } catch (err) {
            console.error(err);
            this.errMsg = commons.errMsg(err);
            this.mails = [];
            this.mailsGroup = []
            this.loading$.next(false);
        }
    }

    onSelect(mail: Mail, event: any): void {
        this.selectedMail = mail;
        if (!this.selectedMail.isRead) {
            this.httpService.markedAsRead(mail)
        }
        event.stopPropagation();
    }

    groupMail(): void {
        let res: { [key: string]: MailsGroup } = {};

        for (let mail of this.mails) {
            let t_date = mail.createdDate;
            let groupValue = d3.timeFormat('%Y-%m-%d')(t_date);
            if (!res[groupValue]) {
                res[groupValue] = { t_date: t_date, children: [] };
            }
            res[groupValue].children.push(mail);
        }
        this.mailsGroup = Object.values(res);
    }

    ConfirmTrade(): void {
        let mail = this.selectedMail;
        let data = {
            mailType: 'Reply',
            msg_id: mail.msg_id,
            to: [mail.sender],
            cc: Array.prototype.concat(mail.cc, mail.to),
            body: 'Confirming the trades, please allocate to GS account. \n\nthanks\n\n'
        }

        DialogWindowComponent.OpenReplyEmailDialog(
            this.matDialog, EmailDialogComponent,
            data).subscribe(
                async (success) => {
                    if (success) {
                        await this.httpService.brokersConfirm([this.ticket]);
                        this.eventService.updateTradeSettlementComponent$.emit(true);
                    }
                }
            );
    }
}
