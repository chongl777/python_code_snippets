import {
    Component, OnInit, Input, ElementRef, Directive, ViewContainerRef,
    ComponentFactoryResolver, Type, ViewChild, Inject, OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventService } from '@app/services/event.service';
import { DialogComponent } from '@app/components/dialog-window/dialog.component';
import { WinDirective } from '../dialog-window/dialog-window.component';
import { Security } from '@app/models/security';
import { FormControl } from '@angular/forms';
import { of, Observable, Subscription } from 'rxjs';
import { debounceTime, delay, map, startWith, switchMap, tap } from 'rxjs/operators';
import { SecurityService } from '@app/services/security.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { SecLookupCompatibleComponent } from './seclookup-compatible.component';


@Component({
    selector: 'app-security-lookup',
    templateUrl: './security-lookup.component.html',
    styleUrls: ['./security-lookup.component.scss']
})
export class SecurityLookupComponent implements OnInit, DialogComponent, OnDestroy {
    wrapper: any;
    @ViewChild(WinDirective, { static: true }) winHost: WinDirective;
    security: Security;

    searchControl = new FormControl();
    options: Security[] = [];
    filteredOptions: Observable<Security[]>;
    componentInstacne: SecLookupCompatibleComponent;
    subscription = new Subscription();
    securitySubscription: Subscription;

    constructor(
        public _ref: ElementRef,
        private securityService: SecurityService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private eventService: EventService) {

        this.options = Object.values(this.securityService.securitiesMap);

        this.securitySubscription = this.eventService.selectSecurity$
            .subscribe((x: Security) => this.selectSecurity(x));
        this.subscription.add(this.securitySubscription);
    }

    ngOnInit(): void {
        this.filteredOptions = this.searchControl.valueChanges
            .pipe(
                debounceTime(400),
                //map(value => this._filter(value).slice(0, 10)),  // equivalent
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

    private _convertToSearchTxt(security: Security): string {
        try {
            return [security.securityID, security.description.toLowerCase(),
            security.deal.toLowerCase()].join('|');
        } catch (err) {
            return '';
        }
    }

    displaySecurityFn(security: Security): string {
        try {
            return security.description;
        } catch (err) {
            return '';
        }
    }

    setData(data: any) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            data.component) as any;

        const viewContainerRef = this.winHost.viewContainerRef;
        viewContainerRef.clear();
        const componentRef = viewContainerRef.createComponent<SecLookupCompatibleComponent>(componentFactory);
        this.componentInstacne = componentRef.instance
        this.componentInstacne.setData(data.data);
    }

    onSecuritySelected(securitySelectedEvt: MatAutocompleteSelectedEvent) {
        this.security = securitySelectedEvt.option.value;
        this.componentInstacne.setSecurity(this.security);
    }

    selectSecurity(security: Security) {
        try {
            this.security = security;
            this.searchControl.setValue(security);
            this.componentInstacne.setSecurity(this.security);
        } catch (err) {
            console.error(err);
        }
    }

    connectOrBreakLink() {
        if (this.securitySubscription.closed) {
            this.securitySubscription = this.eventService.selectSecurity$
                .subscribe((x: Security) => this.selectSecurity(x));
        } else {
            this.securitySubscription.unsubscribe();
        }
    }
}
