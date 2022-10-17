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
        host: msg_queue_config.fix_host,
    }
    heartbeatIncoming = 0; // Typical value 0 - disabled
    heartbeatOutgoing = 20000; // Typical value 20000 - every 20 seconds
    reconnectDelay = 20000;
    constructor() {
        super();
    }

    // debug = (msg: string): void => {
    //     DEBUG_MSG$.next(msg);
    // }
};

export class BookingRxStompConfig extends InjectableRxStompConfig {
    brokerURL = msg_queue_config.url;
    connectHeaders = {
        login: msg_queue_config.login,
        passcode: msg_queue_config.passcode,
        host: msg_queue_config.booking_host,
    }
    heartbeatIncoming = 0; // Typical value 0 - disabled
    heartbeatOutgoing = 20000; // Typical value 20000 - every 20 seconds
    reconnectDelay = 20000;
    constructor() {
        super();
    }

    // debug = (msg: string): void => {
    //     // DEBUG_MSG$.next(msg);
    //     console.log(msg)
    // }
};


export function RxStompConfigFactory(): InjectableRxStompConfig {
    return new FIXRxStompConfig();
}

export function FIXRxStompServiceFactory(): RxStompService {
    return rxStompServiceFactory(new FIXRxStompConfig());
}

export function EventRxStompServiceFactory(): RxStompService {
    return rxStompServiceFactory(new FIXRxStompConfig());
}

export function BookingRxStompServiceFactory(): RxStompService {
    return rxStompServiceFactory(new BookingRxStompConfig());
}

// export function BookingRxStompServiceFactory(): RxStompService {

//     return rxStompServiceFactory(new InjectableRxStompConfig() {
//         brokerURL = msg_queue_config.url;
//         connectHeaders = {
//             login: msg_queue_config.login,
//             passcode: msg_queue_config.passcode,
//             host: msg_queue_config.booking_host,
//         }
//         heartbeatIncoming = 0; // Typical value 0 - disabled
//         heartbeatOutgoing = 20000; // Typical value 20000 - every 20 seconds
//         reconnectDelay = 20000;
//     });
// }


export class FixRxStompService extends RxStompService {
}

export class EventRxStompService extends RxStompService {
}


export class BookingRxStompService extends RxStompService {
}
