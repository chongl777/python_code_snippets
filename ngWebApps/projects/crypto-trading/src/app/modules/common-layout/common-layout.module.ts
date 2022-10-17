import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatusBarModule } from '@components/status-bar/status-bar.module';
import { CommonLayoutComponent } from './common-layout.component';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '@modules/overlay-container/customOverlayContainer';
import {
    AuthModule, AuthConfig, authenticateUser,
    AuthService, NavConfig
} from 'shared-library';
import { AppRoutingModule } from '@app/app-routing.module';
import { CommonComponentsModule } from '../common-modules/common-components.modules';



@NgModule({
    declarations: [
        CommonLayoutComponent,
    ],
    imports: [
        CommonModule,
        AppRoutingModule,
        StatusBarModule,
        AuthModule,
        StatusBarModule,
        CommonComponentsModule,
    ],
    exports: [
        CommonLayoutComponent,
        CommonComponentsModule,
    ],
    providers: [
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer,
        }
    ],
})
export class CommonLayoutModule { }
