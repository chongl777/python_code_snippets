import {
    Component, OnInit, OnDestroy, ElementRef, Inject,
    ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Pipe, PipeTransform, ViewChild } from '@angular/core';
import { DOCUMENT, formatDate } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormGroupDirective, AbstractControl } from '@angular/forms';
import { Subscription, BehaviorSubject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { EventService } from '@app/services/event.service';
import { OrdersService } from '@app/services/orders.service';
import { HttpControllerService } from '@app/services/http-controller.service';
import { Order, Side } from '@app/models/order';
import { IndicationOfInterest } from '@app/models/IndicationOfInterest';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';
import { ORDER_TYPE_MAP } from '@app/models/FixMaps';
import { DialogComponent } from '@app/components/dialog-window/dialog.component';
import { NullSecurity, Security } from '@app/models/security';
import { SecLookupCompatibleComponent } from '../security-lookup/seclookup-compatible.component';


enum Status {
    Ready,
    Loading,
    Error,
    Done,
}


function PositiveValidator(control: AbstractControl): any | null {
    return control.value <= 0 ? { 'positive': 'only positive number allowed' } : null;
}

function NonNullValidator(control: AbstractControl): any | null {
    return control.value == null ? { 'required2': 'field is required' } : null;
}


@Component({
    selector: 'app-ioi-order',
    templateUrl: './ioi-order.component.html',
    styleUrls: ['./ioi-order.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
    ],
})
export class IoiOrderComponent implements OnInit, OnDestroy, SecLookupCompatibleComponent {
    SIDE = Side
    wrapper: any;
    ioi: IndicationOfInterest;
    order: Order;
    timeLeftSub: Subscription;
    goodForSub: Subscription;
    valueChgSub: Subscription;
    goodFor: number;
    timeLeft: number;
    ratingOverride: string;
    status: Status;
    rvs_info: any = {};
    loading$ = new BehaviorSubject<boolean>(false);
    canModify: boolean;
    ordForm: FormGroup;
    ORDER_TYPE_MAP = Object.entries(ORDER_TYPE_MAP).map((val) => {
        return { key: val[0], value: val[1] };
    });
    RATING = [
        'AAA',
        'AA+', 'AA', 'AA-',
        'A+', 'A', 'A-',
        'BBB+', 'BBB', 'BBB-',
        'BB+', 'BB', 'BB-',
        'B+', 'B', 'B-',
        'CCC+', 'CCC', 'CCC-',
        'CC', 'C'];

    // @ViewChild('fform') orderFormDirective: FormGroupDirective;

    formErrors = {
        'quantity': '',
        'isPrice': '',
        'orderType': '',
        'isBuy': '',
    };

    validationMessages = {
        'quantity': {
            'required': 'quantity is required.',
            'positive': 'quantity has to be positive',
        },
        'price': {
            'required': 'price is required.',
        },
        'isPrice': {
            'required': 'price type is required',
        },
        'isBuy': {
            'required': 'order side is required',
        },
        'orderType': {
            'required': 'order type is required',
        },
    };

    constructor(
        // @Inject(MAT_DIALOG_DATA) public data: Order,
        @Inject(DOCUMENT) private _document: Document,
        private ordersService: OrdersService,
        private _cdr: ChangeDetectorRef,
        private eventService: EventService,
        private http: HttpControllerService,
        private fb: FormBuilder,
        public _ref: ElementRef,
    ) {
        // this.order = data;
        // this.ioi = data.ioi;
        this.status = Status.Ready;
        this.canModify = this.ioi ? this.ioi.counter : true;
        // this._cdr.detach();
    }

    setData(data: any) {
        this.order = data;
        this.ioi = this.order.ioi;
        this.createForm();
        this.updateView();
    }

    setSecurity(security: Security) {
        this.order.security = security;
        this.ratingOverride = security.marketData.rating.rtg_normal;
    }

    ngOnInit(): void {

        this.ratingOverride = this.order.security.marketData.rating.rtg_normal;

        this.timeLeftSub = this.ioi == null ? null : this.ioi.timeLeft$.subscribe({
            next: (x) => {
                this.timeLeft = x;
                this.updateView();
            },
            complete: () => {
                this.updateView();
            }
        });

        this.goodForSub = ((this.ioi == null) || (this.ioi.ioiResponseTime == null)) ?
            null : this.ioi.goodFor$.subscribe({
                next: (x) => {
                    this.goodFor = Math.min(x, this.ioi.validUntilTime.getTime() - this.ioi.ioiResponseTime.getTime());
                    this.updateView();
                },
                complete: () => {
                    this.updateView();
                }
            });
    }

    createForm(): void {
        this.valueChgSub && this.valueChgSub.unsubscribe();
        this.ordForm = this.fb.group({
            quantity: [
                { value: this.order.quantity / 1000, disabled: !this.canModify },
                [Validators.required, PositiveValidator]],
            price: [this.order.tgt_price, [Validators.required]],
            isPrice: [this.order.price_type == '1', [Validators.required]],
            orderType: [this.order.order_type, [Validators.required]],
            isBuy: [this.order.side == Side.Buy, [Validators.required]],
        });

        this.valueChgSub = this.ordForm.valueChanges
            .subscribe(data => this.onValueChanged(data));
        this.ordForm.get('isPrice').valueChanges
            .subscribe(data => this.onPirceSwitch(data));
        this.onValueChanged();
    }

    createOrder(): Order {
        let ord = new Order(
            this.order.security,
            this.ordForm.get('quantity').value * 1000,
            this.ordForm.get('price').value,
            this.ordForm.get('isPrice').value ? '1' : '6',
            this.order.settle_date,
            this.order.ioi_id,
            this.ordForm.get('orderType').value,
            this.ordForm.get('isBuy').value ? Side.Buy : Side.Sell,
        );
        return ord;
    }

    ngOnDestroy(): void {
        this.timeLeftSub && this.timeLeftSub.unsubscribe();
        this.goodForSub && this.goodForSub.unsubscribe();
        this.valueChgSub && this.valueChgSub.unsubscribe();
    }

    updateView(): void {
        this._cdr.detectChanges();
    }

    onValueChanged(data?: any) {
        const form = this.ordForm;
        if (!form) {
            return;
        }

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
    }

    onPirceSwitch(isPrice: boolean) {
        if (isPrice) {
            try {
                this.ordForm.get('price').setValue(this.rvs_info.price.toFixed(2));
            } catch (err) {
                this.ordForm.get('price').setValue(null);
            }
        } else {
            try {
                this.ordForm.get('price').setValue(this.rvs_info.g_stm.toFixed(0));
            } catch (err) {
                this.ordForm.get('price').setValue(null);
            }
        }
    }

    public formatVal(val: any): string {
        if (this.status == Status.Ready) {
            return 'Ready';
        } else if (this.status == Status.Loading) {
            return 'Loading';
        } else if (this.status == Status.Error) {
            return 'Error';
        } else if (this.status == Status.Done) {
            return val;
        }
        return val;
    }

    get orderText(): string {
        if (this.order.text) {
            return ' - ' + this.order.text;
        }
        return '';
    }

    get TradeText(): string {
        if (this.ordForm.get('isBuy').value) {
            return 'Bid';
        } else {
            return 'Offer';
        }
    }

    get canSubmit(): boolean {
        let res = !this.order.order_status;
        if (this.ioi) {
            res = res && (!this.ioi.expired);
        }
        return res
    }

    async recalcRVS(price: number) {
        this.status = Status.Loading;
        try {
            let isPrice = this.ordForm.get('isPrice').value;
            let resp = await this.http.recalcRVS(
                this.order.security.securityID, price, this.ratingOverride, isPrice);
            this.order.security.marketData.setCallDts(resp.stats_by_call_dt);
            this.rvs_info = resp;
            this.status = Status.Done;
        } catch (err) {
            console.error(err);
            this.status = Status.Error;
        }
    }

    async onSubmit($event: Event) {
        $event.stopPropagation();
        $event.preventDefault();
        this.loading$.next(true);
        // this._cdr.detectChanges();
        try {
            let order = this.createOrder()
            this.order = await this.ordersService.sendOrder(order);
            this.createForm();
            this.loading$.next(false);
        } catch (err) {
            this.loading$.next(false);
            alert(err);
        }
    }

    async onReplace($event: Event) {
        $event.stopPropagation();
        $event.preventDefault();
        this.loading$.next(true);
        // this._cdr.detectChanges();
        try {
            let order = this.createOrder()
            order.orig_order_id = this.order.order_id;

            this.order = await this.ordersService.replaceOrder(order);
            this.createForm();
            this.loading$.next(false);
        } catch (err) {
            this.loading$.next(false);
            alert(err);
        }
    }

    async onCancel($event: Event) {
        $event.stopPropagation();
        $event.preventDefault();

        this.loading$.next(true);
        // this._cdr.detectChanges();

        try {
            let order = this.createOrder()
            order.orig_order_id = this.order.order_id;
            await this.ordersService.cancelOrder(order);
            this.createForm();
            this.loading$.next(false);
        } catch (err) {
            this.loading$.next(false);
            alert(err);
        }
    }
}
