import { Component, OnInit, Input, AfterContentInit, AfterViewInit, ElementRef, Inject, ViewChild, ChangeDetectorRef, ContentChildren, QueryList, ViewChildren } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SecurityEvent } from '@app/models/securityEvent';
import { Security } from '@app/models/security';
import { MatSort } from '@angular/material/sort';
import { MatColumnDef } from '@angular/material/table';

import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { DialogComponent } from '@app/components/dialog-window/dialog.component';


@Component({
    selector: 'app-security-events-list',
    templateUrl: './security-events-list.component.html',
    styleUrls: ['./security-events-list.component.scss']
})
export class SecurityEventsListComponent implements AfterContentInit, AfterViewInit, DialogComponent {

    public dataSource: TableVirtualScrollDataSource<any>;
    columnsToDisplay: string[];
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    // @ContentChildren(MatColumnDef) _contentColumnDefs: QueryList<MatColumnDef>;
    @ViewChildren(MatColumnDef) _contentColumnDefs: QueryList<MatColumnDef>;

    constructor(
        private _cdr: ChangeDetectorRef,
        public _ref: ElementRef,
    ) {
        this.dataSource = new TableVirtualScrollDataSource<any>();
    }

    setData(secEvts: any) {
        let res: any[] = [];
        for (let secEvt of (secEvts as SecurityEvent[])) {
            res = Array.prototype.concat(res, secEvt.data);
        }

        this.dataSource.sort = this.sort;
        this.dataSource.data = res;
    }

    ngAfterContentInit(): void {
        // this.columnsToDisplay = this._contentColumnDefs.map((x: MatColumnDef) => x.name);
        // this.columnsToDisplay = ['ReportDate', 'Voluntary/Mandatory', 'Status', 'EventDescription'];
    }

    ngAfterViewInit(): void {
        this.columnsToDisplay = this._contentColumnDefs.map((x: MatColumnDef) => x.name);
        this._cdr.detectChanges();
    }
}
