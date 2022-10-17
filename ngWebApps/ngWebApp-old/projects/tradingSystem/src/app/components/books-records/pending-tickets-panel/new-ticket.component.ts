import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, APP_INITIALIZER, ElementRef
} from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { of, BehaviorSubject, Observable, Subscription } from 'rxjs';

import { Security } from '@app/models/security';

import { DialogComponent } from '@app/components/dialog-window/dialog.component';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';
import { _Component } from '@app/models/component';
import { MatDialogRef } from '@angular/material/dialog';
import { SecurityService } from '@app/services/security.service';
import { debounceTime, switchMap } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';


@Component({
    selector: 'app-new-ticket',
    templateUrl: './new-ticket.component.html',
    styleUrls: ['./new-ticket.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class NewTicketComponent extends _Component implements DialogComponent, OnInit, OnDestroy {

    searchControl = new FormControl();
    subscription = new Subscription();
    filteredOptions: Observable<Security[]>;
    errorMessage: string = '';
    options: Security[] = [];
    security: Security;

    constructor(
        private _cdr: ChangeDetectorRef,
        private securityService: SecurityService,
        private fb: FormBuilder,
        public _ref: ElementRef,
        public dialogRef: MatDialogRef<any>) {
        super();

        this.options = Object.values(this.securityService.securitiesMap);
    }

    setData(data: any) { }

    ngOnInit(): void {
        this.filteredOptions = this.searchControl.valueChanges
            .pipe(
                debounceTime(400),
                switchMap(value => of(this._filter(value).slice(0, 10))),
            );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private _filter(value: string): Security[] {
        try {
            const filterValue = value.toLowerCase();
            return this.options.filter(security => this._convertToSearchTxt(security).includes(filterValue));
        } catch (err) {
            return [];
        }
    }

    onSecuritySelected(securitySelectedEvt: MatAutocompleteSelectedEvent) {
        this.security = securitySelectedEvt.option.value;
        this._cdr.detectChanges();
    }

    private _convertToSearchTxt(security: Security): string {
        try {
            return [security.securityID, security.description.toLowerCase(),
            security.deal.toLowerCase()].join('|');
        } catch (err) {
            return '';
        }
    }

    get isvalid() {
        return (this.errorMessage == '') && (this.security != null);
    }

    onBlur() {
        if (this.security) {
            this.searchControl.setValue(this.security);
        } else {
            this.searchControl.setValue(null);
        }
    }

    displaySecurityFn(security: Security): string {
        try {
            return security.description;
        } catch (err) {
            return '';
        }
    }


    onNoClick(): void {
        this.dialogRef.close();
    }
}
