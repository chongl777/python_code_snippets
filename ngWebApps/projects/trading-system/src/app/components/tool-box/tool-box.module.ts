import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

import { ToolBoxComponent } from './tool-box.component';


@NgModule({
    declarations: [
        ToolBoxComponent
    ],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatButtonModule,
    ],
    exports: [
        ToolBoxComponent
    ],
})
export class ToolBoxModule { }
