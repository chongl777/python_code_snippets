import {
    Component, OnInit, Input, ElementRef, Directive, ViewContainerRef,
    ComponentFactoryResolver, Type, ViewChild, Inject, AfterViewInit, AfterContentInit
} from '@angular/core';
import { MatDialog, MatDialogConfig, MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { Order } from '@app/models/order';
import { SecurityEvent } from '@app/models/securityEvent';
import { EventService } from '@app/services/event.service';
import { environment } from '@environments/environment';
import { PortfolioLookthroughComponent } from '../portfolio-lookthrough/portfolio-lookthrough.component';
import { DialogComponent } from './dialog.component';


export class WinItem {
    public winSetting: {
        title: string, height: string,
        closeButton: boolean, minimizeButton: boolean,
    };

    constructor(
        public component: Type<any>, public data: any,
        winSetting?: {
            title?: string, height?: string,
            closeButton?: boolean, minimizeButton?: boolean
        }) {
        winSetting = winSetting || { title: null, height: 'auto', closeButton: true, minimizeButton: true };
        this.winSetting = {
            title: winSetting.title || null,
            height: winSetting.height || 'auto',
            closeButton: winSetting.closeButton == null ? true : winSetting.closeButton,
            minimizeButton: winSetting.minimizeButton == null ? true : winSetting.minimizeButton,
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
    setting: {
        title: string, height: string, closeButton: boolean, minimizeButton: boolean
    }

    @Input('title') title: string;
    constructor(
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

        // this._document.querySelectorAll(
        //     '.focusable.cdk-global-overlay-wrapper').forEach(
        //         (ref) => ref.classList.remove('focused'));
        // wrapper.classList.add('focused');
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

        const modalDialog = matDialog.open(DialogWindowComponent, dialogConfig);
    }

    static OpenTradeDialog(matDialog: MatDialog, componentType: Type<any>, ord: Order) {
        const dialogConfig = new MatDialogConfig<WinItem>();
        // The user can't close the dialog by clicking outside its body
        dialogConfig.disableClose = true;
        dialogConfig.id = ord.order_id;
        dialogConfig.height = environment.order_dialog_height + 'px';
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = false;
        dialogConfig.panelClass = 'focusable-panel';

        dialogConfig.data = new WinItem(componentType, ord, { title: ord.security.description + ' Ticket' });
        // https://material.angular.io/components/dialog/overview
        const modalDialog = matDialog.open(DialogWindowComponent, dialogConfig);
        (modalDialog as any)._overlayRef.hostElement.classList.add('focusable');

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
}
