import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { EventService } from '@app/services/event.service';

@Component({
    selector: 'app-dialog-window2',
    templateUrl: './dialog-window2.component.html',
    styleUrls: ['./dialog-window.component.scss']
})
export class DialogWindowComponent2 implements OnInit {
    wrapper: any;

    @Input('title') title: string;
    constructor(private _ref: ElementRef,
        private eventService: EventService) { }

    ngOnInit(): void {
        this.wrapper = this._ref.nativeElement.parentElement.parentElement.parentElement.parentElement;
        this.wrapper.style['z-index'] = this.eventService.z_index;
    }

    onFocus(): void {
        this.wrapper.style['z-index'] = this.eventService.z_index;
        // this._document.querySelectorAll(
        //     '.focusable.cdk-global-overlay-wrapper').forEach(
        //         (ref) => ref.classList.remove('focused'));
        // wrapper.classList.add('focused');
    }
}
