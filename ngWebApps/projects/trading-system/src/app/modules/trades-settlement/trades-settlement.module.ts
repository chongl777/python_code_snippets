import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { OverlayContainer } from '@angular/cdk/overlay';

import { SecurityDetailsModule } from '@app/components/security-details/security-details.module';
import { BooksRecordsModule } from '@app/components/books-records/books-records.module';
import { ThemeModule } from '@theme';

import { CustomOverlayContainer } from '../overlay-container/customOverlayContainer';
import { CommonComponentsModule } from '../common-components/common-components.module';
import { TradesSettlementLayoutComponent } from './trades-settlement.component';



@NgModule({
    declarations: [
        TradesSettlementLayoutComponent,
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
export class TradesSettlementModule { }
