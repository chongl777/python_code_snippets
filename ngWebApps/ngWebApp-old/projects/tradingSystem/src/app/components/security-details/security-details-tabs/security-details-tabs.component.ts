import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';

import { SlideInOutAnimation } from '@app/animations/app.animations';
import { Security } from '@app/models/security';
import { SecLookupCompatibleComponent } from '@app/components/security-lookup/seclookup-compatible.component';


@Component({
    selector: 'app-security-details-tabs',
    templateUrl: './security-details-tabs.component.html',
    styleUrls: ['./security-details-tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        SlideInOutAnimation(),
    ],
})
export class SecurityDetailsTabsComponent implements OnInit, OnDestroy, SecLookupCompatibleComponent {

    public security: Security;

    constructor(
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef) { }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {

    }

    setData(data: any) {
        this.security = data;
    }

    setSecurity(security: Security) {
        this.security = security;
        this._cdr.detectChanges();
    }
}
