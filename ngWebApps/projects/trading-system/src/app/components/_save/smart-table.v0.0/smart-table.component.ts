import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit, Input,
    ChangeDetectorRef, ContentChildren, QueryList, TemplateRef, HostBinding,
} from '@angular/core';
import {
    MatTableDataSource, MatColumnDef, MatHeaderRowDef, MatRowDef, MatTable
} from '@angular/material/table';

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { interval, Subscription, Observable, merge } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';



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
export class SmartTableComponent<T> implements OnInit, OnDestroy, AfterViewInit {

    @Input() columnsToDisplay: string[];
    @Input() dataSource: MatTableDataSource<T>;
    @Input() sortData: (field: string, flag: -1 | 1) => void;
    @Input() nonChildrenRowTemplate: TemplateRef<any>;

    @HostBinding('class') get className() { return 'level-0'; }

    @ViewChild("Table", { static: true }) _childTab: MatTable<T>;
    @ContentChildren(MatColumnDef) _contentColumnDefs: QueryList<MatColumnDef>;
    @ContentChildren(MatHeaderRowDef) _contentHeaderRowDefs: QueryList<MatHeaderRowDef>;
    // @ViewChild('.child-table-row', { static: true }) _childRow: MatRowDef;
    @ViewChild(MatRowDef, { static: true }) _childRowDef: MatRowDef<T>;

    @ContentChildren(MatRowDef) _contentRows: QueryList<MatRowDef<T>>;
    columnDefs: MatColumnDef[];

    constructor(
        private _cdr: ChangeDetectorRef,
    ) {
        // this._cdr.detach();
    }

    ngOnInit(): void {
    }

    ngAfterContentInit(): void {
        this.columnDefs = this._contentColumnDefs.filter(
            (x: MatColumnDef) => this.columnsToDisplay.includes(x.name));

        for (let colDef of this._contentColumnDefs.toArray()) {
            this._childTab.addColumnDef(colDef);
        }

        for (let headerRowDef of this._contentHeaderRowDefs.toArray()) {
            this._childTab.addHeaderRowDef(headerRowDef);
        }

        for (let rowDef of this._contentRows.toArray()) {
            this._childTab.addRowDef(rowDef);
        }

        this._childTab.addRowDef(this._childRowDef);

        return;
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
    }
}
