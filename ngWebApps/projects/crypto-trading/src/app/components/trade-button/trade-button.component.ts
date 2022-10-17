import { Component, HostBinding, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Security } from '@app/models/security';
import { SecurityService, SecurityDataService } from '@app/services/security.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { utils } from 'shared-library'
import { OrderDialogComponent } from '@components/trade-button/order-dialog.component';
import { DialogData, DialogWindowComponent } from '@components/dialog-window/dialog-window.component';
import { CustomOverlayContainer } from '@app/modules/overlay-container/customOverlayContainer';

@Component({
    selector: 'app-trade-button',
    templateUrl: './trade-button.component.html',
    styleUrls: ['./trade-button.component.scss']
})
export class TradeButtonComponent implements OnInit {

    @Input() coin: Security;
    @Input() disabled: any = false;

    constructor(
        public matDialog: MatDialog,
    ) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    openTradeDialog(): void {
        const dialogConfig = new MatDialogConfig<DialogData>();
        let data = new DialogData(
            OrderDialogComponent, this.coin,
            { title: 'Trade: ' + this.coin.ticker });
        // The user can't close the dialog by clicking outside its body
        // dialogConfig.disableClose = true;
        dialogConfig.id = this.coin.securityID.toLocaleString();
        dialogConfig.height = '500px';
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = false;
        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = data;

        this.matDialog.open(
            DialogWindowComponent, dialogConfig);
    }
}
