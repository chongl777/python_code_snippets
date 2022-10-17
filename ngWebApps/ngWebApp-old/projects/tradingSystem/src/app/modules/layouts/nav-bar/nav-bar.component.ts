import { Component, OnInit, Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import {
    trigger, state, style, transition, animate, keyframes
} from '@angular/animations';
import { Router } from '@angular/router';

import { User } from '@models/User';
import { AuthService } from '@app/modules/auth';


@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    animations: [
        trigger('expand', [
            state('expanded', style({
                'height': 'auto',
            })),
            state('collapsed', style({
                'height': '0px',
            })),
            transition('collapsed => expanded', [
                animate(
                    '500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    keyframes([
                        style({ 'height': '0px', }),
                        style({ 'height': '*' }),
                    ])
                ),
            ]),
            transition('expanded => collapsed', [

                animate(
                    '500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    keyframes([
                        style({ 'height': '*', }),
                        style({ 'height': '0px' }),
                    ]),
                ),

            ]),
        ])
    ],
})
export class NavBarComponent implements OnInit {

    public currentUser: User;
    public isLoggedIn$: BehaviorSubject<boolean>;

    constructor(
        private authService: AuthService,
        private router: Router,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.currentUser = this.authService.user_profile;
        this.isLoggedIn$ = this.authService.isLoggedIn$;
    }

    expanded: boolean = false;

    ngOnInit(): void {
    }

    onClick(): void {
        this.expanded = !this.expanded;
    }

    logout(): void {
        this.authService.logout();
        this.document.location.reload();
        // this.router.navigate(['/login']);
    }

    login(): void {
        this.authService.login();
    }
}
