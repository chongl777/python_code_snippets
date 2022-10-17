import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { NgxMatInputFormatToolsModule } from '@app/directives/mat-input-format/mat-input-format.module';

import { SettingComponent } from './transaction-allocator/setting.component';
import { PendingTicketComponent } from './pending-ticket/pending-ticket.component';
import { TicketDetailsComponent } from './ticket-details/ticket-details.component';
import { TransactionAllocatorComponent } from './transaction-allocator/transaction-allocator.component';
import { PendingTicketsPanelComponent } from './pending-tickets-panel/pending-tickets-panel.component';
import { ConfirmedTicketsPanelComponent } from './confirmed-tickets-panel/confirmed-tickets-panel.component';
import { NewTicketComponent } from './pending-tickets-panel/new-ticket.component';
import { TradeSettlementComponent } from './trade-settlement/trade-settlement.component';
import { TradeEmailCommunication } from './trade-email-communication/trade-email-communication.component';
import { EmailDialogComponent } from '@app/components/email-dialog/email-dialog.component';

import { SpinnerOrErrorModule } from 'shared-library';



@NgModule({
    declarations: [
        PendingTicketsPanelComponent,
        ConfirmedTicketsPanelComponent,
        PendingTicketComponent,
        TransactionAllocatorComponent,
        SettingComponent,
        TicketDetailsComponent,
        NewTicketComponent,
        TradeSettlementComponent,
        TradeEmailCommunication,
        EmailDialogComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatSelectModule,
        MatListModule,
        MatRippleModule,
        MatCheckboxModule,
        MatInputModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        MatInputModule,
        MatDatepickerModule,
        MatSlideToggleModule,
        SpinnerOrErrorModule,
        NgxMatInputFormatToolsModule,
    ],
    exports: [
        PendingTicketsPanelComponent,
        ConfirmedTicketsPanelComponent,
        PendingTicketComponent,
        TransactionAllocatorComponent,
        TicketDetailsComponent,
        TradeSettlementComponent,
        TradeEmailCommunication,
        EmailDialogComponent,
    ],
})
export class BooksRecordsModule { }
