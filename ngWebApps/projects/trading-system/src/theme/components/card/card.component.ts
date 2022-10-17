import { Component, HostBinding, OnInit, Input, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'base-card',
    template: `<ng-content></ng-content>`,
    styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {

    @HostBinding('class.mdl-card') private readonly mdlCard = true;
    @HostBinding('class.mdl-shadow--2dp') private readonly mdlShadow2DP = true;

    constructor(
        private viewContainerRef: ViewContainerRef
    ) { }

    ngOnInit(): void {
    }
}


@Component({
    selector: 'base-card base-card-body',
    styleUrls: ['./card.component.scss'],
    template: `<ng-content></ng-content>`,
})
export class CardBodyComponent {
    @HostBinding('class.mdl-card__supporting-text') private readonly mdlCardSupportingText = true;
    @HostBinding('class.mdl-card--expand') private isExpanded = false;

    @Input() set expanded(value) {
        if (value || value === '') {
            this.isExpanded = true;
        }
    }
}


@Component({
    selector: 'base-card base-card-title',
    styleUrls: ['./card.component.scss'],
    template: `<ng-content></ng-content>`,
})
export class CardTitleComponent {
    @HostBinding('class.mdl-card__title') private readonly mdlCardTitle = true;

    @HostBinding('class.mdl-card--expand') private isExpanded = false;

    @Input() set expanded(value) {
        if (value || value === '') {
            this.isExpanded = true;
        }
    }
}


@Component({
    selector: 'base-card base-card-menu',
    styleUrls: ['./card.component.scss'],
    template: `<ng-content></ng-content>`,
})
export class CardMenuComponent {
    @HostBinding('class.mdl-card__menu') private readonly mdlCardMenu = true;
}
