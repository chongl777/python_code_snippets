import { DOCUMENT } from '@angular/common';
import { Input } from '@angular/core';
import { Component, OnInit, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';

import { services } from 'shared-library';
import { environment } from '@environments/environment';
import { MsgControllerService } from '@app/services/msg-controller.service';


@Component({
    selector: 'app-widget-window',
    templateUrl: './widget-window.component.html',
    styleUrls: ['./widget-window.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetWindowComponent implements OnInit {
    @Input() title: string;

    constructor(
        private _cdr: ChangeDetectorRef,
    ) {
    }

    ngOnInit() {
    }
}
