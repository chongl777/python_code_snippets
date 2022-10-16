var initialize = function(PARAMS, paramsInput) {
    // currency exposure
    // PARAMS['widget']['pf_ccy_expo'] = addTitle(
    //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    var group_columns = [];
    var fund_map = paramsInput.available_funds().reduce(
      (m, obj) => {m[obj.pid] = obj.pf_name; return m}, {});
    // delta exposures
    // PARAMS['widget']['pf-position-pnl'] = addTitle(
    //     $('div#pf-position-pnl').init_wfi_table(
    //         {datasource: 'pf_position_pnl',
    //          title: ko.observable("PORTFOLIO POSITIONS"),
    //          input_args: {
    //              't_date': ko.pureComputed(function() { return (new Date(paramsInput.t_date()));}),
    //              'ref_date': ko.pureComputed(function() { return (new Date(paramsInput.ref_date()));}),
    //              'accounts': ko.observable(paramsInput.selectedAccounts()),
    //              'available_accounts': paramsInput.selectedAccounts,
    //              'group_level_0': ko.observable('total'),
    //              'group_level_1': ko.observable('fund_name'),
    //              'group_level_2': ko.observable('product_typ'),
    //              'level_1_options': ['product_typ', 'industry_level_1', 'book', 'account', 'None', 'tag1'],
    //              'level_2_options': ['industry_level_1', 'industry_level_2', 'book', 'product_typ', 'None','tag2'],
    //              'sort_by': [{'field': 'rank', ascend: true, field_options: ['rank', 'deal', 'description', 'mktval', 'mkt_exposure', 'period_total_pnl']},
    //                          {field: 'mktval', ascend: false, field_options: ['rank', 'deal', 'description', 'mktval', 'mkt_exposure', 'period_total_pnl']},
    //                          {field: 'mktval', ascend: false, field_options: ['rank', 'deal', 'description', 'mktval', 'mkt_exposure', 'period_total_pnl']}],
    //              'init_expansion_level': 4,
    //              'total_expansion_level': null,
    //              'display': 'summary',
    //              'display_options': ['summary', 'details']
    //          },
    //          sort_by: [],
    //          processOption: function() {
    //              var self = this;
    //              self.title("PORTFOLIO POSITIONS (" +
    //                         d3.timeFormat('%Y-%m-%d')(self.input_args.ref_date())+
    //                         " TO " +
    //                         d3.timeFormat('%Y-%m-%d')(self.input_args.t_date()) + ")");
    //              self.sort_by = self.input_args.sort_by;

    //              self.init_expansion_level = self.input_args.init_expansion_level;
    //              self.start_expansion_level = 0;
    //              self.total_expansion_level = self.input_args.total_expansion_level || Number.MAX_VALUE;

    //              // group columns
    //              var group = [self.input_args.group_level_0()];
    //              if (self.input_args.group_level_1() != 'None') {
    //                  group.push(self.input_args.group_level_1());
    //              }
    //              if (self.input_args.group_level_2() != 'None') {
    //                  group.push(self.input_args.group_level_2());
    //              }
    //              self.group_columns = group.concat(['deal', 'description', 'lot_id']);

    //              // copy self.group_colums to group_columns
    //              while(group_columns.length>0) group_columns.pop();
    //              group_columns.push.apply(group_columns, self.group_columns);

    //              // display option
    //              if (self.input_args.display == 'summary') {
    //                  self.columns_setup.forEach(function(p, i) {
    //                      if (p.detail || false) {
    //                          p.visible = false;
    //                      } else {
    //                          p.visible = true;
    //                      }
    //                  });
    //              } else {
    //                  self.columns_setup.forEach(function(p, i) {
    //                      p.visible = true;
    //                  });
    //              }
    //          },
    //          process_row: function(row, rowdata) {
    //              $('.sid-clickable', row).click(function() {
    //                  var url = '../sec_profile/security_profile?sid={sid}&pid={pid}'
    //                  url = url.replace(
    //                      '{sid}', rowdata['security_id']).replace('{pid}');
    //                  window.open(url, '_blank');
    //              });
    //          },
    //          process_child_data: function(data, depth) {
    //              var self = this;
    //              var n = self.options.sort_by.length;
    //              data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
    //          },
    //          columns_setup: [
    //              {data: "lot_id",
    //               sortable: false,
    //               visible: true,
    //               title: '',
    //               width: '25%',
    //               render: function(value, type, row) {
    //                   var self = this;
    //                   var level = group_columns[row.depth];
    //                   if (level == null) {
    //                       return '<div style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
    //                   }
    //                   return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
    //               }},
    //              {data: 'security_id',
    //               sortable: false,
    //               visible: true,
    //               title: '',
    //               width: '10%',
    //               render: function(value, type, row) {

    //                   if (value == "") return '';
    //                   var level = group_columns[row.depth-1];
    //                   if (level == 'lot_id') {
    //                       return '<div class="value">' + row.account + '</div>';
    //                   } else if (level == 'description') {
    //                       return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
    //                   }
    //                   return '<div class="value"></div>';
    //               }},
    //              {data: "prev_quantity",
    //               sortable: false,
    //               visible: true,
    //               title: 'PrevQuantity',
    //               width: '15%',
    //               detail: true,
    //               render: function(value) {
    //                   if (value == "") return '';
    //                   return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
    //              {data: "quantity",
    //               sortable: false,
    //               visible: true,
    //               title: 'Quantity',
    //               width: '15%',
    //               render: function(value) {
    //                   if (value == "") return '';
    //                   return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
    //              {data: "ccy",
    //               sortable: false,
    //               visible: true,
    //               title: 'Ccy',
    //               width: '10%',
    //               render: function(value) {
    //                   return '<div class="value">' + value + '</div>'}},
    //              {data: "cleanCostBasis",
    //               sortable: false,
    //               visible: true,
    //               title: 'Clean Cost Basis (USD)',
    //               width: '15%',
    //               render: function(value) {
    //                   if (value == "") return '';
    //                   return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
    //              {data: "prev_last_price",
    //               sortable: false,
    //               visible: true,
    //               title: 'Prev Price (Loc)',
    //               detail: true,
    //               width: '15%',
    //               render: function(value) {
    //                   if (value == "") return '';
    //                   return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
    //              {data: "last_price",
    //               sortable: false,
    //               visible: true,
    //               title: 'Current Price (Loc)',
    //               width: '15%',
    //               render: function(value, type, row) {
    //                   if (value == "") return '';
    //                   var criteria = row.period_unrealized_pnl || 0;
    //                   return addSignClass(
    //                       '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>', criteria);

    //               }},
    //              {data: "delta",
    //               sortable: false,
    //               visible: true,
    //               title: 'Delta',
    //               detail: true,
    //               width: '15%',
    //               render: function(value, type, row) {
    //                   if (value == "") return '';
    //                   var criteria = row.period_unrealized_pnl || 0;
    //                   return '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>';

    //               }},
    //              {data: "sdv01",
    //               sortable: false,
    //               visible: true,
    //               title: 'SDV01',
    //               detail: true,
    //               width: '15%',
    //               render: function(value, type, row) {
    //                   if (value == "") return '';
    //                   var criteria = row.period_unrealized_pnl || 0;
    //                   return '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>';

    //               }},
    //              {data: "factor",
    //               sortable: false,
    //               visible: true,
    //               title: 'Factor',
    //               width: '10%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '';
    //                   return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
    //              {data: "tradeFlat",
    //               sortable: false,
    //               visible: true,
    //               title: 'Trade Flat',
    //               width: '10%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '';
    //                   return '<div class="value">' + value + '</div>'}},
    //              {data: "coupon",
    //               sortable: false,
    //               visible: true,
    //               title: 'Coupon',
    //               width: '10%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '';
    //                   return '<div class="value">' + d3.format(",.2f")(value*100) + '%</div>'}},
    //              {data: "fx_rate",
    //               sortable: false,
    //               visible: true,
    //               width: '10%',
    //               title: 'FX',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
    //              {data: "mktval_clean",
    //               sortable: false,
    //               visible: true,
    //               width: '20%',
    //               title: 'Clean Price Market Value',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
    //              {data: "prev_mktval",
    //               sortable: false,
    //               visible: true,
    //               detail: true,
    //               width: '20%',
    //               title: 'Prev Market Value',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
    //              {data: "mktval",
    //               sortable: false,
    //               visible: true,
    //               width: '20%',
    //               title: 'Market Value',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
    //              {data: "pct_mktval",
    //               sortable: false,
    //               visible: true,
    //               width: '15%',
    //               title: '% Allocation',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
    //              {data: "delta_adj_exposure",
    //               sortable: false,
    //               visible: true,
    //               width: '20%',
    //               title: 'Exposure',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
    //              {sortable: false,
    //               visible: true,
    //               width: '15%',
    //               title: '% Exposures',
    //               render: function(val, type, row) {
    //                   var value = row['delta_adj_exposure'] / row['total_mktval'];
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
    //              {data: "period_fx_pnl",
    //               sortable: false,
    //               visible: true,
    //               title: 'Period to Date\n FX P&L',
    //               width: '20%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value);}},
    //              {data: "period_realized_pnl",
    //               sortable: false,
    //               visible: true,
    //               title: 'Period to Date Realized P&L',
    //               width: '20%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value)}},
    //              {data: "period_unrealized_pnl",
    //               sortable: false,
    //               visible: true,
    //               title: 'Period to Date Unreal. P&L',
    //               width: '20%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value)}},
    //              {data: "period_total_pnl",
    //               sortable: false,
    //               visible: true,
    //               title: 'Period to Date Total P&L',
    //               width: '20%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return addSignClass('<div class="value">$' + d3.format("9,.1f")(value/1000) + 'K</div>', value)}},
    //              {sortable: false,
    //               visible: true,
    //               title: 'Period to Return Contrib',
    //               width: '20%',
    //               detail: true,
    //               render: function(value, type, row) {
    //                   value = row['period_total_pnl'] / row['total_prev_mktval'];
    //                   if (value == "" | value == null) return '<div class="value">-</div>';
    //                   if (value == 0) return '<div class="value">-</div>';
    //                   return addSignClass('<div class="value">' +d3.format(".2f")(value*100) + '%</div>', value)}},
    //              {data: "pricing_date",
    //               sortable: false,
    //               visible: true,
    //               title: 'Pricing Date',
    //               width: '20%',
    //               render: function(value) {
    //                   try {
    //                       return '<div class="value">' + d3.timeFormat("%m/%d/%y")(value) + '</div>';
    //                   } catch(err) {
    //                       return '<div class="value"></div>'
    //                   }
    //               }},
    //              {data: "pricing_source",
    //               sortable: false,
    //               visible: true,
    //               title: 'Pricing Source',
    //               width: '10%',
    //               render: function(value) {
    //                   if (value == "" | value == null) return '<div class="value"></div>';
    //                   return '<div class="value">' + d3.format(".0f")(value) + '</div>'}}
    //          ],
    //          group_columns: ['deal', 'description', 'lot_id'],
    //          init_level: 0,
    //          init_expand: 3,
    //          keyfield: 'lot_id',
    //          preProcess: function(data, options) {
    //              var dataClone = []
    //              data.forEach(function(p) {
    //                  if (!options.input_args.accounts().includes(p['account'])) {
    //                      return;
    //                  }
    //                  try {
    //                      p['pricing_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(p['pricing_date']);
    //                  } catch(err) {
    //                      p['pricing_date'] = null;
    //                  };
    //                  p['fund_name'] = fund_map[p['fund_id']] || 'fund-' + p['fund_id'];
    //                  p['book'] = p['product_typ'] == 'Currency' ? 'Cash' : (p['direction'] ? 'Long' : 'Short');
    //                  p['period_fx_pnl'] = (p['period_realized_fx_pnl'] || 0) + (p['period_unrealized_fx_pnl'] || 0);
    //                  p['cleanCostBasis'] = p['cleanCostBasis'] || p['costBasis'];
    //                  p['total'] = 'Total';
    //                  p['factor'] = p['factor'] || 1;
    //                  p['description'] = p['product_typ'] == 'Currency' ?  p['account'] : p['description'];
    //                  dataClone.push(p);
    //              });

    //              dataClone.sort(sort_by(options.sort_by));
    //              return dataClone;
    //          },
    //          aggfun: function(node) {
    //              sum(node, 'quantity', 2);
    //              sum(node, 'prev_quantity', 2);
    //              first(node, 'ccy', 4);
    //              first(node, 'security_id', 1);
    //              first(node, 'rank', 1);

    //              weightedAvg(node, 'last_price', 'quantity', 3);
    //              weightedAvg(node, 'delta', 'quantity', 3);
    //              weightedAvg(node, 'sdv01', 'quantity', 3);
    //              weightedAvg(node, 'prev_last_price', 'prev_quantity', 3);

    //              weightedAvg(node, 'cleanCostBasis', 'quantity', 3);
    //              weightedAvg(node, 'factor', 'quantity', 3);
    //              first(node, 'tradeFlat', 3);

    //              weightedAvg(node, 'coupon', 'quantity', 3);
    //              weightedAvg(node, 'fx_rate', 'quantity', 3);

    //              sum(node, 'prev_mktval', 1);
    //              sum(node, 'mktval_clean', 1);
    //              sum(node, 'mktval', 0);
    //              sum(node, 'period_total_pnl', 0);

    //              var mktval = node.mktval - node.period_total_pnl;
    //              set_attr(node, mktval, 'total_prev_mktval');

    //              set_attr(node, node.mktval, 'total_mktval');

    //              sum(node, 'delta_adj_exposure', 1);
    //              sum(node, 'pct_mktval', 1);
    //              // sum(node, 'pct_exposure', 1);
    //              sum(node, 'period_fx_pnl', 1);
    //              sum(node, 'period_realized_pnl', 1);
    //              sum(node, 'period_unrealized_pnl', 1);

    //              first(node, 'pricing_date', 3);
    //              first(node, 'pricing_source', 3);
    //              // sum(node, 'delta_adj_expo', 1);
    //          },
    //          options: function(data) {
    //              var self = this;
    //              var html = $(' \
    //                 <table style="width:300px"> \
    //                   <col width="40%"> \
    //                   <col width="30%"> \
    //                   <tbody> \
    //                     <tr> \
    //                        <td colspan=1>Accounts</td> \
    //                        <td colspan=1 class="value"> \
    //                            <select name="set_acct" class="boost-multiselect" multiple="multiple" \
    //                               data-bind="selectedOptions: accounts, options: available_accounts"/> \
    //                        </td> \
    //                     </tr> \
    //                     <tr> \
    //                        <td colspan=1>Group Level 1</td> \
    //                        <td colspan=1 class="value"> \
    //                            <select data-bind="value: group_level_1, options: level_1_options"/> \
    //                        </td> \
    //                     </tr> \
    //                     <tr> \
    //                        <td colspan=1>Group Level 2</td> \
    //                        <td colspan=1 class="value"> \
    //                            <select data-bind="value: group_level_2, options: level_2_options"/> \
    //                        </td> \
    //                     </tr> \
    //                     <tr> \
    //                        <td colspan=1>Initial Expansion Level</td> \
    //                        <td colspan=1 class="value"> \
    //                            <input data-bind="value:init_expansion_level"/> \
    //                        </td> \
    //                     </tr> \
    //                     <tr> \
    //                        <td colspan=1>Display</td> \
    //                        <td colspan=1 class="value"> \
    //                            <select data-bind="value: display, options: display_options"/> \
    //                        </td> \
    //                     </tr> \
    //                     <tr><td colspan=2> \
    //                       <table style="width:100%"> \
    //                           <caption style="font-weight: bold">Sorting By</caption> \
    //                           <thead><tr> \
    //                               <th>Field</th><th>Ascending</th><th></th> \
    //                           </tr></thead> \
    //                           <tbody data-bind="foreach: sort_by"> \
    //                               <tr> \
    //                                   <td >\
    //                                     <select data-bind="value: field, options: field_options"/> \
    //                                   </td>\
    //                                   <td >\
    //                                     <select data-bind="value: ascend, options: [true, false]"/> \
    //                                   </td>\
    //                               </tr>   \
    //                           </tbody> \
    //                       </table> \
    //                     </td></tr>\
    //                   </tbody> \
    //                 </table>');
    //              return html
    //          },
    //          update: updateSize}
    //     ), true);

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
             init_level: 0,
             init_expand: 1,
             update: updateSize,
             preProcess: function(data) {
                 return data;
             }}
        ));

    // portfolio margin
    PARAMS['widget']['pf-margin'] = addTitle(
        $('div#pf-margin').init_wfi_table(
            {datasource: 'pf_margin',
             title: ko.observable("PORTFOLIO MARGIN"),
             header: ['Tag', 'Account Summary', '', '', '', '<div class="header">Change</div>'],
             processOption: function() {
             },
             columns_setup: [
                 {sortable: false,
                  visible: true,
                  width: '6%',
                  title: 'Tag',
                  render: function(value, type, row) {
                      var val = row['account_summary'];
                      var res = '';
                      if (val == 'Equity') {
                          res = 'b';
                      } else if (val == 'Equity Minimum') {
                          res = 'c';
                      } else if (val == 'Total Margin') {
                          res = 'd';
                      } else if (val == 'House Stress Test') {
                          res = 'e';
                      } else if (val == 'Regulatory') {
                          res = 'f';
                      } else if (val == 'Margin Excess/(Call)') {
                          res = 'g';
                      } else if (val == 'Funding Excess/(Call)') {
                          res = 'h';
                      }
                      return '<div class="middle">' + res + '</div>';
                  }},
                 {data: "account_summary",
                  sortable: false,
                  visible: true,
                  width: '20%',
                  title: 'Account Summary',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {sortable: false,
                  visible: true,
                  width: '10%',
                  title: '',
                  render: function(value, type, row) {
                      var val = row['account_summary'];
                      var res = '';
                      if (val == 'Total Margin') {
                          res = 'Max(e,f)';
                      } else if (val == 'Margin Excess/(Call)') {
                          res = 'b-Max(c,d)';
                      } else if (val == 'Total Excess/(Call)') {
                          res = 'Min(g,h)';
                      }
                      return '<div class="right">' + res + '</div>';
                  }},
                 {data: "as_of_date_val",
                  sortable: false,
                  visible: true,
                  title: '',
                  width: '15%',
                  render: function(value, type, row) {
                      if (row['account_summary'] == 'Total Excess/(Call)') {
                          return '<div class="value bold">' + d3.format(",.1f")(value/1000) + 'K</div>';
                      } else if (value == "" | value == null) {
                          return '<div class="value">-</div>';
                      } else {
                          return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>';
                      }
                  }},
                 {data: "prev_date_val",
                  sortable: false,
                  visible: true,
                  title: '',
                  width: '15%',
                  render: function(value, type, row) {
                      if (value == "" | value == null) {
                          return '<div class="value">-</div>';
                      } else {
                          return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>';
                      }
                  }},
                 {sortable: false,
                  visible: true,
                  width: '15%',
                  title: 'Change',
                  render: function(val, type, row) {
                      var value = row['as_of_date_val'] - row['prev_date_val'];
                      if (value == "") {
                          return '<div class="value">-</div>';
                      } else {
                          return addSignClass('<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>', value);
                      }
                  }}
             ],
             aggfun: function(node) {
             },
             group_columns: ['title'],
             keyfield: 'title',
             init_expansion_level: 1,
             update: updateSize,
             preProcess: function(data, options) {
				         try {
                     var t_date = d3.timeParse("%Y-%m-%dT00:00:00.000Z")(data[0]['as_of_date']);
                     var prev_date = d3.timeParse("%Y-%m-%dT00:00:00.000Z")(data[0]['prev_date']);
                     options.title("PORTFOLIO MARGIN (AS OF " +
                                   d3.timeFormat('%Y-%m-%d')(t_date)+ ")");
                     options.columns_setup[3].title = '<div class="header">' + d3.timeFormat('%d-%b-%Y')(t_date) + '</div>';
                     options.columns_setup[4].title = '<div class="header">' + d3.timeFormat('%d-%b-%Y')(prev_date) + '</div>';
                 } catch (error) {
                 }
                 return data;
             }}
        ));

    // exposure monitor
    PARAMS['widget']['pf-expo-monitor'] = addTitle(
        $('div#pf-expo-monitor').init_pf_expo_monitor(
            {datasource: 'pf_expo_monitor',
             title: ko.observable("EXPOSURE MONITOR")
            }
        ));


    PARAMS['widget']['pf-ccy-risk'] = addTitle(
        $('div#pf-ccy-risk').init_wfi_table(
            {datasource: 'pf_ccy_expo',
             title: ko.observable("CURRENCY RISK"),
             input_args: {
                 't_date': ko.pureComputed(function() { return (new Date(paramsInput.t_date()))})
             },
             processOption: function() {
                 var self = this;
                 self.title("CURRENCY RISK (AS OF " + d3.timeFormat('%Y-%m-%d')(self.input_args.t_date()) + ")")
             },
             columns_setup: [
                 {data: "key",
                  sortable: false,
                  visible: true,
                  width: '50%',
                  title: '',
                  render: function(value, type, row) {
                      return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                  }},
                 {data: "exposure",
                  sortable: false,
                  visible: true,
                  width: '50%',
                  title: 'Exposure',
                  render: function(value) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}}
             ],
             group_columns: ['currency', 'securityType_name', 'security_name'],
             init_level: 0,
             init_expand: 1,
             aggfun: function(node) {
                 sum(node, 'exposure', 1);
             },
             update: updateSize}
        ));


    PARAMS['widget']['pf-txns'] = addTitle(
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
             },
             process_row: function(row, rowdata) {
                 $('.sid-clickable', row).click(function() {
                     var url = '../sec_profile/security_profile?sid={sid}'
                     url = url.replace(
                         '{sid}', rowdata['security_id']).replace('{pid}');
                     window.open(url, '_blank');
                 });
             },
             process_child_data: function(data, depth) {
                 var self = this;
                 var n = self.options.sort_by.length;
                 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
             },
             columns_setup: [
                 {data: "lot_id",
                  sortable: false,
                  visible: true,
                  title: '<div style="text-align: left">TradeId</div>',
                  width: '15%',
                  render: function(value, type, row) {
                      var self = this;
                      var level = group_columns[row.depth];
                      if (level == null) {
                          return '<div style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                      }
                      return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                  }},
                  {data: 'fund_id',
                     sortable: false,
                     visible: true,
                     title: 'FundID',
                     width: '5%',
                     render: function(value, type, row) {
                         return '<div class="value sid-clickable">' + d3.format(".0f")(row['fund_id']) + '</div>';
                     }},
                 {data: 'sid',
                  sortable: false,
                  visible: true,
                  title: 'Sid',
                  width: '5%',
                  render: function(value, type, row) {
                      return '<div class="value sid-clickable">' + d3.format(".0f")(row['sid']) + '</div>';
                  }},
                 {data: 'trade_dt',
                  sortable: false,
                  visible: true,
                  title: 'TradeDt',
                  width: '10%',
                  render: function(value, type, row) {
                      try {
                          return '<div class="value">' + d3.timeFormat("%m/%d/%y")(value) + '</div>';
                      } catch(err) {
                          return '<div class="value"></div>'
                      }
                  }},
                 {data: 'txn_typ',
                  sortable: false,
                  visible: true,
                  title: 'TransType',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'account',
                  sortable: false,
                  visible: true,
                  title: 'Account',
                  width: '5%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'secTyp',
                  sortable: false,
                  visible: true,
                  title: 'SecurityType',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'deal',
                  sortable: false,
                  visible: true,
                  title: 'Deal',
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'secname',
                  sortable: false,
                  visible: true,
                  title: 'Description',
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'identifier',
                  sortable: false,
                  visible: true,
                  title: 'Identifer',
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'quantity',
                  sortable: false,
                  visible: true,
                  title: 'Quantity',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.0f")(value) + '</div>';
                  }},
                 {data: 'trade_px',
                  sortable: false,
                  visible: true,
                  title: 'TradePx',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'cob_px',
                  sortable: false,
                  visible: true,
                  title: 'CobPx',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'factor',
                  sortable: false,
                  visible: true,
                  title: 'Factor',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.4f")(value) + '</div>';
                  }},
                 {data: 'ccy',
                  sortable: false,
                  visible: true,
                  title: 'Currency',
                  width: '5%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }},
                 {data: 'accruedInt',
                  sortable: false,
                  visible: true,
                  title: 'AccruedInt',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'total_clean',
                  sortable: false,
                  visible: true,
                  title: 'TotalClean',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'total_amount',
                  sortable: false,
                  visible: true,
                  title: 'TotalAmount',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {data: 'counterpart',
                  sortable: false,
                  visible: true,
                  title: 'Counterpart',
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + value + '</div>';
                  }}
             ],
             group_columns: ['fund_name', 'trade_id', 'lot_id'],
             init_level: 1,
             init_expansion_level: 2,
             keyfield: 'lot_id',
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['tag1'] = p['tag1'] || '';
                     p['tag2'] = p['tag2'] || '';
                     p['tag3'] = p['tag3'] || '';
                     p['trade_dt'] = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(p['trade_dt']);
                     p['fund_name'] = fund_map[p['fund_id']] || 'fund-' + p['fund_id'];
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
                 first(node, 'fund_id', 1);
                 first(node, 'secTyp', 1);
                 first(node, 'trade_dt', 1);
                 first(node, 'secname', 1);
                 first(node, 'identifier', 1);

                 weightedAvg(node, 'trade_px', 'quantity', 1);
                 weightedAvg(node, 'cob_px', 'quantity', 1);
                 weightedAvg(node, 'factor', 'quantity', 1);
                 first(node, 'trade_flat', 3);

                 weightedAvg(node, 'fx_rate', 'quantity', 1);
                 // sum(node, 'delta_adj_expo', 1);
             },
             update: updateSize}
        ), true);

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
