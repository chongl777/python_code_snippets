import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import { Subscription } from 'rxjs';

import { NguCarouselConfig } from 'shared-library';
import { SlideInOutAnimation } from '@app/animations/app.animations';
import { Security } from '@app/models/security';
import { _Component } from '@app/models/component';


@Component({
    selector: 'app-security-details-slide-card',
    templateUrl: './security-details-slide-card.component.html',
    styleUrls: ['./security-details-slide-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        SlideInOutAnimation(),
    ],
})
export class SecurityDetailsSlideCardComponent extends _Component implements AfterViewInit, OnInit, OnDestroy {

    public securityTileItems: Array<any> = [];

    public carouselConfig: NguCarouselConfig = {
        grid: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6, all: 0 },
        slide: 1,
        speed: 250,
        point: {
            visible: true
        },
        load: 2,
        velocity: 0,
        touch: false,
        easing: 'cubic-bezier(0, 0, 0.2, 1)'
    };

    @ViewChild('Details') details: TemplateRef<any>;
    @ViewChild('PriceInfo') priceInfo: TemplateRef<any>;
    @ViewChild('YieldInfo') yieldInfo: TemplateRef<any>;
    @ViewChild('CallDates') callDates: TemplateRef<any>;
    @ViewChild('EMC') emc: TemplateRef<any>;
    @ViewChild('EMCST') emcst: TemplateRef<any>;
    @ViewChild('RVS') rvs: TemplateRef<any>;
    @ViewChild('RVSNew') rvs_new: TemplateRef<any>;
    @ViewChild('ExternalLink') externalLink: TemplateRef<any>;
    @ViewChild('WatchlistInfo') wlInfo: TemplateRef<any>;
    @Input('secInfo') secInfo: { security: Security, watchlist: any };
    @Input('sizeInfo') sizeInfo: string;

    @Output() beingDestroyed = new EventEmitter<boolean>();

    marketDataUpdateSub: Subscription;

    constructor(private _cdr: ChangeDetectorRef) {
        super();
    }

    ngOnInit(): void {
        if (this.sizeInfo === "small") {
            this.carouselConfig.grid = { xs: 2, sm: 2, md: 2, lg: 2, xl: 3, all: 0 };
        } else if (this.sizeInfo === "fixed-3") {
            this.carouselConfig.grid = { xs: 3, sm: 3, md: 3, lg: 3, xl: 3, all: 0 };
        } else if (this.sizeInfo === "middle") {
            this.carouselConfig.grid = { xs: 3, sm: 3, md: 3, lg: 3, xl: 4, all: 0 };
        } else if (this.sizeInfo === "large") {
            this.carouselConfig.grid = { xs: 2, sm: 3, md: 4, lg: 5, xl: 5, all: 0 };
        } else if (this.sizeInfo === "xlarge") {
            this.carouselConfig.grid = { xs: 2, sm: 3, md: 4, lg: 5, xl: 7, xxl: 8, all: 0 };
        }
        this.marketDataUpdateSub = this.secInfo.security.update$.subscribe(() => {
            this._cdr.detectChanges();
        });
    }

    ngAfterViewInit(): void {
        if (this.sizeInfo == "fixed-3") {
            this.securityTileItems = [
                { 'template': this.details },
                { 'template': this.priceInfo },
                { 'template': this.yieldInfo },
                { 'template': this.callDates },
                { 'template': this.emc },
                { 'template': this.emcst },
                { 'template': this.rvs_new },
                { 'template': this.rvs },
                { 'template': this.externalLink },
                { 'template': this.wlInfo },
            ];
        } else {
            this.securityTileItems = [
                { 'template': this.details },
                { 'template': this.priceInfo },
                { 'template': this.yieldInfo },
                { 'template': this.emc },
                { 'template': this.emcst },
                { 'template': this.rvs_new },
                { 'template': this.rvs },
                { 'template': this.externalLink },
                { 'template': this.wlInfo },
            ];
        }

        this._cdr.detectChanges();
        // this._cdr.detach();
    }

    ngOnDestroy(): void {
        this.beingDestroyed.emit();
        this.securityTileItems = [];
        // this._cdr.detach();
        this.marketDataUpdateSub.unsubscribe();
    }
}
