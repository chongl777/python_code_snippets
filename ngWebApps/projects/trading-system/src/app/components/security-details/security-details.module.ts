import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatTreeModule } from '@angular/material/tree';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SignalMatrixService } from '@app/services/signal-matrix.service';

import { SecurityDetailsSlideCardComponent } from './security-details-slide-card/security-details-slide-card.component';
import { SecurityDetailsTabsComponent } from './security-details-tabs/security-details-tabs.component';
import { SecurityGeneralInfoComponent } from './security-general-info/security-general-info.component';
import { SignalMatrixComponent } from './signal-matrix/signal-matrix.component';
import { SecurityAllocationComponent } from './security-allocation/security-allocation.component';
import { PortfolioLookthroughModule } from '../portfolio-lookthrough/portfolio-lookthrough.module';

import { SpinnerOrErrorModule } from 'shared-library';
import { NguCarouselModule } from 'shared-library';


@NgModule({
    declarations: [
        SecurityDetailsSlideCardComponent,
        SecurityDetailsTabsComponent,
        SecurityGeneralInfoComponent,
        SignalMatrixComponent,
        SecurityAllocationComponent,
    ],
    imports: [
        CommonModule,
        NguCarouselModule,
        FormsModule,
        ReactiveFormsModule,

        MatAutocompleteModule,
        MatBadgeModule,
        MatBottomSheetModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatStepperModule,
        MatDatepickerModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatNativeDateModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRippleModule,
        MatSelectModule,
        MatSidenavModule,
        MatSliderModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule,
        MatFormFieldModule,

        SpinnerOrErrorModule,
        PortfolioLookthroughModule,
    ],
    exports: [
        SecurityDetailsSlideCardComponent,
        SecurityDetailsTabsComponent,
        SecurityGeneralInfoComponent,
        SignalMatrixComponent,
        SecurityAllocationComponent,
    ],
    providers: [
    ],
})
export class SecurityDetailsModule { }