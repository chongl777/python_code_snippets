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
        let next = this.activatedRouter.snapshot.queryParams.next;
        let parts = next.split('?');
        if (parts.length > 1) {
            let url = parts[0];
            let queryParams = new URLSearchParams("?" + parts[1]);

            let params = {}
            queryParams.forEach((x, y) => {
                params[y] = x;
            });
            this.router.navigate([url], { queryParams: params });
        } else {
            this.router.navigate([next ? next : '/']);
        }
    }
}
