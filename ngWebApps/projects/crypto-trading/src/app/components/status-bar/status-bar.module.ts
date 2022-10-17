import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { StatusBarComponent } from './status-bar.component';


@NgModule({
    declarations: [
        StatusBarComponent,
    ],
    imports: [
        BrowserModule,
    ],
    exports: [
        StatusBarComponent,
    ],
})
export class StatusBarModule { }
