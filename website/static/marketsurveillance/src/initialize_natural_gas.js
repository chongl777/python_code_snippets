var initialize_natural_gas = function(PARAMS) {
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    // ----------------- begin of Natural Gas page ---------------------
	  PARAMS['widget']['gas-wow-summary'] = addTitle(
        $('div#gas-wow-summary').init_wfi_table({
            datasource: 'gas-wow-summary',
            title: ko.observable("NatGas COMPARATIVE INVENTORY"),
            processOption: function(data) {
                var self = this;
                // var t_date = d3.timeParse("%Y-%m-%dT00:00:00.000Z")(data[0]["last_date"]);
                // self.title("NatGas COMPARATIVE INVENTORY (AS OF " +
                //            d3.timeFormat('%Y-%m-%d')(t_date)+ ")");
            },
            columns_setup: [
                {data: "key",
                 title: 'EIA Reports',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(name) {
                     return '<div class="clickable">' + name + '</div>'}},
                {data: "crrlvl",
                 title: 'Current Level',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},

                {data: "wow_chg",
                 title: 'WoW Chg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
                {data: "ci_wow_chg",
                 title: 'CI WoW Chg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}},
    			      {data: "nxt_chg_5y_avg",
                 title: 'Next Week Chg 5yAvg',
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value) + '</div>'}}
            ],
            group_columns: ['key'],
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            update: updateSize
        }));

		PARAMS['widget']['gas-ci'] = addTitle2(
        $('div#gas-ci').init_wfi_plot({
            datasource: 'gas-ci',
            scatters: {
                data: {field: 'price', axis: 'yaxis1', radius: 4, hightlightlast: true},
                color: function(j, d){
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d.j/d.n);}},
            fitcurve: {data: [{field: 'fit', axis: 'yaxis1', sort: true},{field: 'fit_low', axis: 'yaxis1', sort: true}],
                       color: colors},
            xaxis: {field: 'ci(lhs)',
                    fmt: function(x) {return d3.format(',.2f')(x/1000)+'M'},
                    tooltipfmt: function(x) {return d3.format(',.2f')(x/1000)+'M'},
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
        "NatGas COMPARATIVE INVENTORY");

		PARAMS['widget']['gas-rig-prod'] = addTitle2(
        $('div#gas-rig-prod').init_wfi_plot({
            datasource: 'gas-rig-prod',
            lines: {
                data: [{field: 'rig_count(lhs)', axis: 'yaxis2'},
                       {field: 'production(bcf)(rhs)', axis: 'yaxis1'}],
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
        "PRODUCTION vs RIG");

    PARAMS['widget']['gas-ci-avg'] = addTitle2(
        $('div#gas-ci-avg').init_wfi_plot({
            datasource: 'gas-ci',
            lines: {
                data: [ {field: 'ci(lhs)', axis: 'yaxis2'},
						            {field: 'avg(rhs)', axis: 'yaxis1'}  ],
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
        "COMPARATIVE INVENTORY VS 5 YEAR AVG. ( in BCF ) ");

    // ----------------- end of Natural Gas page ---------------------
}
