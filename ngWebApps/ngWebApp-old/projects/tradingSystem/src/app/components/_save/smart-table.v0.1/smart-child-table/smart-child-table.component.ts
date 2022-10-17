import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit,
    ChangeDetectorRef, Input, HostBinding, TemplateRef
} from '@angular/core';
import { MatTableDataSource, MatColumnDef, MatTable } from '@angular/material/table';

import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';


@Component({
    selector: 'app-smart-child-table',
    templateUrl: './smart-child-table.component.html',
    styleUrls: ['./smart-child-table.component.scss'],
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class SmartChildTableComponent<T> implements OnInit, AfterViewInit, OnDestroy {
    @Input() data: T[];
    @Input() columnsToDisplay: string[];
    @Input() level: number;
    @Input() contentColumnDefs: MatColumnDef[];
    @Input() nonChildrenRowTemplate: TemplateRef<any>;

    @HostBinding('class') get className() { return 'level-' + this.level; }
    @ViewChild(MatTable, { static: true }) _childTab: MatTable<T>;

    public dataSource = new MatTableDataSource<T>();

    constructor(
        private _cdr: ChangeDetectorRef,
    ) {
        this._cdr.detach();
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        for (let colDef of this.contentColumnDefs) {
            this._childTab.addColumnDef(colDef);
        }

        this.dataSource.data = this.data;
        this._cdr.reattach();
        this._cdr.detectChanges();
    }

    ngOnDestroy(): void {
    }
}
