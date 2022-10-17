import { Component, OnInit, Input, AfterContentInit, AfterViewInit, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { SecurityEvent } from '@app/models/securityEvent';
import * as d3 from 'd3';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { environment } from '@environments/environment';
import { SecurityEventsListComponent } from './security-events-list.component';
import { DialogWindowComponent, WinItem } from '../dialog-window/dialog-window.component';


@Component({
    selector: 'app-security-events',
    template: '',
    styleUrls: ['./security-events.component.scss']
})
export class SecurityEventsComponent implements AfterViewInit {

    @Input('SecEvt') secEvt: SecurityEvent;
    private container;

    constructor(
        private _elm: ElementRef,
        public matDialog: MatDialog,
        @Inject(DOCUMENT) private document: Document) { }

    ngAfterViewInit(): void {
        let self = this;
        this.container = d3.select(this._elm.nativeElement);
        this.container.append('div')
            .attr('class', 'circles-wrapper')
            .style('display', 'flex')
            .style('justify-content', 'center');
        this.container.select('.circles-wrapper')
            .selectAll('div')
            .data(this.secEvt.eventCodes)
            .enter()
            .append('div').attr('class', (d: any) => 'circle ' + d['event_code'])
            .text((d: any) => d['event_code'])
            .on('mouseover', function (evt, d: any) {
                let container = d3.select(document).select('body');
                container.selectAll('div.tooltip').data([1]).enter()
                    .append('div').attr('class', 'tooltip');

                container.select('div.tooltip')
                    .style('position', 'absolute')
                    .style('left', evt.clientX + 10 + 'px')
                    .style('top', evt.clientY - 20 + 'px')
                    .style('width', 'auto')
                    .style('height', 'auto')
                    .text(d['event_code'] + ": " + d['event_description'])
                    .style('opacity', 0);

                container.select('div.tooltip')
                    .transition().attr('duration', 3000)
                    .style('opacity', 0.8);
                // .call(function () {
                //     self.container.select('div.tooltip')
                //         .style('opacity', 1);
                // });
            })
            .on('mouseleave', function () {
                let container = d3.select(document).select('body');
                container.selectAll('div.tooltip').remove();
            })
            .on('click', () => self.openSecEventList.call(self));
        /*
        this.container
            .append('svg').attr('class', 'circles-wrapper')
            .attr('height', 16)
            .attr('width', 16);

        this.container.selectAll('svg.circles-wrapper')
            .data(this.secEvt.eventCodes)
            .append('circle')
            .attr('r', 7)
            .attr('cx', 8)
            .attr('cy', 8)
            .text('text', 'AC');

        this.container.selectAll('svg.circles-wrapper')
            .data(this.secEvt.eventCodes)
            .append("text")
            .attr("class", "event-text")
            .text((d: any) => d['event_code'])
            .attr('dy', 12)
            .attr('dx', 3);
        */
    }

    openSecEventList(): void {
        // const dialogConfig = new MatDialogConfig<SecurityEvent[]>();
        DialogWindowComponent.OpenSecEventList(
            this.matDialog, SecurityEventsListComponent, [this.secEvt]);

    }
}
