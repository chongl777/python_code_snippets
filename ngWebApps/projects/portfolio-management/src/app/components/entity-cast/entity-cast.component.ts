import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as d3 from 'd3';
import { utils } from 'shared-library';

import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { SecurityService } from '@app/services/security.service';
import { TreeChartComponent } from '@app/components/tree-chart/tree-chart.component';
import * as treeChart from '@app/components/tree-chart/tree-chart.component';


@Component({
    selector: 'app-entity-cast',
    templateUrl: './entity-cast.component.html',
    styleUrls: ['./entity-cast.component.scss']
})
export class EntityCastComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public selectedSecurity: Security;
    public errMsg: string = '';
    public companyCast = {};
    public data = {};
    public dataSource: BehaviorSubject<any> = new BehaviorSubject(null);
    private subscription = new Subscription();
    @ViewChild('treeChart', { read: ElementRef }) treeChart: ElementRef;

    tooltipDisplay = (d: any) => {
        return "<tr><td>CompanyID:</td><td>" + d.data.id + "</td></tr>\
                   <tr><td>CompanyName:</td><td>"+ d.data.name + "</td></tr>";
    };

    html = `
      <defs>
        <pattern id="current_company_pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">          <rect width="4" height="8" transform="translate(0,0)" class='primary'></rect>
          <rect width="8" height="8" transform="translate(4,0)rotate(0)" class='alter'></rect>
        </pattern>
        <pattern id="current_select_company_pattern" width="8" height="8" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <rect width="4" height="8" transform="translate(0,0)" class='primary'></rect>
          <rect width="8" height="8" transform="translate(4,0)rotate(0)" class='alter'></rect>
        </pattern>
      </defs>
    `;

    clickNodes = (div: SVGElement, svg: TreeChartComponent, d: treeChart.HierarchyPointNode<treeChart.Datum>) => {
        // let self = this;
        d3.select(svg._elm.nativeElement).selectAll('g.node rect').classed('selected', false);
        d3.select(div).classed('selected', true);
        this.evt.filterCompany$.next(d.data.id);
    };

    constructor(
        private securityDataSvs: SecurityService,
        private evt: EventService,
        private _cdr: ChangeDetectorRef,
    ) {
    }

    ngOnInit(): void {
        this.subscription.add(this.evt.selectSecurity$.subscribe(
            async (sid: number) => {
                if (sid != null) {
                    try {
                        this.loading$.next(true);
                        this._cdr.detectChanges();
                        let selectedSecurity = await this.securityDataSvs.getSecurityData(sid);
                        this.companyCast = await this.securityDataSvs.getEntityCast(selectedSecurity.ultimateParentID)

                        this.loading$.next(false);
                        this.dataSource.next(this.companyCast);
                        this._cdr.detectChanges();
                        this.highlightSelectedCompany([selectedSecurity.companyID])
                        //setTimeout(() => this.highlightSelectedCompany([selectedSecurity.companyID]), 1000);
                    } catch (err) {
                        this.loading$.next(false);
                        this.errMsg = utils.errMsg(err);
                    }
                }
            }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    highlightSelectedCompany(companyIDs: number[]) {
        this.treeChart.nativeElement.querySelectorAll('g.nodes-group g.node rect').forEach((x: any) => {
            x.classList.remove('current-company');
        });

        companyIDs.forEach(cid => {
            this.treeChart.nativeElement.querySelector(
                'g.nodes-group g.company-' + cid + ' rect')?.classList.add('current-company');
            // document.querySelector(
            //     'g.nodes-group g.company-' + cid)?.classList.add('current-company');
        });
    }

}
