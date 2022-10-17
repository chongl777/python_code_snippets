import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NguCarouselModule } from '@ngu/carousel';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { OverlayContainer } from '@angular/cdk/overlay';

import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { SecurityDetailsModule } from '@app/components/security-details/security-details.module';
import { CommonComponentsModule } from '../common-components/common-components.module';
import { TradesConfirmationComponent } from './trades-confirmation.component';
import { BooksRecordsModule } from '@app/components/books-records/books-records.module';
import { ThemeModule } from '@theme';



@NgModule({
    declarations: [
        TradesConfirmationComponent,
    ],
    imports: [
        CommonModule,
        ThemeModule,
        DragDropModule,
        FlexLayoutModule,
        NguCarouselModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ScrollingModule,
        TableVirtualScrollModule,
        CommonComponentsModule,
        BooksRecordsModule,
        SecurityDetailsModule,
    ],
    exports: [
        // TradesConfirmationComponent,
    ],
    providers: [
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer
        }
    ],
})
export class TradesConfirmationModule { }
