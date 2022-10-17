import { Component, ContentChild, Input, OnInit, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, from, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';


@Component({
    selector: 'app-input-search',
    templateUrl: './input-search.component.html',
    styleUrls: ['./input-search.component.scss']
})
export class InputSearchComponent<T, TGroup extends { groupName?: string, children?: (T | TGroup)[] }> implements OnInit {

    selectedItem: T;
    searchControl = new FormControl();
    filteredOptions$: Observable<TGroup[]>;
    @Input('placeholder') placeholder: string = "Search...";
    @Input('filterFn') filterFn: (x: string) => Promise<TGroup[]>;
    @Input('onSelected') onSelected: (item: T) => void;
    @ContentChild(TemplateRef) optionsTemplate: TemplateRef<any>;

    constructor() { }

    ngOnInit(): void {
        this.filteredOptions$ = this.searchControl.valueChanges
            .pipe(
                debounceTime(400),
                //map(value => this._filter(value).slice(0, 10)),  // equivalent
                switchMap((text) => {
                    if (typeof text === 'string') {
                        return from((this.filterFn(text)))
                    }
                    return of([]);
                }),
            );
    }

    // ngAfterViewInit(): void {
    //     console.log(this.optionsTemplate);
    // }

    select(evt$: MatAutocompleteSelectedEvent) {
        this.selectedItem = evt$.option.value;
        this.onSelected(this.selectedItem);
    }

    setValue(item: T) {
        this.selectedItem = item;
        this.searchControl.setValue(item);
    }

    @Input('displayFn') displayFn(item: T): string {
        return null;
    }
}
