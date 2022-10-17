import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerOrErrorComponent } from './spinner-or-error.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@NgModule({
    declarations: [
        SpinnerOrErrorComponent,
    ],
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
    ],
    exports: [
        SpinnerOrErrorComponent,
    ],
})
export class SpinnerOrErrorModule { }
