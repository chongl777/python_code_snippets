import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription, fromEvent } from 'rxjs';
import * as d3 from 'd3';
import { v4 as uuid } from 'uuid';
import { debounceTime } from 'rxjs/operators';

type AxisDomain = Date | number | { valueOf(): number };
type Datum = {
    index: number, axis: string,
    value: number, i: string, j: number, n: number
};
export type LinesConfig = {
    klass: string, field: (string | number), axis: string,
    show_tooltip?: boolean, sort?: boolean,
    color: string, tag?: { data: any },
};
type TagsConfig = { field: string | number, axis: string, klass: string };
type YAxisConfig = {
    fields: (string | number)[],
    tags_fields?: (string | number)[],
    fmt: (x: number) => string,
    text: string,
    anchor: string,
    domain_margin: number,
    ticketSizeInner: () => number,
    ticketSizeOuter: () => number,
    tooltipfmt: (x: number) => string,
    scale: any,
    transform: any,
    pos: () => number,
};

export type NaviConfig = {
    index: string | number,
    field: string | number,
    fmt: any,
    tooltipfmt: any,
    domainfmt: any,
    scale: any,
}


@Component({
    selector: 'app-plot-chart',
    templateUrl: './plot-chart.component.html',
    styleUrls: ['./plot-chart.component.scss', './plot-chart.color.scss']
})
export class PlotChartComponent implements OnInit, AfterViewInit {
    @ViewChild('plotArea', { static: true }) _elmPlot: ElementRef;
    @ViewChild('tooltip') _elmTooltip: ElementRef;

    @Input('lines') set lines(x) {
        this._lines = x;
        this.updateConfig();
    }
    get lines(): LinesConfig[] {
        return this._lines;
    };

    _tags: TagsConfig[];
    @Input('tags') set tags(x: TagsConfig[]) {
        this._tags = x;
        this.updateConfig();
    }

    get tags(): TagsConfig[] {
        return this._tags;
    };

    get legends(): any[] {
        return this.lines.filter(x => x.show_tooltip);
    }

    reSizeEvt$ = fromEvent(window, 'resize')
        .pipe(
            debounceTime(500),
        );

    _lines: LinesConfig[];

    @Input('dataSource') dataSource: BehaviorSubject<any>;
    @Input('updateOnResize') updateOnResize = true;

    @Input('config') config = {
        index: [],
        navBarHeight: 40,
        dursec: 2,
        margin: {
            left: 10,
            right: 10,
            top: 17,
            bottom: 10,
            navTop: 5,
            navBottom: 10,
        }
    }

    @Input('navigator') navigator: NaviConfig = {
        index: 't_date',
        field: 'bond_px',
        fmt: d3.timeFormat("%b '%y"),
        tooltipfmt: d3.timeFormat('%Y-%m-%d'),
        domainfmt: d3.timeFormat('%Y-%m-%d'),
        scale: d3.scaleTime()
    }

    @Input('xaxis') xaxis = {
        field: 't_date',
        transform: null,
        fmt: d3.timeFormat('%m/%Y'),
        tooltipfmt: (x) => { return d3.timeFormat('%m/%d/%Y')(x) },
        scale: d3.scaleTime()
    }

    _yaxis: { [axisName: string]: YAxisConfig } = {
        yaxis1: {
            fields: [],
            fmt: (x) => { return d3.format(',.2f')(x) },
            text: 'eq_px',
            anchor: 'right',
            ticketSizeInner: () => { return 5 },
            ticketSizeOuter: () => 0,
            domain_margin: 0.2,
            tooltipfmt: (x) => { return d3.format(',.2f')(x) },
            scale: d3.scaleLinear(),
            transform: null,
            pos: () => { return this.plotWidth },
        }
    };

    @Input('yaxes') set yaxes(x: { [axisName: string]: YAxisConfig }) {
        this._yaxis = x;
        this.updateConfig();
    }

    get yaxes(): { [axisName: string]: YAxisConfig } {
        return this._yaxis
    }

    x_axis: d3.Axis<AxisDomain>;
    y_axis: d3.Axis<AxisDomain>;

    xStart: Date | number;
    xEnd: Date | number;

    plotWidth: number;
    plotHeight: number;
    totalHeight: number;
    totalWidth: number;
    public svg: any;

    private subscription = new Subscription();
    private brush: any = null;
    private selection: any;

    public data: any;

    constructor(
        private cdf: ChangeDetectorRef,
    ) {
    }

