import {
    Component, OnInit, Input, ContentChildren, QueryList, TemplateRef, ViewChild,
    HostBinding, Directive, ElementRef, ViewContainerRef, ViewChildren, ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'shared-library';
import { HttpService } from '@services/http.service';


@Component({
    selector: 'app-callback]',
    templateUrl: './callback.component.html',
    styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit {
    statusMsg = '';
    constructor(
        private authService: AuthService,
        private activatedRouter: ActivatedRoute,
        private router: Router,
        private httpService: HttpService,
        private _cdr: ChangeDetectorRef
    ) {
        this.statusMsg = 'retrieving token'
    }

    async ngOnInit() {
        let state = this.activatedRouter.snapshot.queryParams.state;
        try {
            let token = await this.authService.loadToken$({ state: state }).toPromise().then(
                (token: string) => { return token },
                (error) => { throw error }
            );
            console.log('token', token)
            this.statusMsg = 'saving token';
            this._cdr.detectChanges();
            await this.httpService.saveToken$(token).toPromise();
            this.statusMsg = 'done';
            this._cdr.detectChanges();
            window.close();
        } catch (err) {
            this.statusMsg = err.error;
            this._cdr.detectChanges();
        }
    }

    ngOnDestroy(): void {
    }
}
