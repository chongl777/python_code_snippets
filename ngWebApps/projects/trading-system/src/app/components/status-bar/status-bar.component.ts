import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ClockService } from '../../services/clock.service';
import { environment } from '@environments/environment';
import { MsgControllerService } from '@app/services/msg-controller.service';


@Component({
    selector: 'app-status-bar',
    templateUrl: './status-bar.component.html',
    styleUrls: ['./status-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent implements OnInit {

    now: Date;
    fixConnectionStatus: string;
    eventConnectionStatus: string;
    bookingConnectionStatus: string;
    subscription = new Subscription();
    version: string;

    constructor(
        private _cdr: ChangeDetectorRef,
        private clockService: ClockService,
        private msgController: MsgControllerService,
        @Inject(DOCUMENT) private document: Document) {

        this.subscription.add(this.clockService.now$.subscribe((now) => {
            this.now = now;
            this._cdr.detectChanges();
        }));
    }

    ngOnInit(): void {
        this.subscription.add(this.msgController.fixConnectionState$.subscribe(
            (status) => {
                this.fixConnectionStatus = (status == 1 ? 'Connected' : 'Disconnected')
                this._cdr.detectChanges();
            }));

        this.subscription.add(this.msgController.eventConnectionState$.subscribe(
            (status) => {
                this.eventConnectionStatus = (status == 1 ? 'Connected' : 'Disconnected')
                this._cdr.detectChanges();
            }));

        this.subscription.add(this.msgController.bookingConnectionState$.subscribe(
            (status) => {
                this.bookingConnectionStatus = (status == 1 ? 'Connected' : 'Disconnected')
                this._cdr.detectChanges();
            }));

        this.version = environment.version;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    recertify() {
        this.document.location.href = environment.msg_queue_config.url.replace('wss', 'https');
    }

}
