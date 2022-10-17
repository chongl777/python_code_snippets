import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as d3 from 'd3';

export type Datum = { name: string, textlength?: number, id: number, children: Datum[], x?: number, y?: number };

export interface HierarchyPointNode<Datum> extends d3.HierarchyPointNode<Datum> {
    textlength: number;
}


@Component({
    selector: 'app-tree-chart',
    templateUrl: './tree-chart.component.html',
    styleUrls: ['./tree-chart.component.scss']
})
export class TreeChartComponent implements OnInit {

    @Input('margins') margins = {
        left: 50,
        right: 50,
        top: 50,
        bottom: 50,
    }
    @Input('dataSource') dataSource: BehaviorSubject<any>;

    @Input('nodeSise') nodeSize = {
        width: 100,
        height: 50,
    }

    @Input('duresec') dursec: number = 0.1;
    @Input('tooltipDisplay') tooltipDisplay = (data: any) => { return "" };
    @Input('maxFont') maxFont = 11;
    @Input('clickNodes') clickNodes: (
        div: SVGElement,
        component: TreeChartComponent,
        data: d3.HierarchyPointNode<Datum>
    ) => void = (
        div: SVGElement, component: TreeChartComponent,
        data: d3.HierarchyPointNode<Datum>) => { };
    @Input('svgDefs') svgDefs: string = '';

    @ViewChild('mainFrame', { 'static': true }) _elm: ElementRef;
    rectStrokeWidth = 1;
    svgMain: any;
    svgSize: {
        width: number,
        height: number,
    }

    private subscription = new Subscription();
    public data: any;

    constructor(
        private cdf: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.svgMain = d3.select(this._elm.nativeElement).select('.tree-chart');
        this.svgMain.html(this.svgDefs);
        this.svgMain
            .append('g')
            .attr('transform',
                'translate(' + this.margins.left + ',' + this.margins.top + ')')
            .append('g').attr('class', 'nodes-group')
            .each(function () {
                d3.select(this).append('g').classed('links', true);
                d3.select(this).append('g').classed('nodes', true);
            });
        this.updateSize();
    }

    clearContent(): void {
        this.svgMain.select('.nodes-group .links').html("");
        this.svgMain.select('.nodes-group .nodes').html("");
    }

    ngAfterViewInit(): void {
        this.updateSize();
        this.subscription.add(
            this.dataSource.subscribe((data) => {
                if (data == null) {
                    return;
                }
                this.data = data;
                this.updateData();
                this.cdf.detectChanges();
            }));

        // this.subscription.add(
        //     this.updateOnResize && this.reSizeEvt$.subscribe(() => {
        //         this.updateSize();
        //     }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    updateSize() {
        this.svgSize = { height: null, width: null };
        this.svgSize.height = this._elm.nativeElement.offsetHeight;
        this.svgSize.width = this._elm.nativeElement.offsetWidth;
    }

    updateData() {
        this.clearContent();

        let self = this;
        let treeLayout = d3.tree();
        let width = this.svgSize.width - this.margins.right - this.margins.left;
        let height = this.svgSize.height - this.margins.top - this.margins.bottom;
        let root = d3.hierarchy<Datum>(this.data as any);
        treeLayout.size([width, height]);
        treeLayout(root);

        // Nodes
        let node_width = self.nodeSize.width;
        let node_height = self.nodeSize.height;
        this.svgMain.select('g.nodes').empty();
        this.svgMain.select('g.nodes')
            .selectAll('rect.node')
            .data(root.descendants())
            .enter()
            .each(function (d: d3.HierarchyPointNode<Datum>) {
                let grp = d3.select(this).append(
                    'g').classed('node nonscalable company-' + d.data['id'], true)
                    .on('mouseover mousemove', (evt$, d) => {
                        self.addTooltip(d, evt$);
                    })
                    .on('mouseout', function (evt$, d) {
                        d3.select(self._elm.nativeElement).select('div.tooltip')
                            .style('opacity', 0)
                            .style('display', 'none');
                    });
                grp.append('rect')
                    .attr('x', (d: d3.HierarchyPointNode<Datum>) => { return d.x - node_width / 2; })
                    .attr('y', (d: d3.HierarchyPointNode<Datum>) => { return d.y - node_height / 2; })
                    .attr('height', node_height)
                    .attr('width', node_width)
                    .on('click', function () {
                        self.clickNodes(this, self, d)
                    });

                grp.append('text').text(
                    function (d: d3.HierarchyPointNode<Datum>) {
                        return d.data.name;
                    })
                    .attr('x', (d: d3.HierarchyPointNode<Datum>) => { return d.x - node_width / 2; })
                    .attr('y', (d: d3.HierarchyPointNode<Datum>) => { return d.y; })
                    .style('font-size', function (d: HierarchyPointNode<Datum>) {
                        d.textlength = this.getComputedTextLength();
                        return Math.min(node_width, (node_width - 8) / d.textlength * 14,
                            self.maxFont) + "px";
                    })
                    .attr('dx', function (d) {
                        var text_width = this.getComputedTextLength();
                        return (node_width - text_width) / 2;
                    });

            });
        this.rectStrokeWidth = 1;

        // Links
        this.svgMain.select('g.links').html('');
        this.svgMain.select('g.links')
            .selectAll('line.link')
            .data(root.links())
            .enter()
            .append('line')
            .classed('link', true)
            .attr('x1', function (d: d3.HierarchyPointLink<Datum>) { return d.source.x; })
            .attr('y1', function (d: d3.HierarchyPointLink<Datum>) { return d.source.y; })
            .attr('x2', function (d: d3.HierarchyPointLink<Datum>) { return d.target.x; })
            .attr('y2', function (d: d3.HierarchyPointLink<Datum>) { return d.target.y; });

        let zoomListener = d3.zoom().scaleExtent([0.5, 5]).on(
            "zoom", (evt$) => this.onZoom.call(this, evt$, root));
        this.svgMain.call(zoomListener);
        this.svgMain.on('dblclick.zoom', reset);

        function reset() {
            zoomListener.transform(self.svgMain, d3.zoomIdentity);
        }

    }

