function sum(node, field, depth) {
    if (field in node) {
        return;
    } else {
        node.children.forEach(function(p) {
            sum(p, field, depth);
        });
        if (node.depth<depth) {
            node[field] = "";
        } else {
            var val = 0;
            node.children.forEach(
                function(p) {
                    val += p[field]});
            node[field] = val;
        };
    }
};


var initialize = function(PARAMS) {
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    // ----------------- begin of Crude Oil Big3 page ------------------------
    PARAMS['widget']['wow-summary-big3'] = addTitle2(
        $('div#wow-summary-big3').init_wfi_table({
            datasource: 'wow-summary-big3',
            columns_setup: [
                {data: "key",
                 sortable: false,
                 title: 'EIA Reports',
                 visible: true,
                 width: '20%',
                 render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "crrlvl",
                 sortable: false,
                 title: 'Current Level',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},

                {data: "wow_chg",
                 sortable: false,
                 title: 'WoW Chg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
                {data: "ci_wow_chg",
                 sortable: false,
                 title: 'CI WoW Chg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
    			      {data: "nxt_chg_5y_avg",
                 sortable: false,
                 visible: true,
                 title: 'Next Week Chg 5yAvg',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
                {data: "nxt_chg_10y_avg",
                 sortable: false,
                 title: 'Next Week Chg 10yAvg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}}
            ],
            group_columns: ['key'],
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            update: updateSize
        }),
        "OIL COMPARATIVE INVENTORY");

    PARAMS['widget']['oil-wow-details-big3'] = addTitle2(
        $('div#oil-wow-details-big3').init_wfi_expandable_table({
            datasource: 'oil-ci-detail-big3',
            header: ['Date', 'Oil', 'Gasoline','Distill', 'Total'],
            columns_setup: [
                {data: "key",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div>' + value + '</div>';
                 }},
                {data: "oil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "gas",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "distil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "total_big3",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value bold">' + d3.format(",.2f")(value/1000) + '</div>'}}
            ],
            sort: function(data) {
                return data.sort(function(a, b) {return a['key'] > b['key']});
            },
            group_columns: ['key'],
            group_row: false,
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            preProcess: function(data) {
                return data;
            },
            update: updateSize
        }),
        "Past Years WoW Details");


	  PARAMS['widget']['ci-avg-big3'] = addTitle2(
        $('div#ci-avg-big3').init_wfi_plot({
            datasource: 'oil-ci-prod-avg-big3',
            lines: {
                data: [{field: 'ci', axis: 'yaxis2', legend: 'c.i. (lhs)'},
                       {field: 'avg', axis: 'yaxis1', legend: '5y-avg (rhs)'},
                       {field: 'inv', axis: 'yaxis1', legend: 'inventory (rhs)'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x/1000)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x/1000)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "COMPARATIVE INVENTORY VS 5 YEAR AVG. ( in MM ) ");


    PARAMS['widget']['oil-ci-big3'] = addTitle2(
        $('div#oil-ci-big3').init_wfi_plot({
            datasource: 'oil-ci-big3',
            scatters: {
                data: {field: 'price', axis: 'yaxis1', radius: 4, hightlightlast: true},
                color: function(j, d){
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d.j/d.n);}},
            fitcurve: {
                data: [
                    {field: 'fit2', axis: 'yaxis1', sort: true}],
                color: colors},
            xaxis: {field: 'ci',
                    fmt: function(x) {return d3.format(',.0f')(x/1000)+'M'},
                    tooltipfmt: function(x) {return d3.format(',.0f')(x/1000)+'M'},
                    scale:d3.scaleLinear()},
            yaxis1: {fmt: function(x) {return d3.format('.2f')(x)},
                     tooltipfmt: function(x) {return d3.format('.2f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                gradient: {color: function(d) {
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d);
                }},
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-4);
                    return [start, end];
                }
            },
            zoombar: true,
            legendbar: false,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "OIL COMPARATIVE INVENTORY - Regression");

    PARAMS['widget']['wow-ci-change-big3'] = addTitle2(
        $('div#wow-ci-change-big3').init_wfi_plot({
            input_args: {
                rolling_weeks: ko.observable(4)
            },
            update: function(f) {
                var self = this;
                var m = parseInt(self.options['input_args'].rolling_weeks());
                $.ajax({
                    url: PARAMS['prefix_url'] + '/api_update_recalc_rolling_chg_big3',
                    method: "GET",
                    dataType: 'json',
                    data: {
                        n: 5,
                        m: m,
                        t_date: PARAMS['t_date'].toISOString()},
                    "success": function(data) {
                        f(data);
                    },
                    error: function (error) {
                        f();
                        alert("script:updateContent:"+error.responseText);
                    }
                });
            },
            datasource: 'wow-ci-change-big3',
            lines: {
                data: [{field: 'ci_chg', axis: 'yaxis1'}],
                color: function(i) {
                    return colors(i);}},
            areas: {
                data: [{upper: 'ci_chg_upper', lower: 'ci_chg_lower', axis: 'yaxis1', name: 'speed-est'}],
                color: function(i) {return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.2f')(x/1000) + " M"},
                     tooltipfmt: function(x) {return d3.format(',.2f')(x/1000) + " M"},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            options: function(data) {
                var self = this;
                var html = $(' \
             <table style="width:300px"> \
               <col width="40%"> \
               <col width="30%"> \
               <tbody> \
                 <tr> \
                    <td colspan=1>Roling Period</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: rolling_weeks"/> \
                    </td> \
                 </tr> \
               </tbody> \
             </table>');
                return html
            }}),
        "COMPARATIVE INVENTORY CHANGE SPEED");

    // ----------------- end of Crude Oil Big3 page ------------------------

    // ----------------- begining of Crude Oil Total + SPR page ------------------------

    PARAMS['widget']['wow-summary-spr'] = addTitle2(
        $('div#wow-summary-spr').init_wfi_table({
            datasource: 'wow-summary-spr',
            header: ['EIA Reports', 'Current Level', 'WoW Chg','CI WoW Chg',
                     'Next Week Chg 5yAvg'],
            columns_setup: [
                {data: "key",
                 title: 'EIA Reports',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "crrlvl",
                 sortable: false,
                 title: 'Current Level',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
                {data: "wow_chg",
                 sortable: false,
                 title: 'WoW Chg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
                {data: "ci_wow_chg",
                 title: 'CI WoW Chg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
    			      {data: "nxt_chg_5y_avg",
                 title: 'Next Week Chg 5yAvg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
            ],
            group_columns: ['key'],
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            update: updateSize
        }),
        "OIL COMPARATIVE INVENTORY - All Components");

    PARAMS['widget']['oil-ci-spr'] = addTitle2(
        $('div#oil-ci-spr').init_wfi_plot({
            datasource: 'oil-ci-spr',
            scatters: {
                data: {field: 'price', axis: 'yaxis1', radius: 4, hightlightlast: true},
                color: function(j, d){
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d.j/d.n);}},
            fitcurve: {data: [{field: 'fit2', axis: 'yaxis1', sort: true}],
                       color: colors},
            xaxis: {field: 'ci',
                    fmt: function(x) {return d3.format(',.0f')(x/1000)+'M'},
                    tooltipfmt: function(x) {return d3.format(',.0f')(x/1000)+'M'},
                    scale:d3.scaleLinear()},
            yaxis1: {fmt: function(x) {return d3.format('.2f')(x)},
                     tooltipfmt: function(x) {return d3.format('.2f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                gradient: {color: function(d) {
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d);
                }},
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-4);
                    return [start, end];
                }
            },
            zoombar: true,
            legendbar: false,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "OIL COMPARATIVE INVENTORY ALL - Regression");

    PARAMS['widget']['oil-wow-details-spr'] = addTitle2(
        $('div#oil-wow-details-spr').init_wfi_expandable_table({
            datasource: 'oil-ci-detail-spr',
            header: ['Date', 'Oil', 'Gasoline','Distill',
                     'Resi Fuel', 'Propane', 'Jet Fuel', 'Unfinished',
                     'SPR', 'Total w/ SPR'],
            columns_setup: [
                {data: "key",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div>' + value + '</div>';
                 }},
                {data: "oil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "gas",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "distil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "resfueloil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "propane",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "jetfuel",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "unfinished",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "spr",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
    			      {data: "total+spr",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value bold">' + d3.format(",.2f")(value/1000) + '</div>'}}
            ],
            group_columns: ['key'],
            group_row: false,
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            preProcess: function(data) {
                return data;
            },
            update: updateSize
        }),
        "Past 5 Years WoW Details (All Components)");


    PARAMS['widget']['ci-avg-spr'] = addTitle2(
        $('div#ci-avg-spr').init_wfi_plot({
            datasource: 'oil-ci-prod-avg-spr',
            lines: {
                data: [{field: 'ci', axis: 'yaxis2', legend: 'c.i. (lhs)'},
                       {field: 'avg', axis: 'yaxis1', legend: '5y-avg (rhs)'},
                       {field: 'inv', axis: 'yaxis1', legend: 'inventory (rhs)'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x/1000)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x/1000)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "COMPARATIVE INVENTORY VS 5 YEAR AVG. ALL Components ( in MM )");

    PARAMS['widget']['wow-ci-change-spr'] = addTitle2(
        $('div#wow-ci-change-spr').init_wfi_plot({
            datasource: 'wow-ci-change-spr',
            input_args: {
                'rolling_weeks': ko.observable(4)
            },
            update: function(f) {
                var self = this;
                var m = parseInt(self.options['input_args'].rolling_weeks());
                $.ajax({
                    url: PARAMS['prefix_url'] + '/api_update_recalc_rolling_chg_n_spr',
                    method: "GET",
                    dataType: 'json',
                    data: {
                        n: 5,
                        m: m,
                        t_date: PARAMS['t_date'].toISOString()},
                    "success": function(data) {
                        f(data);
                    },
                    error: function (error) {
                        f();
                        alert("script:updateContent:"+error.responseText);
                    }
                });
            },
            lines: {
                data: [{field: 'ci_chg', axis: 'yaxis1'}],
                color: function(i) {
                    return colors(i);}},
            areas: {
                data: [{upper: 'ci_chg_upper', lower: 'ci_chg_lower', axis: 'yaxis1', name: 'speed-est'}],
                color: function(i) {return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.2f')(x/1000) + " M"},
                     tooltipfmt: function(x) {return d3.format(',.2f')(x/1000) + " M"},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            options: function(data) {
                var self = this;
                var html = $(' \
             <table style="width:300px"> \
               <col width="40%"> \
               <col width="30%"> \
               <tbody> \
                 <tr> \
                    <td colspan=1>Roling Period</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: rolling_weeks"/> \
                    </td> \
                 </tr> \
               </tbody> \
             </table>');
                return html
            }}),
        "COMPARATIVE INVENTORY CHANGE SPEED");

    // ----------------- end of Crude Oil Total + SPR page ------------------------

    // ----------------- begin of derivatives page ---------------------

		PARAMS['widget']['aaa-sprd'] = addTitle2(
        $('div#aaa-sprd').init_wfi_plot({
            datasource: 'aaa-sprd',
            lines: {
                data: [{field: 'CMBX.A.10', axis: 'yaxis1'},
                       {field: 'CMBX.A.9', axis: 'yaxis1'},
					             {field: 'CMBX.A.8', axis: 'yaxis1'},
					             {field: 'CMBX.A.7', axis: 'yaxis1'},
					             {field: 'CMBX.A.6', axis: 'yaxis1'}
					            ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "CMBX A Spread");

		PARAMS['widget']['aa-sprd'] = addTitle2(
        $('div#aa-sprd').init_wfi_plot({
            datasource: 'aa-sprd',
            lines: {
                data: [
								 {field: 'CMBX.AAA.10', axis: 'yaxis1'},
								 {field: 'CMBX.AAA.9', axis: 'yaxis1'},				
					             {field: 'CMBX.AAA.8', axis: 'yaxis1'},
					             {field: 'CMBX.AAA.7', axis: 'yaxis1'},
					             {field: 'CMBX.AAA.6', axis: 'yaxis1'}
					            ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "CMBX AAA Spread");

		PARAMS['widget']['bbb-minus-sprd'] = addTitle2(
        $('div#bbb-minus-sprd').init_wfi_plot({
            datasource: 'bbb-minus-sprd',
            lines: {
                data: [
						{field: 'CMBX.BBB-.10', axis: 'yaxis1'},
                      {field: 'CMBX.BBB-.9', axis: 'yaxis1'},
					            {field: 'CMBX.BBB-.8', axis: 'yaxis1'},
					            {field: 'CMBX.BBB-.7', axis: 'yaxis1'},
					             {field: 'CMBX.BBB-.6', axis: 'yaxis1'}
					            ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "CMBX BBB- Spread");


		PARAMS['widget']['ig-sprd'] = addTitle2(
        $('div#ig-sprd').init_wfi_plot({
            datasource: 'ig-sprd',
            lines: {
                data: [//{field: 'IG29', axis: 'yaxis1'},
						{field: 'Roll Adj', axis: 'yaxis1'},
					          {field: 'OTR IG', axis: 'yaxis1'},
					      ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "IG Spread");


		PARAMS['widget']['hy-sprd'] = addTitle2(
        $('div#hy-sprd').init_wfi_plot({
            datasource: 'hy-sprd',
            lines: {
                data: [
					          //{field: 'HY29', axis: 'yaxis1'},
                    //{field: 'HY28', axis: 'yaxis1'},
					          //{field: 'HY27', axis: 'yaxis1'},
							  {field: 'Roll Adj', axis: 'yaxis1'},
					          {field: 'OTR HY', axis: 'yaxis1'},
					      ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "HY Spread");

		PARAMS['widget']['rate-vol'] = addTitle2(
        $('div#rate-vol').init_wfi_plot({
            datasource: 'rate-vol',
            lines: {
                data: [{field: '3m1y', axis: 'yaxis1'},
                       {field: '3m10y', axis: 'yaxis2'},
					            ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "Swaption Implied Volatility");

		PARAMS['widget']['hy-spx'] = addTitle2(
        $('div#hy-spx').init_wfi_plot({
            datasource: 'hy-spx',
            lines: {
                data: [{field: 'Itraxx IG', axis: 'yaxis2'},
						{field: 'EM CDX', axis: 'yaxis1'},
                       					            ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "Itraxx and EM CDX");


    PARAMS['widget']['cmbx-pair'] = addTitle2(
        $('div#cmbx-pair').init_wfi_table({
            datasource: 'cmbx-pair',
            header: ['long','short','beta', 'z-score'],
            columns_setup: [
                {data: "long",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "short",
                 sortable: false,
                 visible: true,
                 width: '20%',
				         render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "beta",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
                {data: "z-score",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
            ],
            group_columns: ['long'],
            sum_columns: ['short','beta','z-score'],
            init_level: 0,
            update: updateSize
        }),
        "CMBX Pair Trades");

		PARAMS['widget']['basis-sprd'] = addTitle2(
        $('div#basis-sprd').init_wfi_plot({
            datasource: 'basis-sprd',
            lines: {
                data: [
							  {field: '2Y10Y', axis: 'yaxis1'},
					          {field: '1Y OIS basis', axis: 'yaxis1'},
					      ],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
					          var end = navi[navi.length-1];
					          var start = new Date(end);
					          start.setFullYear(start.getFullYear()-3);
					          return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}),
        "Interest Rate Spread(bps)");


   PARAMS['widget']['basis-monitor'] = addTitle2(
        $('div#basis-monitor').init_wfi_table({
            datasource: 'basis-monitor',
            header: ['Unit(bps)', 'Spot', '1D Chg','WoW Chg','1m_Chg', '3m_Chg',
                     '3y_Low', '3y_High', 'Level_Pct%', 'Prob_Pct%' ],
            columns_setup: [
                {data: "key",
                 title: 'Unit(bps)',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "spot",
                 sortable: false,
                 title: 'Current Level',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
                {data: "1d_chg",
                 sortable: false,
                 title: '1D Chg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
				 {data: "wow_chg",
                 sortable: false,
                 title: 'WoW Chg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
                {data: "1m_chg",
                 title: '1 month Chg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
				{data: "3m_chg",
                 title: '3 month chg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
				{data: "3y_low",
                 title: '3 year low',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
				{data: "3y_high",
                 title: '3 year high',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
				{data: "3y_pct_level",
                 title: 'Level_Pct%',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value*100) + '</div>'}},
				{data: "3y_pct_prob",
                 title: 'Prob_Pct%',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value*100) + '</div>'}},
				 ],
            group_columns: ['key'],
            sum_columns: ['spot', '1d_chg','wow_chg','1m_chg', '3m_chg', '3y_low', '3y_high','3y_pct_level','3y_pct_prob'],
            init_level: 0,
            update: updateSize
        }),
        "Rate/Spread Monitor");
}
