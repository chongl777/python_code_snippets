import { Component, HostBinding, OnInit } from '@angular/core';
import {
    EventRxStompService, EventRxStompServiceFactory,
} from '@app/configs/msg-queue.service.config';
import { HttpMarketDataSource } from '@app/models/marketDataSource';
import { MarketDataService } from '@app/services/market-data.service';
import { SecurityService } from '@app/services/security.service';
import { MsgControllerService } from '@app/services/msg-controller.service';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '@app/services/event.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-popup-window',
    templateUrl: './popup-window.component.html',
    styleUrls: ['./popup-window.component.scss'],
    providers: [
        {
            provide: EventRxStompService,
            useFactory: EventRxStompServiceFactory,
        },
        {
            provide: MsgControllerService,
        },
    ],
})
export class PopupWindowComponent implements OnInit {

    public subscription = new Subscription();
    @HostBinding('class') hostClass = 'trading-signal';

    constructor(
        private titleService: Title,
        private route: ActivatedRoute,
        private eventService
            : EventService,
    ) {
        this.subscription.add(this.route.data
            .subscribe(data => {
                this.titleService.setTitle(data['title']);
                this.hostClass = data['class'];
            }));
    }

    ngOnInit(): void {
        // try {
        //     //let path = this.route.snapshot.routeConfig.children[0].path;
        //     // if (path == 'emc') {
        //     // }
        // } catch (err) {
        //     console.error(err);
        // }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
