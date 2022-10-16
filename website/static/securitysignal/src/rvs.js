(function($){
    var tbl_left = ' \
         <table style="width:100%; height:100%; display: table" cellspacing="0"> \
            <tbody> \
               <tr id="general-info"> \
                 <td><div style="height:100%"> \
                   <form data-bind="submit: recalc_rvs">\
                     <table style="width:100%;" class="subtable scalable"> \
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
                             <td colspan="1"><input id="val-date" class="inputs" type="date" action="submit" \
                                  data-bind="textInput: t_date, attr: {value: t_date}" ></td>\
                             <td class="field">Last Update</td> \
                             <td colspan="1" data-bind="text: rvs_info().last_update"></td>\
                           </tr> \
                           <tr> \
                             <td class="field">RVS Score</td> <td colspan="1" style="font-weight: bold" data-bind="text: rvs_info().score"></td>\
                             <td class="field">Mapped Equity</td> <td colspan="1" data-bind="text: rvs_info().sid_equity" ></td>\
                           </tr> \
                           <tr> \
                             <td class="field">RVS Signal</td> <td colspan="1" data-bind="text: d3.format(\',.0f\')(rvs_info().signal_strength)"></td>\
                             <td class="field">Outlier</td> <td colspan="1" id="outlier" data-bind="text: rvs_info().outlier, attr: {class: rvs_info().outlier}"></td>\
                           </tr> \
                           <tr style="display:none">  \
                             <td><div style="display:none"><input type="submit"/></div></td> \
                           </tr> \
                       </tbody> \
                     </table> \
                   </form>\
                   <table style="width:100%;" class="subtable scalable"> \
                      <thead class="group"> \
                         <tr> \
                           <th style="width: 30%"><font>Score Details</font></th> \
                           <th style="width: 30%"><font></font></th> \
                           <th style="width: 20%"><font>Beta</font></th> \
                           <th style="width: 20%"><font>Contrib</font></th> \
                         </tr> \
                      </thead> \
                      <tbody> \
                          <tr class="group"> \
                            <td><font>Score Details</font></td> \
                            <td><font></font></td> \
                            <td class="left"><div><font>Beta</font></div></td> \
                            <td class="left"><div><font>Contrib</font></div></td> \
                          </tr> \
                            <tr> \
                                <td class="field">Const / Beta</td> \
                                <td>1</td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.const)"/></td>\
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.const)"/></td>\
                            </tr>\
                            <tr> \
                                <td class="field">Duration / Beta</td> \
                                <td data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.bond_dur)"></td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.bond_dur_beta)"/></td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.bond_dur_beta * rvs_info().loadings.bond_dur)"/></td> \
                            </tr>\
                            <tr> \
                                <td class="field">Leverage / Beta</td> \
                                <td data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.leverage)"></td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.leverage_beta)"/></td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.leverage * rvs_info().loadings.leverage_beta)"/></td> \
                            <tr><td class="field">Sector / Beta</td> \
                                <td data-bind="text: rvs_info().loadings.sector"></td> \
                                <td class="left"><div  data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.sector_beta)"/></td> \
                                <td class="left"><div  data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.sector_beta)"/></td> \
                            </tr>\
                            <tr><td class="field">Rating / Beta</td> \
                                <td data-bind="text: rvs_info().loadings.rating"></td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.rating_beta)"/></td> \
                                <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.rating_beta)"/></td> \
                            </tr>\
                            <tr class="with-border-bottom"> \
                                <td class="field">Fair Spread</td> \
                                <td data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.fair_spread)"></td> \
                                <td></td> \
                                <td class="left"><div  data-bind="text: d3.format(\',.2f\')(rvs_info().loadings.fair_spread)"/></td> \
                            </tr>\
                      </tbody> \
                    </table> \
                    <table style="width:100%;" class="subtable scalable"> \
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
                            <td class="left"><div data-bind="text: d3.format(\',.2f\')(rvs_info().bond_px)"/></td> \
                            <td class="field">Bond STW Used</td> \
                            <td class="left"><div data-bind="text: d3.format(\',.0f\')(rvs_info().bond_stw)"/></td> \
                          </tr> \
                          <tr> \
                            <td class="field">Total Debt</td> \
                            <td class="left" colspan="1"><div data-bind="text: rvs_info().total_debt"/></td> \
                            <td class="field">Market Cap</td> \
                            <td class="left" colspan="1"><div data-bind="text: rvs_info().eqt_mktcap"/></td> \
                          </tr>\
                      </tbody> \
                    </table> \
                  </div></td>\
               </tr> \
            </tbody>\
         </table>';

    var tbl_overrides = ' \
        <form data-bind="submit: overrides_params">\
          <table style="width:100%;" class="subtable scalable"> \
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
                   <td><input type="number" id="price-input" class="inputs"\
                    data-bind="textInput: price, attr: {value: price}"></td> \
               </tr> \
               <tr><td class="field" colspan="2">Bond Rating Override</td><td> \
                    <select id="rating-input" class="inputs" colspan="3" \
                        data-bind="options: available_rating, \
                        optionsText: function(item) {return item;}, \
                        selectedOptions: rating">\
                    </td></tr> \
               <tr> \
                 <td class="field">Bond STW</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stw)"></div> \
                 </td> \
                 <td>Score(STW)</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stw_score)"></div> \
                 </td> \
                 <td>Signal(STW)</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stw_strength)"></div> \
                 </td> \
               </tr> \
               <tr> \
                 <td class="field">Bond STM</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stm)"></div> \
                 </td> \
                 <td>Score(STM)</td> \
                 <td class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stm_score)"></div> \
                 </td>\
                 <td>Signal(STM)</td> \
                 <td class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stm_strength)"></div> \
                 </td> \
               </tr>\
             </tbody> \
           </table>\
         </form>';

    var tbl_overrides_detailed = ' \
        <form data-bind="submit: overrides_params">\
          <table style="width:100%;" class="subtable scalable"> \
            <thead class="group"> \
              <tr> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
                <th style="width: 12.5%"><font></font></th> \
              </tr> \
            </thead> \
            <tbody> \
             <tr class="group"> <td colspan="8"><font>Overrides Model Input</font></td> </tr> \
               <tr><td class="field" colspan="2">Bond Price Override</td> \
                   <td colspan="2"><input type="number" id="price-input" class="inputs" colspan="3"\
                    data-bind="textInput: price, attr: {value: price}"></td> \
               </tr> \
               <tr><td class="field" colspan="2">Bond Rating Override</td> \
                 <td colspan="2"> \
                  <select id="rating-input" class="inputs" colspan="3" \
                      data-bind="options: available_rating, \
                      optionsText: function(item) {return item;}, \
                      selectedOptions: rating">\
                 </td> \
               </tr> \
               <tr> \
                 <td class="field">Bond STW</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stw)"></div> \
                 </td> \
                 <td class="field">Duration</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.2f\')(rvs_recalc().mod_dur_stw)"></div> \
                 </td> \
                 <td>Score (STW)</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stw_score)"></div> \
                 </td> \
                 <td>Signal (STW)</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stw_strength)"></div> \
                 </td> \
               </tr> \
               <tr> \
                 <td class="field">Bond STM</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stm)"></div> \
                 </td> \
                 <td class="field">Duration</td> \
                 <td colspan="1" class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.2f\')(rvs_recalc().mod_dur_stm)"></div> \
                 </td> \
                 <td>Score (STM)</td> \
                 <td class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stm_score)"></div> \
                 </td>\
                 <td>Signal (STM)</td> \
                 <td class="left status-tag"> \
                   <div data-bind="text: d3.format(\',.0f\')(rvs_recalc().stm_strength)"></div> \
                 </td> \
               </tr>\
             </tbody> \
           </table>\
         </form>';

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

    var tbl_regression_rslt = '\
            <table style="width:100%; height:100%; display: table" cellspacing="0"> \
              <tbody> \
                <tr class="group"> <td><font>Regression Results</font></td> </tr> \
                <tr>\
                  <td>\
                    <table id="rvs-coefs" style="width:100%; height:100%"> \
                      <thead> \
                        <tr>\
                          <th class="field" style="width:10%"></th> \
                          <th class="field" style="width:30%">name</th> \
                          <th style="width:25%" class="left"><div>beta</div></th> \
                          <th style="width:25%" class="left"><div>p-value</div></th> \
                          <th style="width:10%" class="left"><div>count</div></th> \
                        </tr> \
                      </thead> \
                      <tbody data-bind="foreach: reg_coefs"> \
                        <tr> \
                          <td data-bind="text: subcategory" class="subcategory"></td> \
                          <td data-bind="text: display_name" class="field"></td> \
                          <td class="left"><div data-bind="text: d3.format(\',.0f\')(coef)"/></td> \
                          <td class="left"><div data-bind="text: d3.format(\',.2f\')(pvalue)"/></td> \
                          <td class="left"><div data-bind="text: d3.format(\',.0f\')(count)"/></td> \
                        </tr> \
                      </tbody> \
                    </table> \
                  </td>\
                </tr>\
              </tbody>\
            </table>';

    var tbl_regression_summary = '\
            <table style="width:100%; height:100%; display: table" cellspacing="0"> \
              <tbody> \
                <tr class="group"> <td><font>Regression Summary</font></td> </tr> \
                <tr>\
                  <td>\
                    <table style="width:100%; height:100%"> \
                      <thead> \
                        <tr><th style="width:20%"></th> \
                            <th style="width:15%" class="left"><div></div></th> \
                            <th style="width:20%"><div></div></th> \
                            <th style="width:15%" class="left"><div></div></th> \
                            <th style="width:20%"><div></div></th> \
                            <th style="width:15%" class="left"><div></div></th></tr> \
                     </thead> \
                     <tbody> \
                        <tr> \
                          <td class="field">R Sqaure</td> \
                          <td class="left"><div data-bind="text: d3.format(\',.2f\')(reg_summary().rsquare)"/></td> \
                          <td class="field"><div>Num Of Obs.</div></td> \
                          <td class="left"><div data-bind="text: d3.format(\',.0f\')(reg_summary().num_of_obs)"/></td> \
                          <td class="field"><div>Num Of Outlier</div></td> \
                          <td class="left"><div data-bind="text: d3.format(\',.0f\')(reg_summary().num_of_outlier)"/></td> \
                        </tr> \
                        <tr> \
                          <td class="field">Average Spread</td> \
                          <td class="left"><div data-bind="text: d3.format(\',.0f\')(reg_summary().avg_sprd)"/></td> \
                          <td class="field"><div>Av. Spread (ex Outlier)</div></td> \
                          <td class="left"><div data-bind="text: d3.format(\',.2f\')(reg_summary().avg_sprd_ex_outlier)"/></td> \
                        </tr> \
                     </tbody> \
                    </table> \
                  </td>\
                </tr>\
              </tbody>\
            </table>';

    var tbl_regression_plot = '\
            <table style="width:100%; height:100%; display: table" cellspacing="0"> \
              <tbody> \
                <tr class="group"> <td><font>Regression Plot</font></td> </tr> \
                <tr>\
                  <td>\
                    <div style="height:100%; width: 100%" id="regression_plot"></div>\
                  </td>\
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
              <tr> \
                <td rowspan="1" class="tbl-element-slim"> \
                  <table style="width:100%; height:100%; display: table"> \
                    <tbody> \
                      <tr><td>{tbl_left}</td></tr> \
                      <tr><td>{tbl_overrides}</td></tr> \
                    </tbody> \
                  </table> \
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
                <th style="width: 35%"><font></font></th> \
                <th style="width: 20%"><font></font></th> \
                <th style="width: 45%"><font></font></th> \
              </tr> \
            </thead> \
            <tbody> \
              <tr> \
                <td rowspan="2" class="tbl-element"> \
                     <table class="content-table" style="width:100%; height:100%; display: table" cellspacing="0"> \
                      <thead class="group"> \
                        <tr> \
                          <th style="width: 100%"><font></font></th> \
                        </tr> \
                      </thead> \
                      <tbody> \
                        <tr> \
                          <td rowspan="1" class="tbl-element-slim"> \
                            <table style="width:100%; height:100%; display: table"> \
                              <tbody> \
                                <tr><td>{tbl_left}</td></tr> \
                                <tr><td>{tbl_overrides_detailed}</td></tr> \
                              </tbody> \
                            </table> \
                          </td> \
                        </tr> \
                        <tr> \
                          <td rowspan="1" style="height: 100%" class="tbl-element-slim">{score_hist_extend}</td> \
                        </tr> \
                      </tbody> \
                  </table> \
                </td> \
                <td rowspan="1" class="tbl-element">{tbl_factor_loadings}</td>\
                <td rowspan="1" class="tbl-element">{tbl_regression_plot}</td>\
              </tr> \
              <tr> \
                <td colspan="2" style="height:20%" class="tbl-element">{tbl_regression_summary}</td> \
              </tr> \
            </tbody> \
          </table> \
        </div>\
        <div style="width:100%; height: 100%; top: 0px; left: 0px; \
            position: absolute; background: white; text-align: center;"\
           id="foreground">\
           <text></text> \
        </div>';

    $.fn.init_rvs = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })

        self.update = function(sid) {
            var args = arguments;
            self.each(function(i, div) {
                div.update.apply(div, args)
            })
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
        self.options.row_max_height = self.options.row_max_height || 30;
        self.options.t_date = self.options.t_date || d3.timeFormat('%Y-%m-%d')(new Date());
        self.options.extend = self.options.extend && ($(self).width() >= 650);
        self.options.keep_ratio = 16 / 9 // width / height ratio in extend model

        self.vm = new (function(){
            var vm = this;
            this.rvs_info = ko.observable({'loadings': {}});
            self._reg_coefs = null;
            this.reg_coefs = ko.observableArray([]);
            this.reg_summary = ko.observable({});
            this.reg_plot = null;

            this._t_date = ko.observable(self.options.t_date);
            this.t_date = ko.computed({
                read: function(){
                    return this._t_date();
                },
                write:function(val){
                    self.options.t_date = val;
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

            this.rvs_recalc = ko.observable({});

            this.overrides_params = function() {
                overrides_params.call(self, vm)};

            this.recalc_rvs = function() {
                update.call(self, vm.rvs_info().security_id, self.px_trd_hist)};
        })();

        $(self).addClass('signal-rvs');
        $(self).append('<div id="container"></div>');
        $('#container', self).append('<div id="content"></div>');

        var html_script;
        if (self.options.extend) {
            html_script = skeleton_extend;
        } else {
            html_script = skeleton;
        }

        html_script = html_script
            .replace('{tbl_left}', tbl_left)
            .replace('{tbl_overrides}', tbl_overrides)
            .replace('{tbl_overrides_detailed}', tbl_overrides_detailed)
            .replace('{tbl_factor_loadings}', tbl_regression_rslt)
            .replace('{tbl_regression_summary}', tbl_regression_summary)
            .replace('{score_hist}', score_hist)
            .replace('{score_hist_extend}', score_hist_extend)
            .replace('{tbl_regression_plot}', tbl_regression_plot);

        $('#content', self).append(html_script);
        ko.applyBindings(self.vm, $('#container', self)[0]);
        $('table.scalable tbody tr', self).css(
            'height', Math.min(self.options.row_max_height, $(self).height() * 0.030) + 'px');

        change_loading_status.call(self, 'waiting');

        var colors = d3.scaleOrdinal(d3.schemeCategory10);

        self.score_plot = $('div#score-hist', self).init_interactive_plot({
            lines: {
                data: [
                    {field: 'rvs_score', axis: 'yaxis2',
                     legend: 'rvs score (lhs)',color: () => (colors(2))},
                    {field: 'signal_strength', axis: 'yaxis1',
                     legend: 'rvs signal (rhs)', color: () => (colors(1))}
                ],
                color: function(i) {return colors(i)}
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
                    fmt: function(x) {return d3.format(',.0f')(x)},
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
                plotarea: 'signal_strength',
                field: 'date',
                fmt: d3.timeFormat("%b '%y"),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%Y-%m-%d'),
                scale: d3.scaleTime()
            },
            zoombar: true,
            naviH: "25",
            heightOffset: 4,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {};
                var idx = data['rvs_score'].indexOf(data['rvs_score'].filter((x)=>(x))[0]);
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice(idx);});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            update: function(data) {
                this.updateWithData(data.px_trd_hist);
            }
        });

        self.score_plot_extend = $('div#score-hist-extend', self).init_interactive_plot({
            lines: {
                data: [
                    {field: 'signal_strength', axis: 'yaxis1',
                     legend: 'rvs signal (rhs)', color: () => (colors(1))},
                    {field: 'rvs_score', axis: 'yaxis2',
                     legend: 'rvs score (lhs)',color: () => (colors(2))}
                ],
                color: function(i) {return colors(i)}
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
                    fmt: function(x) {return d3.format(',.0f')(x)},
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
            naviH: "25",
            heightOffset: 4,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            update: function(data) {
                //ts = JSON.parse(ts.replace(/NaN/g, 'null'));
                // format each data point
                var line_config = line_configuration(data);
                this.update_options_lines(line_config);
                this.updateWithData(data.px_trd_hist);
            }
        });

        var regression_tooptip_tmplt = ' \
          <table id="reg-tooltip"> \
            <thead> \
              <tr> \
                <th id="circle" class="sym"></th> \
                <th colspan="3" class="val" data-bind="text: bond_name"></th> \
              </tr> \
            </thead> \
              <tbody>\
                <tr> \
                  <td class="val">SecurityID</td> <td class="val" data-bind="text: sid"><td/> \
                  <td class="val">Duration</td> <td class="val" data-bind="text: d3.format(\',.1f\')(bond_dur)"><td/> \
                </tr> \
                <tr> \
                  <td class="val">Sector</td> <td colspan="3" class="val" data-bind="text: sector"></td> \
                </tr> \
                <tr> \
                  <td class="val">Rating</td> <td class="val" data-bind="text: bond_rtg"><td/> \
                  <td class="val">RVS Score</td> <td class="val" data-bind="text: score"></td> \
                </tr>\
                <tr> \
                  <td class="val">Bond Spread</td> <td class="val" data-bind="text: d3.format(\',.0f\')(bond_spread)"><td/> \
                  <td class="val">Fair Spread</td> <td class="val" data-bind="text: d3.format(\',.0f\')(fair_spread)"></td> \
                </tr>\
              </tbody>\
          </table>\
          ';

        self.regression_plot = $('div#regression_plot', self).init_interactive_plot({
            scatters: {
                data: [
                    {
                        field: 'bond_stw',
                        axis: 'yaxis1',
                        radius: 3,
                        tooltipfmt: function(self, d, i) {
                            var vm = {
                                bond_name: d.attr.description,
                                bond_dur: d.attr.bond_dur,
                                fair_spread: d.index,
                                bond_spread: d.value,
                                bond_rtg: d.attr.rtg,
                                sid: d.attr.sid,
                                sector: d.attr.sector,
                                score: d.attr.rvs_score
                            }
                            var $tmplt = $(regression_tooptip_tmplt);
                            ko.applyBindings(vm, $tmplt[0]);
                            $(this).append($tmplt);
                            d3.select(this).selectAll('th#circle')
                                .append('svg')
                                .style('width', 14)
                                .style('height', 14)
                                .append('circle')
                                .attr('r', 4).attr('cx', 7)
                                .attr('cy', 7)
                                .style('fill', self.options.scatters.data[d.i].color(d.j, d));
                        },
                        data_attr: function(d, data) {
                            d.attr = {
                                rvs_score: data.rvs_score[d.j],
                                sid: data.security_id[d.j],
                                description: data.description[d.j],
                                rtg: data.bond_rtg[d.j],
                                bond_dur: data.bond_dur[d.j],
                                signal: data.signal_strength[d.j],
                                sector: data.sector[d.j]};
                        },
                        point_attr: function(d) {
                            $(this).attr('class', 'scatter');
                            $(this).addClass('sector-'+d.attr.sector);
                            $(this).addClass('rtg-'+d.attr.rtg);
                            $(this).addClass('score-'+d.attr.rvs_score);
                            $(this).addClass('dur-'+d.attr.bond_dur);
                            $(this).addClass('general-point');
                        },
                        dblclick: function(d) {
                            var params = [];
                            var url_parms = {}
                            var url = new URL(window.location.href);
                            url_parms['trading_records'] = parseInt(url.searchParams.get("trading_records")) || 0;
                            if (url_parms['trading_records']) {
                                url_parms['fund_id'] = parseFloat(url.searchParams.get("fund_id")).toFixed(3);
                                url_parms['paper_trade'] =  url.searchParams.get("paper_trade") != null? parseInt(
                                    url.searchParams.get("paper_trade")) : 1;
                                url_parms['hide_panel'] = url.searchParams.get("hide_panel") != null? parseInt(
                                    url.searchParams.get("hide_panel")) : 1;
                            }
                            url_parms['hide_panel'] = 0;
                            $.each(url_parms, (x, y) => {
                                params.push(x + "=" +y)});
                            window.open("./index?sid=" + d.attr['sid'] + '&' + params.join('&'), "_blank");
                        },
                        color: function(j, d){
                            // return d3.rgb("red")
                            var color =d3.scaleLinear().domain([1, 10])
                                .interpolate(d3.interpolateHcl)
                                .range([d3.rgb("red"), d3.rgb('green')]);
                            return color(d.attr.rvs_score);
                        }
                    },
                    {
                        field: 'bond_stw_2',
                        axis: 'yaxis1',
                        radius: 4,
                        tooltipfmt: function(self, d, i) {
                            var vm = {
                                bond_name: d.attr.description,
                                bond_dur: d.attr.bond_dur,
                                fair_spread: d.index,
                                bond_spread: d.value,
                                bond_rtg: d.attr.rtg,
                                sid: d.attr.sid,
                                sector: d.attr.sector,
                                score: d.attr.rvs_score
                            }
                            var $tmplt = $(regression_tooptip_tmplt);
                            ko.applyBindings(vm, $tmplt[0]);
                            $(this).append($tmplt);
                            d3.select(this).selectAll('th#circle')
                                .append('svg')
                                .style('width', 14)
                                .style('height', 14)
                                .append('circle')
                                .attr('r', 4).attr('cx', 7)
                                .attr('cy', 7)
                                .style('fill', self.options.scatters.data[d.i].color(d.j, d));
                        },
                        dblclick: function(d) {
                            var params = [];
                            var url_parms = {}
                            var url = new URL(window.location.href);
                            url_parms['trading_records'] = parseInt(url.searchParams.get("trading_records")) || 0;
                            if (url_parms['trading_records']) {
                                url_parms['fund_id'] = parseFloat(url.searchParams.get("fund_id")).toFixed(3);
                                url_parms['paper_trade'] =  url.searchParams.get("paper_trade") != null? parseInt(
                                    url.searchParams.get("paper_trade")) : 1;
                                url_parms['hide_panel'] = url.searchParams.get("hide_panel") != null? parseInt(
                                    url.searchParams.get("hide_panel")) : 1;
                            }
                            url_parms['hide_panel'] = 0;
                            $.each(url_parms, (x, y) => {
                                params.push(x + "=" +y)});
                            window.open("./index?sid=" + d.attr['sid'] + '&' + params.join('&'), "_blank");
                        },
                        data_attr: function(d, data) {
                            d.attr = {
                                rvs_score: data.rvs_score[d.j],
                                sid: data.security_id[d.j],
                                description: data.description[d.j],
                                rtg: data.bond_rtg[d.j],
                                bond_dur: data.bond_dur[d.j],
                                priority: data.priority[d.j],
                                signal: data.signal_strength[d.j],
                                sector: data.sector[d.j]};
                        },
                        point_attr: function(d) {
                            $(this).attr('class', 'scatter');
                            $(this).addClass('sector-'+d.attr.sector);
                            $(this).addClass('rtg-'+d.attr.rtg);
                            $(this).addClass('score-'+d.attr.rvs_score);
                            $(this).addClass('dur-'+d.attr.bond_dur);
                            $(this).addClass('priority-'+d.attr.priority);
                            $(this).addClass('same-parent-point');
                        },
                        color: function(j, d){
                            return d3.rgb("steelblue");
                        }
                    }
                ]
            },
            fitcurve: {
                data: [
                    {field: 'fair_spread', axis: 'yaxis1', sort: true,
                     tooltipfmt: function() {return ''},
                     color: function() {return colors(0)}
                    }]},
            xaxis: {field: 'fair_spread',
                    fmt: function(x) {return d3.format(',.0f')(x)},
                    tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                    scale:d3.scaleLinear()},
            yaxis: {
                yaxis1: {
                    fmt: function(x) {return d3.format('.0f')(x)},
                    tooltipfmt: function(x) {return d3.format('.0f')(x)},
                    anchor: 'right',
                    domain_margin: 0.2,
                    pos: function() {return this.options.width},
                    scale:d3.scaleLinear()}
            },
            navigator: {
                field: 'fair_spread',
                fmt: d3.format(',.0f'),
                tooltipfmt: function() {return '';},
                domainfmt: d3.format(',.0f'),
                scale: d3.scaleLinear(),
                gradient: {color: function(d) {
                    return "rgba(70, 130, 180, 0.4)";
                }}
            },
            zoombar: false,
            legendbar: false,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                return dataClone;
            },
            update: function(data) {
                this.updateWithData(data);
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
            var self = this;
            self.px_trd_hist = px_trd_hist;
            startLoading();
            var t_date = self.vm._t_date();
            change_loading_status.call(self, 'waiting');

            $.ajax({
                url: self.options['url_update'],
                method: "POST",
                dataType: 'text',
                data: {
                    sid: sid,
                    t_date: t_date,
                    px_trade_data: JSON.stringify(px_trd_hist)
                },
                "success": function(text) {
                    endLoading();
                    $('#foreground', self).css('display', 'none');
                    var raw_data = JSON.parse(text.replace(/NaN/g, null));
                    self.raw_data = raw_data;
                    update_with_data.call(self, raw_data);
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

        function overrides_params(vm) {
            var self = this;
            change_loading_status.call(self, 'calculating');
            $.ajax({
                url: self.options['url_override_params'],
                method: "POST",
                dataType: 'text',
                data: {
                    rvs_info: JSON.stringify(vm.rvs_info()),
                    price: vm.price(),
                    rtg: vm.rating()[0],
                    t_date: vm._t_date(),
                    reg_coefs: JSON.stringify(vm._reg_coefs),
                    reg_data: JSON.stringify(vm.reg_plot)
                },
                "success": function(text) {
                    change_loading_status.call(self, 'hide');
                    var data = JSON
                        .parse(
                            text.replace(/Infinity/g, null)
                                .replace(/NaN/g, null));
                    vm.rvs_recalc({
                        stw: data['g_stw'],
                        mod_dur_stw: data['modified_dur'],
                        stw_score: data['stw_score'],
                        stw_strength: data['stw_strength'],
                        stm: data['g_stm'],
                        mod_dur_stm: data['mat_dur'],
                        stm_score: data['stm_score'],
                        stm_strength: data['stm_strength']
                    });
                },
                error: function (error) {
                    change_loading_status.call(self, 'error');
                    // error.responseText;
                }
            });
        }

        function line_configuration(data) {
            var url = new URL(window.location.href);
            var sec_types = data['sec_types'];
            var colors = d3.scaleOrdinal(d3.schemeCategory10);
            var color_1 = colors(0);
            var color_2 = colors(1);
            var color_3 = '#00CDAC';

            var config_score = [
                {field: 'signal_strength', axis: 'yaxis2', legend: 'rvs signal (lhs)', color: () => color_2},
                {field: 'rvs_score', axis: 'yaxis3', legend: 'rvs score (lhs)', color: () => color_3}
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
                                                   <thead><tr><th>fund_id</th><th>date</th><th>quantity</th>\
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

        function update_with_data(raw_data) {
            var self = this;
            if (raw_data == null)
                return;

            var data = raw_data;
            var reg_rslt = data['reg_rslt'];
            var coefs = reg_rslt.filter((x)=> x['category']=='regressor');

            self.vm.rvs_info(data['rvs_details']);
            self.vm.price(data['rvs_details'].bond_px);
            self.vm.available_rating(data['available_rtg']);
            self.vm.rating([data['rvs_details'].loadings.rating]);
            self.score_plot.update(data["rvs_hist"]);
            self.vm.reg_plot = data["reg_plot"];
            self.vm._reg_coefs = coefs;

            if (self.options.extend) {
                self.vm.reg_coefs(coefs);
                self.vm.reg_summary(data['rvs_reg_summary']);
                self.regression_plot.update(data["reg_plot"]);
                self.score_plot_extend.update(data["rvs_hist"]);
                update_coefs_tbl.call(self);
            }
            change_loading_status.call(self, 'ready');
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

        function resize() {
            var self = this;
            $(self).html("");
            self.options.extend = true;
            initialize.call(self, self.options);
            update_with_data.call(self, self.raw_data);
            $('#foreground', self).css('display', 'none');
        }

        function update_coefs_tbl() {
            var self = this;
            var uni_cat = $('table#rvs-coefs td.subcategory', self).map(
                (i, p)=> $(p).text()).toArray().filter((v, i, a) => a.indexOf(v) === i);
            uni_cat.forEach(function(p, i) {
                var rows = $('table#rvs-coefs td.subcategory:contains("'+p+'")');
                $(rows[0]).attr('rowspan', rows.length);
                rows.slice(1).css('display', 'none');
            })

        }

        function change_loading_status(status) {
            var self = this;
            d3.select(self).selectAll('td.status-tag')
                .selectAll('div.status-div')
                .data([1]).enter()
                .append('div').attr('class', 'status-div');

            $('td.status-tag>div.status-div', self).attr('class', 'status-div ' + status);
            if (status == 'waiting') {
                $('td.status-tag>div:first-child', self).css('display', 'none');
                $('td.status-tag>div.status-div', self).css('display', 'inline-block');
                $('td.status-tag>div.status-div', self).text('waiting...')
            }

            if (status == 'calculating') {
                $('td.status-tag>div:first-child', self).css('display', 'none');
                $('td.status-tag>div.status-div', self).css('display', 'inline-block');
                $('td.status-tag>div.status-div', self).text('calculating...')
            }

            if (status == 'ready') {
                $('td.status-tag>div:first-child', self).css('display', 'none');
                $('td.status-tag>div.status-div', self).css('display', 'inline-block');
                $('td.status-tag>div.status-div', self).text('ready')
            }

            if (status == 'hide') {
                $('td.status-tag>div:first-child', self).css('display', 'inline-block');
                $('td.status-tag>div.status-div', self).css('display', 'none');
                $('td.status-tag>div.status-div', self).text('')
            }

            if (status == 'error') {
                $('td.status-tag>div:first-child', self).css('display', 'none');
                $('td.status-tag>div.status-div', self).css('display', 'inline-block');
                $('td.status-tag>div.status-div', self).text('erro')
            }
        }
    }
})(jQuery);
