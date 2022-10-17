import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '@environments/environment';

import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop'

import { AuthModule, AuthConfig, authenticateUser, AuthService, NavConfig } from 'shared-library';
import { SpinnerOrErrorModule } from 'shared-library';
import { MatTableExpandableModule } from 'shared-library';
import { InputSearchModule } from 'shared-library';

import { TradingSignalComponent } from '@components/trading-signal/trading-signal.component';
import { TradingSignalWrapperComponent } from '@components/trading-signal/trading-signals-wrapper.component';
import { CommonLayoutComponent } from '@components/common-layout/common-layout.component';
import { ModalComponent } from '@components/modal/modal.component';
import { SignalEMCComponent } from '@components/signal-emc/signal-emc.component';
import { SignalRVSComponent } from '@components/signal-rvs/signal-rvs.component';
import { PopupWindowComponent } from '@components/popup-window/popup-window.component';
import { SecurityLookupComponent } from '@components/security-lookup/security-lookup.component';
import { GeneralInfoComponent } from '@components/security-info/general-info.component';
import { SecurityInfoComponent } from '@components/security-info/security-info.component';
import { SecurityInfoWrapperComponent } from '@components/security-info/security-info-wrapper.component';
import { GeneralInfoOverviewComponent } from '@components/security-info/overview/general-info-overview.component';
import { CashflowsComponent } from '@components/security-info/cashflows/cashflows.component';

import { DataUpdateComponent } from '@components/data-update/data-update.component';

import { StatusBarModule } from '@components/status-bar/status-bar.module';
import { PlotChartComponent } from './components/plot-chart/plot-chart.component';

import { SecurityListComponent } from '@components/security-list/security-list.component';
import { EntityCastComponent } from '@components/entity-cast/entity-cast.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { ExpansionPanelComponent } from './components/expansion-panel/expansion-panel.component';
import { MatButtonModule } from '@angular/material/button';
import { MessageComponent } from '@components/data-update/message.component';
import { TreeChartComponent } from './components/tree-chart/tree-chart.component';


@NgModule({
    declarations: [
        AppComponent,
        CommonLayoutComponent,
        TradingSignalComponent,
        ModalComponent,
        SignalEMCComponent,
        SignalRVSComponent,
        PopupWindowComponent,
        PlotChartComponent,
        SecurityListComponent,
        EntityCastComponent,
        TradingSignalWrapperComponent,
        ExpansionPanelComponent,
        SecurityLookupComponent,
        GeneralInfoComponent,
        CashflowsComponent,
        SecurityInfoComponent,
        GeneralInfoComponent,
        SecurityInfoWrapperComponent,
        GeneralInfoOverviewComponent,
        DataUpdateComponent,
        MessageComponent,
        TreeChartComponent,
    ],
    imports: [
        FormsModule,
        InputSearchModule,
        BrowserModule,
        AppRoutingModule,
        StatusBarModule,
        AuthModule,
        SpinnerOrErrorModule,
        DragDropModule,
        MatDialogModule,
        MatTableExpandableModule,
        MatTableModule,
        MatTabsModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatExpansionModule,
        MatButtonModule,
    ],
    providers: [
        {
            provide: AuthConfig,
            useFactory: () => { return environment.auth }
        },
        {
            provide: NavConfig,
            useFactory: () => { return { title: 'Portfolio Management' } }
        },
        // {
        //     provide: APP_INITIALIZER, useFactory: authenticateUser,
        //     deps: [AuthService], multi: true,
        // }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