    ngOnInit(): void {
        this.svg = d3.select(this._elmPlot.nativeElement);
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    ngAfterViewInit(): void {
        this.initPlot();
        this.subscription.add(
            this.dataSource.subscribe((data) => {
                if (data == null) {
                    return;
                }
                this.data = data;
                this.updateData();
                this.cdf.detectChanges();
            }));

        this.subscription.add(
            this.updateOnResize && this.reSizeEvt$.subscribe(() => {
                this.updateSize();
            }));
    }

    initPlot() {
        if (this.svg == null) return;

        this.svg
            .select("svg.main-chart").html("");
        this.svg
            .select("svg.navi-chart").html("");
        this.svg
            .select("div.tooltip").html("");
        this.svg
            .select("svg.main-chart")
            .selectAll("g.canvas-main").data([1]).enter()
            .append('g').attr("class", "canvas-main");

        this.addMainAxis();
        this.addMainPanel();

        this.addNaviChart();
        this.addTooltip();
        this.updateSize(false);
    }

    updateConfig() {
        this.yaxes && Object.values(this.yaxes).forEach(x => {
            x['fields'] = [];
        });

        this.yaxes && Object.values(this.yaxes).forEach(x => {
            x['tags_fields'] = [];
        });

        this.lines && this.lines.forEach((p) => {
            this.yaxes[p.axis] && this.yaxes[p.axis].fields.push(p.field);
        });

        this.tags && this.tags.forEach((p) => {
            this.yaxes[p.axis] && this.yaxes[p.axis].tags_fields.push(p.field);
        });

        this.initPlot();
    }

    updateSize(updateData = true) {
        let config = this.config;
        this.totalHeight = this._elmPlot.nativeElement.offsetHeight;
        this.totalWidth = this._elmPlot.nativeElement.offsetWidth;

        this.plotHeight = this.totalHeight -
            (this.config.margin.top + this.config.margin.bottom) -
            (this.config.margin.navTop + this.config.margin.navBottom) -
            config.navBarHeight - 5;

        this.plotWidth = this.totalWidth -
            this.config.margin.left - this.config.margin.right;

        // console.log('plotWidth:' + this.plotWidth + ", plotHeight:" + this.plotHeight);

        let _elm = this._elmPlot.nativeElement;
        d3.select(_elm).select('.main-chart')
            .attr('height', this.plotHeight + this.config.margin.top + this.config.margin.bottom)
            .attr('width', this.plotWidth + this.config.margin.left + this.config.margin.right);
        d3.select(_elm).select('.navi-chart')
            .attr('height', config.navBarHeight + this.config.margin.navTop + this.config.margin.navBottom)
            .attr('width', this.plotWidth + this.config.margin.left + this.config.margin.right);

        this.xaxis.scale.range([0, this.plotWidth]);
        this.x_axis = d3.axisBottom(this.xaxis.scale)
            .ticks(5)
            .tickSizeInner(-this.plotHeight)
            .tickSizeOuter(0)
            .tickFormat(this.xaxis.fmt);

        let svg = this.svg.select("g.canvas-main");
        svg.select('.x.axis')
            .attr('transform', 'translate(0,' + this.plotHeight + ')');

        for (let y_key of Object.keys(this.yaxes)) {
            let axis = this.yaxes[y_key];
            svg.select('.' + y_key + '.axis.yaxis')
                .attr('transform', 'translate(' + (axis.pos.call(this) || 0) + ', 0)');
            axis.scale.range([this.plotHeight, 0])
            let y_axis = (axis.anchor == 'left' ? d3.axisRight(axis.scale) : d3.axisLeft(axis.scale))
                .ticks(8)
                .tickFormat(axis.fmt)
                .tickSizeInner(axis.ticketSizeInner.call(this))
                .tickSizeOuter(axis.ticketSizeOuter.call(this));

            axis.transform = ((y_axis, y_key, axis) => {
                let axis_adj = (x) => {
                    y_axis(x);
                    x.selectAll('.' + y_key + '.axis.yaxis .tick text')
                        .attr('class', axis.anchor + '-yaxis-text')
                        .attr('x', axis.anchor == 'left' ? 5 : -5)
                        .attr('y', '-5')
                        .attr("xml:space", "preserve");
                }
                (axis_adj as any).scale = (x) => { y_axis.scale(x) };
                return axis_adj;
            })(y_axis, y_key, axis);
        }

        // d3.select(_elm).select('svg.main-chart')
        //     .select('#plot-area')
        //     .attr('width', this.plotWidth);
        d3.select(_elm).select('clipPath rect')
            .attr('width', this.plotWidth)
            .attr('height', this.plotHeight);

        d3.select(_elm).select("g#plot-area")
            .select('rect.plot-area')
            .attr('width', this.plotWidth)
            .attr('height', this.plotHeight);

        if (updateData) {
            this.updateNaviChart();
        }
    }

    updateData() {
        this.updateNaviChart();
    }

    setXaxisStartEnd(start: Date | number, end: Date | number) {
        this.xStart = start;
        this.xEnd = end;
        this.selection = [this.xStart, this.xEnd];
    }

    addMainPanel() {
        // svg main object
        let _elm = this._elmPlot.nativeElement;
        var guid = uuid();
        this.svg.select("g.canvas-main")
            .attr("transform", "translate(" + this.config.margin.left + ", " + (+this.config.margin.top) + ")")
            .append('g').attr('clip-path', 'url(#plotAreaClip-' + guid + ')')
            .attr('id', 'plot-area').on('click', function () {
                d3.select(_elm).selectAll('div.tooltip-tag').style('display', 'none');
            });

        // clip plot area
        d3.select(_elm).select("g#plot-area")
            .selectAll('clipPath').data([1]).enter()
            .append('clipPath').attr('id', 'plotAreaClip-' + guid)
            .append('rect')
            .attr('z-index', 10);

        d3.select(_elm).select("g#plot-area")
            .selectAll('rect.plot-area').data([1])
            .enter().append('rect').attr('class', 'plot-area')
            .attr('opacity', 0);
    }

    addMainAxis() {
        let svg = this.svg.select("g.canvas-main");

        // // x axis
        this.x_axis = d3.axisBottom(this.xaxis.scale)
            .ticks(5)
            .tickSizeOuter(0)
            .tickFormat(this.xaxis.fmt);

        svg.selectAll('.x.axis')
            .data([1]).enter().append('g').attr('class', 'x axis');

        // y axis
        for (let y_key of Object.keys(this.yaxes)) {
            let axis = this.yaxes[y_key];
            svg.selectAll('.' + y_key + '.axis.yaxis')
                .data([1]).enter().append('g')
                .attr('class', y_key + ' axis yaxis')
                .append('text')
                .attr('class', 'axis-name')
                .attr('y', '-10')
                .html(axis.text);
        }
    }

    addNaviChart() {
        d3.select(this._elmPlot.nativeElement)
            .select("svg.navi-chart")
            .attr("transform", "translate(" + this.config.margin.left +
                ", " + this.config.margin.navTop + ")");

        let svg = d3.select(this._elmPlot.nativeElement).select("svg.navi-chart");
        svg.selectAll('g.x.axis')
            .data([1]).enter()
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + (this.config.navBarHeight + this.config.margin.navTop) + ')');

        svg.select('g.axis')
            .selectAll('line.upper-line')
            .data([1]).enter()
            .append("line").attr("class", "upper-line")
            .attr('transform', 'translate(0,' + -this.config.navBarHeight + ')');
    }

