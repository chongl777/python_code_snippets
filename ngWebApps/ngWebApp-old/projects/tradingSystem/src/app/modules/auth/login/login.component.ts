import { Component, OnInit } from '@angular/core';
import { AuthService } from "../auth.service";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    msg: string = '';

    constructor(private authService: AuthService, private activatedRouter: ActivatedRoute) { }

    ngOnInit(): void {
        this.msg = localStorage.getItem('login_error') || '';
        localStorage.removeItem('login_error')
    }

    authenticate(): void {
        let next = this.activatedRouter.snapshot.queryParams['next'];
        this.authService.authenticate(next);
    }
}
