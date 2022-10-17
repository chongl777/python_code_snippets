import {
    Component, HostBinding, OnInit, ViewChild, ElementRef, ViewContainerRef,
    TemplateRef, ChangeDetectorRef, ViewChildren, QueryList, ContentChild, ContentChildren, Directive, InjectionToken, Input
} from '@angular/core';

import { environment } from '@environments/environment';



@Directive({
    selector: '[cardContent]',
}) export class CardContentDirective {
    // constructor(public template: TemplateRef<any>) { }
}

@Directive({
    selector: '[cardComponent]',
}) export class CardComponentDirective {
    constructor() { }
}


@Component({
    selector: 'base-card-tab',
    template: '<ng-template cardContent><ng-content></ng-content></ng-template>',
    styleUrls: [],
})
export class CardTabComponent implements OnInit {
    // @ContentChild('app') component: Component;
    @ViewChild(CardContentDirective, { read: TemplateRef, static: true }) _tmplt1: TemplateRef<any>;
    @ContentChild(CardContentDirective, { read: TemplateRef, static: true }) _tmplt2: TemplateRef<any>;
    get tmplt(): TemplateRef<any> {
        return this._tmplt2 || this._tmplt1;
    }

    @Input() showDownload = false;
    @Input() showSetting = false;
    @Input() showRefresh = false;

    @Input() component: Component | any;

    @Input('label') label = '';

    constructor(public cdr: ChangeDetectorRef) { }

    ngOnInit() { }
}
