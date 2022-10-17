import { Component, ElementRef, OnInit, ViewChild, Input } from '@angular/core';

@Component({
    selector: 'app-expansion-panel',
    templateUrl: './expansion-panel.component.html',
    styleUrls: ['./expansion-panel.component.scss']
})
export class ExpansionPanelComponent implements OnInit {
    @ViewChild('header', { static: true, read: ElementRef }) header: ElementRef;
    @Input('expanded') expanded = true;

    constructor() { }

    ngOnInit(): void {
        // let header = d3.select('mat-expansion-panel').select('mat-expansion-panel-header');
        this.header.nativeElement.parentNode.appendChild(this.header.nativeElement);

        // header.each(function () {
        //     (this as any).parentNode.appendChild(this)
        // });
        // console.log(indicator);
    }

    ngAfterViewInit(): void {
        // let indicator = this.header.nativeElement.querySelector('.mat-expansion-indicator');
    }
}
