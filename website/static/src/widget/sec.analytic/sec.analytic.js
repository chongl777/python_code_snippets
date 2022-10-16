(function($){
    var html_markup = '\
            <div id="bond-analytic" \
                style="float: left; display: inline-block; margin-left: 20px; margin-top: 20px"> \
                 <div id="bond-analytic-info" style="display: inline-block;"> \
                    <form data-bind="submit: submit"> \
                        <table id="tbl-1" class="row-border" style="width:480px"> \
                            <tbody> \
                                <tr class="group"><td colspan="2">General Info</td><tr> \
                                <tr class="sec-info-row">\
                                    <td>Bond Description</td>\
                                    <td data-bind="text: description"></td>\
                                <tr> \
                                <tr class="sec-info-row">\
                                    <td>Maturity</td>\
                                    <td data-bind="text: maturity"></td>\
                                <tr> \
                                <tr class="sec-info-row">\
                                    <td>Coupon</td>\
                                    <td  data-bind="text: coupon"></td>\
                                <tr> \
                                <tr class="sec-info-row">\
                                    <td>Trade Date</td>\
                                    <td><input type="date" id="trade_dt" action="submit"\
                                         data-bind="textInput: trade_dt, attr: {value: trade_dt}"/></td>\
                                <tr> \
                                <tr class="sec-info-row">\
                                    <td>Settlemnt Date</td>\
                                    <td data-bind="text: settle_date"></td>\
                                <tr> \
                                <tr class="sec-info-row">\
                                    <td>Price</td>\
                                    <td> \
                                        <input type="number" id="price" \
                                             data-bind="textInput: price, attr: {value: price}"/>\
                                        <img id="refresh-button" \
                                             data-bind="click: update_price" \
                                             src="./static/src/images/refresh.png"/> \
                                    </td>\
                                <tr> \
                                <tr class="sec-info-row">\
                                    <td>Govi Bond Name</td>\
                                    <td class="calc-field" data-bind="text: gterm_name"></td>\
                                <tr> \
                          </tbody> \
                        </table> \
                         <div style="float: left; display: inline-block; margin-top: 20px; width:480px"> \
                             <table id="tbl-2" class="row-border" style="float:left; width:45%"> \
                                <tbody> \
                                    <tr class="group"><td colspan="2">Spread & Risk</td><tr> \
                                    <tr class="sec-info-row">\
                                        <td>Yield To Maturity</td>\
                                        <td class="calc-field" data-bind="text: ytm"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Yield To Worst</td>\
                                        <td class="calc-field" data-bind="text: ytw"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Workout Date</td>\
                                        <td class="calc-field" data-bind="text: workout_dt"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Govi Bond Yield</td>\
                                        <td class="calc-field" data-bind="text: gterm_yld"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>G-Spread To Worst</td>\
                                        <td class="calc-field" data-bind="text: g_stw"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Modified Duration</td>\
                                        <td class="calc-field" data-bind="text: modified_dur"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Last Coupon Date</td>\
                                        <td class="calc-field" data-bind="text: last_coupon_dt"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Next Coupon Date</td>\
                                        <td class="calc-field" data-bind="text: next_coupon_dt"></td>\
                                    <tr> \
                                    <tr class="sec-info-row">\
                                        <td>Accrued Int</td>\
                                        <td class="calc-field" data-bind="text: accrued_int"></td>\
                                    <tr> \
                                </tbody> \
                             </table> \
                             <table id="tbl-3" class="row-border" style="float:left; width:45%; margin-left: 10%"> \
                                <caption class="group"><div>Call Schedule</div></caption> \
                                <thead><tr><th>call_date</th><th>call_px</th><th>duration</th><th>yield</th></tr></thead> \
                                <tbody data-bind="foreach: stats_by_call_dt"> \
                                    <tr> \
                                        <td data-bind="text: call_date"></td> \
                                        <td data-bind="text: call_px"></td> \
                                        <td class="calc-field" data-bind="text: modified_dur"></td> \
                                        <td class="calc-field" data-bind="text: yld"></td> \
                                    </tr> \
                                </tbody> \
                            </table> \
                         </div> \
                         <div style="display:none"><input type="submit"></div> \
                     </form> \
              </div> \
              <div id="status-bar"> \
                     <img  data-bind="style: {display: loading() ? \'inline-block\': \'none\'}" \
                           src="./static/src/images/loadingcirclests16.gif?rev=23" id="ImageProgress">\
                     <span id="status-text" data-bind="text: text, style: {color: red()? \'red\': \'green\'}"></span> \
                 </div> \
             </div>'

    $.fn.init_sec_analytic = function(
        options={}) {
        var self = this;
        this.each(function(i, div) {
            initialize(div, options);
        })
        // init_calc = function(sid, trade_dt)
        this.init_calc = function(sid, trade_dt) {
            self.each(function(i, div) {
                div.init_calc(sid, trade_dt);
            });
        }
        return this;
    }

    function initial_options(self, opts) {
        ko.extenders.percentage = function(target, params) {
            var result = ko.computed({
                read: function() {
                    return target() == null? null : (target()*params[0]).toFixed(params[1])+params[2];
                },
                write: target
            });

            result.raw = target;
            return result;
        };

        ko.extenders.format_call_stats = function(target, params) {
            var result = ko.computed({
                read: function() {
                    if (target().length == 0) {
                        return [];
                    } else {
                        var call_arrays = target();
                        call_arrays.forEach(function(p, i) {
                            p['modified_dur'] = p['modified_dur'] == null ? 'n/a' : p['modified_dur'].toFixed(3);
                            p['yld'] = p['yld']== null ? 'n/a' : (100*p['yld']).toFixed(2)+'%';
                            p['call_px'] = p['call_px'].toFixed(2);
                        });
                        return call_arrays;
                    }

                },
                write: target
            });

            result.raw = target;
            return result;
        };

        var options = {
            params: new (function() {
                var self_param = this;
                this._price = ko.observable();
                this.sid = ko.observable();
                this.price = ko.computed({
                    read: function(){
                        return self_param._price()
                    },
                    write:function(val){
                        val = parseFloat(parseFloat(val).toFixed(3));
                        self_param._price(val);
                    },
                    owner: self_param
                });
                this.submit = function() {
                    var val = self_param._price();
                    var trade_dt = self_param.trade_dt();
                    self.recalculate(val, trade_dt);

                }

                this.update_price = function() {
                    self.update_price();
                }

                this._trade_dt = ko.observable(d3.timeFormat('%Y-%m-%d')(new Date()));
                this.trade_dt = ko.computed({
                    read: function(){
                        return self_param._trade_dt();
                    },
                    write:function(val){
                        self_param._trade_dt(val);
                    },
                    owner: self_param
                });

                this.description = ko.observable();
                this.maturity = ko.observable();
                this.coupon = ko.observable();
                this.settle_date = ko.observable();
                this.ytm = ko.observable().extend({percentage: [100, 4, '%']});
                this.ytw = ko.observable().extend({percentage: [100, 4, '%']});
                this.workout_dt = ko.observable();
                this.g_stw = ko.observable().extend({percentage: [1, 2, '']});
                this.gterm_yld = ko.observable().extend({percentage: [100, 4, '%']});
                this.modified_dur = ko.observable().extend({percentage: [1, 4, '']});
                this.gterm_name = ko.observable();
                this.last_coupon_dt = ko.observable()
                this.next_coupon_dt = ko.observable()
                this.accrued_int = ko.observable().extend({percentage: [1, 4, '']});
                this.stats_by_call_dt = ko.observableArray().extend({format_call_stats: ''});
                return this;
            })(),
            status: {
                loading: ko.observable(true),
                text: ko.observable(),
                red: ko.observable()
            }
        }
        options['init_calc'] = opts['init_calc'];
        options['recalculate'] = opts['recalculate'];
        options['update_price'] = opts['update_price'];

        return options
    }

    function initialize(self, options) {
        // unique id
        self.options = initial_options(self, options);
        $(self).addClass('wfi-sec-analytic');
        $(self).append(html_markup);

        $(self).append(
            '<div style="float: left; margin-left: 20px; margin-top: 20px;"> \
                <div id="spread-plot" risk_type="cumulative-spread" sid="5" \
                   style="width:530px; height:440px; left:550px; position: absolute;" \
                   navH="50" zoombarH="40"> \
                </div> \
             </div>');

        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        self.spread_chart = $('#spread-plot', self).init_interactive_plot({
            lines: {
                data: [
                    {field: 'sprd', axis: 'yaxis1', legend: 'g-spread (lhs)', color: () => (colors(1))},
                    {field: 'yld', axis: 'yaxis2', legend: 'yld-to-wst (rhs)', color: () => (colors(2))}]
            },
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%m/%d/%Y'),
                    tooltipfmt: function(x) {return d3.timeFormat('%m/%d/%Y')(x)},
                    scale: d3.scaleTime()},
            yaxis: {
                yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                         domain_margin: 0.2,
                         anchor: 'right',
                         pos: function() {return this.options.width},
                         tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                         scale:d3.scaleLinear()},
                yaxis2: {fmt: function(x) {return d3.format(',.2f')(x*100)+"%"},
                         anchor: 'left',
                         pos: function() {return 0},
                         domain_margin: 0.2,
                         tooltipfmt: function(x) {return d3.format(',.4f')(x*100)+"%"},
                         scale:d3.scaleLinear()}},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%Y-%m-%d'),
                scale: d3.scaleTime()
            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%m/%d/%Y')(p.slice(0,10));})
                return dataClone;
            }
        });

        ko.applyBindings(self.options['params'], $('#bond-analytic-info', self)[0]);
        ko.applyBindings(self.options['status'], $('#status-bar', self)[0]);

        var widget = $('table', self);

        var columns_config = {
            "group": {
                "data": "group",
                "visible": false,
                "width": "0px"},
            "field": {
                "data": "field",
                "visible": true,
                "width": "30%"},
            "value": {
                "data": "value",
                "visible": true,
                "render": function(data) {
                    return '<div class="value">' + data + "</div>"},
                "width": "70%"}};

        var columns_setup = [];

        function startloading(txt='calculating...') {
            self.options.status.loading(true);
            self.options.status.text(txt);
            self.options.status.red(true);
        }
        function endloading(txt='ready', red=false) {
            self.options.status.loading(false);
            self.options.status.text(txt);
            self.options.status.red(red);
        }

        self.init_calc = function(sid, trade_dt) {
            self.options.init_calc.call(self, sid, trade_dt, startloading, endloading)};
        self.recalculate = function() {
            var sid = self.options['params'].sid();
            var price = self.options['params']._price();
            var trade_dt = self.options['params'].trade_dt();
            self.options.recalculate.call(self, sid, price, trade_dt, startloading, endloading);
        };

        self.update_price = function() {
            var sid = self.options['params'].sid();
            var trade_dt = self.options['params'].trade_dt();
            self.options.update_price.call(self, sid, trade_dt, startloading, endloading);
        };

        self.update = (data, save) => (updateData.call(self, data, save));

        return this;
    };

    function updateData(data, save=false) {
        var self = this;
        if (save)
            self.data = data;
        $.each(self.options['params'], function(p, f) {
            if (data[p] != null) {
                f(data[p]);
            }
        })

        if (data['spread_ts'])
            self.spread_chart.updateWithData(data['spread_ts']);
    }

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
    }
})(jQuery);
