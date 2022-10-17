import { Component, HostBinding, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { UpgradableComponent } from '@theme/components/upgradable';
import { TradingRecordsComponent } from '@app/components/trading-records/trading-records.component';

import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { TradeTicketsService } from '@app/services/trade-tickets.service';
import { Title } from '@angular/platform-browser';


@Component({
    selector: 'app-trades-settlement-layout',
    templateUrl: './trades-settlement.component.html',
    styleUrls: ['./trades-settlement.component.scss'],
    providers: [TradeTicketsService,],
})
export class TradesSettlementLayoutComponent implements OnInit {
    @HostBinding('class.mdl-grid') private readonly mdlGrid = true;
    @HostBinding('class.mdl-grid--no-spacing') private readonly mdlGridNoSpacing = true;

    constructor(
        private titleService: Title,
        private _elm: ElementRef,
        private overlayContainer: OverlayContainer
    ) {
        this.titleService.setTitle('Trade Settlement');
    }

    ngOnInit() {
        (this.overlayContainer as CustomOverlayContainer).setContainerParent(this._elm);
    }


    onOpenConfig(component: Component | any) {
        (component as any).OpenSettingDialog();
    }

    onRefresh(component: Component | any) {
        (component as any).refresh();
    }

    onDownload(component: Component | any): void {
        try {

            let data = (component as any).data();
            let filename = 'data.csv';

            var xhr = new XMLHttpRequest();
            xhr.open('POST', environment.util.downloadUrl, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = function (e) {
                if (this.status == 200) {
                    var blob = new Blob([xhr.response], { type: 'octet/stream' });
                    var downloadUrl = URL.createObjectURL(blob);
                    //window.open(downloadUrl);
                    var a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    //Do your stuff here
                }
            };
            xhr.send(JSON.stringify(data));

        } catch (err) {
            alert(err);
        }
    }
}
