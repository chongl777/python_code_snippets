import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {
    }

    canActivate(
        next: ActivatedRouteSnapshot, state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.authService.loadUserInfo$.pipe(
            map((rslt) => {
                let authenticated = this.authService.authenticated$.value;
                if (authenticated) {
                    return true;
                } else {
                    this.router.navigate(['/login'], { queryParams: { next: state.url } });
                    return false;
                }
            }),
            catchError(() => {
                this.router.navigate(['/login'], { queryParams: { next: state.url } });
                return of(false);
            })
        );

        // if (this.authService.isLoggedIn$.value) {
        //     return true;
        // }
        // // this.authService.errMsg = 'Need to log in first';
        // this.router.navigate(['/login'], { queryParams: { next: state.url } });
        // return false;
    }

    canActivateChild(
        next: ActivatedRouteSnapshot, state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.canActivate(next, state);
    }
}
