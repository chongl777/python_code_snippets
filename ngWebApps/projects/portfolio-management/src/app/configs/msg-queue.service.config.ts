import {
    InjectableRxStompConfig, RxStompService, rxStompServiceFactory,
    RxStompRPCService, InjectableRxStompRPCConfig,
} from '@stomp/ng2-stompjs';

import { environment } from '@environments/environment';
import { BehaviorSubject } from 'rxjs';


let msg_queue_config = environment.msg_queue_config;
export const DEBUG_MSG$ = new BehaviorSubject<string>('');


export class FIXRxStompConfig extends InjectableRxStompConfig {
    brokerURL = msg_queue_config.url;
    connectHeaders = {
        login: msg_queue_config.login,
        passcode: msg_queue_config.passcode,
        host: msg_queue_config.event_host,
    }
    heartbeatIncoming = 0; // Typical value 0 - disabled
    heartbeatOutgoing = 20000; // Typical value 20000 - every 20 seconds
    reconnectDelay = 5000;
    constructor() {
        super();
    }

    // debug = (msg: string): void => {
    //     console.log(msg);
    // }
};


export function EventRxStompServiceFactory(): RxStompService {
    return rxStompServiceFactory(new FIXRxStompConfig());
}

export class EventRxStompService extends RxStompService {
}
