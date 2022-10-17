import { Directive, ElementRef, forwardRef, HostListener, Input } from '@angular/core';
// import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { numberWithCommas } from './helpers';
import * as d3 from 'd3';

@Directive({
    selector: 'input[matInputFormat]',
    providers: [
        // { provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: MatInputFormatDirective },
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatInputFormatDirective),
            multi: true,
        }
    ]
})
export class MatInputFormatDirective {
    private _value: number | null;

    constructor(private elm: ElementRef<HTMLInputElement>,
    ) {
        // console.log('created directive');
    }

    @Input() matInputFormat: string = ',.0f';


    get value(): string | null {
        // console.log('get value');
        return this._value.toString();
    }

    @Input('value')
    set value(value: string | null) {
        // console.log('set value', value);
        this._value = parseFloat(value) || 0;
        this.formatValue(this._value);
    }

    private formatValue(value: number | null) {

        if (value != null) {
            this.elm.nativeElement.value = d3.format(this.matInputFormat)(value);
            //numberWithCommas(value);
        } else {
            this.elm.nativeElement.value = '';
        }
    }

    private unFormatValue() {
        //const value = this.elm.nativeElement.value;
        //this._value = value.replace(/[^\d.-]/g, '');
        try {
            if (this._value == 0) {
                this.elm.nativeElement.value = '';
            } else {
                this.elm.nativeElement.value = this._value.toString();
            }
        } catch (err) {
            this.elm.nativeElement.value = '';
        }
        // if (value) {
        //     this.elm.nativeElement.value = this._value;
        // } else {
        //     this.elm.nativeElement.value = '';
        // }
    }

    @HostListener('input', ['$event.target.value'])
    onInput(value) {
        //console.log('on input', value);
        // console.log('value', value);
        //console.log('value type', typeof value);
        this._value = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
        // this._value = parseFloat(value) || 0;
        // console.log('_value', this._value);
        // if (this._value > 0) {
        //     console.log('error');
        // }
        this._onChange(this._value);
    }

    @HostListener('blur')
    _onBlur() {
        //console.log('on blur', this._value);
        this.formatValue(this._value);
    }

    @HostListener('focus')
    onFocus() {
        this.unFormatValue();
    }

    _onChange(value: any): void {
    }

    writeValue(value: any) {
        this._value = value;
        this.formatValue(this._value);
        // this._onChange(this._value);
    }

    registerOnChange(fn: (value: any) => void) {
        this._onChange = fn;
    }

    registerOnTouched() {
    }


}
