import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SecurityEventsComponent } from './security-events.component';
import { SecurityEventsListComponent } from './security-events-list.component';



@NgModule({
    declarations: [
        SecurityEventsComponent,
        SecurityEventsListComponent,

    ],
    imports: [
        CommonModule,
        DragDropModule,
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatSelectModule,
        MatInputModule,
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        ScrollingModule,
        TableVirtualScrollModule,
    ],
    exports: [
        SecurityEventsComponent,
        SecurityEventsListComponent,
    ]
})
export class SecurityEventsModule { }
