(function($){

    var tbl_score_info = '\
        <table class="content-table" style="width:100%; height:100%; display: table"> \
          <thead> \
             <tr> \
               <th style="width: 70%">field</th> \
               <th style="width: 30%">value</th> \
             </tr> \
          </thead> \
          <tbody> \
               <tr class="group"><td colspan="2"><font>Score Details</font></td></tr> \
                   <tr><td class="field">Mapped Equity</td> <td data-bind="text: emc_info().equity_sid" ></td></tr>\
                   <tr><td class="field">EMC Score</td> <td style="font-weight: bold" data-bind="text: emc_info().emc_score"></td></tr>\
                   <tr><td class="field">EMC Signal</td> <td data-bind="text: emc_info().emc_signal"></td></tr>\
                   <tr><td class="field">1M Return</td> <td data-bind="text: emc_info().ret_1m"></td></tr>\
                   <tr><td class="field">2M Return</td> <td data-bind="text: emc_info().ret_2m"></td></tr>\
                   <tr><td class="field">3M Return</td> <td data-bind="text: emc_info().ret_3m"></td></tr>\
                   <tr><td class="field">Average Return</td> <td data-bind="text: emc_info().ret_mean"></td></tr>\
                   <tr><td class="field">Last Update</td> <td data-bind="text: emc_info().last_update"></td></tr>\
          </tbody>\
        </table>'

    var score_hist = '\
         <table style="width:100%; height:100%"> \
            <tbody> \
               <tr class="group"><td style="width:100%"><font>Score History</font></td></tr> \
               <tr  style="height:100%"><td style="height: auto" colspan="3"> \
                   <div id="score-hist" style="height:100%"><div></td> \
               </tr>\
            </tbody>\
         </table>';

    var score_hist_extend = '\
         <table style="width:100%; height:100%"> \
            <tbody> \
               <tr class="group"><td style="width:100%"><font>Score History</font></td></tr> \
               <tr  style="height:100%"><td style="height: auto" colspan="3"> \
                   <div id="score-hist-extend" style="height:100%"><div></td> \
               </tr>\
            </tbody>\
         </table>';

    var skeleton = '\
        <div style="display: inline-block; position: relative; height: 100%; width: 100%"> \
          <table class="content-table" style="width:100%; height:100%; display: table" cellspacing="0"> \
            <thead class="group"> \
              <tr> \
                <th style="width: 100%"><font></font></th> \
              </tr> \
            </thead> \
            <tbody> \
              <tr style="height: 270px"> \
                <td rowspan="1" class="tbl-element-slim"> \
                  {tbl_score_info} \
                </td> \
              </tr> \
              <tr> \
                <td rowspan="1" style="height: 100%" class="tbl-element-slim">{score_hist}</td> \
              </tr> \
            </tbody> \
          </table> \
        </div>\
        <div style="width:100%; height: 100%; top: 0px; left: 0px; \
            position: absolute; background: white; text-align: center;"\
           id="foreground">\
           <text></text> \
        </div>';

    var skeleton_extend = '\
        <div style="display: inline-block; position: relative; height: 100%; width: 100%"> \
          <table class="content-table" style="width:100%; height:100%; display: table" cellspacing="0"> \
            <thead class="group"> \
              <tr> \
                <th style="width: 50%"><font></font></th> \
              </tr> \
              <tr> \
                <th style="width: 50%"><font></font></th> \
              </tr> \
            </thead> \
            <tbody> \
              <tr style="height: 100%"> \
                <td rowspan="1" class="tbl-element-slim"> \
                  {tbl_score_info} \
                </td> \
                <td rowspan="1" style="height: 100%" class="tbl-element-slim">{score_hist_extend}</td> \
              </tr> \
            </tbody> \
          </table> \
        </div>\
        <div style="width:100%; height: 100%; top: 0px; left: 0px; \
            position: absolute; background: white; text-align: center;"\
           id="foreground">\
           <text></text> \
        </div>';

    $.fn.init_emc = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })

        self.update = function(sid) {
            var args = arguments;
            self.each(function(i, div) {
                div.update.apply(div, args);
            });
        };

        self.startLoading = function(){
            self.each(function(i, div) {
                div.startLoading();
            });
        }

        self.endLoading = function(){
            self.each(function(i, div) {
                div.endLoading();
            });
        }
        return this;
    }

    function initialize(options) {
        var self = this;
        self.options = options;
        self.options.extend = self.options.extend || false;
        self.options.extend = self.options.extend && ($(self).width() >= 650);
        self.options.t_date = self.options.t_date || d3.timeFormat('%Y-%m-%d')(new Date());
        self.options.keep_ratio = 2 / 1 // width / height ratio in extend model

        self.vm = new (function() {
            this._t_date = ko.observable(self.options.t_date);
            this.t_date = ko.computed({
                read: function(){
                    return this._t_date();
                },
                write:function(val){
                    this._t_date(val);
                },
                owner: this
            });

            this.emc_info= ko.observable({});
        });

        $(self).addClass('signal-emc');
        $(self).append('<div id="container"></div>');
        $('#container', self).append('<div id="content"></div>');

        var html_script;
        if (self.options.extend) {
            html_script = skeleton_extend;
        } else {
            html_script = skeleton;
        }

        html_script = html_script
            .replace('{tbl_score_info}', tbl_score_info)
            .replace('{score_hist}', score_hist)
            .replace('{score_hist_extend}', score_hist_extend)
        $('#content', self).append(html_script);

        ko.applyBindings(self.vm,  $('#container', self)[0]);


        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        self.score_plot = $('div#score-hist', self).init_interactive_plot({
            lines: {
                data: [
                    {field: 'emc_score', axis: 'yaxis1', legend: 'emc score (lhs)', color: () => colors(0)},
                    {field: 'ret_avg', axis: 'yaxis2', legend: 'emc signal (rhs)', color: () => colors(1)}
                ]
            },
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%m/%Y'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis: {
                yaxis1: {
                    fmt: function(x) {return d3.format(',.0f')(x)},
                    anchor: 'left',
                    pos: function() {return 0;},
                    domain_margin: 0.2,
                    tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                    scale:d3.scaleLinear()},
                yaxis2: {
                    fmt: function(x) {return d3.format(',.2f')(x)},
                    pos: function() {return this.options.width;},
                    anchor: 'right',
                    domain_margin: 0.2,
                    tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                    scale:d3.scaleLinear()}

            },
            navigator: {
                //plotarea: 'ret_avg',
                plotarea: 'plot_area',
                field: 'date',
                fmt: d3.timeFormat("%b '%y"),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%Y-%m-%d'),
                scale: d3.scaleTime()
            },
            zoombar: true,
            naviH: "30",
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {};
                var idx = data['emc_score'].indexOf(data['emc_score'].filter((x)=>(x))[0]);
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice(idx);});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            update: function(data) {
                 this.updateWithData(data.px_trd_hist)
            }
        });

        self.score_plot_extend = $('div#score-hist-extend', self).init_interactive_plot({
            lines: {
                data: [
                ]
            },
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%m/%Y'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis: {
                yaxis1: {
                    fmt: function(x) {return d3.format(',.0f')(x)},
                    anchor: 'right',
                    pos: function() {return this.options.width},
                    domain_margin: 0.2,
                    tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                    scale:d3.scaleLinear()},
                yaxis2: {
                    fmt: function(x) {return d3.format(',.2f')(x)},
                    pos: function() {return 0},
                    anchor: 'left',
                    domain_margin: 0.2,
                    tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                    scale:d3.scaleLinear()},
                yaxis3: {
                    fmt: function(x) {return d3.format(',.0f')(x)},
                    pos: function() {return 20},
                    anchor: 'left',
                    domain_margin: 0.2,
                    tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                    scale:d3.scaleLinear()}
            },
            navigator: {
                plotarea: 'plot_area',
                field: 'date',
                fmt: d3.timeFormat("%b '%y"),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%Y-%m-%d'),
                scale: d3.scaleTime()
            },
            zoombar: true,
            naviH: "30",
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                // dataClone['t_date'] = dataClone['t_date'].map(
                //     function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            update: function(data) {
                //ts = JSON.parse(ts.replace(/NaN/g, 'null'));
                // format each data point
                var line_config = line_configuration(data);
                this.update_options_lines(line_config);
                this.updateWithData(data.px_trd_hist)
            }
        });

        self.update = update;
        self.project_to = project_to;
        self.resize = resize;

        var [startLoading, endLoading] = loadingIcon($('#content', self)[0]);
        self.startLoading = startLoading;
        self.endLoading = endLoading;

        /* -------------------------------------------- */
        function update(sid, px_trd_hist) {
            startLoading();
            var self = this;
            var t_date = self.vm._t_date();

            $.ajax({
                url: self.options['update_url'],
                "method": "POST",
                dataType: 'text',
                "data": {
                    sid: sid,
                    t_date: t_date,
                    px_trade_data: JSON.stringify(px_trd_hist)
                },
                "success": function(text) {
                    endLoading();
                    $('#foreground', self).css('display', 'none');
                    var raw_data = JSON.parse(text.replace(/NaN/g, null));
                    self.raw_data = raw_data;
                    update_with_data.call(self, self.raw_data);
                    // score_plot.update(data["emc_hist"]);
                },
                error: function (error) {
                    endLoading();
                    $('#foreground', self).css('display', 'block');
                    try {
                        $('#foreground text', self).html(JSON.parse(error.responseText).message);
                    } catch(error) {
                        $('#foreground text', self).html(error.responseText);
                    }
                }
            });
        };

        function resize() {
            var self = this;
            $(self).html("");
            self.options.extend = true;
            initialize.call(self, self.options);
            update_with_data.call(self, self.raw_data);
            $('#foreground', self).css('display', 'none');
        }
    }

    function update_with_data(raw_data) {
        var self = this;
        if (raw_data == null)
            return;

        var data = raw_data;
        self.vm.emc_info(data['emc_details']);

        if (self.options.extend) {
            self.score_plot_extend.update(data.emc_hist);
        } else {
            self.score_plot.update(data.emc_hist);
        }
    }

    function project_to(canvas) {
        var self = this;
        var options = Object.assign({}, self.options);
        options.extend = true;
        initialize.call(canvas, options);
        canvas.raw_data = self.raw_data;
        update_with_data.call(canvas, canvas.raw_data);
        $('#foreground', canvas).css('display', 'none');
        return canvas;
    }

    function line_configuration(data) {
        var url = new URL(window.location.href);
        var sec_types = data['sec_types'];
        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        var color_1 = colors(0);
        var color_2 = colors(1);
        var color_3 = '#00CDAC';

        var config_score = [
            {field: 'ret_avg', axis: 'yaxis2', legend: 'emc signal (lhs)', color: () => color_2},
            {field: 'emc_score', axis: 'yaxis3', legend: 'emc score (lhs)', color: () => color_3}
        ];

        var config_px = {
            field: 'plot_area', axis: 'yaxis1', legend: 'price (rhs)', color: () => color_1};

        var config_hld_periods = data['holding_periods'].map((x)=>{
            return {
                show_legend: false,
                show_tooltip: false,
                field: x['name'],
                color: () => (x['dir'] == 'long' ? 'green' : 'red'),
                axis: 'yaxis1'}
        });

        var config = config_score.concat(config_hld_periods).concat([config_px]);

        if (parseInt(url.searchParams.get("trading_records")) || 0) {
            config_px['tag'] = {
                field: 'trading_rc',
                data: function(d) {
                    var width = 30;
                    var height = 40;
                    const points_down = [
                        {x: 0, y: 0},
                        {x: width/2, y: height/3},
                        {x: width/2, y: height},
                        {x: -width/2, y: height},
                        {x: -width/2, y: height/3},
                    ]
                    const points_up = [
                        {x: 0, y: 0},
                        {x: width/2, y: -height/3},
                        {x: width/2, y: -height},
                        {x: -width/2, y: -height},
                        {x: -width/2, y: -height/3},
                    ]
                    var dir = d.dir == 1 ? 'up' : 'down';
                    var font_text = {
                        down: '<tspan x="0" dy="0em">Sell</tspan><tspan x="0" dy="1em">'+ d.title +'</tspan>',
                        up: '<tspan x="0" dy="0em">Buy</tspan><tspan x="0" dy="1em">'+ d.title +'</tspan>'
                    }

                    function open_tooltip() {
                        var tbl = $('<table><caption>Trading Records</caption>\
                                                   <thead><tr><th>fund</th><th>date</th><th>quantity</th>\
                                                              <th>price</th><th>broker</th></tr></thead> \
                                                   <tbody></tbody></table>');
                        var data = d.data;
                        data.forEach(function(p, i) {
                            $('tbody', tbl).append(
                                '<tr>'+
                                    '<td>'+ p.fund_id+'</td>'+
                                    '<td>'+ p.t_date+'</td>'+
                                    '<td>'+ d3.format(',.0f')(p.position_size)+'</td>'+
                                    '<td>'+ p.price+'</td>'+
                                    '<td>'+ (p.counterparty || '') +'</td>'+
                                    '</tr>');
                        });

                        return tbl[0].outerHTML;
                    }

                    return {'points': {'down': points_down, 'up': points_up}[dir],
                            'tooltip': open_tooltip,
                            'text_info': {
                                font_size: 8.5,
                                font_text: font_text[dir],
                                x: 0,
                                y: {'down': height/1.5, 'up': -height/1.5}[dir]
                            }};
                }
            };
        };
        return config;
    }
})(jQuery);
