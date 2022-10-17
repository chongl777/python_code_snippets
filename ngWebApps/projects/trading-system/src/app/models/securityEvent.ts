import { Serializable } from './serializable';


let EVENT_CODE_PRIORITY = {
    'FC': 1,
    'PC': 1,
    'O': 2,
    'C': 2,
    'E': 3,
    'IP': 4,
}


export class SecurityEvent implements Serializable<SecurityEvent> {
    eventCodes: {
        'event_code': string, 'event_description': string,
        'priority': number,
    }[] = [];
    data: any[] = [];

    get all_codes(): string {
        return this.eventCodes.map((x) => x['event_code']).join(',');
    }

    get priority(): number {
        return Math.min(...this.eventCodes.map((x) => x['priority']));
    }

    deserialize(json: any): SecurityEvent {
        if (json == null) {
            return this;
        }
        this.eventCodes = json['event_codes'];
        this.eventCodes.map(x => x['priority'] = (EVENT_CODE_PRIORITY[x['event_code']] || 10));
        this.eventCodes.sort((x, y) => x['priority'] - y['priority']);
        this.data = json['data'];

        return this;
    }
}
