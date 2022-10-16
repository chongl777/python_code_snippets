(function($){
    var html_template =
            '<div style="float: left; display: flex; flex-direction: row; justify-content: space-around;"> \
            <table id="1" class="row-border" style="width:45%;"> \
                <thead> \
                    <tr> \
                      <th>field</th> \
                      <th>value</th> \
                    </tr> \
                </thead> \
                <tbody> \
                    <tr class="group"><td colspan="2"><font>General Info</font></td></tr> \
                        <tr><td>Description</td> <td data-bind="text: general_info().description"></td></tr> \
                        <tr><td>Short Name</td> <td data-bind="text: general_info().short_name"></td></tr> \
                        <tr><td>Issue Date</td> <td data-bind="text: general_info().issue_date"></td></tr> \
                        <tr><td>Issued Amount</td> <td data-bind="text: d3.format(\',.0f\')(general_info().amt_issued)"></td></tr> \
                        <tr><td>Maturity</td><td data-bind="text: general_info().maturity"></td></tr> \
                        <tr><td>Currency</td><td data-bind="text: general_info().ccy"></td></tr> \
                        <tr><td>Security Type Code</td><td data-bind="text: general_info().product_code"></td></tr> \
                        <tr><td>Status</td><td data-bind="text: general_info().status"></td></tr> \
                        <tr data-bind="style: {display: sec_type()==3? \'table-row\' : \'none\'}"><td>Next Earning Date (Est.)</td><td data-bind="text: general_info().earning_date_est"></td></tr> \
                    <tr class="group"><td colspan="2"><font>Identifier</font></td></tr> \
                        <tr><td>SecurityID</td><td data-bind="text: general_info().security_id"></td></tr> \
                        <tr><td>Cusip</td><td data-bind="text: general_info().cusip"></td></tr> \
                        <tr><td>ISIN</td><td data-bind="text: general_info().isin"></td></tr> \
                        <tr><td>BBG ID</td><td data-bind="text: general_info().bbg_id"></td></tr> \
                        <tr><td>FINRA ID</td><td data-bind="text: general_info().finra_ticker"></td></tr> \
                    <tr class="group"><td colspan="2"><font>Sector & Region</font></td></tr> \
                        <tr><td>Sector</td><td data-bind="text: industry_level_1"></td></tr> \
                        <tr><td>SubSector</td><td data-bind="text: industry_level_2"></td></tr> \
                        <tr><td>BBG Industry Code</td><td data-bind="text: general_info().industry_code"></td></tr> \
                        <tr><td>Country</td><td data-bind="text: general_info().cntry_of_risk"></td></tr> \
                        <tr><td>Region</td><td data-bind="text: general_info().region"></td></tr> \
                    <tr class="group"><td colspan="2"><font>Company Info</font></td></tr> \
                      <tr><td>Company ID</td><td data-bind="text: general_info().company_id"></td></tr> \
                      <tr><td>Parent ID</td><td data-bind="text: general_info().parent_id"></td></tr> \
                    <tr class="group" data-bind="style: {display: CURRENT_USER.access_level <=1 ? \'table-row\' : \'none\'}"><td colspan="2"><font>Strategy</font></td></tr> \
                      <tr data-bind="style: {display: CURRENT_USER.access_level <=1 ? \'table-row\' : \'none\'}"><td>Signal</td><td>\
                          <a data-bind="attr: {href: \'https://wfiubuntu01.wfi.local/ngapps/pfmgmt/#/security/trading_signal\'+general_info().strategy_page}" \
                            target="_blank" class="trade-history-link">View</a></td></tr> \
                </tbody> \
            </table> \
            <table id="2" class="row-border" style="width:45%;"> \
                <thead> \
                  <tr> \
                    <th>field</th> \
                    <th>value</th> \
                  </tr> \
                </thead> \
                <tbody> \
                    <tr class="group"><td colspan="2"><font>Coupon</font></td></tr> \
                      <tr><td>Coupon</td><td data-bind="text: general_info().coupon"></td></tr> \
                      <tr><td>Sinkable</td><td data-bind="text: general_info().sinkable"></td></tr> \
                      <tr><td>Callable</td><td data-bind="text: general_info().callable"></td></tr> \
                      <tr><td>Putable</td><td data-bind="text: general_info().putable"></td></tr> \
                      <tr><td>Multiplier</td><td data-bind="text: general_info().multiplier"></td></tr> \
                    <tr class="group"><td colspan="2"><font>Price Info</font></td></tr> \
                      <tr><td>Last Price(BVAL)</td><td data-bind="text: px_bval"></td></tr> \
                      <tr><td>Last Time(BVAL)</td><td data-bind="text: t_date_bval"></td></tr> \
                      <tr data-bind="style: {display: sec_type()==1? \'table-row\' : \'none\'}"><td>Last Price(FINRA)</td><td data-bind="text: px_finra"></td></tr> \
                      <tr data-bind="style: {display: sec_type()==1? \'table-row\' : \'none\'}"><td>Last Time(FINRA)</td><td data-bind="text: t_date_finra"></td></tr> \
                      <tr data-bind="style: {display: sec_type()==1? \'table-row\' : \'none\'}"><td>Trade History</td><td><a data-bind="attr: {href: finra_link}" target="_blank" class="trade-history-link">View</a></td></tr> \
                      <tr><td>Chg (1day)</td><td data-bind="text: chg_1d.extend({format: \'.2%\'}) \
                      , css: {positive: chg_1d()>0, negative: chg_1d()<0}"></td></tr> \
                      <tr><td>Chg (5day)</td><td data-bind="text: chg_5d.extend({format: \'.2%\'}) \
                      , css: {positive: chg_5d()>0, negative: chg_5d()<0}"></td></tr> \
                      <tr><td>Last Time(Return)</td><td data-bind="text: chg_last_date"></td></tr> \
                      <tr><td>Vol (1 year)</td><td data-bind="text: vol_1y.extend({format: \'.2%\'})"></td></tr> \
                    <tr class="group"><td colspan="2"><font>Additional Attributes</font></td></tr> \
                      <tr><td>Current Outstanding</td><td data-bind="text: d3.format(\',.0f\')(amt_out()) + (sec_type()==3? \'MM\':\'\')"></td></tr> \
                      <tr><td>Last Update(Outstanding)</td><td data-bind="text: t_date_amt_out"></td></tr> \
                      <tr><td>Short Status</td>\
                          <td id="short_status" data-bind="text: short_cost_info().short_status, \
                              attr: {class: (short_cost_info().short_status||\'\').replace(\' \', \'-\')}"></td></tr> \
                      <tr><td>Short Cost</td><td data-bind="text: short_cost_info().short_cost"></td></tr> \
                      <tr><td>Allocated Qty</td><td data-bind="text: d3.format(\',.0f\')(short_cost_info().allocated_qty)"></td></tr> \
                      <tr><td>Last Update(Short Cost)</td><td data-bind="text: short_cost_info().short_lasttime"></td></tr> \
                      <tr><td>LiqScore</td><td data-bind="text: liq_info().liqscore"></td></tr> \
                      <tr><td>MktSeg Qty</td><td data-bind="text: liq_info().marketsegment"></td></tr> \
                      <tr><td>Last Update(Liq Score)</td><td data-bind="text: liq_info().lastupdate_liq"></td></tr> \
                      <tr><td>Current Allocation</td><td id="sec-info-current-allocation"></td></tr> \
                </tbody> \
            </table> \
            </div>';

    var vm = null;

    ko.extenders.format = function(target, fmt) {
        var result = ko.computed({
            read: function() {
                return d3.format(fmt)(target())
            },
            write: target
        });

        result.raw = target;
        return result;
    };

    $.fn.init_sec_info = function(options) {
        this.each(function(i, div) {
            initialize.call(div, options);
        })
        return this;
    }
    var initialize = function(options) {
        // unique id
        var self = this;
        options.update = options.update || function() {}
        self.options = options;
        $(self).addClass('wfi-sec-info');
        var widget = $('table', self);
        self.update = options.update;
        self.updateWithData = updateWithData;
        return this;
    };

    var updateWithData = function(data) {
        var self = this;
        if (vm == null) {
            init_vm.call(self, data);
        } else {
            update_vm.call(self, data);
        }
    };

    function update_vm(data) {
        $.each(data, function(p) {
            vm[p](data[p] == null ? '-' : data[p]);
        })
    }

    function init_vm(data) {
        var self = this;
        vm = {};
        $(self).append(html_template);
        $.each(data, function(p) {
            vm[p] = ko.observable(data[p]);
        })
        ko.applyBindings(vm, self);
    }

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(sid, params) {
            if (sid == null) {
                return;
            }
            var widget = this;
            startLoading();
            $.ajax({
                url: "get_security_info",
                method: "GET",
                dataType: 'json',
                data: {
                    "sid": sid},
                success: function(data) {
                    //data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                    endLoading();
                    var params_vec = [];
                    $.each(params, (x, y) => {params_vec.push(x + "=" +y)});
                    // data.general_info.strategy_page = 'index?sid='+sid + '&' + params_vec.join('&');
                    data.general_info.strategy_page = '?sid='+sid;
                    widget.updateWithData(data);
                },
                error: function (msg) {
                    endLoading();
                    window.alert("secinfo.js:"+msg.responseText);
                }
            })
        };
        return update;
    }
})(jQuery);


