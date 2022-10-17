import { Component, OnInit, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { environment } from '@environments/environment';

import { IoiOrderComponent } from '@app/components/ioi-order/ioi-order.component';
import { Order } from '@app/models/order';
import { DialogWindowComponent, WinItem } from '@app/components/dialog-window/dialog-window.component';


@Component({
    selector: 'app-order-status',
    templateUrl: './order-status.component.html',
    styleUrls: ['./order-status.component.scss']
})
export class OrderStatusComponent implements OnInit {
    @Input() ord: Order;

    constructor(
        public matDialog: MatDialog,
    ) { }

    ngOnInit(): void {
    }

    openTradeDialog(): void {

        DialogWindowComponent.OpenTradeDialog(this.matDialog, IoiOrderComponent, this.ord);
        //     const dialogConfig = new MatDialogConfig<WinItem>();
        //     // The user can't close the dialog by clicking outside its body
        //     dialogConfig.disableClose = true;
        //     dialogConfig.id = this.ord.order_id;
        //     dialogConfig.height = environment.order_dialog_height + 'px';
        //     dialogConfig.width = "600px";
        //     dialogConfig.hasBackdrop = false;
        //     dialogConfig.panelClass = 'focusable-panel';

        //     dialogConfig.data = new WinItem(IoiOrderComponent, this.ord, { title: this.ord.security.description + ' Ticket' });
        //     // https://material.angular.io/components/dialog/overview
        //     const modalDialog = this.matDialog.open(DialogWindowComponent, dialogConfig);
        //     (modalDialog as any)._overlayRef.hostElement.classList.add('focusable');

        //     modalDialog.beforeClosed().subscribe((success: boolean) => {
        //         if (success) {
        //         }
        //     });
        // }
    }

}
