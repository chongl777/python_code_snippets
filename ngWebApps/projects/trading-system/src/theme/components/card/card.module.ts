import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    CardComponent, CardBodyComponent,
    CardTitleComponent, CardMenuComponent
} from './card.component';
import { CardComponentDirective, CardContentDirective, CardTabComponent } from './card-tab.component';
import { CardTabsGroupComponent } from './card-tabs-group.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
    declarations: [
        CardComponent,
        CardBodyComponent,
        CardTitleComponent,
        CardMenuComponent,
        CardTabComponent,
        CardTabsGroupComponent,
        CardContentDirective,
        CardComponentDirective,
    ],
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
    ],
    exports: [
        CardComponent,
        CardBodyComponent,
        CardTitleComponent,
        CardMenuComponent,
        CardTabComponent,
        CardTabsGroupComponent,
        CardContentDirective,
        CardComponentDirective,
    ],
})
export class CardModule { }
