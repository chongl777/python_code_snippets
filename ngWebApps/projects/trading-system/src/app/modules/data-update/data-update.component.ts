import { Component, HostBinding, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UpgradableComponent } from '@theme/components/upgradable';
import { PortfolioComponent } from '@app/components/portfolio/portfolio.component';
import { TradingRecordsComponent } from '@app/components/trading-records/trading-records.component';

import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { Title } from '@angular/platform-browser';


@Component({
    selector: 'app-data-update',
    templateUrl: './data-update.component.html',
    styleUrls: ['./data-update.component.scss'],
    providers: [
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer
        }
    ],
})
export class DataUpdateComponent extends UpgradableComponent implements OnInit {
    @HostBinding('class.mdl-grid') private readonly mdlGrid = true;
    @HostBinding('class.mdl-grid--no-spacing') private readonly mdlGridNoSpacing = true;

    constructor(
        private titleService: Title,
        private _elm: ElementRef,
        private overlayContainer: OverlayContainer,
        private http: HttpClient
    ) {
        super();
        this.titleService.setTitle('Data Updates');
    }

    onSelected(a: any, b: any): void {
        let self = this;
        console.log(self);
    }

    ngOnInit() {
        (this.overlayContainer as CustomOverlayContainer).setContainerParent(this._elm);
    }

    onDownload(component: string): void {
        try {
            let componentMap = {
            };

            let data = componentMap[component].data();
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
