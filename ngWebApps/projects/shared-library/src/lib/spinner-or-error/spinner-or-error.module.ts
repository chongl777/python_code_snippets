import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerOrErrorComponent } from './spinner-or-error.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        SpinnerOrErrorComponent,
    ],
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatIconModule,
    ],
    exports: [
        SpinnerOrErrorComponent,
    ],
})
export class SpinnerOrErrorModule { }
export { SpinnerOrErrorComponent }
