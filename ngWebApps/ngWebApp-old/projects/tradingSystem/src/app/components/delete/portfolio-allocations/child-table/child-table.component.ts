import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit,
    ChangeDetectorRef, Input, HostBinding
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { GenericPos } from '@app/models/position';
import { ExpandedAnimation, ShowAnimation, SlideInOutAnimation } from '@app/animations/app.animations';


@Component({
    selector: 'app-child-table',
    templateUrl: './child-table.component.html',
    styleUrls: ['./child-table.component.scss'],
    animations: [
        SlideInOutAnimation(),
        ShowAnimation(),
        ExpandedAnimation(),
    ],
})
export class ChildTableComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() data: GenericPos[];
    @Input() columnsToDisplay: string[];
    @Input() level: number;
    @HostBinding('class') get className() { return 'level-' + this.level; }

    public dataSource = new MatTableDataSource<GenericPos>();

    constructor(
        private _cdr: ChangeDetectorRef,
    ) {
        this._cdr.detach();
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.dataSource.data = this.data;
        this._cdr.reattach();
        this._cdr.detectChanges();
    }

    ngOnDestroy(): void {
    }
}
