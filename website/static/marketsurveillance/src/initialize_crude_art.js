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


var initialize_crude_art = function(PARAMS) {
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    // ----------------- begining of Crude Oil Art's page ------------------------
    PARAMS['widget']['wow-summary-art'] = addTitle(
        $('div#wow-summary-art').init_wfi_table({
            datasource: 'wow-summary-art',
            title: ko.observable("OIL COMPARATIVE INVENTORY - Art's Components"),
            preProcess: function(data, options) {
                var t_date = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(data[0]["last_date"]);
                options.title("OIL+PRODUCTS COMPARATIVE INVENTORY (AS OF " +
                           d3.timeFormat('%Y-%m-%d')(t_date)+ ")");
				return data;
            },
            columns_setup: [
                {data: "key",
                 sortable: false,
                 visible: true,
                 title: 'EIA Reports',
                 width: '20%',
                 render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "crrlvl",
                 sortable: false,
                 visible: true,
                 title: 'Current Level',
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
    			      {data: "nxt_5y_avg_predict",
                 sortable: false,
                 title: 'Next Week Chg 5yAvg',
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
            ],
            group_columns: ['key'],
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            update: updateSize
        }));

    PARAMS['widget']['oil-ci-art'] = addTitle2(
        $('div#oil-ci-art').init_wfi_plot({
            datasource: 'oil-ci-art',
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

    PARAMS['widget']['oil-wow-details-art'] = addTitle(
        $('div#oil-wow-details-art').init_wfi_expandable_table({
            datasource: 'oil-ci-detail-art',
            header: ['Date', 'Oil', 'Gasoline','Distill',
                     'Resi Fuel', 'Propane', 'Jet Fuel', 'Unfinished', 'Total'],
            title: ko.observable("Past 5 Years WoW Details"),
            processOption: function(data) {
                var self = this;
                var t_date = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(data[0]["nxt_week_date"]);
                self.title("Past 5 Years WoW Details (AS OF " +
                           d3.timeFormat('%Y-%m-%d')(t_date)+ ")");
            },
            columns_setup: [
                {data: "key",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value, type, row) {
                     return '<div class="clickable" style="margin-left:' +
                         (row.depth-1)*4 + 'px">' + value + '</div>';
                 }},
                {data: "oil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>';}},
                {data: "gas",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>';}},
                {data: "distil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>';}},
                {data: "resfueloil",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>';}},
                {data: "propane",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>';}},
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
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>';}},
    			      {data: "total",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value bold">' + d3.format(",.2f")(value/1000) + '</div>';}}
            ],
            sort: function(data) {
                return data.sort(function(a, b) {return a['key'] > b['key']});
            },
            group_columns: ['key'],
            group_row: false,
            init_level: 0,
            init_expand: 0,
            preProcess: function(data) {
                return data;
            },
            update: updateSize
        }),
        "Past 5 Years WoW Details (All Components)");

    PARAMS['widget']['rig-prod-art'] = addTitle2(
        $('div#rig-prod-art').init_wfi_plot({
            datasource: 'rig-prod-art',
            lines: {
                data: [{field: 'rig_count(lhs)', axis: 'yaxis2'},
                       {field: 'production(rhs)', axis: 'yaxis1'}],
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
        "PRODUCTION(K) vs RIG");


   PARAMS['widget']['prod-monthly-weekly-art'] = addTitle(
        $('div#prod-monthly-weekly-art').init_wfi_plot({
            datasource: 'prod-monthly-weekly-art',
            title: "US PRODUCTION MONTHLY VS WEEKLY",
            lines: {
                data: [{field: 'production_weekly', axis: 'yaxis1'},
                       {field: 'production_monthly', axis: 'yaxis1'},
                       {field: 'production_weekly_plus_adj', axis: 'yaxis1'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {
                field: 'date',
                fmt: d3.timeFormat('%Y-%m-%d'),
                tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
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
            }}));


		PARAMS['widget']['rig-employ-art'] = addTitle2(
        $('div#rig-employ-art').init_wfi_plot({
            datasource: 'rig-employ-art',
            lines: {
                data: [{field: 'rig_count(lhs)', axis: 'yaxis2'},
                       {field: 'employment(k)(rhs)', axis: 'yaxis1'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format('.0f')(x)},
                     tooltipfmt: function(x) {return d3.format('.0f')(x)},
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
                    start.setFullYear(start.getFullYear()-4);
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
        "RIG vs Employment");

		PARAMS['widget']['mm-long-art'] = addTitle2(
        $('div#mm-long-art').init_wfi_plot({
            datasource: 'mm-long-art',
            lines: {
                data: [{field: 'wti_pct',   axis: 'yaxis1'},
                       {field: 'brent_pct', axis: 'yaxis1'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x*100)+'%'},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x*100)+'%'},
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
                    start.setFullYear(start.getFullYear()-4);
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
        "Money Manager Net Long/Open Interest");

    PARAMS['widget']['ci-avg-art'] = addTitle2(
        $('div#ci-avg-art').init_wfi_plot({
            datasource: 'oil-ci-prod-avg-art',
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

    PARAMS['widget']['wow-ci-change-art'] = addTitle2(
        $('div#wow-ci-change-art').init_wfi_plot({
            input_args: {
                'rolling_weeks': ko.observable(4)
            },
            update: function(f) {
                var self = this;
                var m = parseInt(self.options['input_args'].rolling_weeks());
                $.ajax({
                    url: PARAMS['prefix_url'] + '/api_update_recalc_rolling_chg',
                    method: "GET",
                    dataType: 'json',
                    "data": {
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
            datasource: 'wow-ci-change-art',
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
    // ----------------- end of Crude Oil Art's page ------------------------
}
