import { DOCUMENT } from '@angular/common';
import { AfterContentInit, AfterViewInit, ComponentFactoryResolver, Directive, Input, Type, ViewChild, ViewContainerRef } from '@angular/core';
import {
    MatDialog, MatDialogConfig, MatDialogRef,
    MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS
} from '@angular/material/dialog';
import { Component, OnInit, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';

import { services } from 'shared-library';
import { environment } from '@environments/environment';
import { MsgControllerService } from '@app/services/msg-controller.service';
import { DialogComponent } from './dialog.component';


type DialogSetting = {
    title?: string, height?: string,
    closeButton?: boolean, minimizeButton?: boolean,
    //popupButton?: boolean,
    //popupFunc?: () => void,
}


export class DialogData {
    public dialogSetting: DialogSetting;

    constructor(
        public component: Type<any>, public data: any,
        dialogSetting?: DialogSetting) {
        dialogSetting = dialogSetting || { title: null, height: 'auto', closeButton: true, minimizeButton: true };
        this.dialogSetting = {
            title: dialogSetting.title || null,
            height: dialogSetting.height || 'auto',
            closeButton: dialogSetting.closeButton == null ? true : dialogSetting.closeButton,
            minimizeButton: dialogSetting.minimizeButton == null ? true : dialogSetting.minimizeButton,
            // popupButton: dialogSetting.popupButton == null ? false : winSetting.popupButton,
            // popupFunc: dialogSetting.popupFunc == null ? () => { } : winSetting.popupFunc,
        }
    }
}

@Directive({
    selector: '[dialogContentHost]',
})
export class DialogContentDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}


@Component({
    selector: 'app-dialog-window',
    templateUrl: './dialog-window.component.html',
    styleUrls: ['./dialog-window.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogWindowComponent implements OnInit, AfterViewInit, AfterContentInit {
    setting: DialogSetting;
    title: string;
    instance: DialogComponent;
    @ViewChild(DialogContentDirective, { static: true }) contentHost: DialogContentDirective;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private _cdr: ChangeDetectorRef,
        private componentFactoryResolver: ComponentFactoryResolver,
    ) {
        this.setting = data.dialogSetting;
        this.title = this.setting.title;
    }

    ngOnInit(): void {
        this.loadComponent();
    }

    ngAfterContentInit(): void {

    }

    ngAfterViewInit() {

    }

    loadComponent() {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            this.data.component);
        const viewContainerRef = this.contentHost.viewContainerRef;
        viewContainerRef.clear();

        this.instance = viewContainerRef.createComponent<DialogComponent>(componentFactory).instance;
        this.instance.setData(this.data.data);
    }

    onFocus() { }

    minizeWindow() { }
}
