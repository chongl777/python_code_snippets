import {
    Component, OnInit, Input, ElementRef, Directive, ViewContainerRef,
    ChangeDetectorRef, Type, ViewChild, Inject, AfterViewInit, AfterContentInit
} from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

import { AuthService } from 'shared-library';

import * as commons from '@app/models/commons';
import { BehaviorSubject } from 'rxjs';


@Component({
    selector: 'app-email-dialog',
    templateUrl: './email-dialog.component.html',
    styleUrls: ['./email-dialog.component.scss']
})
export class EmailDialogComponent implements OnInit, AfterViewInit, AfterContentInit {
    loading$ = new BehaviorSubject<boolean>(true);
    errMsg: string = "";


    mailType: 'Reply' | 'Forward' | 'Send';
    msg_id: string;
    to: string;
    cc: string;
    body: string;
    attachments: string[] = [];

    constructor(
        public authService: AuthService,
        public dialogRef: MatDialogRef<any>,
        private _cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
    }

    ngAfterContentInit(): void {
    }

    setData(data: any) {
        let filter = [this.authService.user_profile.email, this.authService.user_profile.az_username]
        this.mailType = data['mailType'];
        if (this.mailType == 'Reply') {
            this.msg_id = data['msg_id'];
            this.to = data['to'].filter(x => !filter.includes(x.address)).map(x => x.address).join('; ');
            this.cc = data['cc'].filter(x => !filter.includes(x.address)).map(x => x.address).join('; ');
            this.body = data['body'];
        }
        this.loading$.next(false);
    }

    async send() {
        this.loading$.next(true);
        try {
            if (this.mailType == 'Reply') {
                await this.authService.replyEmail$(
                    this.msg_id,
                    this.body + this.authService.user_profile.email_signature,
                    //this.to.split(";"),
                    //this.cc.split(";"),
                    [],
                    [],
                    this.attachments,
                ).toPromise();
                this.loading$.next(false);
            }
            this.dialogRef.close(true);

        } catch (err) {
            this.errMsg = commons.errMsg(err);
            this.loading$.next(false);
        }
    }

}
