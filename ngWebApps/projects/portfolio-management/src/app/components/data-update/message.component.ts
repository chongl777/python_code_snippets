import { Component, HostBinding, OnInit, Input, Inject, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { map, switchMap } from 'rxjs/operators';
import { utils } from 'shared-library';


@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
    @ViewChild('message', { static: true }) msg: ElementRef;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { message: string, title: string },
    ) {
    }

    ngOnInit(): void {
        this.msg.nativeElement.innerHTML = this.data.message;
    }

    ngAfterViewInit(): void {
        // let self = this;
        // console.log('availableViews', this.availableViews);
    }

    ngOnDestroy() {
    }

    refreshPage() {
        location.reload();
    }
}
