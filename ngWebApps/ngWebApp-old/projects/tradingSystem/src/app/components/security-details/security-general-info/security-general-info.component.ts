import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';

import { SlideInOutAnimation } from '@app/animations/app.animations';
import { Security } from '@app/models/security';
import { SecLookupCompatibleComponent } from '@app/components/security-lookup/seclookup-compatible.component';


@Component({
    selector: 'app-security-general-info',
    templateUrl: './security-general-info.component.html',
    styleUrls: ['./security-general-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        SlideInOutAnimation(),
    ],
})
export class SecurityGeneralInfoComponent implements OnInit, OnDestroy, SecLookupCompatibleComponent {

    private _security;
    @Input() set security(value: Security) {
        this._security = value;
        this._cdr.detectChanges();
    };

    get security() {
        return this._security;
    }

    constructor(
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef,
    ) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {

    }

    setData(data: any) {
        this.security = data;
    }

    setSecurity(security: Security) {
        this.security = security;
    }
}
