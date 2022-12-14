import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { routes } from './routes';


@NgModule({
    imports: [
        RouterModule.forRoot(
            routes, {
            useHash: true,
            // enableTracing: true
        },
        )],
    exports: [RouterModule]
})
export class AppRoutingModule { }
