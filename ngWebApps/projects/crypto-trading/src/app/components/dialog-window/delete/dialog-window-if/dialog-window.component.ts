import {
    Component, OnInit, Input, ElementRef, Directive, ViewContainerRef,
    ComponentFactoryResolver, Type, ViewChild, Inject, AfterViewInit, AfterContentInit
} from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

import { Order, Side } from '@app/models/order';
import { NullSecurity } from '@app/models/security';
import { SecurityEvent } from '@app/models/securityEvent';
import { EventService } from '@app/services/event.service';
import { environment } from '@environments/environment';
import { IoiOrderComponent } from '../ioi-order/ioi-order.component';
import { PortfolioLookthroughComponent } from '../portfolio-lookthrough/portfolio-lookthrough.component';
import { SecurityDetailsTabsComponent } from '../security-details/security-details-tabs/security-details-tabs.component';
import { SecurityLookupComponent } from '../security-lookup/security-lookup.component';
import { ToolBoxComponent } from '@app/components/tool-box/tool-box.component';
import { DialogComponent } from './dialog.component';


type WinSetting = {
    title?: string, height?: string,
    closeButton?: boolean, minimizeButton?: boolean,
    popupButton?: boolean,
    popupFunc?: () => void,
}

export class WinItem {
    public winSetting: WinSetting;

    constructor(
        public component: Type<any>, public data: any,
        winSetting?: WinSetting) {
        winSetting = winSetting || { title: null, height: 'auto', closeButton: true, minimizeButton: true };
        this.winSetting = {
            title: winSetting.title || null,
            height: winSetting.height || 'auto',
            closeButton: winSetting.closeButton == null ? true : winSetting.closeButton,
            minimizeButton: winSetting.minimizeButton == null ? true : winSetting.minimizeButton,
            popupButton: winSetting.popupButton == null ? false : winSetting.popupButton,
            popupFunc: winSetting.popupFunc == null ? () => { } : winSetting.popupFunc,
        }
    }
}


@Directive({
    selector: '[winHost]',
})
export class WinDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}


@Component({
    selector: 'app-dialog-window',
    templateUrl: './dialog-window.component.html',
    styleUrls: ['./dialog-window.component.scss']
})
export class DialogWindowComponent implements OnInit, AfterViewInit, AfterContentInit {
    wrapper: any;
    overlay: any;
    @ViewChild(WinDirective, { static: true }) winHost: WinDirective;
    @ViewChild('Host', { read: ElementRef, static: true }) refHost: ElementRef;
    minimize: boolean = false;
    instance: DialogComponent;

    initialized = false;
    originalHeight: string;
    setting: WinSetting;

    @Input('title') title: string;
    constructor(
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public winItem: WinItem,
        private _ref: ElementRef,
        private componentFactoryResolver: ComponentFactoryResolver,
        private eventService: EventService) {
        this.title = winItem.winSetting.title;
        this.setting = winItem.winSetting;
    }

    ngOnInit(): void {
        this.wrapper = this._ref.nativeElement.parentElement.parentElement.parentElement;
        this.overlay = this._ref.nativeElement.parentElement.parentElement;
        this.wrapper.style['z-index'] = this.eventService.z_index;
        this.loadComponent();
    }

    ngAfterViewInit(): void {
        this.originalHeight = this._ref.nativeElement.style['height'];
    }

    ngAfterContentInit(): void {
    }

    onFocus(): void {
        this.wrapper.style['z-index'] = this.eventService.z_index;

        if (!this.initialized) {
            let pos = (this.overlay).getBoundingClientRect();
            this.overlay.style["position"] = "absolute";
            this.overlay.style["top"] = pos.top + "px";
            this.initialized = true;
        }
    }

    minizeWindow(): void {
        this.minimize = !this.minimize;

        if (this.minimize) {
            this.instance._ref.nativeElement.style["display"] = "none";
        } else {
            this.instance._ref.nativeElement.style["display"] = "block";
        }
    }

    loadComponent() {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            this.winItem.component);
        const viewContainerRef = this.winHost.viewContainerRef;
        viewContainerRef.clear();

