(function($){
    $.fn.init_time_line = function(dursec=2) {
        this.each(function(i, div) {
            init_time_line(div, dursec);
        })
        return this;
    };

    var init_time_line = function(self, dursec) {
        $(self).addClass('wfi-time-line')
            .append('<div id="div-time-line"></div>');
        $(self).css('display', 'flex').css('flex-direction', 'column');

        // DOM element where the Timeline will be attached
        //var container = $("sec-time-line", self);
        var container = $("#div-time-line", self).css(
            'width', '100%')[0];

        /*
        var item = new vis.DataSet();
        var options = {};
        self.timeline = new vis.Timeline(container, item, options);
         */

        // create naviagtion bar
        d3.select(self)
            .selectAll("svg.chart-navigator")
            .data([1]).enter()
            .append("svg")
            .attr("class", "chart-navigator")
            .attr("width", $(self).width())
            .attr("height", '40px')
            .append('g').attr("class", "canvas-navigator")
            .attr("transform", "translate(0, 0)")

        self.update = update;
        self.updateWithData = updateWithData;

        return this;
    };

    /*
    var updateWithData = function(data) {
        self = this;
        self.timeline.fit();
        self.timeline.redraw();

        var item = self.timeline.itemsData;
        //var item = self.item;
        item.clear();
        self.timeline.fit();
        self.timeline.redraw();
        item.add(data);

        // self.timeline.setData(data);
        // timeline.getDataRange();
        // var timeline = new vis.Timeline($("#div-time-line")[0], new vis.DataSet(data), {});
        // timeline.fit();
        // timeline.redraw();

        self.timeline.fit();
        self.timeline.redraw();
        //var item = self.timeline;
    };
     */

    var updateWithData = function(data, grps) {
        self = this;
        var container = $("#div-time-line", self);
        container.empty();
        var items = new vis.DataSet(data);
        var groups = new vis.DataSet(grps);
        var options = {
            clickToUse: true,
            stack: true,
            stackSubgroups: true,
            margin: {
                item : {
                    horizontal : 0
                }
            },
            onInitialDrawComplete: function() {
                console.log('Timeline initial draw completed');
            }};
        var timeline = new vis.Timeline(container[0], items, groups, options);

        $('.vis-timeline', container).css('visibility', 'visible');
        timeline.fit();
        // change background
        var clrs = d3.scaleOrdinal(d3.schemeCategory10);
        d3.select(container[0]).selectAll('.bg.subgrp')
            .style('background-color', function(p, i) {
                return hexToRgb(clrs(i), 0.2);});

        var x_range = [timeline.getDataRange().min, timeline.getDataRange().max];
        // var [minDt, maxDt] = max_range(x_range);
        var [minDt, maxDt] = x_range;
        //minDt.setDate(minDt);
        //maxDt.setDate(maxDt);
        timeline.setOptions({min: minDt, max: maxDt});
        //timeline.on('rangechanged', rangechange);

        /* -------------------------------
         navigation chart
         -------------------------------*/
        var svg = d3.select(self).select('svg.chart-navigator');
        var x = d3.scaleTime()
                .range([0, $(self).width()])
                .domain(d3.extent(x_range));

        var naviH = parseInt(svg.attr("height"));
        var xaxis = d3.svg.axis()
                .scale(x)
                .orient("bottom").ticks(5)
                .tickSizeInner(-naviH)
                .tickSizeOuter(-naviH)
                .tickFormat(d3.timeFormat("%b '%y"));
        var xaxisAdj = function(x) {
            xaxis(x);
            x.selectAll('.x.axis .tick text')
                .attr('x', 20).attr('y', -10);
        }
        svg.selectAll('g.x.axis').data([1]).enter()
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + naviH + ')');
        svg.selectAll('g.x.axis').call(xaxisAdj);

        // brush
        var brush = d3.brush()
                .x(x)
                .on("brush", brushed);

        var view = svg.selectAll('g.brush').data([1]);
        brush.clear();
        view.enter().append("g")
            .attr("class", "x brush")
            .call(brush).selectAll("rect")
            .attr("height", naviH);
        view.call(brush);
        //brush.event(svg.select('g.x.brush'));

        /* --------------------------------
         inner function
         --------------------------------*/
        // brushed
        function brushed() {
            var range = brush.empty()? x.domain() : brush.extent();
            var [start, end] = range;
            timeline.setWindow(start, end);
            timeline.redraw();
        };

        function rangechange(prop) {
            brush.extent(prop.start, prop.end);
            //brush(d3.select(self).select(".brush").transition());
            brush(d3.select(self).select("g.x.brush"));
            //brush.event(d3.select(".brush").transition().delay(50));
        };
    };

    var update = function(server_url) {
        var widget = this;
        var groups = [
            {id: 'g1', content: 'document',
             subgroupStack: {'research': true, 'restructure': true, 'news': true},
             subgroupOrder: function (a,b) {return a.subgroupOrder - b.subgroupOrder;}},
            {id: 'g2', content: 'holding period', subgroupOrder: 'subgroupOrder',
             subgroupStack: {'1': true, '2': true}}
        ];

        var data = [
            {id: 0, content: 'item 5', start: '2014-03-25', group: 'g1', subgroup: 'research'},
            {id: 1, content: 'item 1', start: '2014-04-20', group: 'g1', subgroup: 'news'},
            {id: 2, content: 'item 2', start: '2014-04-14', group: 'g1', subgroup: 'restructure'},
            {id: 3, content: 'item 3', start: '2014-04-18', group: 'g1', subgroup: 'restructure'},
            {id: 6, content: 'item 34kdkdfn', start: '2014-04-17', group: 'g1', subgroup: 'restructure'},
            {id: 4, content: 'item 4', start: '2014-04-16', end: '2014-04-19',
             group: 'g2', subgroup: '1'},
            {id: 5, content: 'item 6', start: '2014-05-16', end: '2014-06-19',
             group: 'g2', subgroup: '2'}
        ];

        var gbdata = createSubgrpBg(data);
        data = data.concat(gbdata);


        /*
        var bgdata = [
            {id: 'A', content: 'research', start: '2014-03-25', end: '2015-01-01',
             type: 'background', group: 'g1', subgroup: 'research', className: 'bg subgrp'},
            {id: 'B', content: 'news', start: '2014-03-25', end: '2015-01-01',
             type: 'background', group: 'g1', subgroup: 'news', className: 'bg subgrp'},
            {id: 'C', content: 'restructure', start: '2014-03-25', end: '2015-01-01',
             type: 'background', group: 'g1', subgroup: 'restructure', className: 'bg subgrp'},
        ];

        groups = [{
            id: 'bar', content:'bar', subgroupOrder: function (a,b) {return a.subgroupOrder - b.subgroupOrder;}, subgroupStack: {'sg_1': false, 'sg_2': false, 'sg_3': false }
        },{
            id: 'foo', content:'foo', subgroupOrder: 'subgroupOrder', subgroupStack: {'sg_22': true, 'sg_21': true} // this group has no subgroups but this would be the other method to do the sorting.
        }];

        data = [
            {id: 'A',start: '2014-01-10', end: '2014-02-12', type: 'background', group:'foo', className: 'positive', subgroup: 'sg_22'},
            {id: 'B',start: '2014-01-22', end: '2014-02-23', type: 'background', group:'foo', className: 'negative', subgroup: 'sg_21'},
            {id: 0, content: 'no subgroup1', start: '2014-01-20', end: '2014-01-22',group:'foo', subgroup: 'sg_21'},
		        {id: 7, content: 'no subgroup2', start: '2014-01-20', end: '2014-01-22',group:'foo', subgroup: 'sg_22'},

            {id: 'SG_1_1',start: '2014-01-25', end: '2014-01-27', type: 'background', group:'bar', subgroup:'sg_1', subgroupOrder:0},
            {id: 'SG_1_2', start: '2014-01-26', end: '2014-01-27', type: 'background', className: 'positive',group:'bar', subgroup:'sg_1', subgroupOrder:0},
            {id: 1, content: 'subgroup0_1', start: '2014-01-23T12:00:00', end: '2014-01-26T12:00:00',group:'bar', subgroup:'sg_1', subgroupOrder:0},
            {id: 2, content: 'subgroup0_2', start: '2014-01-22T12:00:01', end: '2014-01-25T12:00:00',group:'bar', subgroup:'sg_1', subgroupOrder:0},

            {id: 'SG_2_1', start: '2014-02-01', end: '2014-02-02', content: 'SG_2_1', type: 'background', group:'bar', subgroup:'sg_2', subgroupOrder:1},
            {id: 'SG_2_2', start: '2014-02-2', end: '2014-02-03', content: 'SG_2_2', type: 'background', className: 'negative',group:'bar', subgroup:'sg_2', subgroupOrder:1},
            {id: 3, content: 'subgroup1_1', start: '2014-01-27T02:00:00', end: '2014-01-29',group:'bar', subgroup:'sg_2', subgroupOrder:1},
            {id: 4, content: 'subgroup1_2', start: '2014-01-28', end: '2014-02-02',group:'bar', subgroup:'sg_2', subgroupOrder:1},

            {id: 'SG_3_1',start: '2014-01-23', end: '2014-01-25', type: 'background', group:'bar', subgroup:'sg_3', subgroupOrder:2, content:"a"},
            {id: 'SG_3_2', start: '2014-01-26', end: '2014-01-28', type: 'background', className: 'positive',group:'bar', subgroup:'sg_3', subgroupOrder:2, content:"b"},
            {id: 5, content: 'subgroup2_1', start: '2014-01-23T12:00:00', end: '2014-01-26T12:00:00',group:'bar', subgroup:'sg_3', subgroupOrder:2},
            {id: 6, content: 'subgroup2_2', start: '2014-01-26T12:00:01', end: '2014-01-29T12:00:00',group:'bar', subgroup:'sg_3', subgroupOrder:2},

            {id: 'background', start: '2014-01-29', end: '2014-01-30', type: 'background', className: 'negative',group:'bar'},
            {id: 'background_all', start: '2014-01-31', end: '2014-02-02', type: 'background', className: 'positive'},
        ];
         */
        widget.updateWithData(data, groups);
    };

    function hexToRgb(hex, opacity) {
        var c = d3.rgb(hex);
        return "rgba("+c.r+","+c.g+","+c.b+","+opacity+")";
    }

    function max_range(x_range) {
        var [mindt, maxdt] = x_range;
        var margin = (maxdt - mindt) * 0.1;
        mindt.setMilliseconds(-margin);
        maxdt.setMilliseconds(margin);
        return [new Date(mindt), new Date(maxdt)];
    }

    function createSubgrpBg(data) {
        var grps = {};
        var dates = [];
        data.forEach(function(p, i) {
            if (('subgroup' in p) && ('group' in p)) {
                if (!(p['group'] in grps)) {
                    grps[p['group']] = {};
                }
                grps[p['group']][p['subgroup']] = 1;
            };
            dates = dates.concat([new Date(p['start']), new Date(p['end'])]);
        });
        var [mindt, maxdt] = max_range(d3.extent(dates));
        var grpbg = [];
        var i = 0;
        $.each(grps, function(p) {
            $.each(grps[p], function(p1) {
                grpbg.push({
                    id: 'GG'+(i++),
                    content: p1,
                    start: mindt,
                    end: maxdt,
                    type: 'background',
                    group: p,
                    subgroup: p1,
                    className: 'bg subgrp'});
            });
        });
        return grpbg;
    }

})(jQuery);
