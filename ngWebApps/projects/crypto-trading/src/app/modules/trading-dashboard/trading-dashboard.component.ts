import { Component, HostBinding, OnInit, ViewChild, ElementRef } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { NavConfig } from 'shared-library';

import { MsgControllerService } from '@services/msg-controller.service';
import { SecurityService } from '@services/security.service';
import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';


@Component({
    selector: 'app-trading-dashboard',
    templateUrl: './trading-dashboard.component.html',
    styleUrls: ['./trading-dashboard.component.scss'],
})
export class TradingDashboardComponent implements OnInit {
    @HostBinding('class') hostClass = '';

    public subscription = new Subscription();

    constructor(
        private navConfig: NavConfig,
        private titleService: Title,
        private router: Router,
        private route: ActivatedRoute,
        private msgControllerService: MsgControllerService,
        private overlayContainer: OverlayContainer,
        private svs: SecurityService,
        private _elm: ElementRef,
    ) {
        this.subscription.add(this.route.data
            .subscribe(data => {
                this.navConfig.title = data['title'];
                this.titleService.setTitle(data['title']);
                this.hostClass = data['class'];
            }));
    }

    ngOnInit() {
        (this.overlayContainer as CustomOverlayContainer).setContainerParent(this._elm);
    }

}
