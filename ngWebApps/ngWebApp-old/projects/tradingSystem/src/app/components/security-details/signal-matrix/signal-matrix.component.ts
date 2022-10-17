import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, APP_INITIALIZER, ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import * as d3 from 'd3';

import { SlideInOutAnimation } from '@app/animations/app.animations';
import { Security } from '@app/models/security';
import { SecLookupCompatibleComponent } from '@app/components/security-lookup/seclookup-compatible.component';

import { MatrixData, SignalMatrixService } from '@app/services/signal-matrix.service';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { _Component } from '@app/models/component';


@Component({
    selector: 'app-signal-matrix',
    templateUrl: './signal-matrix.component.html',
    styleUrls: ['./signal-matrix.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        SlideInOutAnimation(),
    ],
    // providers: [
    //     SignalMatrixService,
    //     {
    //         provide: APP_INITIALIZER,
    //         useFactory: (signalMatrixService: SignalMatrixService) => signalMatrixService.loadMatrixMeta(),
    //         deps: [SignalMatrixService],
    //         multi: true,
    //     }
    // ]
})
export class SignalMatrixComponent extends _Component implements OnInit, OnDestroy, SecLookupCompatibleComponent {

    matrixData: MatrixData;
    SignalSrc1_Set: number[] = [];
    SignalSrc2_Set: number[] = [];
    Signal_Set: number[] = [];
    Matrix_Set: number[] = [];
    SignalDes: { (signal_id: number): string };
    MatrixPeriod: { (matrix_id: number): string };

    signalMeta: any[];
    matrixMeta: any[];
    readonly signalForm: FormGroup;
    valueChgSub: Subscription;
    color_mat: d3.ScaleLinear<number, number, unknown>;
    color_x: d3.ScaleLinear<number, number, unknown>;
    color_y: d3.ScaleLinear<number, number, unknown>;
    errMsg: string = 'Select Matrix to Load';
    signSub: Subscription = new Subscription();
    cachedValues: CacheableObject;

    loading$ = new BehaviorSubject<boolean>(false);

    _matrixId: number;
    set matrixId(val: number) {
        this._matrixId = val;
        if (this._matrixId != null) {
            this.updateMatrix();
        } else {
            this.matrixData = null;
        }
    };
    get matrixId() {
        return this._matrixId;
    }

    public currentSignal = {};
    private _security: Security;
    @Input() set security(value: Security) {
        this._security = value;
        this.currentSignal = {
            1: this._security.marketData.emcScoreData.emc_score,
            3: this.security.marketData.rvsScoreData.rvs_score,
        }
        this._cdr.detectChanges();
    };

    get security() {
        return this._security;
    }

    constructor(
        public signalMatrixService: SignalMatrixService,
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef,
        private cacheValuesService: CacheValuesService,
        private fb: FormBuilder) {
        super();

        this.cachedValues = this.cacheValuesService.createCachable(
            'signal-matrix-setup', ['SignalSrc_1', 'SignalSrc_2', 'SignalID', 'MatrixID']);

        this.signalForm = this.fb.group({
            SignalSrc_1: [this.cachedValues['SignalSrc_1'], [Validators.required]],
            SignalSrc_2: [this.cachedValues['SignalSrc_2'], [Validators.required]],
            SignalID: [this.cachedValues['SignalID'], [Validators.required]],
            MatrixID: [this.cachedValues['MatrixID'], [Validators.required]],
        });

        this.color_mat = d3.scaleLinear()
            .interpolate(d3.interpolateHcl as any)
            .range([d3.rgb("red"), d3.rgb('green')] as any);
        this.color_x = d3.scaleLinear()
            .interpolate(d3.interpolateHcl as any)
            .range([d3.rgb("red"), d3.rgb('green')] as any);
        this.color_y = d3.scaleLinear()
            .interpolate(d3.interpolateHcl as any)
            .range([d3.rgb("red"), d3.rgb('green')] as any);

        this.valueChgSub = this.signalForm.valueChanges
            .subscribe(data => this.onValueChanged(data));

        let self = this;
        this.signSub.add(this.signalMatrixService.loadingMeta$.subscribe({
            next: (value: boolean) => {
                this.loading$.next(value);
                if (!value) {
                    try {
                        self.signalMeta = self.signalMatrixService.signalMeta;
                        self.matrixMeta = self.signalMatrixService.matrixMeta;
                        self.SignalSrc1_Set = [...new Set(self.signalMeta.map(x => x['signal_src_1']))];
                        self.SignalSrc2_Set = [...new Set(self.signalMeta.map(x => x['signal_src_2']))];

                        self.SignalDes = self.signalMeta.reduce(
                            (a, x) => ({ ...a, [x['signal_id']]: x['description'] }), {});
                        self.MatrixPeriod = self.matrixMeta.reduce(
                            (a, x) => ({ ...a, [x['matrix_id']]: x['start_date'] + '~' + x['end_date'] }), {});

                        self.onValueChanged(self.signalForm.value);
                    } catch (err) {
                        self.errMsg = err;
                    }
                }
            },
            error: (err: Error) => {
                this.loading$.next(false);
                self.errMsg = err.message;
            }
        }));
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.signSub.unsubscribe();
    }

    onValueChanged(data?: any) {
        try {
            const form = this.signalForm;
            if (!form) {
                return;
            }
            if (!(this.SignalSrc1_Set.includes(data['SignalSrc_1']))) {
                this.signalForm.value['SignalSrc_1'] = null;

            }
            if (!(this.SignalSrc2_Set.includes(data['SignalSrc_2']))) {
                this.signalForm.value['SignalSrc_2'] = null;
            }

            this.Signal_Set = this.signalMeta.filter(
                (x) => (x['signal_src_1'] == this.signalForm.value['SignalSrc_1']) &&
                    (x['signal_src_2'] == this.signalForm.value['SignalSrc_2']))
                .map((x) => x['signal_id']);

            if (!(this.Signal_Set.includes(data['SignalID']))) {
                this.signalForm.value['SignalID'] = null;
                this.signalForm.value['MatrixID'] = null;
                this.Matrix_Set = [];
                this.matrixId = null;
            }

            if (this.signalForm.value['SignalID'] != null) {
                this.Matrix_Set = this.matrixMeta.filter(
                    (x) => (x['signal_id'] == this.signalForm.value['SignalID']))
                    .map((x) => x['matrix_id']);

                if (!(this.Matrix_Set.includes(data['MatrixID']))) {
                    this.signalForm.value['MatrixID'] = null;
                }
                this.matrixId = this.signalForm.value['MatrixID'];
            } else {
                this.matrixId = null;
            }
        } finally {
            this.cachedValues.save_from(this.signalForm.value);
        }
    }

    async updateMatrix(): Promise<void> {
        try {
            this.matrixData = await this.signalMatrixService.getMatrixData(this.matrixId);

            let matrix_array: number[] = this.matrixData.signalData.slice(1).map(x => x.slice(1))
                .reduce((accumulator, value) => accumulator.concat(value), []);
            this.color_mat.domain(d3.extent(matrix_array));

            this.color_y.domain(d3.extent(this.matrixData.signalData[0].slice(1)));
            this.color_x.domain(d3.extent(this.matrixData.signalData.slice(1).map(x => x[0])));

            this.errMsg = '';

        } catch (err) {
            console.error(err);
            this.errMsg = err;
        }
        this._cdr.detectChanges();
    }

    setData(data: any) {
        this.security = data;
    }

    setSecurity(security: Security) {
        this.security = security;
    }
}
