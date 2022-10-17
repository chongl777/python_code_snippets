import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-spinner-or-error',
    templateUrl: './spinner-or-error.component.html',
    styleUrls: ['./spinner-or-error.component.scss']
})
export class SpinnerOrErrorComponent implements OnInit {

    @Input() public loading$: BehaviorSubject<boolean>;
    @Input() public errMsg: string;

    constructor() { }

    ngOnInit(): void {

        // this.loading$.subscribe(
        //     (loading: boolean) => {
        //         console.log('portfoio.component loading', loading);
        //         if (!loading) {
        //             this._cdr.reattach();
        //             this._cdr.detectChanges();
        //         } else {
        //             this._cdr.detectChanges();
        //             this._cdr.detach();
        //         }
        //     }
        // );
    }

}
