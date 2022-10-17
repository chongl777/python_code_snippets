import { Component, HostBinding, OnInit, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SecurityService } from '@app/services/security.service';
import { environment } from '@environments/environment';
import { BehaviorSubject, combineLatest, from, Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { utils } from 'shared-library';
import { MessageComponent } from './message.component';


@Component({
    selector: 'app-data-update',
    templateUrl: './data-update.component.html',
    styleUrls: ['./data-update.component.scss']
})
export class DataUpdateComponent implements OnInit {

    public loading$ = new BehaviorSubject<boolean>(false);
    public loadingAll$: Observable<boolean>;
    public errMsg: string = '';
    public subscription = new Subscription();
    public security: Security;


    constructor(
        private evt: EventService,
        private marketDataSvs: MarketDataService,
        private securityDataSvs: SecurityService,
        public matDialog: MatDialog,
    ) {
        this.loadingAll$ = combineLatest([
            this.loading$,
            this.marketDataSvs.updateLoading$,
        ]).pipe(
            map(([loading, market_ref_loading]) => {
                return loading || market_ref_loading;
            }),
        );
    }

    ngOnInit(): void {
        this.subscription.add(this.evt.selectSecurity$.pipe(
            switchMap(sid => {
                this.errMsg = "";
                return from((async (): Promise<[sid: number, data: any[]]> => {
                    this.loading$.next(true);
                    if (sid != null) {
                        try {
                            this.security = await this.securityDataSvs.getSecurityData(sid)
                            return null;
                        } catch (err) {
                            this.errMsg = utils.errMsg(err);
                            return null;
                        }
                    } else {
                        return null;
                    }

                })());
            })
        ).subscribe(() => {
            this.loading$.next(false);
        }));
    }

    setData(): void { }

    ngAfterViewInit(): void {
        // let self = this;
        // console.log('availableViews', this.availableViews);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    async updateFinraID(): Promise<void> {
        try {
            let rslt = await this.marketDataSvs.updateFinraID(this.security);
            let msg = '<table id="finra-confirm-diag"><thead><th>SecurityId</th><th>FinraID</th></thead>\
                  <tbody>';
            Object.keys(rslt).forEach((sid) => {
                msg += '<tr><td>' + sid + "</td><td>" + rslt[sid] + '</td></tr>';
            });
            msg += '</tbody></table>';
            this.OpenToolbox('Finra Updated', msg);
        } catch (err) {
            this.OpenToolbox('Failed', utils.errMsg(err), 'failed');
        }
    }

    async updateCorpStructure(): Promise<void> {
        try {
            let msg = await this.marketDataSvs.updateCorpStructure(this.security);
            this.OpenToolbox('Corp Structure Updated', `<div>${msg}</div>`);
        } catch (err) {
            this.OpenToolbox('Failed', utils.errMsg(err), 'failed');
        }
    }

    async updateFinraPrice(): Promise<void> {
        try {
            let msg = await this.marketDataSvs.updateFinraPrice(this.security);
            this.OpenToolbox('Corp Structure Updated', `<div>${msg}</div>`);
        } catch (err) {
            this.OpenToolbox('Failed', utils.errMsg(err), 'failed');
        }
    }

    async updateBBGHist(): Promise<void> {
        try {
            let msg = await this.marketDataSvs.updateBBGPrice(this.security);
            this.OpenToolbox('BBG Price Updated', `<div>${msg}</div>`);
        } catch (err) {
            this.OpenToolbox('Failed', utils.errMsg(err), 'failed');
        }
    }

    async updateCache(all = false): Promise<void> {
        try {
            let msg = await this.marketDataSvs.updateCache(all);
            this.OpenToolbox('Cache Updated', `<div>${msg}</div>`);
        } catch (err) {
            this.OpenToolbox('Failed', utils.errMsg(err), 'failed');
        }
    }

    OpenToolbox(title: string, content: string, klass: string = 'success') {

        const dialogConfig = new MatDialogConfig<any>();
        dialogConfig.disableClose = false;
        dialogConfig.hasBackdrop = true;
        dialogConfig.id = "modal-component";
        dialogConfig.height = 'auto';
        dialogConfig.width = "300px";

        dialogConfig.panelClass = 'focusable-panel';
        dialogConfig.data = { title: title, message: content, hostClass: klass }

        const modalDialog = this.matDialog.open(
            MessageComponent, dialogConfig);

        return modalDialog.afterClosed()
    };
}
