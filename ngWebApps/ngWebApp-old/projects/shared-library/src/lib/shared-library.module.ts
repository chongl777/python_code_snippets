import { NgModule } from '@angular/core';
import { SharedLibraryComponent } from './shared-library.component';
import { MatTableExpandableComponent } from './mat-table-expandable/mat-table-expandable.component';


@NgModule({
    declarations: [SharedLibraryComponent],
    imports: [
    ],
    exports: [SharedLibraryComponent]
})
export class SharedLibraryModule { }