    updateNaviChart() {
        // svg navigative object
        if (this.data == null) {
            return;
        }
        let data = this.data;
        let dursec = this.config.dursec;
        let navi_index = this.navigator.index;
        let navi_field = this.navigator.field;

        let svg = d3.select(this._elmPlot.nativeElement).select("svg.navi-chart");

        let navi = data[navi_index];
        let x_range = d3.extent<number>(navi);

        let navXScale = this.navigator.scale
            .range([0, this.plotWidth])
            .domain(x_range);

        let navXAxis = d3.axisBottom(navXScale)
            .ticks(5)
            .tickSizeInner(-this.config.navBarHeight)
            .tickSizeOuter(-this.config.navBarHeight)
            .tickFormat(this.navigator.fmt);

        let navXAxisAdj = (x) => {
            navXAxis(x);
            x.selectAll('.x.axis .tick text')
                .attr('x', 20).attr('y', -10);
        }

        svg.selectAll('g.x.axis').call(navXAxisAdj);

        svg.select('g.axis')
            .select('line.upper-line')
            .attr("x2", this.plotWidth);

        // plot area if possible
        if (this.navigator.index != null) {
            let lineData = data[navi_index].map((p: any, i: number) => {
                return {
                    index: p,
                    value: data[navi_field][i]
                }
            }).filter((x: any) => x.value != null);

            let y_range = d3.extent<number>(data[navi_field]);
            let navYScale = d3.scaleLinear()
                .range([this.config.navBarHeight, 0])
                .domain(d3.extent<number>(y_range));
            let navArea = d3.area()
                .x((d: any) => {
                    return navXScale(d.index);
                })
                .y0(this.config.navBarHeight)
                .y1((d: any) => {
                    return navYScale(d.value);
                });
            svg.selectAll('.area-wrap').data([1]).enter()
                .append('g').attr("class", "area-wrap")
                .attr('transform', 'translate(0,' + this.config.margin.navTop + ')');

            let navAreas = svg.select('g.area-wrap')
                .selectAll('.area').data([lineData])
            navAreas.transition().attr('duration', dursec).attr("d", navArea);
            navAreas.enter()
                .append("path")
                //.attr("class", function (p, i) { return 'area port' })
                .attr("class", 'area plot color1')
                .attr("d", navArea);
        }

        this.brush = d3.brushX()
            .extent([
                [0, this.config.margin.navTop],
                [this.plotWidth, this.config.navBarHeight + this.config.margin.navTop]])
            .on(
                "brush end",
                // "end",
                ($event) => {
                    this.brushed($event, data)
                });

        svg.selectAll('g.brush').data([1]).enter().append("g")
            .attr("class", "x brush");

        this.drawBrush(this.xStart, this.xEnd);
    }

