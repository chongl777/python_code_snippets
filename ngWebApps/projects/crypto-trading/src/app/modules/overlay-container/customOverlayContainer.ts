import { Injectable, ElementRef, OnInit, Inject } from '@angular/core';
// import { OverlayContainer } from '@angular/material';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';


@Injectable({
    providedIn: "root",
})
export class CustomOverlayContainer extends OverlayContainer implements OnInit {
    private _containerParent: Element;
    get containerParent(): Element {
        return this._containerParent;
    };

    set containerParent(val: Element) {
        this._containerParent = val;
    };

    /**
     * enable any component to set a custom element as overlay parent
     *
     * could apply hacky style on element here
     * -webkit-transform: translateZ(0);
     */
    // constructor(@Inject(Document) document: any, @Inject(Platform) _platform?: Platform | undefined) {
    //     super(document, _platform);
    //     console.log(this);
    // }

    public setContainerParent(containerParent: ElementRef): void {
        this._containerElement = null;
        this.containerParent = containerParent.nativeElement;
    }

    protected _createContainer(): void {
        let container = document.createElement('div');
        container.classList.add('cdk-overlay-container');

        // if (this._themeClass) {
        //     container.classList.add(this._themeClass);
        // }

        let parent = this.containerParent || document.body;

        parent.appendChild(container);

        this._containerElement = container;
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this._containerElement = null;
    }
}
