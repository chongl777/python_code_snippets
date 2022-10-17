import { Component, HostBinding, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PortfolioComponent } from '@app/components/portfolio/portfolio.component';
import { TradingRecordsComponent } from '@app/components/trading-records/trading-records.component';

import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { OrderListComponent } from '@app/components/order-list/order-list.component';
import { WatchlistComponent } from '@app/components/watchlist/watchlist.component';
import { Title } from '@angular/platform-browser';


@Component({
    selector: 'app-trading-dashboard',
    templateUrl: './trading-dashboard.component.html',
    styleUrls: ['./trading-dashboard.component.scss'],
})
export class TradingDashboardComponent implements OnInit {
    @HostBinding('class.mdl-grid') private readonly mdlGrid = true;
    @HostBinding('class.mdl-grid--no-spacing') private readonly mdlGridNoSpacing = true;
    @ViewChild('appPortfolio') pfComponent: PortfolioComponent;
    @ViewChild('appTransaction') txnComponent: TradingRecordsComponent;
    @ViewChild('appOrders') orderListComponent: OrderListComponent;
    @ViewChild('appWatchlist') watchlistComponent: WatchlistComponent;

    constructor(
        private titleService: Title,
        private _elm: ElementRef,
        private overlayContainer: OverlayContainer,
        private http: HttpClient
    ) {
        this.titleService.setTitle('TradingSystem');
    }

    ngOnInit() {
        (this.overlayContainer as CustomOverlayContainer).setContainerParent(this._elm);
    }

    onOpenConfig(component: Component | any) {
        (component as any).OpenSettingDialog();
    }

    onDownload(component: Component): void {
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