    zoom(timeframe: string) {
        let index = this.data[this.navigator.index];
        this.xEnd = index[index.length - 1];
        if (timeframe == '1d') {
            this.xStart = this.xStart = new Date(this.xEnd);
            this.xStart.setDate((this.xEnd as any).getDate() - 1);
        } else if (timeframe == 'mtd') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setDate(0);
        } else if (timeframe == '1m') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setMonth((this.xEnd as any).getMonth() - 1);
        } else if (timeframe == '3m') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setMonth((this.xEnd as any).getMonth() - 3);
        } else if (timeframe == '6m') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setMonth((this.xEnd as any).getMonth() - 6);
        } else if (timeframe == 'ytd') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setMonth(0);
            this.xStart.setDate(0);
        } else if (timeframe == '1y') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setFullYear((this.xEnd as any).getFullYear() - 1);
        } else if (timeframe == '3y') {
            this.xStart = new Date(this.xEnd);
            this.xStart.setFullYear((this.xEnd as any).getFullYear() - 3);
        }

        this.selection = [this.xStart, this.xEnd]

        this.drawBrush(this.xStart, this.xEnd);
    }

    drawBrush(start: any, end: any) {
        let svg = this.svg.select("svg.navi-chart");
        let view_brush = svg.selectAll('g.brush').call(this.brush);
        let range = null;
        if ((start && end) != null) {
            range = [
                this.navigator.scale(start),
                this.navigator.scale(end)]
        }
        view_brush.call(this.brush.move, this.selection && range).transition().delay(50);
    }

    brushed($event: any, data: any) {
        let start: Date | number, end: Date | number;
        this.selection = $event.selection;

        this.config.index = data[this.navigator.index];
        [start, end] = this.selection == null ? this.navigator.scale.domain() :
            d3.extent<Date | number>(this.selection.map(this.navigator.scale.invert));

        // adjust start, end
        let startAdj: number | Date;
        let endAdj: number | Date;
        let pos_i: number;
        let pos_j: number;
        [startAdj, endAdj, pos_i, pos_j] = adjustedDomain(this.config.index, start, end);

        this.xStart = startAdj;
        this.xEnd = endAdj;

        // if (selection != null) {
        //     this.xStart = startAdj;
        //     this.xEnd = endAdj;
        // } else {
        //     this.xStart = null;
        //     this.xEnd = null;
        // }

        this.updateAxis(startAdj, endAdj);

        this.updateLines(data);
        this.updateTags(data);

        // this.update_fitcurve(self, data, start, end);
        // this.update_bars(self, data, start, end);
        // this.update_scatter(self, data, start, end);
        // update_areas(self, data, start, end);
    }

    updateAxis(start: AxisDomain, end: AxisDomain) {
        let svg = this.svg.select('.canvas-main');
        let dursec = this.config.dursec;
        let data = this.data;

        // x -- axis
        var navi = data[this.navigator.index];
        var index = data[this.xaxis.field];
        var xDomain = RangeDomain(index, navi, start, end);
        this.xaxis.scale.domain(xDomain);
        this.x_axis.scale(this.xaxis.scale);

        svg.select('.x.axis').transition()
            .attr('duration', dursec).call(this.x_axis);

        // y-axis
        for (let y_key of Object.keys(this.yaxes)) {
            let axis = this.yaxes[y_key];
            let yData = getSubset(axis.fields, this.data);
            let yDomain = DataTransform(yData, navi, start, end)[1];

            for (let tags_field of axis.tags_fields) {
                let yTagValue = this.data[tags_field]
                    .filter(x => {
                        return (x.index >= start) && (x.index <= end)
                    })
                    .map(x => x.value);
                yDomain = d3.extent(yDomain.concat(yTagValue));
            }

            axis.scale.domain(adjDomain(yDomain, axis.domain_margin));

            svg.select('.' + y_key + '.axis')
                .call(axis.transform);
            //.transition()
            //.attr('duration', dursec)
        }
    }

    updateTags(data: any) {
        let self = this;
        let dursec = this.config.dursec;
        let svg = this.svg.select("g#plot-area")
        let fields = this.tags.map(function (x) { return x.field });
        let tagsData = getSubset(fields, data);

        let tags = svg.selectAll('.tags-wrap').data(tagsData);
        tags.exit().remove();

        tags.each(function (data_tags: Datum[], i: number) {
            data_tags = data_tags.filter(x => x.value);
            let tags = d3.select(this).selectAll('.tag').data(data_tags);
            tags.transition()
                .attr('duration', dursec)
                .attr(
                    'transform',
                    function (d: Datum) {
                        return 'translate(' + (self.xaxis.scale(d.index) || 0) + ',' +
                            (self.yaxes[self.tags[i].axis].scale(d.value) || 0) + ")"
                    });
            tags = d3.select(this).selectAll('.tag').data(data_tags);
            tags.exit().remove()
        });

        tags.enter()
            .each(function (data_tags: Datum[], i: number) {
                data_tags = data_tags.filter(x => x.value);
                let tag_wrap = d3.select(this)
                    .append('g').attr("class", "tags-wrap " + self.tags[i].klass);

                let tags = tag_wrap.selectAll('.tag').data(data_tags);
                tags.enter().append("g")
                    .attr("class", "tag")
                    .attr('transform',
                        function (d: Datum) {
                            return 'translate(' + (self.xaxis.scale(d.index) || 0) + ',' +
                                (self.yaxes[self.tags[i].axis].scale(d.value) || 0) + ")"
                        })
                    .each(function (d: any, i: number) { drawTag.call(this, self, d, i) });
                tags = tag_wrap.selectAll('.tag').data(data_tags);
                tags.exit().remove();
            });
    }


    updateLines(data: any) {
        let self = this;
        let dursec = this.config.dursec;
        let svg = this.svg.select("g#plot-area")
        let index = data[this.xaxis.field];
        let navi = data[this.navigator.index]

        let fields = this.lines.map(function (x) { return x.field });
        let axes = this.lines.map(function (x) { return x.axis });
        let sort = this.lines.map(function (x) { return x.sort || false });

        let lineData = getSubset(fields, data);
        let dataTrans = PruneData(
            DataTransform(lineData, navi, this.xStart, this.xEnd)[0], index, navi, axes);
        dataTrans = dataTrans.map((d, i) => {
            if (sort[i]) {
                return d.sort((a, b) => { return a.index - b.index; })
            } else {
                return d;
            }
        })

        let line = d3.line<Datum>()
            .x((d: Datum, i: number) => {
                return this.xaxis.scale(d.index);
            })
            .y((d: Datum) => {
                return this.yaxes[d.axis].scale(d.value);
            });

        let lines = svg.selectAll('.line-wrap').data(dataTrans);

        lines.each(function (line_data: Datum[], i: number) {
            line_data = line_data.filter(x => x.value);
            d3.select(this)
                .attr('class', "line-wrap " + self.lines[i].klass)
                .select('path.line')
                .attr("class", function () {
                    return "line " + self.lines[i].field;
                })
                .transition().attr('duration', dursec)
                .attr("d", line(line_data));
        });

        lines.exit().remove();
        lines.enter()
            .each(function (line_data: Datum[], i: number) {
                line_data = line_data.filter(x => x.value);
                let crr_line_wrap = d3.select(this)
                    .append('g').attr("class", "line-wrap " + self.lines[i].klass);

                crr_line_wrap.append("path")
                    .attr("class", (p, _i) => {
                        return "line " + self.lines[i].field;
                    })
                    .attr("d", line)
                    .style('fill', 'none')
                    .style('stroke', (p, _i) => { return self.lines[i].color });
            });
    }


    addTooltip() {
        // add tooltip and guideline
        let self = this;
        this.svg.select('div.tooltip')
            .style('display', 'none')
            .append('table');
        var tooltipTab = this.svg.selectAll('div.tooltip table');
        var dursec = this.config.dursec;
        tooltipTab.selectAll('*').remove();
        tooltipTab.append('thead')
            .append('tr').append('th')
            .attr('colspan', 3)
            .style('margin-left', '2px')
            .style('white-space', 'nowrap')
            .style('font-weight', 'bold');

        // lines
        tooltipTab.append('tbody').attr('class', 'lines-tooltip');

        // bars
        tooltipTab.append('tbody').attr('class', 'bars-tooltip');

        // scatter
        tooltipTab.append('tbody').attr('class', 'scatter-tooltip');

        // fitcurve
        tooltipTab.append('tbody').attr('class', 'fitcurve-tooltip');
        // fitcurve
        tooltipTab.append('tbody').attr('class', 'areas-tooltip');

        let tooltip = this.svg.select('div.tooltip');
        (tooltip as any).active = false;
        this.svg.select('svg.main-chart').select("g#plot-area")
            .selectAll('g.guideline')
            .data([1]).enter()
            .insert('g', ":first-child").attr('class', 'guideline');

        let pit = this.svg.select('svg.main-chart').selectAll('g.guideline');
        let svg = this.svg.select('g.canvas-main');

        svg.on("mousemove", null).on("mouseleave", null);

        if ((this.lines.length != 0)) {
            svg.on("mousemove", ($event: any) => {
                if (this.data == null) {
                    return null;
                }

                let index = this.data[self.xaxis.field].slice()
                    .sort(function (x, y) { return x - y });
                tooltip.active = true;

                let axis = d3.pointer($event, svg);
                let plotPos = svg.select('rect.plot-area').node().getBoundingClientRect();
                let xax = axis[0] - plotPos.x;
                if (xax < 0) { return false; };
                let pivot = xAxisTrans(index, self.xaxis.scale);
                let ref_nd = referenceNode2(pivot, xax);
                xax = pivot[ref_nd];
                // guideline
                pit.selectAll('*').remove();
                pit.append('line').attr('class', 'guideline')
                    .attr('x1', xax).attr('y1', self.plotHeight)
                    .attr('x2', xax).attr('y2', 0)
                    .attr('opacity', 0.8);

                // lines tooltip
                this.addLinesTooltip(tooltip, pit, xax, ref_nd, index[ref_nd]);

                tooltip.active && this.showTooltip($event, tooltip.node());
                return true;
            }).on("mouseleave", function (d) {
                tooltip.active = false;
                pit.selectAll('*').remove();
                tooltip.transition()
                    .attr('duration', dursec)
                    .style("opacity", 0)
                    .style("display", "none")
            });
        }
    }

    addLinesTooltip(tooltip: any, pit, xax, ref_nd, indx) {
        tooltip.selectAll("thead th")
            .style('width', '100%')
            .html(this.xaxis.tooltipfmt(indx));

        let data_filtered = this.lines.filter((x) => x.show_tooltip)
        let fields = data_filtered.map(function (x) { return x.field });
        let colors = data_filtered.map(function (x) { return x.color });
        //let axis = data_filtered.map(function (x) { return x.axis });
        // data
        let datum = getSubset(fields, this.data).map((p, i) => {
            return {
                'index': indx,
                'value': p[ref_nd],
                'color': colors[i],
                'name': data_filtered[i].field,
                'axis': this.yaxes[data_filtered[i].axis]
            };
        }).filter(x => x['value'] != null);

        tooltip.select('tbody.lines-tooltip').html("");
        tooltip.select('tbody.lines-tooltip')
            .selectAll('tr.datum')
            .data(datum).enter()
            .append('tr').attr('class', 'datum');

        tooltip.select('tbody.lines-tooltip')
            .selectAll('tr.datum').data(datum)
            .each(function (d, i) {
                d3.select(this)
                    .append('td').attr('class', 'sym')
                    .append('svg')
                    .style('width', 14)
                    .style('height', 14)
                    .append('circle')
                    .attr('r', 4).attr('cx', 7)
                    .attr('cy', 7)
                    .style('fill', function (p) {
                        return d.color
                    });
                d3.select(this)
                    .append('td').attr('class', 'name')
                    .html(d.name);
                d3.select(this)
                    .append('td').attr('class', 'val')
                    .html(function (p) {
                        return d.axis.tooltipfmt(d.value);
                    });
            });

        // add circle to guideline
        pit.selectAll("circle").data(datum)
            .enter().append("circle")
            .attr("r", 4)
            .attr("class", function (d) { return d.name })
            .attr("cx", function (d) { return xax })
            .attr("cy", function (d) {
                return d.axis.scale(d.value)
            })
            .attr("opacity", 0.9)
            .style("fill", function (d) { return d.color })
    }

    showTooltip(event$: any, tooltip: HTMLElement) {
        event$.stopPropagation();
        let dursec = this.config.dursec;

        // tooltip
        d3.select(tooltip)
            .style('opacity', 0)
            .style('display', 'block');

        let shape = tooltip.getBoundingClientRect();
        //let w = tooltip.offsetWidth;
        //let h = tooltip.offsetHeight;
        let w = shape.width;
        let h = shape.height;

        let w_total = this.totalWidth;
        let h_total = this.plotHeight;

        let x = event$.offsetX;
        let y = event$.offsetY;

        let right_id = true;
        let down_id = true;

        if ((x + w) > w_total) right_id = false;
        if ((y + h + 20) > h_total) down_id = false;

        d3.select(tooltip).transition()
            .attr('duration', dursec)
            .style('opacity', 0.9)

        d3.select(tooltip)
            .style(
                "left",
                (right_id ? (event$.pageX + 10) :
                    (event$.pageX - w - 10)) + "px")
            .style("top", (down_id ? (event$.pageY + 30) :
                (event$.pageY - h - 30)) + "px")
            .style("padding-left", "0px")
            .style("padding-right", "5px")
    }
}


