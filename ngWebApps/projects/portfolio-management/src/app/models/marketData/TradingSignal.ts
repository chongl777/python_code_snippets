export interface TradingSignal<T> {
    readonly securityID: number;
    deserialize(json: Object): T;
}
