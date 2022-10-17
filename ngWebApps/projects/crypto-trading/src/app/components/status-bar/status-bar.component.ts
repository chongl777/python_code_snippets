import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';

import { services } from 'shared-library';
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
    //fixConnectionStatus: string;
    mktConnectionStatus: string;
    //bookingConnectionStatus: string;
    subscription = new Subscription();
    version: string;

    constructor(
        private _cdr: ChangeDetectorRef,
        private clockService: services.ClockService,
        private msgController: MsgControllerService,
        @Inject(DOCUMENT) private document: Document
    ) {

        this.subscription.add(this.clockService.now$.subscribe((now) => {
            this.now = now;
            this._cdr.detectChanges();
        }));
    }

    ngOnInit(): void {
        this.subscription.add(this.msgController.mktConnectionState$.subscribe(
            (status) => {
                let StatusMap = {
                    0: 'Connecting',
                    1: 'Connected',
                    2: 'Closing',
                    3: 'Closed',
                }
                this.mktConnectionStatus = StatusMap[status];
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