function fmtTagData(d: any) {
    let width = 30;
    let height = 40;
    const points_down = [
        { x: 0, y: 0 },
        { x: width / 2, y: height / 3 },
        { x: width / 2, y: height },
        { x: -width / 2, y: height },
        { x: -width / 2, y: height / 3 },
    ]
    const points_up = [
        { x: 0, y: 0 },
        { x: width / 2, y: -height / 3 },
        { x: width / 2, y: -height },
        { x: -width / 2, y: -height },
        { x: -width / 2, y: -height / 3 },
    ]
    let dir = d.dir;
    let font_text = d.title;

    function open_tooltip() {
        let rows = d.details.map((p, i) => {
            return '<tr>' +
                '<td>' + p.fund_id + '</td>' +
                '<td>' + p.trade_id + '</td>' +
                '<td>' + d3.timeFormat('%Y-%m-%d')(p.trade_dt) + '</td>' +
                '<td>' + d3.format(',.0f')(p.txn_amount) + '</td>' +
                '<td>' + p.price + '</td>' +
                '<td>' + (p.counterparty || '') + '</td>' +
                '<td>' + (p.trans_typ || '') + '</td>' +
                '</tr>';
        });
        let html = '<table><caption>Trading Records</caption>\
                   <thead><tr><th>fund</th><th>trade_id</th><th>date</th><th>quantity</th>\
                   <th>price</th><th>broker</th>\
                   <th>Type</th></tr></thead> \
                   <tbody>' + rows + '</tbody></table>';

        return html;
    }

    return {
        'points': { 'down': points_down, 'up': points_up }[dir],
        'tooltip': open_tooltip,
        'text_info': {
            font_size: 8.5,
            font_text: font_text,
            x: 0,
            y: { 'down': height / 1.5, 'up': -height / 1.5 }[dir]
        }
    };
}


