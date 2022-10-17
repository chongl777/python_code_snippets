import { Component, OnInit, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Subscription } from "rxjs";

import { MsgControllerService } from '@app/services/msg-controller.service';


@Component({
    selector: 'app-debug-msg',
    templateUrl: './debug-msg.component.html',
    styleUrls: ['./debug-msg.component.scss']
})
export class DebugMsgComponent implements OnInit, OnDestroy {
    @ViewChild('MsgLog', { static: true }) msgLog: ElementRef
    private msgLogSubscription: Subscription;

    constructor(
        private msgController: MsgControllerService,
        private renderer: Renderer2,) {

    }

    ngOnInit(): void {
        this.msgLogSubscription = this.msgController.mqMsg$.subscribe(
            (msg: string) => {
                //.appendChild(msg);
                let elm = this.renderer.createElement('div');
                elm.textContent = msg;
                this.renderer.appendChild(this.msgLog.nativeElement, elm);
                // console.log(msg);
            });
    }

    ngOnDestroy(): void {
        this.msgLogSubscription.unsubscribe();
    }
}
