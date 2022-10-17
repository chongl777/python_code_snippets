import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Order, Side } from '@app/models/order';
import { NullSecurity } from '@app/models/security';
import { DialogWindowComponent, WinItem } from '../dialog-window/dialog-window.component';
import { IoiOrderComponent } from '../ioi-order/ioi-order.component';
import { SecurityEventsListComponent } from '../security-events/security-events-list.component';
import { environment } from '@environments/environment';
import { SecurityLookupComponent } from '../security-lookup/security-lookup.component';
import { SecurityDetailsTabsComponent } from '../security-details/security-details-tabs/security-details-tabs.component';


@Component({
    selector: 'app-tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {

    @Input() trade = false;
    @Input() secInfo = false;
    @Input() message = false;

    constructor(public matDialog: MatDialog) { }

    ngOnInit(): void {
    }

    showTrade(): void {
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
                new Order(
                    new NullSecurity(),
                    0,
                    null,
                    '1',
                    null,
                    null,
                    '1',
                    Side.Buy,
                )
            ),
            { title: 'Trade', height: environment.order_dialog_height + 50 + 'px' });

        this.matDialog.open(
            DialogWindowComponent, dialogConfig);
    }

    showSecInfo(): void {
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
            { title: 'Security Details', height: dialogConfig.height });

        this.matDialog.open(
            DialogWindowComponent, dialogConfig)
    }

}