function drawTag(self: any, d: any, i: number) {
    const data = fmtTagData(d);
    d3.select(this).append("polygon")
        .attr('class', d.klass)
        .attr("points", function (d) {
            return data['points'].map(function (d) {
                return [d.x, d.y].join(",")
            }).join(" ");
        });
    d3.select(this).append('text')
        .style('font-size', data['text_info']['font_size'])
        .attr('x', data['text_info']['x'])
        .attr('y', data['text_info']['y'])
        .style('text-anchor', 'middle')
        .html(data['text_info']['font_text']);
    d3.select(this).append("polygon")
        .attr('class', "tag-hover")
        .style('opacity', '0')
        .attr("points", function (d) {
            return data['points'].map(function (d) {
                return [d.x, d.y].join(",")
            }).join(" ");
        })
        .on('click', ($event) => {
            self.svg.selectAll('div.tooltip-tag')
                .data([1]).enter()
                .append('div')
                .attr('class', 'tooltip-tag')
                .style('display', 'block')
                .style('position', 'fixed');

            let tooltipTab = self.svg.select('div.tooltip-tag');
            tooltipTab.html(data.tooltip());
            self.showTooltip($event, tooltipTab.node());
        });
}



function xAxisTrans(index, scale) {
    let pivot = [];
    index.forEach(function (p, i) {
        pivot.push(scale(index[i]));
    })
    return pivot;
}


