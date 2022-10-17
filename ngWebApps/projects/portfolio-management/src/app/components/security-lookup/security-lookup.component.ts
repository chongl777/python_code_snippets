import { Component, HostBinding, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMarketDataSource } from '@app/models/marketDataSource';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SearchItem, SecurityService } from '@app/services/security.service';
import { environment } from '@environments/environment';
import { Subscription, of, BehaviorSubject, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NavConfig, utils } from 'shared-library';


@Component({
    selector: 'app-security-lookup',
    templateUrl: './security-lookup.component.html',
    styleUrls: ['./security-lookup.component.scss'],
    providers: [
        {
            provide: 'MarketDataSource',
            useClass: HttpMarketDataSource,
        },
        {
            provide: MarketDataService,
        },
        {
            provide: SecurityService,
        }
    ],
})
export class SecurityLookupComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg: string = '';
    public subscription = new Subscription();
    public oldUrl = '';

    @HostBinding('class') hostClass = 'trading-signal';

    constructor(
        private navConfig: NavConfig,
        private route: ActivatedRoute,
        private router: Router,
        private titleService: Title,
        private eventService: EventService,
        private securityDataSvs: SecurityService,
        private marketDataSvs: MarketDataService,
    ) {
        this.subscription.add(this.route.data
            .subscribe(data => {
                this.navConfig.title = data['title'];
                this.titleService.setTitle(data['title']);
                this.hostClass = data['class'];
            }));
        this.securityDataSvs.getSecurityIndex();
    }

    ngOnInit(): void {

        this.subscription.add(this.route.queryParams
            .pipe(
                map(params => {
                    let search = new URLSearchParams(params);

                    this.oldUrl = environment.urls.sec_info_url + '/security_profile?' + search.toString();

                    return { sid: params['sid'] && (+params['sid']), pid: params['pid'] && (+params['pid']) };
                }),
                switchMap(params => {
                    this.loading$.next(false);
                    this.errMsg = "";
                    return from((async (): Promise<{ sid: number, pid: number }> => {
                        this.loading$.next(true);
                        let sid = params['sid'];
                        if (sid != null) {
                            try {
                                await Promise.all([
                                    this.securityDataSvs.getSecurityData(sid),
                                ]);
                                return params;
                            } catch (err) {
                                this.errMsg = utils.errMsg(err);
                                return null;
                            }
                        } else {
                            this.errMsg = 'choose a security';
                            return null;
                        }
                    })());
                })
            ).subscribe(
                async (params) => {
                    this.loading$.next(false);
                    if (params == null) {
                        return null;
                    }
                    if (params['sid']) {
                        let sid = +params['sid'];
                        this.eventService.selectSecurity$.next(sid);
                    }
                    if (params['pid']) {
                        let pid = +params['pid'];
                        this.eventService.selectCompany$.next(pid);
                    }
                }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    filterSecurity = async (text: string): Promise<GroupSearchItem[]> => {
        try {
            let secs = (await this.securityDataSvs.searchSecurities(text)).slice(0, 10);
            let secsGroup = utils.groupby<SearchItem, GroupSearchItem>(secs, ['groupName'], GroupSearchItem);
            return secsGroup;
        } catch (err) {
            return [];
        }
    }

    onSelectedSecurity = (item: SearchItem) => {
        if (item.groupName == 'Company') {
            this.router.navigate(
                ['index'], { relativeTo: this.route, queryParams: { pid: item.sid } });
        } else {
            this.router.navigate(
                ['index'], { relativeTo: this.route, queryParams: { sid: item.sid } });
        }
    }

    displaySelected(security: SearchItem) {
        return security && security['description'];
    }
}


interface G<T> { groupName?: string; children?: (G<T> | T)[] };

class GroupSearchItem implements G<any> {
    public expanded = false;
    public children: (GroupSearchItem | SearchItem)[];
    private _level = null;

    constructor(public groupName: string) {
    }
}
