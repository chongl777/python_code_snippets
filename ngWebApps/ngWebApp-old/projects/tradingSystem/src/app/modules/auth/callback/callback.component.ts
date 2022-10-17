import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-callback',
    template: `
      <p>
      Loading...
      </p>`,
    styles: [],
})
export class CallbackComponent implements OnInit {

    constructor(
        private authService: AuthService,
        private activatedRouter: ActivatedRoute,
        private router: Router,) { }

    ngOnInit() {
        let code = this.activatedRouter.snapshot.queryParams.code;
        let next = this.activatedRouter.snapshot.queryParams.next;
        if (code) {
            this.authService.handleLoginCallback(code, next);
        } else {
            this.router.navigate(['/login'], {
                queryParams: { next: next }
            });
        }
    }
}
