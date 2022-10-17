import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, APP_INITIALIZER, ElementRef
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import * as d3 from 'd3';

import { SlideInOutAnimation } from '@app/animations/app.animations';
import { Security } from '@app/models/security';
import { SecLookupCompatibleComponent } from '@app/components/security-lookup/seclookup-compatible.component';

import { MatrixData, SignalMatrixService } from '@app/services/signal-matrix.service';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { _Component } from '@app/models/component';
import { MatDialogRef } from '@angular/material/dialog';
import { AVAILABLE_STAGS } from '@app/services/trade-tickets.service';


function PositiveValidator(control: AbstractControl): any | null {
    return control.value < 0 ? { 'positive': 'negative number is not allowed' } : null;
}


@Component({
    selector: 'app-setting',
    templateUrl: './setting.component.html',
    styleUrls: ['./setting.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class SettingComponent extends _Component implements OnInit, OnDestroy {

    _fundsSetting: any;

    get fundsSetting(): any[] {
        return Object.values(this._fundsSetting);
    }
    subscription = new Subscription();

    formErrors = {
        'initialExpansion': '',
    };

    validationMessages = {
        'initialExpansion': {
            'required': 'initial expansion is required.',
            'positive': 'initial expansion has to be positive',
        },
    }

    constructor(private _cdr: ChangeDetectorRef, private fb: FormBuilder,
        public dialogRef: MatDialogRef<any>) {
        super();
    }

    get errorMessage(): string {
        let sumVal = Object.values(this._fundsSetting).reduce(
            (cumSum: number, setting: any) => {
                return cumSum + (setting.defaultAlloc || 0)
            }, 0);
        if (sumVal != 1) {
            return 'Sum of default allocations needs to be 1';
        }
        return '';
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    setData(data: any) {
        this._fundsSetting = data;
        // this.createForm();
    }

    availableSTags1() {
        return [...new Set(AVAILABLE_STAGS.map(x => x.tag1))];
    }

    availableSTags2(fundSetting: any) {
        return [...new Set(AVAILABLE_STAGS.filter(x => x.tag1 == fundSetting.sLevel1).map(x => x.tag2))];
    }

    availableSTags3(fundSetting: any) {
        return AVAILABLE_STAGS.filter(x => (x.tag1 == fundSetting.sLevel1) && (x.tag2 == fundSetting.sLevel2)).map(x => x.tag3);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
