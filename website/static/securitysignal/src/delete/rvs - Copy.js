(function($){
    $.fn.init_rvs = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })

        self.update = function(sid) {
            self.each(function(i, div) {
                div.update(sid)
            })
        };
        return this;
    }

    function initialize(options) {
        var self = this;
        self.options = options;
        self.options.t_date = self.options.t_date || new Date();
        self.vm = new (function(){
            this.rvs_info = ko.observable({});

            this._t_date = ko.observable(self.options.t_date);
            this.t_date = ko.computed({
                read: function(){
                    return d3.timeFormat('%Y-%m-%d')(this._t_date());
                },
                write:function(val){
                    this._t_date(val);
                },
                owner: this
            });

            this.available_rating = ko.observableArray([]);
            this.rating = ko.observable();

            this._price = ko.observable();
            this.price = ko.computed({
                read: function(){
                    try {
                        return this._price().toFixed(2);
                    } catch (err){
                        return '';
                    }
                },
                write:function(val){
                    val = parseFloat(val);
                    this._price(val);
                },
                owner: this
            });

            this._stw = ko.observable();
            this.stw = ko.computed({
                read: function(){
                    return this._stw()
                },
                write:function(val){
                    val = parseFloat(parseFloat(val).toFixed(2));
                    this._stw(val);
                },
                owner: this
            });

            this._ytw = ko.observable();
            this.ytw = ko.computed({
                read: function(){
                    return this._ytw()
                },
                write:function(val){
                    val = parseFloat(parseFloat(val).toFixed(2));
                    this._ytw(val);
                },
                owner: this
            });
        })();

        $(self).addClass('signal-rvs');
        $(self).append('<div id="container"></div>');
        $('#container', self).append('<div id="content"></div>');
        $('#content', self).append(
            '<div style="display: inline-block; position: relative; height: 100%; width: 100%"> \
                 <table class="content-table" style="width:100%; height:100%; display: table" cellspacing="0"> \
                    <tbody> \
                       <tr id="general-info" class="scalable"> \
                         <td><div> \
                           <table style="width:100%;" class="subtable"> \
                               <thead class="group"> \
                                  <tr> \
                                    <th style="width: 30%"><font></font></th> \
                                    <th style="width: 15%"><font></font></th> \
                                    <th style="width: 30%"><font></font></th> \
                                    <th style="width: 25%"><font></font></th> \
                                  </tr> \
                               </thead> \
                               <tbody> \
                                   <tr class="group"> <td colspan="4"><font>Score Summary</font></td> \
                                   </tr> \
                                   <tr> \
                                     <td class="field">Valuation Date</td>\
                                     <td colspan="1"><input id="val-date" class="inputs" type="date" \
                                          id="val_date" action="submit" data-bind="textInput: t_date, attr: {value: t_date}" ></td>\
                                     <td class="field">Last Update</td> \
                                     <td colspan="1" data-bind="text: rvs_info().last_update"></td>\
                                   </tr> \
                                   <tr> \
                                     <td class="field">RVS Score</td> <td colspan="1" style="font-weight: bold" data-bind="text: rvs_info().score"></td>\
                                     <td class="field">Mapped Equity</td> <td colspan="1" data-bind="text: rvs_info().sid_equity" ></td>\
                                   </tr> \
                                   <tr> \
                                     <td class="field">RVS Signal</td> <td colspan="1" data-bind="text: rvs_info().signal_strength"></td>\
                                     <td class="field">Outlier</td> <td colspan="1" data-bind="text: rvs_info().outlier"></td>\
                                   </tr> \
                               </tbody> \
                            </table> \
                          </div></td>\
                       </tr> \
                       <tr id="detailed-info" class="scalable"> \
                         <td> \
                            <table style="width:100%;" class="subtable"> \
                              <thead class="group"> \
                                 <tr> \
                                   <th style="width: 35%"><font>Score Details</font></th> \
                                   <th style="width: 35%"><font></font></th> \
                                   <th style="width: 15%"><font>Beta</font></th> \
                                   <th style="width: 15%"><font>Contrib</font></th> \
                                 </tr> \
                              </thead> \
                              <tbody> \
                                  <tr class="group"> <td><font>Score Details</font></td><td><font></font></td> \
                                      <td><font>Beta</font></td><td><font>Contrib</font></td> \
                                  </tr> \
                                    <tr><td class="field">Sector / Beta</td> <td data-bind="text: rvs_info().sector"></td> \
                                        <td data-bind="text: rvs_info().signal_strength"></td></tr>\
                                    <tr><td class="field">Duration / Beta</td> <td data-bind="text: rvs_info().bond_dur"></td> \
                                        <td data-bind="text: rvs_info().duration_beta"></td></tr>\
                                    <tr><td class="field">Rating / Beta</td> <td data-bind="text: rvs_info().bond_rtg"></td> \
                                        <td data-bind="text: rvs_info().bond_rtg_beta"></td></tr>\
                                    <tr><td class="field">Leverage / Beta</td> <td data-bind="text: rvs_info().leverage"></td> \
                                        <td data-bind="text: rvs_info().leverage_beta"></td></tr>\
                                    <tr class="with-border-bottom"><td class="field">Fair Spread</td> <td data-bind="text: rvs_info().fair_spread"></td> \
                                        <td></td><td data-bind="text: rvs_info().fair_spread"></td></tr>\
                              </tbody> \
                            </table> \
                         </td> \
                       </tr> \
                       <tr  id="additional-info" class="scalable"><td> \
                           <table style="width:100%;" class="subtable"> \
                              <thead class="group"> \
                                 <tr> \
                                   <th style="width: 30%"><font></font></th> \
                                   <th style="width: 20%"><font></font></th> \
                                   <th style="width: 30%"><font></font></th> \
                                   <th style="width: 20%"><font></font></th> \
                                 </tr> \
                              </thead> \
                              <tbody> \
                                  <tr class="group"> <td colspan="4"><font>Additional Info</font></td></tr> \
                                    <tr>\
                                      <td class="field">Bond PX Used</td> \
                                      <td data-bind="text: rvs_info().bond_px"></td> \
                                      <td class="field">Bond Spread Used</td> \
                                      <td data-bind="text: rvs_info().bond_stw"></td> \
                                    </tr> \
                                    <tr> \
                                      <td class="field">Total Debt</td> \
                                      <td colspan="1" data-bind="text: rvs_info().total_debt"></td> \
                                      <td class="field">Market Cap</td> \
                                      <td colspan="1" data-bind="text: rvs_info().eqt_mktcap"></td> \
                                    </tr>\
                              </tbody> \
                            </table> \
                       </td></tr> \
                       <tr class="scalable"><td> \
                           <table style="width:100%;" class="subtable"> \
                              <thead class="group"> \
                                 <tr> \
                                   <th style="width: 17%"><font></font></th> \
                                   <th style="width: 17%"><font></font></th> \
                                   <th style="width: 17%"><font></font></th> \
                                   <th style="width: 17%"><font></font></th> \
                                   <th style="width: 17%"><font></font></th> \
                                   <th style="width: 17%"><font></font></th> \
                                 </tr> \
                              </thead> \
                              <tbody> \
                                  <tr class="group"> <td colspan="6"><font>Overrides Model Input</font></td> </tr> \
                                    <tr><td class="field" colspan="2">Bond Price Override</td> \
                                        <td><input type="number" id="price-input" class="inputs" colspan="3"\
                                         data-bind="textInput: price, attr: {value: price}"></td> \
                                    </tr> \
                                    <tr><td class="field" colspan="2">Bond Rating Override</td><td> \
                                         <select id="rating-input" class="inputs" colspan="3" \
                                             data-bind="options: available_rating, \
                                             optionsText: function(item) {return item;}, \
                                             selectedOptions: rating">\
                                         </td></tr> \
                                    <tr> \
                                      <td class="field">Bond STW</td> <td colspan="1" data-bind="text: stw"></td> \
                                      <td>Score(STW)</td> <td colspan="1" data-bind="text: stw"></td> \
                                      <td>Signal(STW)</td> <td colspan="1" data-bind="text: stw"></td> \
                                    <tr> \
                                      <td class="field">Bond STM</td> <td colspan="1" data-bind="text: ytw"></td> \
                                      <td>Score(STM)</td><td></td>\
                                      <td>Signal(STM)</td><td></td></tr>\
                              </tbody> \
                            </table> \
                       </td></tr> \
                       <tr class="group" style="height:30%"><td><font>Score History</font></td></tr> \
                       <tr ><td style="height: auto" colspan="3"><div id="score-hist" style="height:100%"><div></td></tr>\
                    </tbody>\
                 </table> \
            </div>\
            <div style="width:100%; height: 100%; top: 0px; left: 0px; \
                position: absolute; background: white; text-align: center;"\
               id="foreground">\
               <text></text> \
            </div>');
        ko.applyBindings(self.vm, self);

        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        var score_plot = $('div#score-hist', self).init_interactive_plot({
            lines: {
                data: [
                    {field: 'signal_strength', axis: 'yaxis1', legend: 'rvs signal (rhs)'},
                    {field: 'rvs_score', axis: 'yaxis2', legend: 'rvs score (lhs)'}],
                color: function(i) {return colors(i)}
            },
            xaxis: {field: 't_date',
                    fmt: d3.timeFormat('%m/%Y'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.2f')(x)},
                     domain_margin: 0.2,
                     tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x)},
                     domain_margin: 0.2,
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                plotarea: 'signal_strength',
                field: 't_date',
                fmt: d3.timeFormat("%b '%y"),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%Y-%m-%d'),
                scale: d3.scaleTime()
            },
            zoombar: true,
            naviH: "15",
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['t_date'] = dataClone['t_date'].map(
                    function(p) {return d3.timeParse('%m/%d/%Y')(p.slice(0,10));})
                return dataClone;
            },
            update: function(data) {
                //ts = JSON.parse(ts.replace(/NaN/g, 'null'));
                // format each data point
                this.updateWithData(data)
            }
        });

        var [startLoading, endLoading] = loadingIcon($('#content', self)[0]);
        self.update = update;

        /* -------------------------------------------- */
        function update(sid) {
            var self = this;
            startLoading();
            var t_date = d3.timeFormat('%Y-%m-%d')(self.vm._t_date());

            $.ajax({
                url: self.options['update_url'],
                "method": "GET",
                dataType: 'text',
                "data": {
                    sid: sid,
                    t_date: t_date
                },
                "success": function(text) {
                    endLoading();
                    var data = JSON.parse(text.replace(/NaN/g, null));
                    $('#foreground', self).css('display', 'none');
                    self.vm.rvs_info(data['rvs_details']);
                    self.vm.price(data['rvs_details'].bond_px);
                    self.vm.available_rating(data['available_rtg']);
                    self.vm.rating([data['rvs_details']['bond_rtg']]);
                    //ko.applyBindings(self.vm, self);
                    score_plot.update(data["rvs_hist"]);
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
    }
})(jQuery);
