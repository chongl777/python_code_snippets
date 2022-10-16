var initialize = function(PARAMS, paramsInput, baseUrl='..', show_txn=false, paper_trade=false) {
  // currency exposure
  // PARAMS['widget']['pf_ccy_expo'] = addTitle(
  //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
  var colors = d3.scaleOrdinal(d3.schemeCategory10);
  var group_columns = [];
  var cached_setup = CachedParams('pf_positions_setup');
  var strategy_map = paramsInput.available_tags().reduce(
    function(m, obj) {m[obj.strategy_tag] = obj.short_name; return m;}, {});
  var fund_map = paramsInput.available_funds().reduce(
    (m, obj) => {m[obj.pid] = obj.pf_name; return m}, {});
  // delta exposures
  function format_score(x, p) {
      try {
          return d3.format('.1f')(p['score.'+x]).padStart(4, '0');
    } catch(error) {
      return 'NA';
    }
  }

  function format_signal(x, p) {
      try {
          return d3.format('.1f')(p['score.'+x]).padStart(4, '0');
    } catch(error) {
      return 'NA';
    }
  }

  PARAMS['widget']['pf-position-pnl'] = addTitle(
    $('div#pf-position-pnl').init_wfi_table(
      {datasource: 'pf_position_pnl',
       title: ko.observable("PORTFOLIO POSITIONS"),
       input_args: {
         't_date': ko.pureComputed(function() { return (new Date(paramsInput.t_date()));}),
         'ref_date': ko.pureComputed(function() { return (new Date(paramsInput.ref_date()));}),
         'accounts': '',
         'group_by': [
           {grp_field: cached_setup('level_0_grp', 'fund_name'),
            sort_field: cached_setup('level_0_sort', 'rank'),
            ascend: cached_setup('level_0_ascend', true),
            grp_field_options: ['fund_name', 'product_typ', 'industry_level_2', 'industry_level_1',
                                'description', 'deal', 'book',
                                'None', 'sLevel_1', 'sLevel_2', 'sLevel_3',
                                'rtg_normal', 'outstg_bucket', 'liq_score_bucket'],
            sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure',
                                 'period_total_pnl', 'w_risk', 'w_vol']},
           {grp_field: cached_setup('level_1_grp', 'sLevel_1'),
            sort_field: cached_setup('level_1_sort', 'rank'),
            ascend: cached_setup('level_1_ascend', true),
            grp_field_options: ['fund_name', 'product_typ', 'industry_level_2', 'industry_level_1',
                                'description', 'deal', 'book',
                                'None', 'sLevel_1', 'sLevel_2', 'sLevel_3',
                                'rtg_normal', 'outstg_bucket', 'liq_score_bucket'],
            sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure',
                                 'period_total_pnl', 'w_risk', 'w_vol']},
           {grp_field: cached_setup('level_2_grp', 'sLevel_2'),
            sort_field: cached_setup('level_2_sort', 'delta_adj_exposure'),
            ascend: cached_setup('level_2_ascend', false),
            grp_field_options: ['fund_name', 'product_typ', 'industry_level_2', 'industry_level_1',
                                'description', 'deal', 'book',
                                'sLevel_1', 'sLevel_2', 'sLevel_3',  'None',
                                'rtg_normal', 'outstg_bucket', 'liq_score_bucket'],
            sort_field_options: ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure',
                                 'period_total_pnl', 'last_price', 'w_risk', 'w_vol',
                                 'ytw', 'duration', 'eq_intraday_ret']},
           {grp_field: cached_setup('level_3_grp', 'book'),
            sort_field: cached_setup('level_3_sort', 'delta_adj_exposure'),
            ascend: cached_setup('level_3_ascend', false),
            grp_field_options: ['fund_name', 'product_typ', 'industry_level_2', 'industry_level_1',
                                'description', 'deal', 'book',
                                'None', 'sLevel_1', 'sLevel_2', 'sLevel_3',
                                'rtg_normal', 'outstg_bucket', 'liq_score_bucket'],
            sort_field_options: [
              'rank', 'deal', 'description', 'mktval', 'delta_adj_exposure',
              'period_total_pnl', 'last_price', 'w_risk', 'w_vol',
              'ytw', 'duration', 'eq_intraday_ret']},
           {grp_field: cached_setup('level_4_grp', 'description'),
            sort_field: cached_setup('level_4_sort', 'signal'),
            ascend: cached_setup('level_4_ascend', false),
            grp_field_options: ['fund_name', 'product_typ', 'industry_level_2', 'industry_level_1', 'book',
                                'deal', 'sLevel_1', 'sLevel_2', 'sLevel_3', 'description', 'None',
                                'rtg_normal', 'outstg_bucket', 'liq_score_bucket'],
            sort_field_options: ko.pureComputed(function () {
              return ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure',
                      'period_total_pnl', 'last_price', 'w_risk', 'w_vol',
                      'ytw', 'duration', 'eq_intraday_ret'].concat(
                        paramsInput.selected_tag().map((x)=>'signal.'+x)).concat(
                          paramsInput.selected_tag().map((x)=>'score.'+x));})
           },
           {grp_field: cached_setup('level_5_grp', 'sLevel_3'),
            sort_field: cached_setup('level_5_sort', 'delta_adj_exposure'),
            ascend: cached_setup('level_5_ascend', true),
            grp_field_options: ['fund_name', 'product_typ', 'industry_level_2', 'industry_level_1', 'deal',
                                'sLevel_1', 'sLevel_2', 'sLevel_3', 'book', 'description', 'None',
                                'rtg_normal', 'outstg_bucket', 'liq_score_bucket'],
            sort_field_options: ko.pureComputed(function () {
              return ['rank', 'deal', 'description', 'mktval', 'delta_adj_exposure',
                      'period_total_pnl', 'last_price', 'w_risk', 'w_vol',
                      'ytw', 'duration', 'eq_intraday_ret'].concat(
                        paramsInput.selected_tag().map((x)=>'signal.'+x)).concat(
                          paramsInput.selected_tag().map((x)=>'score.'+x));})
           }
         ],
         'init_expansion_level': cached_setup('init_expansion_level', 4),
         'total_expansion_level':  cached_setup('total_expansion_level', null),
         'display': cached_setup('display', 'summary'),
         'display_options': ['summary', 'details']
       },
       filename: "PortfolioPositions",
       sort_by: [],
       // group_columns: ['deal', 'description', 'security'],
       keyfield: 'security',
       processOption: function() {
         var options = this;
         // $('#stra_score', self.tables().header()[0]).html('Stra Score EH|RH');
         var title_suffix = paramsInput.selected_tag().map((x)=>(strategy_map[x])).join(' | ');
         options.columns_setup[30].title="Stra Score <br/>"+title_suffix;
         options.columns_setup[31].title="Stra Signal <br/>"+title_suffix;

         $('th #stra_score', options).text('hello kitty');

         options.init_expansion_level = options.input_args.init_expansion_level();
         options.start_expansion_level = 0;
         options.total_expansion_level = options.input_args.total_expansion_level() || Number.MAX_VALUE;
         options.sort_by = [];
         // group columns
         var group = ['total'];
         options.input_args.group_by.forEach(function(p, i) {
           if (p.grp_field() != 'None') {
             group.push(p.grp_field());
             options.sort_by.push({field: p.sort_field(), ascend: p.ascend()})
           }
         });
         options.group_columns = group.concat(['security']);

         // copy options.group_colums to group_columns
         while(group_columns.length>0) group_columns.pop();
         group_columns.push.apply(group_columns, options.group_columns);

         // display option
         if (options.input_args.display() == 'summary') {
           options.columns_setup.forEach(function(p, i) {
             if (p.detail || false) {
               p.visible = false;
             } else {
               p.visible = true;
             }
           });
         } else {
           options.columns_setup.forEach(function(p, i) {
             p.visible = true;
           });
         }
       },
       process_row: function(row, rowdata) {
         var self = this;

         $('.sid-clickable', row).click(function() {
           var url = baseUrl+'/sec_profile/security_profile?sid={sid}';
           if (show_txn) {
             var params = 'trading_records=1&fund_id='+rowdata.fund_id+'&paper_trade=' + (paper_trade ? 1: 0)
             url = url + "&" + params;
           }

           url = url.replace(
             '{sid}', rowdata['security_id']);
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
            return '<div class="value">' + d3.format(".0f")(value) + '</div>';
            // return '<div class="value"></div>';
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
          detail: true,
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
              '<div class="value">$' + d3.format("7,.2f")(value) + '</div>', criteria);

          }},
         {data: "ytw",
          sortable: false,
          visible: true,
          title: 'Current Yield',
          width: '10%',
          render: function(value, type, row) {
            if (value == "") return '';
            var criteria = row.period_unrealized_pnl || 0;
            return addSignClass(
              '<div class="value">' + d3.format("7,.2f")(value*100) + '%</div>', criteria);
          }},
         {data: "duration",
          sortable: false,
          visible: true,
          title: 'Modified Dur.',
          width: '10%',
          render: function(value, type, row) {
            if (value == "") return '';
            return '<div class="value">' + d3.format("7,.2f")(value) + '</div>';
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
         {data: "factor",
          sortable: false,
          visible: true,
          title: 'Factor',
          width: '10%',
          detail: true,
          render: function(value) {
            if (value == "" | value == null) return '';
            return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
         {data: "tradeFlat",
          sortable: false,
          visible: true,
          title: 'Trade Flat',
          width: '10%',
          detail: true,
          render: function(value) {
            if (value == "" | value == null) return '';
            return '<div class="value">' + value + '</div>'}},
         {data: "coupon",
          sortable: false,
          visible: true,
          title: 'Coupon',
          width: '10%',
          detail: true,
          render: function(value) {
            if (value == "" | value == null) return '';
            return '<div class="value">' + d3.format(",.2f")(value*100) + '%</div>'}},
         {data: "fx_rate",
          sortable: false,
          visible: true,
          width: '10%',
          title: 'FX',
          detail: true,
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
         {sortable: false,
          visible: true,
          width: '15%',
          title: '% R_Exposure',
          render: function(val, type, row) {
            var value = row['w_risk'];
            if (value == "" | value == null) return '<div class="value">-</div>';
            if (value == 0) return '<div class="value">-</div>';
            return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
         {sortable: false,
          visible: true,
          width: '15%',
          title: '% Vol_Exposure',
          render: function(val, type, row) {
            var value = row['w_vol'];
            if (value == "" | value == null) return '<div class="value">-</div>';
            if (value == 0) return '<div class="value">-</div>';
            return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
         {data: "period_fx_pnl",
          sortable: false,
          visible: true,
          title: 'Period to Date\n FX P&L',
          width: '20%',
          detail: true,
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
         {data: "eq_intraday_ret",
          sortable: false,
          visible: true,
          title: 'Eq Return',
          width: '15%',
          render: function(value, type, row) {
            if (value == null) return '';
            var criteria = row.eq_intraday_ret || 0;
            return addSignClass(
              '<div class="value">' + d3.format("7,.2f")(value*100) + '%</div>', criteria);

          }},
         {data: 'score',
          sortable: false,
          visible: true,
          title: '<div id="stra_score">Stra Score</div>',
          width: '22%',
          render: function(value, type, row) {
              // if (value == "" | value == null) return '<div class="value"></div>';
              let tag1 = paramsInput.selected_tag()[0];
              if (tag1 == null) return '<div class="value"></div>';
              if (row['score.'+ tag1] == "" | row['score.'+ tag1] == null) return '<div class="value"></div>';
              let res = paramsInput.selected_tag().map((x)=>format_score(x, row)).filter((x) => (x!=null)).join('|');
              return '<div class="value strategy"><tt>' + res + '</tt></div>'}},
         {data: "signal",
          sortable: false,
          visible: true,
          title: '<div id="stra_signal">Stra Signal</div>',
          width: '22%',
          render: function(value, type, row) {
              let tag1 = paramsInput.selected_tag()[0];
              if (tag1 == null) return '<div class="value"></div>';
              if (row['score.'+ tag1] == "" | row['score.'+ tag1] == null) return '<div class="value"></div>';
              let res = paramsInput.selected_tag().map((x)=>format_signal(x, row)).filter((x) => (x!=null)).join('|');
              return '<div class="value strategy"><tt>' + res + '</tt></div>'}}
       ],
       preProcess: function(data, options) {
         options.title("PORTFOLIO POSITIONS (" +
                       d3.timeFormat('%Y-%m-%d')(options.input_args.ref_date())+
                       " TO " +
                       d3.timeFormat('%Y-%m-%d')(options.input_args.t_date()) + ")");

         var dataClone = []
         data.forEach(function(p) {
           try {
             p['pricing_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['pricing_date']);
           } catch(err) {
             p['pricing_date'] = null;
           };
           // try {
           //     p['stra_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(p['stra_date']);
           // } catch(err) {
           //     p['stra_date'] = null;
           // }
             p['fund_name'] = fund_map[p['fund_id']] || 'fund-' + p['fund_id'];

             //paramsInput.selected_tag().map((x)=>format_score(x, p)).filter((x) => (x!=null)).join('|')
             //paramsInput.selected_tag().map((x)=>(format_signal(x, p))).join('|');

             // p['score'] = paramsInput.selected_tag().map((x)=>format_score(x, p)).filter((x) => (x!=null)).join('|')
             // p['signal'] = paramsInput.selected_tag().map((x)=>(format_signal(x, p))).join('|');
           // p['description'] = p['security'].description;
           p['book'] = p['product_typ'] == 'Currency' ? 'Cash' : (p['direction'] ? 'Long' : 'Short');
           p['period_fx_pnl'] = (p['period_realized_fx_pnl'] || 0) + (p['period_unrealized_fx_pnl'] || 0);
           p['cleanCostBasis'] = p['cleanCostBasis'] || p['costBasis'];
           p['total'] = 'Total';
           p['factor'] = p['factor'] || 1;
           // p['description'] = p['product_typ'] == 'Currency' ?  p['account'] : p['description'];
           dataClone.push(p);
         });

         dataClone.sort(sort_by(options.sort_by));
         return dataClone;
       },
       aggfun: function(node) {
         sum(node, 'quantity', 1);
         sum(node, 'prev_quantity', 2);
         sum(node, 'w_risk', 2);
         sum(node, 'w_vol', 2);

         first(node, 'ccy', 4);
         first(node, 'description', 1);
         count(node, 'security_id', 1);
         first(node, 'rank', 1);

           first(node, 'security_id_ref', 4);
         sum(node, 'delta_adj_exposure', 1);
           paramsInput.selected_tag().map(x => weightedAvg(node, 'score.'+x, 'delta_adj_exposure', 4));
           paramsInput.selected_tag().map(x => weightedAvg(node, 'signal.'+x, 'delta_adj_exposure', 4));

           // weightedAvg(node, 'score', 'delta_adj_exposure', 4);
           // weightedAvg(node, 'signal', 'delta_adj_exposure', 4);

         first(node, 'stra_date', 4);
         first(node, 'deal', 1);

         paramsInput.selected_tag().forEach(function(i, p){
           first(node, 'signal.'+i, 4);
           first(node, 'score.'+i, 4);
         });

         weightedAvg(node, 'last_price', 'quantity', 3);
         weightedAvg(node, 'ytw', 'quantity', 3);
         weightedAvg(node, 'duration', 'quantity', 3);
         weightedAvg(node, 'delta', 'quantity', 3);
         weightedAvg(node, 'sdv01', 'quantity', 3);
         weightedAvg(node, 'prev_last_price', 'prev_quantity', 3);
         weightedAvg(node, 'eq_intraday_ret', 'quantity', 3);

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
                      <col width="15%"> \
                      <thead><tr>\
                          <th></th><th>Group</th><th>Sort By</th><th>Ascending</th> \
                      </tr></thead> \
                      <tbody  data-bind="foreach: group_by"> \
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
         return html
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

  var txn_cached_setup = CachedParams('pf_txn_setup');
  PARAMS['widget']['pf-txns'] = (function() {
    var group_columns;
    return addTitle(
      $('div#pf-txns').init_wfi_table(
        {datasource: 'pf_txns',
         title: ko.observable("TRADING RECORDS"),
         input_args: {
           't_date': ko.pureComputed(function() { return (new Date(paramsInput.t_date()));}),
           'ref_date': ko.pureComputed(function() { return (new Date(paramsInput.ref_date()));}),
           'init_expansion_level': txn_cached_setup('init_expansion_level', 4),
           'group_by': [
             {grp_field: txn_cached_setup('level_1_grp', 'product_typ'),
              sort_field: txn_cached_setup('level_1_sort', 'product_typ'),
              ascend: txn_cached_setup('level_1_ascend', true),
              grp_field_options: ['txn_typ', 'secTyp',
                                  'str_trade_dt', 'sid'],
              sort_field_options: ['txn_typ', 'secTyp',
                                   'str_trade_dt', 'sid']},
             {grp_field: txn_cached_setup('level_2_grp', 'txn_typ'),
              sort_field: txn_cached_setup('level_2_sort', 'txn_typ'),
              ascend: txn_cached_setup('level_2_ascend', true),
              grp_field_options: ['txn_typ', 'secTyp',
                                  'str_trade_dt', 'sid'],
              sort_field_options: ['txn_typ', 'secTyp',
                                   'str_trade_dt', 'sid']},
             {grp_field: txn_cached_setup('level_3_grp', 'str_trade_dt'),
              sort_field: txn_cached_setup('level_3_sort', 'str_trade_dt'),
              ascend: txn_cached_setup('level_3_ascend', true),
              grp_field_options: ['txn_typ', 'secTyp', 'None',
                                  'str_trade_dt', 'sid'],
              sort_field_options: ['txn_typ', 'secTyp', 'None',
                                   'str_trade_dt', 'sid']},
           ],
         },
         sort_by: [{'field': 'trade_dt', ascend: true}],
         processOption: function() {
           var options = this;
           options.title("TRADING RECORDS (" +
                      d3.timeFormat('%Y-%m-%d')(options.input_args.ref_date())+
                      " TO " +
                      d3.timeFormat('%Y-%m-%d')(options.input_args.t_date()) + ")");
           options.init_expand = options.input_args.init_expansion_level();

           var group = [];
           options.input_args.group_by.forEach(function(p, i) {
             if (p.grp_field() != 'None') {
               group.push(p.grp_field());
               options.sort_by.push({field: p.sort_field(), ascend: p.ascend()})
             }
           });
           options.group_columns = group.concat(['sid']);
           options.sort_by.push({field: 'sid', ascend: true});
           group_columns = options.group_columns
         },
         process_row: function(row, rowdata) {
           $('.sid-clickable', row).click(function() {
             var url = baseUrl+'/sec_profile/security_profile?sid={sid}';
             url = url.replace(
               '{sid}', rowdata['sid']);
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
              var field = group_columns[row.depth-1];
              return '<div class="value clickable">'+ row[field] + '</div>'
              // try {
              //   return '<div class="value clickable">' + d3.timeFormat("%m/%d/%y")(row[field]) + '</div>';
              // } catch(err) {
              //   return '<div class="value">'+ row[field] + '</div>'
              // }
            }},
           {data: 'txn_typ',
            sortable: false,
            visible: true,
            title: 'TransType',
            width: '10%',
            render: function(value, type, row) {
              var field = group_columns[row.depth-1];
              return '<div class="value">' + value + '</div>';
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
         'init_expansion_level': 1,
         'total_expansion_level': null,
         keyfield: 'sid',
         preProcess: function(data, options) {
           var dataClone = []
           data.forEach(function(p) {
             p['tag1'] = p['tag1'] || '';
             p['tag2'] = p['tag2'] || '';
             p['tag3'] = p['tag3'] || '';
             p['trade_dt'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['trade_dt']);
             p['str_trade_dt'] = d3.timeFormat('%Y-%m-%d')(p['trade_dt']);
             dataClone.push(p);
           });

           dataClone.sort(sort_by(options.sort_by));
           return dataClone;
         },
         options: function(data) {
           var self = this;
           var html = $(' \
                    <table style="width:500px"> \
                      <col width="25%"> \
                      <col width="30%"> \
                      <col width="30%"> \
                      <col width="15%"> \
                      <thead><tr>\
                          <th></th><th>Group</th><th>Sort By</th><th>Ascending</th> \
                      </tr></thead> \
                      <tbody  data-bind="foreach: group_by"> \
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
                              </tbody> \
                          </table> \
                        </td></tr>\
                      </tbody> \
                    </table>');
           return html
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
         },
         aggfun: function(node) {
           abs_sum(node, 'quantity', 1);
           sum(node, 'total_amount', 1);
           sum(node, 'total_clean', 1);
           sum(node, 'accruedInt', 1);

           first(node, 'ccy', 1);
           first(node, 'sid', 1);
           first(node, 'deal', 1);
           first(node, 'str_trade_dt', 1);
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
      ), true, true)
  })();


  // ----------------------------------------------------

  function first(node, field, depth) {
    if (field in node) {
      return;
    } else if (node.children == null) {
      node[field] = "";
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
    } else if (node.children == null) {
      node[field] = 0;
    } else {
      node.children.forEach(function(p) {
        sum(p, field, depth);
      });
      if (node.depth<depth) {
        node[field] = 0;
      } else {
        var val = 0;
        node.children.forEach(
          function(p) {
            val += p[field]});
        node[field] = val;
      };
    }
  };

  function abs_sum(node, field, depth) {
    if (field in node) {
      return;
    } else if (node.children == null) {
      node[field] = 0;
    } else {
      node.children.forEach(function(p) {
        abs_sum(p, field, depth);
      });
      if (node.depth<depth) {
        node[field] = 0;
      } else {
        var val = 0;
        node.children.forEach(
          function(p) {
            val += Math.abs(p[field])});
        node[field] = val;
      };
    }
  };

  function count(node, field, depth) {
    if (field in node) {
      return;
    } else if (node.children == null) {
      node[field] = 1;
    } else {
      node.children.forEach(function(p) {
        count(p, field, depth);
      });
      if (node.depth<depth) {
        node[field] = 0;
      } else {
        var val = 0;
        node.children.forEach(
          function(p) {
            if (p.children == null) {
              val += 1;
            } else {
              val += p[field];
            }});
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
                let val1 = 0;
                let weight1 = 0;
                node.children.forEach(
                    function(p) {
                        if ((p[field] != null) & (p[weight] != null)) {
                            val1 += p[field] * p[weight];
                            weight1 += p[weight];
                        }
                    });
                node[field] = Math.abs(weight1) < 0.02 ? null : val1 / weight1;
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
