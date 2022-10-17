import { Component, OnInit, Input } from '@angular/core';
import { SidebarComponent as BaseSidebarComponent } from '@theme/components/sidebar';

@Component({
    selector: 'app-sidebar',
    templateUrl: './../../../../theme/components/sidebar/sidebar.component.html',
    styleUrls: ['./../../../../theme/components/sidebar/sidebar.component.scss', './side-bar.component.scss']
})
export class SideBarComponent extends BaseSidebarComponent {

    // constructor() { }
    public title = 'Trading DashBoard';
    @Input() public menu = [
        { name: 'Trading Dashboard', link: '/trading/dashboard', icon: 'dashboard' },
        { name: 'Portfolio Allocations', link: '/trading/port_allocations', icon: 'dashboard' },
        { name: 'Trades Confirmation', link: '/trading/trades_confirmation', icon: 'dashboard' },
        { name: 'Trades Settlement', link: '/trading/trades_settlement', icon: 'dashboard' },
        {
            name: 'Controls', icon: 'settings',
            children: [
                { name: 'Data Updates', link: '/trading/data_update' },
            ]
        }
    ]

    ngOnInit(): void {
    }
}
