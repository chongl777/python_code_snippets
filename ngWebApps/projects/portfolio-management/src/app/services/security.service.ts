import { Inject, Injectable } from '@angular/core';
import { MarketDataSource } from '@app/models/marketDataSource';
import { Security } from '@models/security';
import { BehaviorSubject } from 'rxjs';


export class SearchItem {
    sid: number;
    shortName: string;
    description: string;
    id: string;
    groupName: string;

    searchKey: string = "";

    searchKeyFn() {
        return [
            this.sid.toFixed(0), this.shortName,
            this.description, this.id,
            this.groupName]
            .filter(x => x != null)
            .map(x => x.toLowerCase())
            .join('|');
    }

    deserilized(json: any): SearchItem {
        this.sid = json['sid'];
        this.shortName = json['short_name'];
        this.description = json['description'];
        this.id = json['id'];
        this.groupName = json['group_name'];

        this.searchKey = this.searchKeyFn();
        return this;
    }
}


@Injectable({
    providedIn: 'root'
})
export class SecurityService {

    securitiesMap: { [securityID: number]: Security } = {};
    parentsMap: { [parentID: number]: Security[] } = {};
    entityCast: { [parentID: number]: any } = {};
    cashFlow: { [securityID: number]: any } = {};
    securityIndex: SearchItem[] = null;

    public loading$ = new BehaviorSubject<boolean>(false);

    constructor(
        @Inject('MarketDataSource') private dataSource: MarketDataSource,
    ) { }

    async getSecurityData(securityID: number): Promise<Security> {
        try {
            securityID = +securityID;
            if (this.securitiesMap[securityID] == null) {
                this.loading$.next(true);
                let json = await this.dataSource.getSecurityData(securityID);
                this.securitiesMap[securityID] = new Security(securityID);
                json['security_id'] && this.securitiesMap[securityID].deserialize(json);
                this.loading$.next(false);
            }

            return this.securitiesMap[securityID];
        } catch (err) {
            this.loading$.next(false);
            console.error(err);
            throw err;
        }
    }

    async allSecuritiesInParent(parentID: number): Promise<Security[]> {
        try {
            parentID = +parentID;
            if (this.parentsMap[parentID] == null) {
                this.loading$.next(true);
                let json = await this.dataSource.allSecuritiesInParent(parentID);
                this.entityCast[parentID] = json['company-cast'];
                let secList = json['sec-list'];
                this.parentsMap[parentID] = secList.map(x => {
                    let securityID = +x['security_id'];
                    (this.securitiesMap[securityID] == null) && (
                        this.securitiesMap[securityID] = new Security(securityID));
                    this.securitiesMap[securityID].deserialize(x);
                    return this.securitiesMap[securityID];
                });

                this.loading$.next(false);
            }

            return this.parentsMap[parentID];
        } catch (err) {
            this.loading$.next(false);
            console.error(err);
            throw err;
        }
    }

    async getEntityCast(parentID: number): Promise<Security[]> {
        try {
            parentID = +parentID;
            if (this.entityCast[parentID] == null) {
                this.loading$.next(true);
                let json = await this.dataSource.allSecuritiesInParent(parentID);
                this.entityCast[parentID] = json['company-cast'];

                this.loading$.next(false);
            }

            return this.entityCast[parentID];
        } catch (err) {
            this.loading$.next(false);
            console.error(err);
            throw err;
        }
    }

    async getCashflow(securityID: number): Promise<any> {
        try {
            securityID = +securityID;
            if (this.cashFlow[securityID] == null) {

                let json = await this.dataSource.getCashflow(securityID);
                this.cashFlow[securityID] = {
                    'coupon': json.coupon_schedule?.map(x => {
                        x['t_date'] = new Date(x['t_date']);
                        return x;
                    }),
                    'factor': json.factor_schedule?.map(x => {
                        x['t_date'] = new Date(x['t_date']);
                        return x;
                    }),
                }
            }
            return this.cashFlow[securityID];
        } catch (err) {
            this.loading$.next(false);
            console.error(err);
            throw err;
        }

    }

    async searchSecurities(text: string): Promise<SearchItem[]> {
        try {
            let rslt = (await this.getSecurityIndex()).filter(x => {
                return x.searchKey.includes(text.toLowerCase());
            });
            return rslt;
        } catch (err) {
            console.error(err);
            return [];
            //throw err;
        }
    }

    async getSecurityIndex(): Promise<SearchItem[]> {
        if (this.securityIndex != null) {
            return this.securityIndex;
        }
        try {
            let json = await this.dataSource.getSecuritiesIndex();
            this.securityIndex = json.map(
                x => (new SearchItem()).deserilized(x));
            return this.securityIndex;
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}
