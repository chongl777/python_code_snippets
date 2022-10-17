import {
    Component, OnInit, Input, ElementRef, Directive, ViewContainerRef,
    ComponentFactoryResolver, Type, ViewChild, Inject, AfterViewInit, AfterContentInit
} from '@angular/core';
import { MatDialog, MatDialogConfig, MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { Order, Side } from '@app/models/order';
import { NullSecurity } from '@app/models/security';
import { SecurityEvent } from '@app/models/securityEvent';
import { EventService } from '@app/services/event.service';
import { environment } from '@environments/environment';
import { switchMap } from 'rxjs/operators';
import { WinDirective, WinItem } from '../dialog-window/dialog-window.component';
import { DialogComponent } from '../dialog-window/dialog.component';
import { IoiOrderComponent } from '../ioi-order/ioi-order.component';
import { PortfolioLookthroughComponent } from '../portfolio-lookthrough/portfolio-lookthrough.component';
import { SecurityDetailsTabsComponent } from '../security-details/security-details-tabs/security-details-tabs.component';
import { SecurityLookupComponent } from '../security-lookup/security-lookup.component';



@Component({
    selector: 'app-popup-dialog-window',
    templateUrl: './popup-dialog-window.component.html',
    styleUrls: ['./popup-dialog-window.component.scss']
})
export class PopupDialogWindowComponent implements OnInit, AfterViewInit, AfterContentInit {
    wrapper: any;
    overlay: any;
    @ViewChild('Host', { read: ElementRef, static: true }) refHost: ElementRef;
    @ViewChild(WinDirective, { static: true }) winHost: WinDirective;
    minimize: boolean = false;
    instance: DialogComponent;

    initialized = false;
    originalHeight: string;

    @Input('title') title: string;
    winItem: WinItem;

    constructor(
        private titleService: Title,
        private route: ActivatedRoute,
        private _ref: ElementRef,
        private componentFactoryResolver: ComponentFactoryResolver,
        private eventService: EventService
    ) {
        this.title = 'total';
    }

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            let winItem: WinItem;

            switch (params['widget']) {
                case 'security_details':
                    winItem = new WinItem(
                        SecurityLookupComponent,
                        new WinItem(
                            SecurityDetailsTabsComponent,
                            new NullSecurity(),
                        ),
                        { title: 'Security Details' });
                    this.titleService.setTitle('Security Details');
                    break;
                case 'trade_ticket':
                    winItem = new WinItem(
                        SecurityLookupComponent,
                        new WinItem(
                            IoiOrderComponent,
                            new Order(new NullSecurity(), 0, null, '1', null, null, '1', Side.Buy,)
                        ),
                        { title: 'Trade Ticket' });
                    this.titleService.setTitle('Trade Ticket');
                    break;
            }


            this.loadComponent(winItem);
        });
    }

    ngAfterViewInit(): void {
    }

    ngAfterContentInit(): void {
    }

    onFocus(): void {
    }


    loadComponent(winItem: WinItem) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            winItem.component);
        const viewContainerRef = this.winHost.viewContainerRef;

        this.instance = viewContainerRef.createComponent<DialogComponent>(componentFactory).instance;
        this.instance.setData(winItem.data);
    }
}
