import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeButtonsComponent } from './trade-buttons.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
    declarations: [
        TradeButtonsComponent
    ],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatButtonModule,
    ],
    exports: [
        TradeButtonsComponent
    ],
})
export class TradeButtonsModule { }
