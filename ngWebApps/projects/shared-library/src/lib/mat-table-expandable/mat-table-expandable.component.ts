import {
    Component, OnInit, Input, ContentChildren, QueryList, TemplateRef, ViewChild,
    HostBinding, Directive, ElementRef, ViewContainerRef, ViewChildren,
} from '@angular/core';

import { RowOutlet } from '@angular/cdk/table';
import { MatColumnDef, MatHeaderRowDef, MatRowDef, MatTable } from '@angular/material/table';


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
    selector: 'mat-table-expandable, [mat-table-expandable]',
    templateUrl: './mat-table-expandable.component.html',
    styleUrls: ['./mat-table-expandable.component.scss']
})
export class MatTableExpandableComponent<T> extends MatTable<T>{

    @ViewChild(DataRowOutlet, { static: true }) _rowOutlet: DataRowOutlet;
    @ViewChild(HeaderRowOutlet, { static: true }) _headerRowOutlet: HeaderRowOutlet;
    @ViewChild(FooterRowOutlet, { static: true }) _footerRowOutlet: FooterRowOutlet;
    @ViewChild(NoDataRowOutlet, { static: true }) _noDataRowOutlet: NoDataRowOutlet;

    @Input() columnsToDisplay: string[];
    @Input() nonChildrenRowTemplate: TemplateRef<any>;
    @Input() level: number = 0;
    @Input() contentColumnDefs: MatColumnDef[] = [];
    @Input() rowDefs: MatRowDef<T>[] = [];

    @HostBinding('class') get className() { return 'level-' + this.level; }

    @ContentChildren(MatRowDef) _contentChildrenRowDefs: QueryList<MatRowDef<T>>;

    @ViewChildren(MatRowDef) _viewChildrenRowDefs: QueryList<MatRowDef<T>>;
    @ViewChild(MatColumnDef, { static: true }) _childColumnDef: MatColumnDef;

    @ViewChild(MatTableExpandableComponent, { static: true }) _childTable: MatTableExpandableComponent<T>;

    @ContentChildren(MatColumnDef) _contentColumnDefs: QueryList<MatColumnDef>;

    columnDefs: MatColumnDef[];

    ngAfterContentInit(): void {
        for (let colDef of this.contentColumnDefs) {
            this.addColumnDef(colDef);
        }
        this.columnDefs = this.contentColumnDefs.filter(
            (x: MatColumnDef) => this.columnsToDisplay.includes(x.name));

        for (let rowDef of this.rowDefs) {
            this.addRowDef(rowDef);
        }

        if (this.level == 0) {
            this.rowDefs = this._contentRowDefs.toArray();
        }

        // for (let rowDef of this._childrenRowDefs.toArray()) {
        //     this.addRowDef(rowDef);
        // }
    }

    ngAfterViewInit(): void {
        this._headerRowOutlet;

        if (this.level == 0) {
            this.columnDefs = this._contentColumnDefs.filter(
                (x: MatColumnDef) => this.columnsToDisplay.includes(x.name));
        }

        this.addColumnDef(this._childColumnDef);

        for (let rowDef of this._viewChildrenRowDefs.toArray()) {
            this.addRowDef(rowDef);
        }

        this.ngAfterContentChecked();
        this.renderRows();
        this._changeDetectorRef.detectChanges();
        return;
    }

    ngOnDestroy(): void {
    }
}
