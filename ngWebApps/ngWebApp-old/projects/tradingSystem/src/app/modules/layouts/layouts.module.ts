import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ThemeModule } from '@theme';
import { CommonLayoutComponent } from './common-layout/common-layout.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideBarComponent } from './side-bar/side-bar.component';

import { StatusBarComponent } from '@app/components/status-bar/status-bar.component';


@NgModule({
    declarations: [
        CommonLayoutComponent,
        NavBarComponent,
        SideBarComponent,
        StatusBarComponent,
    ],
    imports: [
        CommonModule,
        ThemeModule,
        RouterModule,
    ]
})
export class LayoutsModule { }
