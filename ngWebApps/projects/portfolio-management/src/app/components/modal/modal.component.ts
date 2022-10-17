import { Component, Input, OnInit } from '@angular/core';


@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

    @Input('title') title: string;
    @Input('color-theme') color = "mat-primary";

    constructor() { }

    ngOnInit(): void {
    }
}