function adjustedDomain(index: any[], start, end) {
    for (var i = 0; i < index.length; i++) {
        if (index[i] >= start) {
            break;
        }
    };

    // get domain
    let j: number;
    for (j = i; j < index.length; j++) {
        if (index[j] > end)
            break;
    }

    return [index[i], index[j - 1], i, j - 1];
}



function RangeDomain(data, index, start, end): [AxisDomain, AxisDomain] {
    return d3.extent<Date | number>(sliceData(data, index, start, end));
}


function sliceData(data, index, start, end) {
    var d = 0, f = data.length - 1;
    for (var i = 0; i < data.length; i++) {
        if (index[i] <= start) {
            d = i;
        }
        if (index[i] <= end) {
            f = i + 1;
        }
    }
    return data.slice(d, f)
}


function DataTransform(data, index, start, end, norm = false) {

    let yDomain = [];
    let data_adj = Object.values(data).map((p) => {
        let d = normData(p, index, start, end, norm);
        yDomain = yDomain.concat(d.domain);
        return d.data;
    })
    let aa = d3.extent(yDomain);
    return [data_adj, d3.extent(yDomain)];
}


function getSubset(keys, obj) {
    return keys.reduce(
        (a, c) => ([...a, obj[c]]), []);
}


function normData(data, index, start, end, norm = false) {
    let refValue = 1;
    // get the reference node
    let i: number;
    for (i = 0; i < index.length; i++) {
        if (index[i] >= start) {
            if (norm) {
                refValue = data[i];
            }
            break;
        }
    };
    // get domain
    var dataAdj = [];
    for (var j = 0; j < index.length; j++) {
        try {
            dataAdj.push(data[j] && data[j] / refValue);
        } catch (err) {
            // console.log(err);
        }
    }
    j = referenceNode(index, end) + 1;
    return { 'data': dataAdj, 'domain': d3.extent(dataAdj.slice(i, j)) };
}


