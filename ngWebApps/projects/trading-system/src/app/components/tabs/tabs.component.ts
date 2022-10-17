import { Component, HostBinding, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {
    currentView: string;
    @Input() availableViews: { view: string, title: string }[];
    @HostBinding('class.tabs__container') private readonly tabsContainer = true;

    constructor() { }

    ngOnInit(): void {
        this.currentView = this.availableViews[0].view;
    }

    ngAfterViewInit(): void {
        // let self = this;
        // console.log('availableViews', this.availableViews);
    }

    onTabClick(tab: string) {
        this.currentView = tab;
    }

}