(function($){
    var html_template_bond =
            '<div style="float: left; display: flex; flex-direction: row; \
              justify-content: space-around;"> \
            <div id="coupon" class="cash-flow-table" style="width:40%;"> \
            </div> \
            <div id="factor" class="cash-flow-table" style="width:40%;"> \
            </div> \
            </div>';

    var html_template_spg =
            '<div style="float: left; display: flex; flex-direction: row; \
              justify-content: space-around; padding-bottom: 10px"> \
               <div id="coupon" class="cash-flow-table" style="width:40%;"> \
               </div> \
               <div id="factor" class="cash-flow-table" style="width:40%;"> \
               </div> \
            </div>\
           <div style="float: left; display: flex; flex-direction: row; \
              justify-content: space-around;"> \
               <div id="default_data" class="cash-flow-table" style="width:90%;"> \
               </div> \
            </div>';

    var html_template_equity =
            '<div style="float: left; display: flex; flex-direction: row; \
              justify-content: space-around;"> \
            <div id="dvd-prj" class="cash-flow-table" style="width:95%;"> \
            </div> \
            </div>';

    var vm = null;

    ko.extenders.format = function(target, fmt) {
        var result = ko.computed({
            read: function() {
                return d3.format(fmt)(target())
            },
            write: target
        });

        result.raw = target;
        return result;
    };

    $.fn.init_sec_info_cashflow = function(
        startLoading=function(){},
        endLoading=function(){}) {
        this.each(function(i, div) {
            initialize(
                div,
                startLoading,
                endLoading);
        })
        return this;
    }
    var initialize = function(
        self, startLoading, endLoading) {
        // unique id
        $(self).addClass('wfi-sec-info-cash-flow');
        self.update = updateWithLoadingIcon(startLoading, endLoading);
        self.updateWithData = updateWithData;
        return this;
    };

    var updateWithData = function(data) {
        var self = this;
        if (data['secTyp'] == 3) {
            $(self).html(html_template_equity);
            addTitle($('#dvd-prj', self).init_wfi_table({
                title: 'DIVIDEND PROJECTION',
                groupdata: false,
                bPaginate: true,
                iDisplayLength: 22,
                columns_setup: [
                    {data: "ex_date",
                     sortable: false,
                     visible: true,
                     title: 'Ex Date',
                     width: '40%',
                     render: function(value, type, row) {
                         var self = this;
                         var t_date = d3.timeFormat('%Y-%m-%d')(
                             d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                         return '<div style="margin-left:5px">' + t_date + '</div>';
                     }},
                    {data: "amt_per_share",
                     sortable: false,
                     visible: true,
                     title: 'Amount/Share',
                     width: '30%',
                     render: function(value, type, row) {
                         var self = this;
                         return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value) + '</div>';
                     }},
                    {data: "projected_confirmed",
                     sortable: false,
                     visible: true,
                     title: 'Status',
                     width: '30%',
                     render: function(value, type, row) {
                         var self = this;
                         return '<div class="value" style="margin-left:5px">' + value + '</div>';
                     }}]
            }), false, false).updateWithData(data['dividend_schedule']);
        } else if ([1, 9, 10, 11, 12, 16].indexOf(data['secTyp']) != -1) {
          if ([1, 16].indexOf(data['secTyp']) != -1) {
            $(self).html(html_template_bond);
          } else {
            $(self).html(html_template_spg);
          }

          if ([9, 10, 11, 12].indexOf(data['secTyp']) != -1) {
            addTitle($('#default_data', self).init_wfi_table({
              datasource: 'default_data',
              title: 'DEFAULT DATA',
              groupdata: false,
              bPaginate: true,
              iDisplayLength: 14,
              columns_setup: [
                {data: "event_date",
                 sortable: false,
                 visible: true,
                 title: 'event date',
                 width: '20%',
                 render: function(value, type, row) {
                   var self = this;
                   var t_date = d3.timeFormat('%Y-%m-%d')(
                     d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                   return '<div style="margin-left:5px">' + t_date + '</div>';
                 }},
                {data: "company_id",
                 sortable: false,
                 visible: true,
                 title: 'company id',
                 width: '20%',
                 render: function(value, type, row) {
                   var self = this;
                   return '<div class="value" style="margin-left:5px">' + d3.format('.0f')(value) + '</div>';
                 }},
                {data: "auction_date",
                 sortable: false,
                 visible: true,
                 title: 'Acuntion Date',
                 width: '20%',
                 render: function(value, type, row) {
                   var self = this;
                   var t_date = d3.timeFormat('%Y-%m-%d')(
                     d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                   return '<div style="margin-left:5px">' + t_date + '</div>';
                 }},
                {data: "recovery_rate",
                 sortable: false,
                 visible: true,
                 title: 'Recovery Rate',
                 width: '20%',
                 render: function(value, type, row) {
                   var self = this;
                   return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value*100) + '%</div>';;
                 }},
                {data: "company_name",
                 sortable: false,
                 visible: true,
                 title: 'company name',
                 width: '20%',
                 render: function(value, type, row) {
                   var self = this;
                   return '<div class="value right-aligned" style="margin-left:5px">' + value + '</div>';;
                 }}
              ]
            }), false, false).updateWithData(data['default_data']);
          }

          addTitle($('#coupon', self).init_wfi_table({
            datasource: 'coupon_schedule',
            title: 'COUPON SCHEDULE',
            groupdata: false,
            bPaginate: true,
            iDisplayLength: 14,
            columns_setup: [
              {data: "t_date",
               sortable: false,
               visible: true,
               title: 'Coupon date',
               width: '40%',
               render: function(value, type, row) {
                 var self = this;
                 var t_date = d3.timeFormat('%Y-%m-%d')(
                   d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                 return '<div style="margin-left:5px">' + t_date + '</div>';
               }},
              {data: "coupon",
               sortable: false,
               visible: true,
               title: 'Coupon',
               width: '30%',
               render: function(value, type, row) {
                 var self = this;
                 return '<div class="value" style="margin-left:5px">' + d3.format('.4f')(value*100) + '%</div>';
               }},
              {data: "principal_amt",
               sortable: false,
               visible: true,
               title: 'Principal Amt',
               width: '30%',
               render: function(value, type, row) {
                 var self = this;
                 return '<div class="value" style="margin-left:5px">' + d3.format('.0f')(value) + '</div>';
               }}]
          }), false, false).updateWithData(data['coupon_schedule']);

          addTitle($('#factor', self).init_wfi_table({
            datasource: 'coupon_schedule',
            title: 'FACTOR SCHEDULE',
            groupdata: false,
            bPaginate: true,
            iDisplayLength: 14,
            columns_setup: [
              {data: "t_date",
               sortable: false,
               visible: true,
               title: 'Factor Date',
               width: '50%',
               render: function(value, type, row) {
                 var self = this;
                 var t_date = d3.timeFormat('%Y-%m-%d')(
                   d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                 return '<div style="margin-left:5px">' + t_date + '</div>';
               }},
              {data: "factor",
               sortable: false,
               visible: true,
               title: 'Factor',
               width: '50%',
               render: function(value, type, row) {
                 var self = this;
                 return '<div class="value" style="margin-left:5px">' + d3.format('.4f')(value) + '</div>';
               }}]
          }), false, false).updateWithData(data['factor_schedule']);
        }
    };

    function update_vm(data) {
        $.each(data, function(p) {
            vm[p](data[p] == null ? '-' : data[p]);
        })
    }

    function init_vm(data) {
        var self = this;
        vm = {};
        $.each(data, function(p) {
            vm[p] = ko.observable(data[p]);
        })
        ko.applyBindings(vm, self);
    }

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(sid) {
            if (sid == null) {
                return;
            }
            var widget = this;
            startLoading();
            $.ajax({
                url: "get_security_info_cash_flow",
                method: "GET",
                dataType: 'json',
                data: {
                    "sid": sid},
                success: function(data) {
                    //data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                    endLoading();
                    widget.updateWithData(data);
                },
                error: function (msg) {
                    endLoading();
                    window.alert("secinfo.js:"+msg.statusText);
                }
            })
        };
        return update;
    }

    function addTitle(obj, config=true, download=false) {
        var source = '<header class="title"> \
                    <h data-bind="text: title"></h> \
                    <div id="buttons"> \
                        <span id="download" \
                         class="config tab-icon-download"></span> \
                        <img id="config" class="config" src="./static/src/images/settings.png"> \
                    </div> \
                  </header>';
        obj.each(function(i, widget) {
            // var $html = $(Handlebars.compile(source)({title: div.options.title()}));
            var $html = $(source);
            (!config) && $('#config', $html).css('display', 'none');
            (!download) && $('#download', $html).css('display', 'none');

            $('#config', $html).on('click', function(p) {
                widget.open_option_setup(widget);
            });
            $('#download', $html).on('click', function(p) {
                widget.open_download_setup(widget);
            });
            $(this).prepend($html);

            ko.applyBindings(widget.options, $html[0]);
        });
        return obj;
    }

})(jQuery);
