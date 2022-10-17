import { Component, OnInit } from '@angular/core';
import { MsgControllerService } from '@app/services/msg-controller.service';
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs'

@Component({
    selector: 'app-data-update-panel',
    templateUrl: './data-update-panel.component.html',
    styleUrls: ['./data-update-panel.component.scss']
})
export class DataUpdatePanelComponent implements OnInit {

    constructor(
        public msgController: MsgControllerService,
    ) { }

    ngOnInit(): void {
    }

    async refresh(obs$: Observable<any>) {
        let sub = obs$
            .pipe(
                finalize(() => {
                    sub.unsubscribe();
                })
            ).subscribe({
                next: (msg: string) => {
                    this.msgController.mqMsg$.next(msg);
                },
                error: (err: string) => {
                    this.msgController.mqMsg$.next(err);
                },
            });
    }
}