        this.instance = viewContainerRef.createComponent<DialogComponent>(componentFactory).instance;
        this.instance.setData(this.winItem.data);
    }

    openPopup() {
        this.dialogRef.close();
        this.setting.popupFunc();
    }

    static OpenSecEventList(matDialog: MatDialog, componentType: Type<any>, secEvts: SecurityEvent[]) {
        const dialogConfig = new MatDialogConfig<WinItem>();
        dialogConfig.disableClose = true;
        dialogConfig.hasBackdrop = false;
        // dialogConfig.id = "modal-component";
        dialogConfig.height = "200px";
        dialogConfig.width = "800px";
        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = new WinItem(
            componentType, secEvts,
            { title: 'Custodian Records', height: dialogConfig.height });

        matDialog.open(DialogWindowComponent, dialogConfig);
    }

    static OpenSecLookupTradeDialog(matDialog: MatDialog) {
        const dialogConfig = new MatDialogConfig<any>();
        dialogConfig.disableClose = true;
        dialogConfig.hasBackdrop = false;
        // dialogConfig.id = "modal-component";
        dialogConfig.height = environment.order_dialog_height + 50 + 'px';
        dialogConfig.width = "600px";

        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = new WinItem(
            SecurityLookupComponent,
            new WinItem(
                IoiOrderComponent,
                new Order(new NullSecurity(), 0, null, '1', null, null, '1', Side.Buy,)
            ),
            {
                title: 'Trade', height: environment.order_dialog_height + 50 + 'px',
                popupButton: true,
                popupFunc: () => {
                    window.open('#/popup-window/trade_ticket', '_blank',
                        'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,' +
                        `scrollbars=no,resizable=no,width=600,height=${environment.order_dialog_height + 50}`);
                }
            });

        matDialog.open(
            DialogWindowComponent, dialogConfig);
    }

    static OpenTradeDialog(matDialog: MatDialog, componentType: Type<any>, ord: Order) {
        const dialogConfig = new MatDialogConfig<WinItem>();
        // The user can't close the dialog by clicking outside its body
        dialogConfig.disableClose = true;
        dialogConfig.id = ord.order_id || ord.ioi_id;
        dialogConfig.height = environment.order_dialog_height + 'px';
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = false;
        dialogConfig.panelClass = 'focusable-panel';

        dialogConfig.data = new WinItem(
            componentType, ord,
            { title: ord.security.description + ' Ticket' });
        // https://material.angular.io/components/dialog/overview
        const modalDialog = matDialog.open(DialogWindowComponent, dialogConfig);
        (modalDialog as any)._overlayRef.hostElement.classList.add('focusable');
        return modalDialog;

    }

    static OpenSecInfo(matDialog: MatDialog) {
        const dialogConfig = new MatDialogConfig<any>();
        dialogConfig.disableClose = true;
        dialogConfig.hasBackdrop = false;
        // dialogConfig.id = "modal-component";
        dialogConfig.height = 'auto';
        dialogConfig.width = "600px";

        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = new WinItem(
            SecurityLookupComponent,
            new WinItem(
                SecurityDetailsTabsComponent,
                new NullSecurity(),
            ),
            {
                title: 'Security Details', height: dialogConfig.height,
                popupButton: true,
                popupFunc: () => {
                    window.open('#/popup-window/security_details', '_blank',
                        'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,' +
                        'scrollbars=no,resizable=no,width=500,height=630');
                }
            });

        matDialog.open(
            DialogWindowComponent, dialogConfig)
    }

    static OpenSetting(matDialog: MatDialog, SettingCp: Type<any>, data: any) {

        const dialogConfig = new MatDialogConfig<any>();
        dialogConfig.disableClose = false;
        dialogConfig.hasBackdrop = true;
        dialogConfig.id = "modal-component";
        dialogConfig.height = 'auto';
        dialogConfig.width = "600px";

        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = new WinItem(
            SettingCp, data, { title: 'Setting', closeButton: false, minimizeButton: false });

        const modalDialog = matDialog.open(
            DialogWindowComponent, dialogConfig);

        return modalDialog.afterClosed()
    };

    static OpenToolbox(matDialog: MatDialog) {

        const dialogConfig = new MatDialogConfig<any>();
        dialogConfig.disableClose = false;
        dialogConfig.hasBackdrop = true;
        dialogConfig.id = "modal-component";
        dialogConfig.height = '300px';
        dialogConfig.width = "650px";

        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = new WinItem(
            ToolBoxComponent, null, { title: 'Tool Box', closeButton: true, minimizeButton: false });

        const modalDialog = matDialog.open(
            DialogWindowComponent, dialogConfig);

        return modalDialog.afterClosed()
    };

    static OpenNewTicket(matDialog: MatDialog, component: Type<any>, data: any) {

        const dialogConfig = new MatDialogConfig<any>();
        dialogConfig.disableClose = false;
        dialogConfig.hasBackdrop = true;
        dialogConfig.id = "modal-component";
        dialogConfig.height = 'auto';
        dialogConfig.width = "600px";

        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = new WinItem(
            component, data, { title: 'Security To Trade', closeButton: false, minimizeButton: false });

        const modalDialog = matDialog.open(
            DialogWindowComponent, dialogConfig);

        return modalDialog.afterClosed()
    };

    static OpenReplyEmailDialog(
        matDialog: MatDialog, componentType: Type<any>, data: any) {
        const dialogConfig = new MatDialogConfig<WinItem>();
        // The user can't close the dialog by clicking outside its body
        dialogConfig.disableClose = true;
        dialogConfig.id = data.msg_id;
        dialogConfig.height = '500px';
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = true;
        dialogConfig.panelClass = 'focusable-panel';

        dialogConfig.data = new WinItem(
            componentType, data, { title: 'Reply to' });

        const modalDialog = matDialog.open(DialogWindowComponent, dialogConfig);
        (modalDialog as any)._overlayRef.hostElement.classList.add('focusable');
        return modalDialog.afterClosed();

    }
}
