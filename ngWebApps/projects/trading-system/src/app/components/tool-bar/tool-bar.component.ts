import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Order, Side } from '@app/models/order';
import { NullSecurity } from '@app/models/security';
import { DialogWindowComponent, WinItem } from '../dialog-window/dialog-window.component';
import { IoiOrderComponent } from '../ioi-order/ioi-order.component';
import { SecurityEventsListComponent } from '../security-events/security-events-list.component';

import { SecurityLookupComponent } from '../security-lookup/security-lookup.component';
import { SecurityDetailsTabsComponent } from '../security-details/security-details-tabs/security-details-tabs.component';
import { EventService } from '@app/services/event.service';


@Component({
    selector: 'app-tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {

    @Input() trade = false;
    @Input() secInfo = false;
    @Input() message = false;
    @Input() toolbox = false;

    constructor(
        public matDialog: MatDialog,
        private eventService: EventService,
    ) { }

    ngOnInit(): void {
    }

    showTrade(): void {
        DialogWindowComponent.OpenSecLookupTradeDialog(
            this.matDialog,
        );
    }

    showSecInfo(): void {
        DialogWindowComponent.OpenSecInfo(this.matDialog);
    }

    showToolbox(): void {
        DialogWindowComponent.OpenToolbox(this.matDialog);
    }
}
