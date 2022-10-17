import { Component, ElementRef, HostBinding, Inject, Input, OnInit, ViewChild } from '@angular/core';
import {
    MatDialog, MatDialogConfig, MatDialogRef,
    MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS
} from '@angular/material/dialog';

import { Security } from '@app/models/security';
import { Order, Side, OrderType } from '@app/models/order';

import { BehaviorSubject, Subscription } from 'rxjs';
import { utils } from 'shared-library';
import { DialogComponent } from '../dialog-window/dialog.component';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '@app/services/order.service';


export const ORDER_TYPE_MAP = {
    '1': 'Market',
    '2': 'Limit',
};

function PositiveValidator(control: AbstractControl): any | null {
    return control.value <= 0 ? { 'positive': 'only positive number allowed' } : null;
}


@Component({
    selector: 'app-order-dialog',
    templateUrl: './order-dialog.component.html',
    styleUrls: ['./order-dialog.component.scss']
})
export class OrderDialogComponent implements OnInit, DialogComponent {

    coin: Security;
    order: Order;
    submitted = false;
    SIDE = Side;
    ordForm: FormGroup;
    ORDER_TYPE_MAP = Object.entries(ORDER_TYPE_MAP).map((val) => {
        return { key: val[0], value: val[1] };
    });
    loading$ = new BehaviorSubject<boolean>(false);
    orderText: string;
    errorText: string;

    formErrors = {
        'quantity': '',
        'orderType': '',
        'isBuy': '',
        'price': '',
    };

    validationMessages = {
        'quantity': {
            'required': 'quantity is required.',
            'positive': 'quantity has to be positive',
        },
        'price': {
            'required': 'price is required.',
            'positive': 'price has to be positive',
        },
        'isBuy': {
            'required': 'order side is required',
        },
        'orderType': {
            'required': 'order type is required',
        },
    };

    valueChgSub: Subscription;

    constructor(
        private orderService: OrderService,
        private fb: FormBuilder,
        public _ref: ElementRef,
    ) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    openTradeDialog(): void {
    }

    createOrder(): Order {
        let ord = new Order(
            this.order.security)
        ord.order_type = this.ordForm.get('orderType').value;
        ord.price = this.ordForm.get('price').value;
        ord.quantity = this.ordForm.get('quantity').value;
        ord.side = this.ordForm.get('isBuy').value ? Side.Buy : Side.Sell;
        return ord;
    }

    createForm(): void {
        this.valueChgSub && this.valueChgSub.unsubscribe();
        this.ordForm = this.fb.group({
            quantity: [
                this.order.quantity, [Validators.required, PositiveValidator]],
            price: [this.order.price, [Validators.required, PositiveValidator]],
            orderType: [this.order.order_type, [Validators.required]],
            isBuy: [this.order.side == Side.Buy, [Validators.required]],
        });

        this.valueChgSub = this.ordForm.valueChanges
            .subscribe(data => this.onValueChanged(data));
        this.onValueChanged();
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

    async onSubmit($event: Event) {
        this.loading$.next(true);
        this.orderText = '';
        this.errorText = '';
        try {
            let ord = this.createOrder();
            let res = await this.orderService.sendOrder(ord);
            this.loading$.next(false);
            this.orderText = 'submited';
            this.submitted = true;
        } catch (e) {
            console.error(e);
            this.errorText = utils.errMsg(e);
            this.loading$.next(false);
        }
    }

    setData(data: Security): void {
        this.coin = data;
        this.order = new Order(this.coin);
        this.createForm();
    }
}
