import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';

import { SlideInOutAnimation } from '@app/animations/app.animations';
import { Security } from '@app/models/security';
import { SecLookupCompatibleComponent } from '@app/components/security-lookup/seclookup-compatible.component';
import { Position } from '@app/models/position';
import { EventService } from '@app/services/event.service';
import { PortfolioLookthroughComponent } from '@app/components/portfolio-lookthrough/portfolio-lookthrough.component';
import { Lot } from '@app/models/Lot';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { PortfolioService } from '@app/services/portfolio.service';


@Component({
    selector: 'app-security-allocation',
    templateUrl: './security-allocation.component.html',
    styleUrls: ['./security-allocation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        SlideInOutAnimation(),
    ],
})
export class SecurityAllocationComponent implements OnInit, OnDestroy, AfterViewInit, SecLookupCompatibleComponent {

    private _security: Security
    public get security(): Security {
        return this._security;
    };

    private subscription = new Subscription();

    @Input() public set security(x: Security) {
        this._security = x;
        this.pf && this.pf.refresh();
        this._cdr.detectChanges();
    };

    @Input() public listenSecEvt = true;


    @ViewChild(PortfolioLookthroughComponent) pf: PortfolioLookthroughComponent;
    filter: string;
    cachedValues: CacheableObject;
    columnsToDisplay = ['Security', 'Quantity', 'Price', 'MarketVal'];
    cookieKey = 'sec-details-alloc';

    constructor(
        private _cdr: ChangeDetectorRef,
        private eventService: EventService,
        private cacheValuesService: CacheValuesService,
        public portfolioService: PortfolioService,
        public _ref: ElementRef) {

        this._security = null;
        this.cachedValues = this.cacheValuesService.createCachable(
            this.cookieKey, ['group_by', 'initial_expanded_level', 'sort']);
        this.validateCache();
    }

    validateCache(): void {
        if (
            (this.cachedValues['group_by'] == null) ||
            (this.cachedValues['group_by'].length == null) ||
            (this.cachedValues['group_by'].length == 0)
        ) {
            this.cachedValues['group_by'] = ['fundName', 'sLevel1', 'sLevel2', 'sLevel3'];
        };
        let group_by = this.cachedValues['group_by']
        this.cachedValues['group_by'] = group_by.filter((x: string) => x != null);

        let initExp = this.cachedValues['initial_expanded_level'];
        initExp = Math.round(initExp) || 5;
        this.cachedValues['initial_expanded_level'] = initExp;
    }

    ngAfterViewInit(): void {
        if (!this.listenSecEvt) {
            return;
        }
        this.subscription.add(
            this.eventService.selectSecurity$
                .subscribe((x: Security) => {
                    this.security = x;
                    // this._ref.querySelector('.cell-div');
                }));
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    setData(data: any) {
        this.security = data;
    }

    filterFactory(): (data: Lot) => boolean {
        return (data: Lot): boolean => {
            if (!this._security) {
                return false;
            }
            return (data.security == this._security) ||
                (data.security.deal == this._security.deal);
        };
    }

    rowClassFnFactory(): (pos: any) => string {
        return (pos: any): string => {
            return (pos['pos_name'] == this._security.description) ? 'highlight-sec' : '';
        };
    }

    setSecurity(security: Security) {
        this.security = security;
    }

    OpenSettingDialog() {
        this.pf.OpenSettingDialog();
    }
}
