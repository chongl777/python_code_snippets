import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit, Input,
    ChangeDetectorRef, ContentChildren, QueryList, TemplateRef, HostBinding, Directive, ElementRef, ViewContainerRef, ViewChildren,
} from '@angular/core';
import {
    MatTableDataSource, MatColumnDef, MatHeaderRowDef, MatRowDef, MatTable
} from '@angular/material/table';

import {
    CDK_TABLE_TEMPLATE, RowOutlet
} from '@angular/cdk/table';

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { interval, Subscription, Observable, merge } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';


@Directive({ selector: '[headerRowOutlet]' })
export class HeaderRowOutlet implements RowOutlet {
    constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}


@Directive({ selector: '[rowOutlet]' })
export class DataRowOutlet implements RowOutlet {
    constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}

@Directive({ selector: '[footerRowOutlet]' })
export class FooterRowOutlet implements RowOutlet {
    constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}

@Directive({ selector: '[noDataRowOutlet]' })
export class NoDataRowOutlet implements RowOutlet {
    constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}


@Component({
    selector: 'smart-table',
    templateUrl: './smart-table.component.html',
    styleUrls: ['./smart-table.component.scss'],
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class SmartTableComponent<T> extends MatTable<T> {
    @ViewChild(DataRowOutlet, { static: true }) _rowOutlet: DataRowOutlet;
    @ViewChild(HeaderRowOutlet, { static: true }) _headerRowOutlet: HeaderRowOutlet;
    @ViewChild(FooterRowOutlet, { static: true }) _footerRowOutlet: FooterRowOutlet;
    @ViewChild(NoDataRowOutlet, { static: true }) _noDataRowOutlet: NoDataRowOutlet;

    @Input() columnsToDisplay: string[];
    @Input() nonChildrenRowTemplate: TemplateRef<any>;
    @Input() level: number = 0;
    @Input() contentColumnDefs: MatColumnDef[] = [];

    @HostBinding('class') get className() { return 'level-' + this.level; }

    // @ViewChild("Table", { static: true }) _childTab: MatTable<T>;
    // @ViewChild("childTemplate", { static: true }) childTemplate: MatTable<T>;

    @ViewChildren(MatRowDef) _childrenRowDefs: QueryList<MatRowDef<T>>;
    @ViewChild(MatColumnDef, { static: true }) _childColumnDef: MatColumnDef;

    @ContentChildren(MatColumnDef) _contentColumnDefs: QueryList<MatColumnDef>;
    // @ContentChildren(MatHeaderRowDef) _contentHeaderRowDefs: QueryList<MatHeaderRowDef>;
    // @ContentChildren(MatRowDef) _contentRows: QueryList<MatRowDef<T>>;

    columnDefs: MatColumnDef[];

    ngAfterContentInit(): void {
        for (let colDef of this.contentColumnDefs) {
            this.addColumnDef(colDef);
        }
        this.columnDefs = this.contentColumnDefs.filter(
            (x: MatColumnDef) => this.columnsToDisplay.includes(x.name));
    }

    ngAfterViewInit(): void {
        this._headerRowOutlet;

        //if (!this.columnDefs || this.columnDefs.length == 0) {
        if (this.level == 0) {
            this.columnDefs = this._contentColumnDefs.filter(
                (x: MatColumnDef) => this.columnsToDisplay.includes(x.name));
        }

        this.addColumnDef(this._childColumnDef);

        // this.columnDefs.push(this._childColumnDef);

        for (let rowDef of this._childrenRowDefs.toArray()) {
            this.addRowDef(rowDef);
        }

        // (this as any)._cacheRowDefs();
        // (this as any)._cacheColumnDefs();
        this.ngAfterContentChecked();
        this.renderRows();
        this._changeDetectorRef.detectChanges();
        return;
    }

    ngOnDestroy(): void {
    }
}
