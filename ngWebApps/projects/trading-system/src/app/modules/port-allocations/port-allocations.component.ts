import {
    Component, HostBinding, OnInit, ViewChild, ElementRef, ViewContainerRef,
    TemplateRef, ChangeDetectorRef, ViewChildren, QueryList
} from '@angular/core';
import { UpgradableComponent } from '@theme/components/upgradable';
import { TradingRecordsComponent } from '@app/components/trading-records/trading-records.component';

import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { OverlayContainer } from '@angular/cdk/overlay';

import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { PortfolioLookthroughComponent } from '@app/components/portfolio-lookthrough/portfolio-lookthrough.component';
import { Title } from '@angular/platform-browser';


@Component({
    selector: 'app-port-allocations',
    templateUrl: './port-allocations.component.html',
    styleUrls: ['./port-allocations.component.scss'],
})
export class PortAllocationComponent implements OnInit {
    @HostBinding('class.mdl-grid') private readonly mdlGrid = true;
    @HostBinding('class.mdl-grid--no-spacing') private readonly mdlGridNoSpacing = true;


    // @ViewChild(PortfolioLookthroughComponent) appPortfolio: PortfolioLookthroughComponent;
    @ViewChild('component') component: Component;

    // @ViewChild(TradingRecordsComponent) appTransaction: TradingRecordsComponent;
    // @ViewChildren('cardTemplate') templateRefs: QueryList<TemplateRef<any>>;
    // @ViewChildren(CardContentDirective, { read: TemplateRef }) templateRefs2: QueryList<TemplateRef<any>>;
    @ViewChild('container', { read: ViewContainerRef }) _vcr;
    selectedIdx = 0;

    constructor(
        private titleService: Title,
        private _elm: ElementRef,
        private overlayContainer: OverlayContainer) {
        this.titleService.setTitle('Portfolio Allocations');
    }

    ngOnInit() {
        (this.overlayContainer as CustomOverlayContainer).setContainerParent(this._elm);
    }


    onOpenConfig(component: Component) {
        (component as any).OpenSettingDialog();
    }

    onDownload(component: Component): void {
        try {

            let data = (component as any).data();
            let filename = 'data.csv';

            var xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.open('POST', environment.util.downloadUrl, true);

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

    onRefresh(component: Component | any) {
        (component as any).refresh();
    }
}
