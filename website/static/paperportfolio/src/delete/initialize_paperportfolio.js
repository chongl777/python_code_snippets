var initialize = function(PARAMS, paramsInput) {
    // currency exposure
    // PARAMS['widget']['pf_ccy_expo'] = addTitle(
    //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    var group_columns = [];
    // delta exposures
    PARAMS['widget']['pf-position-pnl'] = addTitle(
        $('div#pf-position-pnl').init_wfi_table(
            {datasource: 'pf_position_pnl',
             title: ko.observable("PORTFOLIO POSITIONS"),
             input_args: {
                 't_date': ko.pureComputed(function() { return (new Date(paramsInput.t_date()));}),
                 'ref_date': ko.pureComputed(function() { return (new Date(paramsInput.ref_date()));}),
                 'accounts': '',
                 'group_by': [
                     {grp_field: 'sLevel_1', sort_field: 'rank', ascend: true,
                      grp_field_options: ['product_typ', 'industry_level_2', 'industry_level_1', 'book', 'None', 'sLevel_1', 'sLevel_2', 'sLevel_3'],
                      sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure', 'period_total_pnl']},
                     {grp_field: 'sLevel_2', sort_field: 'delta_adj_exposure', ascend: false,
                      grp_field_options: ['product_typ', 'industry_level_2', 'industry_level_1', 'book', 'None', 'sLevel_1', 'sLevel_2', 'sLevel_3'],
                      sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure', 'period_total_pnl']},
                     {grp_field: 'book', sort_field: 'delta_adj_exposure', ascend: false,
                      grp_field_options: ['product_typ', 'industry_level_2', 'industry_level_1', 'book', 'None', 'sLevel_1', 'sLevel_2', 'sLevel_3'],
                      sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure', 'period_total_pnl']},
                     {grp_field: 'None', sort_field: 'delta_adj_exposure', ascend: false,
                      grp_field_options: ['product_typ', 'industry_level_2', 'industry_level_1', 'book', 'None', 'sLevel_1', 'sLevel_2', 'sLevel_3'],
                      sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure', 'period_total_pnl']},
                     {grp_field: 'description', sort_field: 'signal', ascend: false,
                      grp_field_options: ['product_typ', 'description', 'industry_level_2', 'industry_level_1', 'book', 'None'],
                      sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure', 'period_total_pnl', 'signal']}
                 ],
                 'init_expansion_level': 5,
                 'total_expansion_level': null,
                 'display': 'summary',
                 'display_options': ['summary', 'details']
             },
             filename: "PortfolioPositions",
             sort_by: [],
             // group_columns: ['deal', 'description', 'security'],
             keyfield: 'security',
             processOption: function() {
                 var self = this;
                 self.title("PORTFOLIO POSITIONS (" +
                            d3.timeFormat('%Y-%m-%d')(self.input_args.ref_date())+
                            " TO " +
                            d3.timeFormat('%Y-%m-%d')(self.input_args.t_date()) + ")");

                 self.init_expansion_level = self.input_args.init_expansion_level;
                 self.start_expansion_level = 0;
                 self.total_expansion_level = self.input_args.total_expansion_level || Number.MAX_VALUE;

                 var group = ['total'];
                 self.sort_by = [];
                 self.input_args.group_by.forEach(function(p, i) {
                     if (p.grp_field != 'None') {
                         group.push(p.grp_field);
                         self.sort_by.push({field: p.sort_field, ascend: p.ascend});
                     }
                 });

                 self.group_columns = group.concat(['security']);

                 // copy self.group_colums to group_columns
                 while(group_columns.length>0) group_columns.pop();
                 group_columns.push.apply(group_columns, self.group_columns);

                 // display option
                 if (self.input_args.display == 'summary') {
                     self.columns_setup.forEach(function(p, i) {
                         if (p.detail || false) {
                             p.visible = false;
                         } else {
                             p.visible = true;
                         }
                     });
                 } else {
                     self.columns_setup.forEach(function(p, i) {
                         p.visible = true;
                     });
                 }
             },
             process_row: function(row, rowdata) {
                 var self = this;

                 $('.sid-clickable', row).click(function() {
                     var url = 'http://wfiubuntu01.wfi.local/pfmgmt/sec_profile/security_profile?sid={sid}&pid={pid}'
                     url = url.replace(
                         '{sid}', rowdata['security_id']).replace('{pid}', rowdata['parent_id']);
                     window.open(url, '_blank');
                 });
             },
             process_child_data: function(data, depth) {
                 var self = this;
                 var n = self.options.sort_by.length;
                 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
             },
             columns_setup: [
                 {data: "security",
                  sortable: false,
                  visible: true,
                  title: '',
                  width: '25%',
                  render: function(value, type, row) {
                      var self = this;
                      var level = group_columns[row.depth];
                      if (level == null) {
                          return '<div style="margin-left:' + (row.depth-1)*4 + 'px">' + value.description + '</div>';
                      }
                      return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                  }},
                 {data: 'security_id',
                  sortable: false,
                  visible: true,
                  title: '',
                  width: '10%',
                  render: function(value, type, row) {
                      if (value == "") return '';
                      var level = group_columns[row.depth-1];
                      if (level == 'security') {
                          return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
                      }
                      return '<div class="value"></div>';
                  }},
                 {data: "prev_quantity",
                  sortable: false,
                  visible: true,
                  title: 'PrevQuantity',
                  width: '15%',
                  detail: true,
                  render: function(value) {
                      if (value == "") return '';
                      return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
                 {data: "quantity",
                  sortable: false,
                  visible: true,
                  title: 'Quantity',
                  width: '15%',
                  render: function(value) {
                      if (value == "") return '';
                      return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
                 {data: "ccy",
                  sortable: false,
                  visible: true,
                  title: 'Ccy',
                  width: '10%',
                  render: function(value) {
                      return '<div class="value">' + value + '</div>'}},
                 {data: "cleanCostBasis",
                  sortable: false,
                  visible: true,
                  title: 'Clean Cost Basis (USD)',
                  width: '15%',
                  render: function(value) {
                      if (value == "") return '';
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                 {data: "prev_last_price",
                  sortable: false,
                  visible: true,
                  title: 'Prev Price (Loc)',
                  detail: true,
                  width: '15%',
                  render: function(value) {
                      if (value == "") return '';
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                 {data: "last_price",
                  sortable: false,
                  visible: true,
                  title: 'Current Price (Loc)',
                  width: '15%',
                  render: function(value, type, row) {
                      if (value == "") return '';
                      var criteria = row.period_unrealized_pnl || 0;
                      return addSignClass(
                          '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>', criteria);

                  }},
                 {data: "delta",
                  sortable: false,
                  visible: true,
                  title: 'Delta',
                  detail: true,
                  width: '15%',
                  render: function(value, type, row) {
                      if (value == "") return '';
                      var criteria = row.period_unrealized_pnl || 0;
                      return '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>';

                  }},
                 {data: "sdv01",
                  sortable: false,
                  visible: true,
                  title: 'SDV01',
                  detail: true,
                  width: '15%',
                  render: function(value, type, row) {
                      if (value == "") return '';
                      var criteria = row.period_unrealized_pnl || 0;
                      return '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>';

                  }},
                 {data: "factor",
                  sortable: false,
                  visible: true,
                  title: 'Factor',
                  width: '10%',
                  render: function(value) {
                      if (value == "" | value == null) return '';
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                 {data: "tradeFlat",
                  sortable: false,
                  visible: true,
                  title: 'Trade Flat',
                  width: '10%',
                  render: function(value) {
                      if (value == "" | value == null) return '';
                      return '<div class="value">' + value + '</div>'}},
                 {data: "coupon",
                  sortable: false,
                  visible: true,
                  title: 'Coupon',
                  width: '10%',
                  render: function(value) {
                      if (value == "" | value == null) return '';
                      return '<div class="value">' + d3.format(",.2f")(value*100) + '%</div>'}},
                 {data: "fx_rate",
                  sortable: false,
                  visible: true,
                  width: '10%',
                  title: 'FX',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                 {data: "mktval_clean",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: 'Clean Price Market Value',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
                 {data: "prev_mktval",
                  sortable: false,
                  visible: true,
                  detail: true,
                  width: '20%',
                  title: 'Prev Market Value',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
                 {data: "mktval",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: 'Market Value',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
                 {data: "pct_mktval",
                  sortable: false,
                  visible: true,
                  width: '15%',
                  title: '% Allocation',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
                 {data: "delta_adj_exposure",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: 'Exposure',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
                 {sortable: false,
                  visible: true,
                  width: '15%',
                  title: '% Exposures',
                  render: function(val, type, row) {
                      var value = row['delta_adj_exposure'] / row['total_mktval'];
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
                 {data: "period_fx_pnl",
                  sortable: false,
                  visible: true,
                  title: 'Period to Date\n FX P&L',
                  width: '20%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value);}},
                 {data: "period_int_pnl",
                  sortable: false,
                  visible: true,
                  title: 'Period to Date Int P&L',
                  width: '20%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value)}},
                 {data: "period_total_pnl",
                  sortable: false,
                  visible: true,
                  title: 'Period to Date Total P&L',
                  width: '20%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value)}},
                 {sortable: false,
                  visible: true,
                  title: 'Period to Return Contrib',
                  width: '20%',
                  detail: true,
                  render: function(value, type, row) {
                      value = row['period_total_pnl'] / row['total_prev_mktval'];
                      if (value == "" | value == null) return '<div class="value">-</div>';
                      if (value == 0) return '<div class="value">-</div>';
                      return addSignClass('<div class="value">' +d3.format(".2f")(value*100) + '%</div>', value)}},
                 {data: "pricing_date",
                  sortable: false,
                  visible: true,
                  title: 'Pricing Date',
                  width: '20%',
                  render: function(value) {
                      try {
                          return '<div class="value">' + d3.timeFormat("%m/%d/%y")(value) + '</div>';
                      } catch(err) {
                          return '<div class="value"></div>'
                      }
                  }},
                 {data: "pricing_source",
                  sortable: false,
                  visible: true,
                  title: 'Pricing Source',
                  width: '10%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value"></div>';
                      return '<div class="value">' + d3.format(".0f")(value) + '</div>'}},
                 {data: "security_id_ref",
                  sortable: false,
                  visible: true,
                  title: 'Stra Sid',
                  width: '7%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value"></div>';
                      return '<div class="value strategy">' + d3.format(".0f")(value) + '</div>'}},
                 {data: "score",
                  sortable: false,
                  visible: true,
                  title: 'Stra Score',
                  width: '7%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value"></div>';
                      return '<div class="value strategy">' + d3.format(".0f")(value) + '</div>'}},
                 {data: "signal",
                  sortable: false,
                  visible: true,
                  title: 'Stra Signal',
                  width: '10%',
                  render: function(value) {
                      if (value == "" | value == null) return '<div class="value"></div>';
                      return '<div class="value strategy">' + d3.format(".2f")(value) + '</div>'}},
                 {data: "stra_date",
                  sortable: false,
                  visible: true,
                  title: 'Stra Date',
                  width: '15%',
                  render: function(value) {
                      try {
                          return '<div class="value strategy">' + d3.timeFormat("%m/%d/%y")(value) + '</div>';
                      } catch(err) {
                          return '<div class="value"></div>'
                      }}}
             ],
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     try {
                         p['pricing_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(p['pricing_date']);
                     } catch(err) {
                         p['pricing_date'] = null;
                     };
                     try {
                         p['stra_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(p['stra_date']);
                     } catch(err) {
                         p['stra_date'] = null;
                     }
                     // p['description'] = p['security'].description;
                     p['book'] = p['product_typ'] == 'Currency' ? 'Cash' : (p['direction'] ? 'Long' : 'Short');
                     p['period_fx_pnl'] = (p['period_realized_fx_pnl'] || 0) + (p['period_unrealized_fx_pnl'] || 0);
                     p['cleanCostBasis'] = p['cleanCostBasis'] || p['costBasis'];
                     p['total'] = 'Total';
                     p['factor'] = p['factor'] || 1;
                     // p['description'] = p['product_typ'] == 'Currency' ?  p['account'] : p['description'];
                     dataClone.push(p);
                 });

                 // dataClone.sort(sort_by(options.sort_by));
                 return dataClone;
             },
             aggfun: function(node) {
                 sum(node, 'quantity', 2);
                 sum(node, 'prev_quantity', 2);
                 first(node, 'ccy', 4);
                 first(node, 'description', 1);
                 first(node, 'security', 1);
                 first(node, 'rank', 1);

                 first(node, 'security_id_ref', 4);
                 first(node, 'score', 4);
                 first(node, 'signal', 4);
                 first(node, 'stra_date', 4);

                 weightedAvg(node, 'last_price', 'quantity', 3);
                 weightedAvg(node, 'delta', 'quantity', 3);
                 weightedAvg(node, 'sdv01', 'quantity', 3);
                 weightedAvg(node, 'prev_last_price', 'prev_quantity', 3);

                 weightedAvg(node, 'cleanCostBasis', 'quantity', 3);
                 weightedAvg(node, 'factor', 'quantity', 3);
                 first(node, 'tradeFlat', 3);
                 first(node, 'parent_id', 4);

                 weightedAvg(node, 'coupon', 'quantity', 3);
                 weightedAvg(node, 'fx_rate', 'quantity', 3);

                 sum(node, 'prev_mktval', 1);
                 sum(node, 'mktval_clean', 1);
                 sum(node, 'mktval', 0);
                 sum(node, 'period_total_pnl', 0);
                 sum(node, 'period_int_pnl', 0);

                 var mktval = node.mktval - node.period_total_pnl;
                 set_attr(node, mktval, 'total_prev_mktval');

                 set_attr(node, node.mktval, 'total_mktval');

                 sum(node, 'delta_adj_exposure', 1);
                 sum(node, 'pct_mktval', 1);
                 // sum(node, 'pct_exposure', 1);
                 sum(node, 'period_fx_pnl', 1);
                 first(node, 'pricing_date', 3);
                 first(node, 'pricing_source', 3);
                 // sum(node, 'delta_adj_expo', 1);
             },
             options: function(data) {
                 var self = this;
                 var html = $(' \
                    <table style="width:500px"> \
                      <col width="25%"> \
                      <col width="30%"> \
                      <col width="30%"> \
                      <col width="10%"> \
                      <thead><tr>\
                          <th></th><th>Group</th><th>Sort By</th><th>Asc</th> \
                      </tr></thead> \
                      <tbody data-bind="foreach: group_by"> \
                        <tr> \
                           <td colspan=1 data-bind="text: \'Level \' + ($index()+1)"></td> \
                           <td colspan=1 class="value"> \
                               <select data-bind="value: grp_field, options: grp_field_options"/> \
                           </td> \
                           <td >\
                               <select data-bind="value: sort_field, options: sort_field_options"/> \
                           </td>\
                           <td >\
                               <select data-bind="value: ascend, options: [true, false]"/> \
                           </td>\
                        </tr> \
                      </tbody> \
                      <tbody> \
                        <tr><td colspan=4> \
                          <table style="width:100%"> \
                              <tbody> \
                               <tr> \
                                  <td colspan=1>Initial Expansion Level</td> \
                                  <td colspan=3 class="value"> \
                                      <input data-bind="value:init_expansion_level"/> \
                                  </td> \
                               </tr> \
                               <tr> \
                                  <td colspan=1>Total Expansion Level</td> \
                                  <td colspan=3 class="value"> \
                                      <input data-bind="value:total_expansion_level"/> \
                                  </td> \
                               </tr> \
                               <tr> \
                                  <td colspan=1>Display</td> \
                                  <td colspan=3 class="value"> \
                                      <select data-bind="value: display, options: display_options"/> \
                                  </td> \
                               </tr> \
                              </tbody> \
                          </table> \
                        </td></tr>\
                      </tbody> \
                    </table>');
                 return html;
             },
             download: function(filename, data, callback) {
                 var args = {
                     filename: filename}
                 var args_vec = [];
                 $.each(args, function(x, y) {
                     args_vec.push(x+"="+y);
                 })
                 var i;

                 var xhr = new XMLHttpRequest();
                 xhr.open('POST', 'api_download_data?'+args_vec.join('&'), true);
                 xhr.responseType = 'arraybuffer';
                 xhr.setRequestHeader('data', "{x: hello}")

                 xhr.onload  = function(e) {
                     callback();
                     if (this.status == 200) {
                         var blob = new Blob([xhr.response], {type: 'octet/stream'});
                         var downloadUrl = URL.createObjectURL(blob);
                         //window.open(downloadUrl);
                         var a = document.createElement("a");
                         a.href = downloadUrl;
                         a.download = filename;
                         document.body.appendChild(a);
                         a.click();
                         //Do your stuff here
                     }
                 };
                 xhr.send(JSON.stringify(data));
             }}
        ), true, true);

    PARAMS['widget']['pf-summary'] = addTitle(
        $('div#pf-summary').init_wfi_table(
            {datasource: 'pf_summary',
             title: ko.observable("PORTFOLIO SUMMARY"),
             columns_setup: [
                 {data: "title",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: '',
                  render: function(name) {
                      return '<div>' + name + '</div>'}},
                 {data: "value",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: 'Value',
                  render: function(value, type, row) {
                      if (value == "") {
                          return '<div class="value"></div>';
                      } else {
                          if (row['title'] != "Portfolio AUM")
                              return addSignClass('<div class="value">' + '$' + d3.format("15,.2f")(value) + '</div>', value);
                          else
                              return '<div class="value">' +'$'+d3.format("15,.2f")(value) + '</div>';
                      }
                  }},
                 {data: "pct",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: '% Value',
                  render: function(value, type, row) {
                      if (value == "") {
                          return '<div class="value"></div>';
                      } else {
                          if (!["Portfolio AUM", 'Cumulative PnL'].includes(row['title']))
                              return addSignClass('<div class="value">' + d3.format(".2%")(value) + '</div>', value);
                          else
                              return '<div class="value">-</div>';
                      }
                  }}
             ],
             aggfun: function(node) {
             },
             group_columns: ['title'],
             keyfield: 'title',
             preProcess: function(data) {
                 return data;
             }}
        ));

    // -------------------- tab 2 ----------------------------------
    //delta exposures

    PARAMS['widget']['pf-txns'] = (function() {
        var group_columns;
        return addTitle(
        $('div#pf-txns').init_wfi_table(
            {datasource: 'pf_txns',
             title: ko.observable("TRADING RECORDS"),
             input_args: {
                 't_date': ko.pureComputed(function() { return (new Date(paramsInput.t_date()));}),
                 'ref_date': ko.pureComputed(function() { return (new Date(paramsInput.ref_date()));})
             },
             sort_by: [{'field': 'trade_dt', ascend: true}],
             processOption: function() {
                 var self = this;
                 self.title("TRADING RECORDS (" +
                            d3.timeFormat('%Y-%m-%d')(self.input_args.ref_date())+
                            " TO " +
                            d3.timeFormat('%Y-%m-%d')(self.input_args.t_date()) + ")");
                 self.init_expand = 1;
                 group_columns = self.group_columns;
             },
             process_row: function(row, rowdata) {
                 $('.sid-clickable', row).click(function() {
                     var url = '../sec_profile/security_profile?sid={sid}&pid={pid}'
                     url = url.replace(
                         '{sid}', rowdata['security_id']).replace('{pid}', rowdata['parent_id']);
                     window.open(url, '_blank');
                 });
             },
             process_child_data: function(data, depth) {
                 var self = this;
                 var n = self.options.sort_by.length;
                 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
             },
             columns_setup: [
                 {data: 'trade_dt',
                  sortable: false,
                  visible: true,
                  title: 'TradeDt',
                  width: '10%',
                  render: function(value, type, row) {
                      try {
                          return '<div class="value clickable">' + d3.timeFormat("%m/%d/%y")(value) + '</div>';
                      } catch(err) {
                          return '<div class="value"></div>'
                      }
                  }},
                 {data: 'sid',
                  sortable: false,
                  visible: true,
                  title: 'Sid',
                  width: '5%',
                  render: function(value, type, row, meta) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }
                      return '<div class="value sid-clickable">' + d3.format(".0f")(row['sid']) + '</div>';
                  }},
                 {data: 'txn_typ',
                  sortable: false,
                  visible: true,
                  title: 'TransType',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'account',
                  sortable: false,
                  visible: true,
                  title: 'Account',
                  width: '5%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'secTyp',
                  sortable: false,
                  visible: true,
                  title: 'SecurityType',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'deal',
                  sortable: false,
                  visible: true,
                  title: 'Deal',
                  width: '15%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'secname',
                  sortable: false,
                  visible: true,
                  title: 'Description',
                  width: '15%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'identifier',
                  sortable: false,
                  visible: true,
                  title: 'Identifer',
                  width: '15%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'quantity',
                  sortable: false,
                  visible: true,
                  title: 'Quantity',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + d3.format(",.0f")(value) + '</div>';
                  }},
                 {data: 'trade_px',
                  sortable: false,
                  visible: true,
                  title: 'TradePx',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'factor',
                  sortable: false,
                  visible: true,
                  title: 'Factor',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + d3.format(",.4f")(value) + '</div>';
                  }},
                 {data: 'ccy',
                  sortable: false,
                  visible: true,
                  title: 'Currency',
                  width: '5%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'accruedInt',
                  sortable: false,
                  visible: true,
                  title: 'AccruedInt',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'total_clean',
                  sortable: false,
                  visible: true,
                  title: 'TotalClean',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'total_amount',
                  sortable: false,
                  visible: true,
                  title: 'TotalAmount',
                  width: '10%',
                  render: function(value, type, row) {
                      var field = group_columns[row.depth-1];
                      if (field != 'sid') {
                          return '<div  class="value"></div>';
                      }

                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
             ],
             group_columns: ['str_trade_dt', 'txn_typ', 'sid'],
             'init_expansion_level': 1,
             'total_expansion_level': null,
             keyfield: 'sid',
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['tag1'] = p['tag1'] || '';
                     p['tag2'] = p['tag2'] || '';
                     p['tag3'] = p['tag3'] || '';
                     p['trade_dt'] = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(p['trade_dt']);
                     p['str_trade_dt'] = d3.timeFormat('%Y-%m-%d')(p['trade_dt']);
                     dataClone.push(p);
                 });

                 dataClone.sort(sort_by(options.sort_by));
                 return dataClone;
             },
             aggfun: function(node) {
                 sum(node, 'quantity', 1);
                 sum(node, 'total_amount', 1);
                 sum(node, 'total_clean', 1);
                 sum(node, 'accruedInt', 1);
                 first(node, 'ccy', 1);
                 first(node, 'sid', 1);
                 first(node, 'deal', 1);
                 first(node, 'account', 1);
                 first(node, 'counterpart', 1);

                 first(node, 'txn_typ', 1);
                 first(node, 'secTyp', 1);
                 first(node, 'trade_dt', 1);
                 first(node, 'secname', 1);
                 first(node, 'identifier', 1);

                 weightedAvg(node, 'trade_px', 'quantity', 1);
                 weightedAvg(node, 'factor', 'quantity', 1);
                 first(node, 'trade_flat', 3);

                 weightedAvg(node, 'fx_rate', 'quantity', 1);
                 // sum(node, 'delta_adj_expo', 1);
             }}
        ))
    })();


    // ----------------------------------------------------

    function first(node, field, depth) {
        if (field in node) {
            return;
        } else {
            node.children.forEach(function(p) {
                first(p, field, depth);
            });
            if (node.depth<depth) {
                node[field] = "";
            } else {
                node[field] = node.children[0][field];
            };
        }
    };

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

    function prodsum(node, field, prod, depth) {
        if (field in node) {
            return;
        } else {
            if (node.children) {
                node.children.forEach(function(p) {
                    prodsum(p, field, prod, depth);
                });
                var val1 = 0;
                node.children.forEach(
                    function(p) {
                        val1 += p[field]});
                node[field] = val1;
            } else {
                var val2 = 1;
                prod.forEach(function(p) {
                    val2 *= node[p];
                })
                node[field] = val2;
            }
            if (node.depth<depth) {
                node[field] = "";
            }
        }
    };

    function weightedAvg(node, field, weight, depth) {
        if (field in node) {
            return;
        } else {
            if (node.children) {
                node.children.forEach(function(p) {
                    weightedAvg(p, field, weight, depth);
                });
                var val1 = 0;
                node.children.forEach(
                    function(p) {
                        val1 += p[field] * p[weight]});
                node[field] = Math.abs(node[weight]) < 0.02 ? 0 : val1 / node[weight];
            }
            if (node.depth<depth) {
                node[field] = "";
            }
        }
    };

    function set_attr(node, attr_val, attr_name) {
        node[attr_name] = attr_val;
        if (node.children) {
            node.children.forEach(function(p) {
                set_attr(p, attr_val, attr_name);
            });

        }
    }

    function addSignClass(html, value) {
        if (value > 0) {
            html = $(html).addClass('positive');
        } else if (value < 0) {
            html = $(html).addClass('negative');
        } else {
            html = $(html);
        }
        return html[0].outerHTML;
    };

    function sort_by(by) {
        var default_cmp = function(a, b) {
            if (a == b) return 0;
            return a < b ? -1 : 1;
        }

        var fn = function(x, y) {
            var rnk;
            var field;
            var ascend;
            for (var i=0; i< by.length; i++) {
                field = by[i]['field'];
                ascend = by[i]['ascend'];
                rnk = default_cmp(x[field], y[field]);
                if (rnk != 0) {
                    return ascend == true ? rnk: -rnk;
                }
            }
            return -1;
        };
        return fn;
    };
}
