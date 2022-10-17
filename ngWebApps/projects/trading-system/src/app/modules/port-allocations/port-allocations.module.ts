import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { ThemeModule } from '@theme/theme';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MatCheckboxModule } from '@angular/material/checkbox';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop'

import { ThemeModule } from '@theme';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll'

import { PortAllocationComponent } from './port-allocations.component'

import { CommonComponentsModule } from '@app/modules/common-components/common-components.module';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { PortfolioLookthroughModule } from '@app/components/portfolio-lookthrough/portfolio-lookthrough.module';


@NgModule({
    declarations: [
        PortAllocationComponent,
    ],
    imports: [
        CommonModule,
        ThemeModule,
        DragDropModule,
        FlexLayoutModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ScrollingModule,
        TableVirtualScrollModule,
        CommonComponentsModule,
    ],
    providers: [
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer,
        }
    ],

})
export class PortAllocationsModule { }
