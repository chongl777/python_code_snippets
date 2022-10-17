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

    public availableOptions = ['book', 'industry_level_1', 'industry_level_2', 'deal', 'marketSegment', 'security'];
    settingForm: FormGroup;
    groupBy: string[];
    numGroup: number[];
    initialExpansion: number;
    valueChgSub: Subscription = new Subscription();

    formErrors = {
        'initialExpansion': '',
    };

    validationMessages = {
        'initialExpansion': {
            'required': 'initial expansion is required.',
            'positive': 'initial expansion has to be positive',
        },
    }

    constructor(
        private _cdr: ChangeDetectorRef, private fb: FormBuilder,
        public dialogRef: MatDialogRef<any>,
    ) {
        super();
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.valueChgSub.unsubscribe();
    }

    onValueChanged(data?: any) {
        try {
            this.groupBy = Object.keys(data).filter(x => x.startsWith("Level_")).map(x => data[x]);
            this.initialExpansion = Math.round(data['initialExpansion']) || 0;

            const form = this.settingForm;

            for (const field in this.formErrors) {
                if (this.formErrors.hasOwnProperty(field)) {
                    // clear previous error message (if any)
                    this.formErrors[field] = '';
                    const control = form.get(field);
                    //if (control && control.dirty && !control.valid) {
                    if (control && !control.valid) {
                        const messages = this.validationMessages[field]
                        for (const key in control.errors) {
                            if (control.errors.hasOwnProperty(key) && messages) {
                                this.formErrors[field] += messages[key] + ' ';
                                // this._cdr.detectChanges();
                            }
                        }
                    }
                }
            }
        } finally {
        }
    }

    createForm() {
        let formData = {}
        for (let level in this.groupBy) {
            formData['Level_' + level] = [this.groupBy[level]];
        }
        formData['initialExpansion'] = [this.initialExpansion, [Validators.required, PositiveValidator]];

        this.settingForm = this.fb.group(
            formData);
        this.valueChgSub.add(this.settingForm.valueChanges
            .subscribe(data => this.onValueChanged(data)));

        this._cdr.detectChanges();
    }

    setData(data: any) {
        let groupBy = data['group_by'];
        this.initialExpansion = data['initial_expanded_level'];

        this.groupBy = groupBy.filter(x => x != null);
        this.numGroup = Array(this.groupBy.length).fill(0).map((_, i) => i);
        this.availableOptions = data['availableOptions'];
        this.createForm();
    }

    addGroup() {
        this.groupBy.push(null);
        this.numGroup = Array(this.groupBy.length).fill(0).map((_, i) => i);
        this.createForm();
    }

    deleteGroup(item: number) {
        this.groupBy.splice(item, 1);
        this.numGroup = Array(this.groupBy.length).fill(0).map((_, i) => i);
        this.createForm();
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
