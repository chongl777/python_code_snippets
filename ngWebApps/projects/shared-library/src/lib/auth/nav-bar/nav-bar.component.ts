import { Component, OnInit, Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import {
    trigger, state, style, transition, animate, keyframes
} from '@angular/animations';
import { Router } from '@angular/router';

import { User } from '../User';
import { AuthService } from '../auth.service';


export class NavConfig {
    title: string
}


@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit {

    public currentUser: User;
    public isLoggedIn$: BehaviorSubject<boolean>;

    constructor(
        public navConfig: NavConfig,
        private authService: AuthService,
        private router: Router,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.currentUser = this.authService.user_profile;
        this.isLoggedIn$ = this.authService.isLoggedIn$;
    }

    ngOnInit(): void {
    }

    async logout(): Promise<any> {
        this.document.location.href = this.authService.build_logout_url();
        //this.document.location.reload();
        // this.router.navigate(['/login']);
    }

    get logout_url(): string {
        return this.authService.build_logout_url();
    }

    login(): void {
        this.authService.login();
    }
}
