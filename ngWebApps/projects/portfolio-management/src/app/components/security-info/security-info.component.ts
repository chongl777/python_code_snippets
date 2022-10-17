import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMarketDataSource } from '@app/models/marketDataSource';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SearchItem, SecurityService } from '@app/services/security.service';
import { Subscription, of, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NavConfig, utils } from 'shared-library';
import { SIGNALURL } from './general-info.component';


@Component({
    selector: 'app-security-info',
    templateUrl: './security-info.component.html',
    styleUrls: ['./security-info.component.scss'],
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
        },
    ],
})
export class SecurityInfoComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg: string = '';
    public subscription = new Subscription();
    @Input() updateOnResize = false;

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
                this.updateOnResize = data['updateOnResize'] == null ? this.updateOnResize : data['updateOnResize'];
            }));
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
