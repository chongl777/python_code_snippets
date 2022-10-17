import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-spinner-or-error',
    templateUrl: './spinner-or-error.component.html',
    styleUrls: ['./spinner-or-error.component.scss']
})
export class SpinnerOrErrorComponent implements OnInit {

    @Input() public loading$: BehaviorSubject<boolean> | Observable<boolean>;
    @Input() public errMsg: string;

    constructor() { }

    ngOnInit(): void {
    }

}
