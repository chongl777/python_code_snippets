import { BehaviorSubject } from 'rxjs';
import { InjectableRxStompConfig } from '@stomp/ng2-stompjs';


export const rxStompConfig: InjectableRxStompConfig = {
    // Which server?

    // brokerURL: 'ws://10.92.1.8:15674/ws',
    // brokerURL: 'ws://10.92.1.8:15673/ws',
    // brokerURL: 'wss://10.92.1.8:61614/ws',

    // Headers
    // Typical keys: login, passcode, host
    connectHeaders: {
        login: 'wfi',
        passcode: 'Westfield1234!',
        host: '/fix_uat'
    },

    // How often to heartbeat?
    // Interval in milliseconds, set to 0 to disable
    heartbeatIncoming: 0, // Typical value 0 - disabled
    heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

    // Wait in milliseconds before attempting auto reconnect
    // Set to 0 to disable
    // Typical value 500 (500 milli seconds)
    // reconnectDelay: 200,
    reconnectDelay: 2000,

    maxWebSocketChunkSize: 1000,
    splitLargeFrames: true,

    // Will log diagnostics on console
    // It can be quite verbose, not recommended in production
    // Skip this key to stop logging to console
    debug: (msg: string): void => {
        // console.log(new Date(), msg);
    }
};
