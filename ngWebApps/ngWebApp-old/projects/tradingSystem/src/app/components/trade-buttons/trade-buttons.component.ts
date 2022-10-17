import { Component, OnInit, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { Order, Side } from '@app/models/order';
import { IoiOrderComponent } from '@app/components/ioi-order/ioi-order.component';
import { Security } from '@app/models/security';
import { environment } from '@environments/environment';
import { DialogWindowComponent, WinItem } from '../dialog-window/dialog-window.component';


@Component({
    selector: 'app-trade-buttons',
    templateUrl: './trade-buttons.component.html',
    styleUrls: ['./trade-buttons.component.scss']
})
export class TradeButtonsComponent implements OnInit {
    @Input() security: Security;

    constructor(
        public matDialog: MatDialog,
    ) { }

    ngOnInit(): void {
    }

    openTradeDialog(side: '1' | '2') {
        let order = new Order(
            this.security,
            0,
            this.security.marketData.priceData.compositePrice,
            '1', // price type
            null, // settldate
            null, // ioi_id
            '1', // order_type
            side == '1' ? Side.Buy : Side.Sell // buy/sell
        );
        DialogWindowComponent.OpenTradeDialog(this.matDialog, IoiOrderComponent, order);

        // const dialogConfig = new MatDialogConfig<WinItem>();
        // // The user can't close the dialog by clicking outside its body
        // dialogConfig.disableClose = true;
        // // dialogConfig.id = "modal-component";
        // dialogConfig.height = environment.order_dialog_height + 'px';
        // dialogConfig.width = "600px";
        // dialogConfig.hasBackdrop = false;
        // dialogConfig.panelClass = 'focusable-panel';

        // dialogConfig.data = new WinItem(IoiOrderComponent, order, this.security.description + ' Ticket');
        // // https://material.angular.io/components/dialog/overview
        // const modalDialog = this.matDialog.open(DialogWindowComponent, dialogConfig);
        // (modalDialog as any)._overlayRef.hostElement.classList.add('focusable');
    }
}