    onZoom(event$: any, root: d3.HierarchyPointNode<Datum>) {
        let svgGroup = this.svgMain.select('svg .nodes-group');
        let node_width = this.nodeSize.width;
        let node_height = this.nodeSize.height;
        let self = this;

        svgGroup.attr("transform", "translate(" +
            event$.transform.x + "," + event$.transform.y +
            ")scale(" + event$.transform.k + ")");
        this.svgMain.selectAll('g.nonscalable')
            .data(root.descendants())
            .each(function (d: any) {
                let scale = Math.max(event$.transform.k / (1.5 - 0.5 / event$.transform.k), 1);
                d3.select(this).select('rect')
                    .attr('x', function (d: d3.HierarchyPointNode<Datum>) { return d.x - node_width / 2 / scale; })
                    .attr('y', function (d: d3.HierarchyPointNode<Datum>) { return d.y - node_height / 2 / scale; })
                    .attr('height', node_height / scale)
                    .attr('width', node_width / scale)
                    .style('stroke-width', this.rectStrokeWidth / scale);
                d3.select(this).select('text')
                    .attr('x', function (d: d3.HierarchyPointNode<Datum>) { return d.x - node_width / 2 / scale; })
                    .attr('y', function (d: d3.HierarchyPointNode<Datum>) { return d.y; })
                    .style('font-size', function (d: HierarchyPointNode<Datum>) {
                        return Math.min(
                            node_width,
                            (node_width - 8) / d.textlength * 14, self.maxFont) / scale + "px";
                    })
                    .attr('dx', function (d) {
                        var text_width = (this as SVGTextContentElement).getComputedTextLength();
                        return (node_width / scale - text_width) / 2;
                    });
            });
    }



    addTooltip(data: any, event$: any) {
        // event$.stopPropagation();
        // add tooltip and guideline
        d3.select(this._elm.nativeElement).selectAll('div.tooltip')
            .data([1]).enter()
            .append('div')
            .classed('tooltip', true).style('display', 'none')
            .append('table')
        let tooltip = d3.select(this._elm.nativeElement).selectAll('div.tooltip');
        let tooltipTab = d3.select(this._elm.nativeElement).selectAll('div.tooltip table');
        let dursec = this.dursec;
        tooltipTab.selectAll('*').remove();
        // data
        tooltipTab.append('tbody')
            .html(this.tooltipDisplay(data));

        let shape = (tooltip.node() as HTMLElement).getBoundingClientRect();
        let w = shape.width;
        let h = shape.height;

        let w_total = this.svgSize.width;
        let h_total = this.svgSize.height;

        let x = event$.offsetX + 5;
        let y = event$.offsetY - this.margins.top;

        let right_id = !((x + w) > w_total);
        let down_id = ((y - h - 20) < 0);

        tooltip
            .style("left", (right_id ? (x + 10) : (x - w - 20)) + "px")
            .style("top", (down_id ? (y + h + 20) : (y + 0)) + "px")
        tooltip
            .style('display', 'block')
            .transition()
            .style('opacity', 0.99);

    }

}
