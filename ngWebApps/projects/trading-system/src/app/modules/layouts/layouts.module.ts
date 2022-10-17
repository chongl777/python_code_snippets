import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ThemeModule } from '@theme';
import { CommonLayoutComponent } from './common-layout/common-layout.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SideBarComponent } from './side-bar/side-bar.component';

import { StatusBarComponent } from '@app/components/status-bar/status-bar.component';
import { StatusBarModule } from '@app/components/status-bar/status-bar.module';
import { AuthModule } from 'shared-library';


@NgModule({
    declarations: [
        CommonLayoutComponent,
        NavBarComponent,
        SideBarComponent,
    ],
    imports: [
        CommonModule,
        ThemeModule,
        RouterModule,
        StatusBarModule,
    ]
})
export class LayoutsModule { }
