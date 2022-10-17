import {
    Component, HostBinding, OnInit, ViewChild, ElementRef, ViewContainerRef,
    TemplateRef, ChangeDetectorRef, ViewChildren, QueryList, ContentChild, ContentChildren, Directive, InjectionToken, Input, ChangeDetectionStrategy
} from '@angular/core';
import { PortfolioLookthroughComponent } from '@app/components/portfolio-lookthrough/portfolio-lookthrough.component';
import { _Component } from '@app/models/component';

import { environment } from '@environments/environment';
import { CardComponentDirective, CardTabComponent } from './card-tab.component';


@Component({
    selector: 'base-card-tabs-group',
    templateUrl: './card-tabs-group.component.html',
    styleUrls: ['./card-tabs-group.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTabsGroupComponent implements OnInit {
    // @ViewChild(TradingRecordsComponent) appTransaction: TradingRecordsComponent;
    @ContentChildren(CardTabComponent) cardTabs: QueryList<CardTabComponent>;

    @ContentChild('cardContent') cpt: Component;
    component: Component | any;

    //@ContentChild(CARD_CONTENT, { read: TemplateRef, static: true }) _tmplt: TemplateRef<any>;

    @ViewChild('container', { read: ViewContainerRef, static: true }) _vcr: ViewContainerRef;
    @Input() selectedIdx = 0;
    @Input() onDownload: (component: Component) => void;
    @Input() onOpenConfig: (component: Component) => void;
    @Input() onRefresh: (component: Component) => void;

    @Input() tabStyle = 'tab';
    showSetting: boolean;
    showDownload: boolean;
    showRefresh: boolean;
    currentTab: CardTabComponent;

    constructor(
        private _elm: ElementRef,
        private _cdr: ChangeDetectorRef) {
    }

    ngOnInit() {
    }

    ngAfterContentInit() {
        // console.log(this.cardTabs);
        // console.log(this.templateRefs3.toArray());
    }

    ngAfterContentChecked() {
        // this.component = this.currentTab && this.currentTab.component;
    }

    ngAfterViewInit() {
        this.onSelect(this.selectedIdx);
    }

    onSelect(i: number) {
        // vcr.clear();
        this.currentTab = this.cardTabs.toArray()[i];
        this.selectedIdx = i;
        this._vcr.clear();
        this._vcr.createEmbeddedView(this.currentTab.tmplt);

        this.component = this.currentTab.component;

        this.showSetting = this.currentTab.showSetting;
        this.showDownload = this.currentTab.showDownload;
        this.showRefresh = this.currentTab.showRefresh;
        this._cdr.detectChanges();
    }

    hasSetting() {
        return this.component && (this.component as any).OpenSettingDialog;
    }

    hasDownload() {
        return this.component && (this.component as any).data;
    }

    // onOpenConfig(component: Component) {
    //     (component as any).OpenSettingDialog();
    // }
}
