import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { WidgetWindowComponent } from '@components/widget-window/widget-window.component';
import { DialogWindowComponent, DialogContentDirective } from '@components/dialog-window/dialog-window.component';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { OrderDialogComponent } from '@app/components/trade-button/order-dialog.component';


@NgModule({
    declarations: [
        WidgetWindowComponent,
        DialogWindowComponent,
        OrderDialogComponent,
        DialogContentDirective,
    ],
    imports: [
        CommonModule,
        DragDropModule,
        FlexLayoutModule,
        FormsModule,
        MatListModule,
        MatTableModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        MatSortModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,
        MatAutocompleteModule,
        MatIconModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ScrollingModule,
        RouterModule,
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        MatListModule,
        MatTableModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        MatSortModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,
        WidgetWindowComponent,
        DialogWindowComponent,
        DialogContentDirective],
    providers: [
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer,
        }
    ],
})
export class CommonComponentsModule { }
