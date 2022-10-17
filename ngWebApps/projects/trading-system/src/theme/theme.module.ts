import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, CardBodyComponent } from './components/card/card.component';
import { CardModule } from './components/card/card.module';
import { SidebarModule } from './components/sidebar';


@NgModule({
    declarations: [
        // CardComponent,
        // CardBodyComponent,
    ],
    imports: [
        CommonModule,
        CardModule,
        SidebarModule,
    ],
    exports: [
        CardModule,
        SidebarModule,
    ]
})
export class ThemeModule { }
