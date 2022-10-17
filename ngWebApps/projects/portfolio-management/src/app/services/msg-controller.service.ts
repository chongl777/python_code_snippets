import { Injectable } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompState } from '@stomp/rx-stomp';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { EventRxStompService } from '@app/configs/msg-queue.service.config';

import { AuthService, models } from 'shared-library';
import { environment } from '@environments/environment'
import { EventService } from './event.service';


let MQCONFIG = environment.msg_queue_config;


@Injectable({
    providedIn: 'root'
})
export class MsgControllerService {

    readonly eventConnected$: Observable<RxStompState>;
    readonly eventConnectionState$: BehaviorSubject<RxStompState>;
    public subscription = new Subscription();

    // event
    _eventSessionId: string = null;
    public securitySelect$: Subject<any>;
    public emitSecuritySelect(sid: number): Promise<any> {
        return this.eventMsgClient.topic_broadcast(
            this._eventSessionId, 'security_selected', sid);
    }

    // msg control
    public mqMsg$ = new BehaviorSubject<string>('');
    private eventMsgClient: models.MsgClient;

    constructor(
        private eventRxStompService: EventRxStompService,
        private route: ActivatedRoute,
        private router: Router,
        private eventService: EventService,
    ) {
        this.eventMsgClient = new models.MsgClient(
            this.eventRxStompService, { msgQueue: null, timeOut: MQCONFIG.time_out });

        this.eventConnected$ = this.eventRxStompService.connected$;
        this.eventConnectionState$ = this.eventRxStompService.connectionState$;

        let params = this.route.snapshot.queryParams;
        if (params["session"] != null) {
            this.subscription.add(this.eventMsgClient.topic_subscription(
                params['session'], 'security_selected'
            ).subscribe((sid: number) => {
                this.router.navigate(
                    [],
                    {
                        relativeTo: this.route,
                        queryParams: { 'sid': sid },
                        queryParamsHandling: 'merge', // remove to replace all query params by provided
                    });
            }));
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
