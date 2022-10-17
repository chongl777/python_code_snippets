import { Component, AfterViewInit, OnInit, OnDestroy, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { formatDate } from '@angular/common';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { interval, Subscription, Observable, merge } from "rxjs";
import { environment } from '@environments/environment';

import * as commons from '@app/models/commons';
import { IndicationOfInterest } from '@app/models/IndicationOfInterest';
import { Order, Side } from '@app/models/order';
import { IoiOrderComponent } from '@app/components/ioi-order/ioi-order.component';
import { IndicationOfInterestService } from '@app/services/indication-of-interest.service';
import { DialogWindowComponent, WinItem } from '@app/components/dialog-window/dialog-window.component';


@Component({
    selector: 'app-ioi-status',
    templateUrl: './ioi-status.component.html',
    styleUrls: ['./ioi-status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IoiStatusComponent implements AfterViewInit, OnDestroy {

    constructor(
        private _cdr: ChangeDetectorRef,
        private ioiService: IndicationOfInterestService,
        public matDialog: MatDialog,
    ) {
        this._cdr.detach();
    }

    private statusSubscription: Subscription;

    @Input() ioi: IndicationOfInterest;
    @Input() order: Order;
    @Input() showButton: boolean;
    timeLeftSub: Subscription;

    async ngAfterViewInit(): Promise<any> {
        if (this.ioi == null) {
            if (this.order && this.order.ioi) {
                // try {
                //     await commons.waitUntil(() => (this.order.ioi), 60 * 1000)
                this.ioi = this.order.ioi;
                // } catch (err) {
                //     console.error(err);
                // }
            } else {
                return;
            }
        }
        this.timeLeftSub = merge(this.ioi.timeLeft$, this.ioi.goodFor$).subscribe(
            () => this._cdr.detectChanges());
        this.statusSubscription = this.ioi.loading$.subscribe((x: any) => {
            this._cdr.detectChanges()
        })

    }

    ngOnDestroy(): void {
        this.timeLeftSub && this.timeLeftSub.unsubscribe();
        this.statusSubscription && this.statusSubscription.unsubscribe();
    }

    get disable(): boolean {
        if (this.ioi.canUpdate) {
            return false;
        }
        if (this.ioi.expired) {
            return true;
        }
        return false;
    }

    get TradeText(): string {
        if (this.ioi.canUpdate) {
            return 'UPDATE';
        }
        if (this.ioi.expired) {
            return 'Expired';
        }
        return this.ioi.side == Side.Buy ? 'OFFER' : 'BID';
    }

    openTradeDialog() {
        const dialogConfig = new MatDialogConfig<WinItem>();
        // The user can't close the dialog by clicking outside its body
        dialogConfig.disableClose = true;
        // dialogConfig.id = "modal-component";
        dialogConfig.height = environment.order_dialog_height + 'px';
        dialogConfig.width = "600px";
        dialogConfig.hasBackdrop = false;
        dialogConfig.panelClass = 'focusable-panel';

        if (!this.ioi.canUpdate) {
            let order = new Order(
                this.ioi.security,  // security
                this.ioi.ioiQty,  // quantity
                this.ioi.security.marketData.priceData.compositePrice,  // target price
                this.ioi.priceType,  // price type
                formatDate(this.ioi.settlDate, 'yyyyMMdd', 'en-US'), // settlement date
                this.ioi.ioiID,
                '2',  // order_type
                (this.ioi.side == Side.Buy) ? Side.Sell : Side.Buy,  // side
            );
            this.ioi.setOrder(order);
        }

        dialogConfig.data = new WinItem(IoiOrderComponent, this.ioi.order);
        // dialogConfig.data = this.ioi.order;
        // https://material.angular.io/components/dialog/overview
        const modalDialog = this.matDialog.open(DialogWindowComponent, dialogConfig);
        // (modalDialog as any)._overlayRef.hostElement.classList.add('focusable');

        modalDialog.beforeClosed().subscribe((success: boolean) => {
            if (success) {
            }
        });
    }

}
