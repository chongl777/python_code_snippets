export interface MarketDataSource {
    getTradingSignal(securityID: number, signal_src: number): any;
    getSecurityData(securityID: number): any;
    getSecurityTrdingRecords(securityIDs: number[], fundIDs: number[]): any;
    getSecurityPriceHist(securityIDs: number[]): any;
    getSecurityAttr(securityID: number): any;
    getSecurityRtg(securityID: number): any;
    getSecurityCurrentPx(securityID: number): any;
    getCashflow(securityID: number): any;
    allSecuritiesInParent(parentID: number): any;
    getSecuritiesIndex(): Promise<any[]>;
    updateFinraID(securityID: number, parentID: number): Promise<any>;
    updateFinraPrice(securityID: number, parentID: number): Promise<any>;
    updateBBGPrice(securityID: number, parentID: number): Promise<any>;
    updateCorpStructure(parentID: number): Promise<any>;
    updateCache(all: boolean): Promise<any[]>;
}
