import { Component, OnInit } from '@angular/core';
import { UpgradableComponent } from '@theme/components/upgradable';

@Component({
    selector: 'app-common-layout',
    templateUrl: './common-layout.component.html',
    styleUrls: ['./common-layout.component.scss']
})
export class CommonLayoutComponent extends UpgradableComponent implements OnInit {

    constructor() {
        super();
    }

    ngOnInit(): void {
        const layout = (document.querySelector('.mdl-layout') as any).MaterialLayout;
    }
}
