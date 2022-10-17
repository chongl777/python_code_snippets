import { Component, HostListener, Input, OnInit } from '@angular/core';

@Component({
    selector: 'base-menu-item',
    styleUrls: ['./sidebar.component.scss'],
    template: `
    <base-menu-link-item *ngIf="data.link || data.href" [data]="data"></base-menu-link-item>
    <base-submenu-item *ngIf="data.children" [data]="data"></base-submenu-item>
  `,
})
export class MenuItemComponent implements OnInit {
    @Input() public data;

    ngOnInit(): void {
    }
}
