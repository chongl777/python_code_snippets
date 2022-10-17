import { Component, HostBinding, OnInit, Input } from '@angular/core';
import { _Component } from '@app/models/component';
import { EventService } from '@app/services/event.service';
import { environment } from '@environments/environment';


@Component({
    selector: 'app-tool-box',
    templateUrl: './tool-box.component.html',
    styleUrls: ['./tool-box.component.scss']
})
export class ToolBoxComponent extends _Component implements OnInit {

    constructor(
        private eventService: EventService,
    ) {
        super();
    }

    ngOnInit(): void {
    }

    setData(): void { }

    ngAfterViewInit(): void {
        // let self = this;
        // console.log('availableViews', this.availableViews);
    }

    open_signal(title: string, signal: number): void {
        let sec = this.eventService.selectSecurity$.getValue();
        let sidQry = sec ? '&sid=' + sec.securityID : '';

        window.open(
            environment.urls.popup_url + `/${title}` +
            `?signal=${signal}` +
            `&session=${sessionStorage.tabID}` + sidQry,
            '_blank',
            'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,' +
            'scrollbars=no,resizable=no,width=500,height=800');
    }

    open_all_signals(): void {
        let sec = this.eventService.selectSecurity$.getValue();
        let sidQry = sec ? '&sid=' + sec.securityID : '';
        window.open(
            environment.urls.popup_url + `/trading_signal?allSignals=1` +
            `&session=${sessionStorage.tabID}` + sidQry,
            '_blank',
            'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,' +
            'scrollbars=no,resizable=no,width=1950,height=890');
    }

    open_signals_page(): void {
        let sec = this.eventService.selectSecurity$.getValue();
        let sidQry = sec ? '&sid=' + sec.securityID : '';
        window.open(
            environment.urls.security_url + `/trading_signal?` + sidQry,
            '_blank');
    }

    open_general_info_page(): void {
        let sec = this.eventService.selectSecurity$.getValue();
        let sidQry = sec ? '&sid=' + sec.securityID : '';
        window.open(
            environment.urls.security_url + `/info/index?` + sidQry,
            '_blank');
    }

    open_secuirty_info(): void {
        let sec = this.eventService.selectSecurity$.getValue();
        let sidQry = sec ? '&sid=' + sec.securityID : '';

        window.open(
            environment.urls.popup_url + `/security_general_info` +
            `?session=${sessionStorage.tabID}` + sidQry,
            '_blank',
            'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,' +
            'scrollbars=no,resizable=no,width=1918,height=580');
    }
}