function referenceNode2(vec: number[], v: number): number {
    let n = vec.length;
    if (vec[0] >= v)
        return 0;
    if (vec[n - 1] <= v)
        return n - 1;
    let d1 = 0, d2 = n - 1, m = Math.floor((d2 + d1) / 2);
    do {
        if (v <= vec[m])
            d2 = m;
        else
            d1 = m;
        m = Math.floor((d2 + d1) / 2);
    } while ((d2 - d1) > 1);
    return (v - vec[d1]) / (vec[d2] - vec[d1]) > 0.5 ? d2 : d1;
}


function referenceNode(vec: number[], v: number) {
    let n = vec.length;
    if (vec[0] >= v)
        return 0;
    if (vec[n - 1] <= v)
        return n - 1;
    let d1 = 0, d2 = n - 1, m = Math.floor((d2 + d1) / 2);
    do {
        if (v <= vec[m])
            d2 = m;
        else
            d1 = m;
        m = Math.floor((d2 + d1) / 2);
    } while ((d2 - d1) > 1);
    return d1;
}


function adjDomain(domain, pct): [AxisDomain, AxisDomain] {
    domain = d3.extent(domain);
    var band = domain[1] - domain[0];
    domain[0] -= band * pct / 2;
    domain[1] += band * pct / 2;
    return domain;
}


function PruneData(
    data, index, navi, axis, trim = true) {
    let res = [];
    data.forEach((p, i) => {
        var r2 = [];
        res.push(r2);
        p.forEach((q, j) => {
            if (q || !trim) {
                r2.push(
                    {
                        value: q,
                        index: index[j],
                        navi: navi[j],
                        axis: axis[i],
                        n: p.length,
                        j: j,
                        i: i
                    });
            }
        })
    })
    return res;
}
