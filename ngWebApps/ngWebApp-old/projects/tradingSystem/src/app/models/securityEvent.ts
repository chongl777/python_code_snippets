import { Serializable } from './serializable';


export class SecurityEvent implements Serializable<SecurityEvent> {
    eventCodes: { 'event_code': string, 'event_description': string }[] = [];
    data: any[] = [];
    get all_codes(): string {
        return this.eventCodes.map((x) => x['event_code']).join(',');
    }

    deserialize(json: any): SecurityEvent {
        if (json == null) {
            return this;
        }
        this.eventCodes = json['event_codes'];
        this.data = json['data'];
        return this;
    }
}
