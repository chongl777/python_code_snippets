var initialize = function(PARAMS, paramsInput) {
    // currency exposure
    // PARAMS['widget']['pf_ccy_expo'] = addTitle(
    //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    var excelpng = './static/src/images/file-image/icxlsx.png'
    var cached_setup = CachedParams('reconciliation_setup');
    var group_columns = [];

    function get_cash_reconcile(query_id, datasrc, custodian) {
        return $(query_id).init_wfi_cash_reconcile_table(
            {
                datasource: datasrc,
                title: ko.observable("CASH RECONCILIATION"),
                input_args: {
                    start_date: ko.pureComputed(function() { return (new Date(paramsInput.start_date()));}),
                    end_date: ko.pureComputed(function() { return (new Date(paramsInput.end_date()));}),
                    fund_id: ko.pureComputed(function() { return paramsInput.selected_fund()[0];}),
                },
                processOption: function() {
                    var self = this;
                    var start_date = self['input_args']['start_date']();
                    var end_date = self['input_args']['end_date']();
                    self.title(
                        'CASH RECONCILIATION (from ' +
                            d3.timeFormat('%Y-%m-%d')(start_date) + ' to ' +
                            d3.timeFormat('%Y-%m-%d')(end_date) + ')');
                },
                group_columns: ['ccy', 'group', 'trade_dt'],
                init_level: 0,
                init_expand: 2,
                aggfun: function(node) {
                    sum(node, 'net_amount_gs', 2);
                    sum(node, 'net_amount_wfi', 2);
                    sum(node, 'diff', 2);
                    // sum(node, 'delta_adj_expo', 1);
                },
                keyfield: "group",
                process_row: function(row, rowdata) {
                    $('.sid-clickable', row).click(function() {
                        var url = 'https://wfiubuntu01.wfi.local/pfmgmt/sec_profile/security_profile?sid={sid}';
                        var params = 'trading_records=1&fund_id='+rowdata['fund_id']+'&paper_trade=0';
                        url = url + "&" + params;

                        url = url.replace(
                            '{sid}', rowdata['security_id']);
                        window.open(url, '_blank');
                    });
                },

                add_other_cash_record: function(data, callback) {
                    $.ajax({
                        url: "api_add_record_other_cash",
                        method: "GET",
                        dataType: 'json',
                        data: {
                            'fund_id': data['fund_id'],
                            'trade_dt': data['trade_dt'],
                            'set_dt': data['set_dt'],
                            'ccy': data['ccy'],
                            'amount': data['amount'],
                            'is_pnl': data['is_pnl'],
                            'set_acct': data['set_acct'],
                            'comment': data['comment']
                        },
                        success: function(data) {
                            callback(data)
                        },
                        error: function (error) {
                            alert("script:updateContent:"+error.responseText);
                        }
                    })
                },
                options: function(data) {
                    var self = this;
                    var html = $(' \
                    <table style="width:300px"> \
                      <col width="40%"> \
                      <col width="30%"> \
                      <tbody> \
                        <tr> \
                        </tr> \
                      </tbody> \
                    </table>');
                    return html
                },
                updateData: function(f) {
                    var self = this;
                    var start_date = self.options['input_args']['start_date']();
                    var end_date = self.options['input_args']['end_date']();

                    var pid = self.options['input_args']['fund_id']();

                    $.ajax({
                        "url": 'update_cash_reconciliation',
                        "method": "GET",
                        dataType: 'text',
                        "data": {
                            pid: parseInt(pid),
                            custodian: custodian,
                            start_date: start_date.toLocaleString(),
                            end_date: end_date.toLocaleString(),
                            custodain: custodian
                        },
                        "success": function(data) {
                            data = JSON.parse(data.replace(/NaN/g, "0"));
                            f(data);
                        },
                        error: function (error) {
                            f();
                            alert("error:"+error.responseText);
                        }
                    });
                },
                updateSize: updateSize
            });
    }

    // cash reconcile gs
    PARAMS['widget']['cash-reconcile-gs'] = addTitle(
        get_cash_reconcile('div#cash-reconcile-gs', 'cash-reconcile-gs', 'GS'),
        false, false, false);

    // cash reconcile ib
    PARAMS['widget']['cash-reconcile-ib'] = addTitle(
        get_cash_reconcile('div#cash-reconcile-ib', 'cash-reconcile-ib', 'IB'),
        false, false, false);

    // cash reconcile

    // position reconcile
    PARAMS['widget']['pos-reconcile-gs'] = addTitle(
        $('div#pos-reconcile-gs').init_wfi_table(
            {datasource: 'pos-reconcile-gs',
             title: ko.observable("POSITION RECONCILIATION"),
             input_args: {
                 start_date: ko.pureComputed(function() { return (new Date(paramsInput.start_date()));}),
                 end_date: ko.pureComputed(function() { return (new Date(paramsInput.end_date()));}),
                 fund_id: ko.pureComputed(function() { return paramsInput.pid();}),
                 init_expansion_level: 3,
                 group_by: [
                     {grp_field: cached_setup('', 'security_id'),
                      sort_field: cached_setup('level_1_sort', 'mktval_clean_diff'),
                      ascend: cached_setup('level_1_ascend', false),
                      grp_field_options: ['security_id'],
                      sort_field_options: ['security_id', 'quantity_wf', 'diff', 'mktval_clean_diff']}],
             },
             processOption: function() {
                 var self = this;
                 self.sort_by = [{field: 'rank', ascend: true}, {field: 'product_typ', ascend: true}];

                 self.init_expansion_level = self.input_args.init_expansion_level;

                 // group columns
                 var group = ['total', 'product_typ', 'security_id'];
                 self.input_args.group_by.forEach(function(p, i) {
                     if (p.grp_field() != 'None') {
                         group.push(p.grp_field());
                         self.sort_by.push({field: p.sort_field(), ascend: p.ascend()})
                     }
                 });

                 // copy self.group_colums to group_columns
                 self.group_columns = group;
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
             columns_setup: [
                 {data: "security_id",
                  title: 'Security Id',
                  sortable: false,
                  visible: true,
                  width: '10%',
                  render: function(value, type, row) {
                      var level = group_columns[row.depth-1];
                      if (level == 'security_id') {
                          return '<div class="sid-clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                      } else {
                          return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                      }
                  }},
                 {title: "Description",
                  sortable: false,
                  data: 'description',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      if (row.depth == 1)
                          return '<div></div>';
                      return '<div>' + value + '</div>';
                  }},
                 {title: "Quantity(WFI)",
                  sortable: false,
                  data: 'quantity_wf',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Quantity(GS)",
                  sortable: false,
                  data: 'quantity_gs',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Diff",
                  sortable: false,
                  data: 'diff',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Price(GS)",
                  sortable: false,
                  data: 'price_gs',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Price(WFI)",
                  sortable: false,
                  data: 'price_wf',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "MktVal Diff",
                  sortable: false,
                  data: 'mktval_clean_diff',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }}
             ],
             process_child_data: function(data, depth) {
                 var self = this;
                 var n = self.options.sort_by.length;
                 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
             },
             process_row: function(row, rowdata) {
                 $('.sid-clickable', row).click(function() {
                     var url = 'https://wfiubuntu01.wfi.local/pfmgmt/sec_profile/security_profile?sid={sid}';
                     var params = 'trading_records=1&fund_id='+rowdata['fund_id']+'&paper_trade=0';
                     url = url + "&" + params;

                     url = url.replace(
                         '{sid}', rowdata['security_id']);
                     window.open(url, '_blank');
                 });
             },
             keyfield: 'security_id',
             aggfun: function(node) {
                 first(node, 'total', 1);
                 first(node, 'fund_id', 1);
                 first(node, 'description', 3);
                 sum(node, 'quantity_gs', 1);
                 sum(node, 'quantity_wf', 1);
                 first(node, 'price_gs', 1);
                 first(node, 'price_wf', 1);
                 sum(node, 'diff', 1);
                 sum(node, 'mktval_clean_diff', 1);
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
                   </table>');
                 return html
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['total'] = 'total';
                     p['diff'] = p['quantity_gs'] - p['quantity_wf'];
                     p['mktval_clean_diff'] = - p['mktval_clean_wf'] + p['mktval_clean_gs'];
                     p['description'] = p['description'] || p['gsid'];
                     p['rank'] = p['product_typ'] == 'Unmatched' ? 100 : 0;
                     dataClone.push(p);
                 });
                 dataClone.sort(sort_by(options.sort_by));
                 try{
                     var t_date = d3.timeParse('%Y-%m-%dT%H:%M:%S')(dataClone[0]['cob_date']);
                     options.title(d3.timeFormat('POSITIONS RECONCILIATION (AS OF %Y-%m-%d)')(t_date));
                 } catch(err) {
                     options.title('POSITIONS RECONCILIATION');
                 }
                 return dataClone;
             },
             updateSize: updateSize}
        ), true, false, false);


    // position reconcile
    PARAMS['widget']['pos-reconcile-bb'] = addTitle(
        $('div#pos-reconcile-bb').init_wfi_table(
            {datasource: 'pos-reconcile-bb',
             title: ko.observable("POSITION RECONCILIATION"),
             input_args: {
                 start_date: ko.pureComputed(function() { return (new Date(paramsInput.start_date()));}),
                 end_date: ko.pureComputed(function() { return (new Date(paramsInput.end_date()));}),
                 fund_id: ko.pureComputed(function() { return paramsInput.pid();}),
                 init_expansion_level: 3,
                 group_by: [
                     {grp_field: cached_setup('', 'security_id'),
                      sort_field: cached_setup('level_1_sort', 'mktval_clean_diff'),
                      ascend: cached_setup('level_1_ascend', false),
                      grp_field_options: ['security_id'],
                      sort_field_options: ['security_id', 'quantity_wf', 'diff', 'mktval_clean_diff']}],
             },
             processOption: function() {
                 var self = this;
                 self.sort_by = [{field: 'rank', ascend: true}, {field: 'product_typ', ascend: true}];

                 self.init_expansion_level = self.input_args.init_expansion_level;

                 // group columns
                 var group = ['total', 'product_typ', 'security_id'];
                 self.input_args.group_by.forEach(function(p, i) {
                     if (p.grp_field() != 'None') {
                         group.push(p.grp_field());
                         self.sort_by.push({field: p.sort_field(), ascend: p.ascend()})
                     }
                 });

                 // copy self.group_colums to group_columns
                 self.group_columns = group;
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
             columns_setup: [
                 {data: "security_id",
                  title: 'Security Id',
                  sortable: false,
                  visible: true,
                  width: '10%',
                  render: function(value, type, row) {
                      var level = group_columns[row.depth-1];
                      if (level == 'security_id') {
                          return '<div class="sid-clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                      } else {
                          return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                      }
                  }},
                 {title: "Description",
                  sortable: false,
                  data: 'description',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      if (row.depth == 1)
                          return '<div></div>';
                      return '<div>' + value + '</div>';
                  }},
                 {title: "Quantity(WFI)",
                  sortable: false,
                  data: 'quantity_wf',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Quantity(BB)",
                  sortable: false,
                  data: 'quantity_cus',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Quantity Diff",
                  sortable: false,
                  data: 'diff',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Factor",
                  sortable: false,
                  data: 'factor',
                  visible: true,
                  width: '10%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "CostBasis(WFI)",
                  sortable: false,
                  data: 'cost_basis_wf',
                  visible: true,
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "CostBasis(BB)",
                  sortable: false,
                  data: 'cost_basis_cus',
                  visible: true,
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "CostBasis Diff",
                  sortable: false,
                  data: 'cost_basis_diff',
                  visible: true,
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Price(BB)",
                  sortable: false,
                  data: 'price_cus',
                  visible: true,
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Price(WFI)",
                  sortable: false,
                  data: 'price_wf',
                  visible: true,
                  width: '15%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "MktVal Diff",
                  sortable: false,
                  data: 'mktval_clean_diff',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Clean PnL DTD(BB)",
                  sortable: false,
                  data: 'pnl_dtd_cus',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Clean PnL DTD(WFI)",
                  sortable: false,
                  data: 'pnl_dtd_wf',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Clean PnL Diff",
                  sortable: false,
                  data: 'pnl_dtd_diff',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }},
                 {title: "Total PnL DTD(WFI)",
                  sortable: false,
                  data: 'total_pnl_dtd_wf',
                  visible: true,
                  width: '20%',
                  render: function(value, type, row) {
                      return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                  }}
             ],
             process_child_data: function(data, depth) {
                 var self = this;
                 var n = self.options.sort_by.length;
                 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
             },
             process_row: function(row, rowdata) {
                 $('.sid-clickable', row).click(function() {
                     var url = 'https://wfiubuntu01.wfi.local/pfmgmt/sec_profile/security_profile?sid={sid}';
                     var params = 'trading_records=1&fund_id='+rowdata['fund_id']+'&paper_trade=0';
                     url = url + "&" + params;

                     url = url.replace(
                         '{sid}', rowdata['security_id']);
                     window.open(url, '_blank');
                 });
             },
             keyfield: 'security_id',
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['total'] = 'total';
                     p['diff'] = p['quantity_cus'] - p['quantity_wf'];
                     p['total'] = 'total';
                     p['mktval_clean_diff'] = - p['mktval_clean_wf'] + p['mktval_clean_cus'];
                     p['pnl_dtd_diff'] = - p['pnl_dtd_wf'] + p['pnl_dtd_cus'];

                     p['cost_basis_diff'] = - p['cost_basis_wf'] + p['cost_basis_cus'];

                     p['description'] = p['description'] || p['gsid'];
                     p['rank'] = p['product_typ'] == 'Unmatched' ? 100 : 0;
                     dataClone.push(p);
                 });
                 dataClone.sort(sort_by(options.sort_by));
                 try{
                     var t_date = d3.timeParse('%Y-%m-%dT%H:%M:%S')(dataClone[0]['t_date']);
                     options.title(d3.timeFormat('POSITIONS RECONCILIATION (AS OF %Y-%m-%d)')(t_date));
                 } catch(err) {
                     options.title('POSITIONS RECONCILIATION');
                 }
                 return dataClone;
             },
             aggfun: function(node) {
                 first(node, 'total', 1);
                 first(node, 'fund_id', 1);
                 first(node, 'factor', 1);
                 first(node, 'description', 3);
                 sum(node, 'quantity_cus', 1);
                 sum(node, 'quantity_wf', 1);
                 sum(node, 'pnl_dtd_cus', 1);
                 sum(node, 'pnl_dtd_wf', 1);
                 sum(node, 'total_pnl_dtd_wf', 1);
                 sum(node, 'pnl_dtd_diff', 1);

                 weightedAvg(node, 'cost_basis_cus', 'quantity_cus', 1);
                 weightedAvg(node, 'cost_basis_wf', 'quantity_wf', 1);
                 sum(node, 'cost_basis_diff', 1);
                 first(node, 'price_cus', 1);
                 first(node, 'price_wf', 1);
                 sum(node, 'diff', 1);
                 sum(node, 'mktval_clean_diff', 1);
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
                   </table>');
                 return html
             },
             updateSize: updateSize}
        ), true, false, false);


    PARAMS['widget']['processed-file-gs-mtd-trd'] = addTitle(
        $('div#processed-file-gs-mtd-trd').init_wfi_table(
            {datasource: 'processed-file-gs-mtd-trd',
             title: ko.observable("PROCESSED MTD TRADE FILE"),
             init_level: 0,
             init_expand: 0,
             scrollY: '100px',
             scrollCollapse: false,
             columns_setup: [
                 {data: "t_date",
                  title: 'Report Date',
                  sortable: false,
                  visible: true,
                  width: '20%',
                  render: function(value) {
                      return '<div>' + d3.timeFormat('%Y-%m-%d')(value) + '</div>';}},
                 {data: "rpt_name",
                  sortable: false,
                  title: 'Name',
                  visible: true,
                  width: '80%',
                  render: function(value, type, row) {
                      var img = '<img width="16" height="16" border="0" alt="" src="' + excelpng + '">';
                      return '<div class="clickable file">' + img + value + '</div>';;
                  }}],
             group_columns: ['t_date'],
             keyfield: "t_date",
             process_row: function(row, rowdata) {
                 $('.file', row).click(function() {
                     var args = {
                         t_date: rowdata['t_date'].toLocaleString(),
                         rpt_name: rowdata['rpt_name']};
                     var args_vec = [];
                     $.each(args, function(x, y) {
                         args_vec.push(x+"="+y);
                     })

                     var xhr = new XMLHttpRequest();
                     xhr.open('GET', 'api_download_file?'+args_vec.join('&'), true);
                     xhr.responseType = 'arraybuffer';

                     xhr.onload = function(e) {
                         if (this.status == 200) {
                             var fr = new FileReader();
                             // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
                             //var binary = fr.readAsArrayBuffer(blob);
                             var blob = new Blob([xhr.response], {type: 'octet/stream'});
                             var downloadUrl = URL.createObjectURL(blob);
                             //window.open(downloadUrl);

                             var a = document.createElement("a");
                             a.href = downloadUrl;
                             a.download = rowdata['rpt_name'];
                             document.body.appendChild(a);
                             a.click();
                             //Do your stuff here
                         }
                     };
                     xhr.send();
                 });
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['t_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['t_date']);
                     dataClone.push(p);
                 });

                 dataClone.sort(function(x, y) {
                     return x.t_date - y.t_date;
                 });
                 return dataClone;
             },
             updateSize: updateSize}
        ), false, false, false);

    PARAMS['widget']['processed-file-gs-fut-acct-bal'] = addTitle(
        $('div#processed-file-gs-fut-acct-bal').init_wfi_table(
            {datasource: 'processed-file-gs-fut-acct-bal',
             title: ko.observable("PROCESSED MTD FUTURE ACCT BALANCE"),
             init_level: 0,
             init_expand: 0,
             scrollY: '100px',
             columns_setup: [
                 {data: "t_date",
                  sortable: false,
                  title: 'Report Date',
                  visible: true,
                  width: '20%',
                  render: function(value) {
                      return '<div>' + d3.timeFormat('%Y-%m-%d')(value) + '</div>';}},
                 {data: "rpt_name",
                  sortable: false,
                  visible: true,
                  title: 'Name',
                  width: '80%',
                  render: function(value, type, row) {
                      var img = '<img width="16" height="16" border="0" alt="" src="' + excelpng + '">';
                      return '<div class="clickable file">' + img + value + '</div>';;
                  }}],
             group_columns: ['t_date'],
             keyfield: "t_date",
             process_row: function(row, rowdata) {
                 $('.file', row).click(function() {
                     var args = {
                         t_date: rowdata['t_date'].toLocaleString(),
                         rpt_name: rowdata['rpt_name']};
                     var args_vec = [];
                     $.each(args, function(x, y) {
                         args_vec.push(x+"="+y);
                     })

                     var xhr = new XMLHttpRequest();
                     xhr.open('GET', 'api_download_file?'+args_vec.join('&'), true);
                     xhr.responseType = 'arraybuffer';

                     xhr.onload = function(e) {
                         if (this.status == 200) {
                             var fr = new FileReader();
                             // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
                             //var binary = fr.readAsArrayBuffer(blob);
                             var blob = new Blob([xhr.response], {type: 'octet/stream'});
                             var downloadUrl = URL.createObjectURL(blob);
                             //window.open(downloadUrl);

                             var a = document.createElement("a");
                             a.href = downloadUrl;
                             a.download = rowdata['rpt_name'];
                             document.body.appendChild(a);
                             a.click();
                             //Do your stuff here
                         }
                     };
                     xhr.send();
                 });
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['t_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['t_date']);
                     dataClone.push(p);
                 });

                 dataClone.sort(function(x, y) {
                     return x.t_date - y.t_date;
                 });
                 return dataClone;
             },
             updateSize: updateSize}
        ), false, false, false);

    PARAMS['widget']['processed-file-gs-fut-journel'] = addTitle(
        $('div#processed-file-gs-fut-journel').init_wfi_table(
            {datasource: 'processed-file-gs-fut-journel',
             title: ko.observable("PROCESSED MTD FUTURE JOURNEL ENTRIES"),
             init_level: 0,
             init_expand: 0,
             scrollY: '100px',
             columns_setup: [
                 {data: "t_date",
                  sortable: false,
                  title: 'Report Date',
                  visible: true,
                  width: '20%',
                  render: function(value) {
                      return '<div>' + d3.timeFormat('%Y-%m-%d')(value) + '</div>';}},
                 {data: "rpt_name",
                  sortable: false,
                  visible: true,
                  title: 'Name',
                  width: '80%',
                  render: function(value, type, row) {
                      var img = '<img width="16" height="16" border="0" alt="" src="' + excelpng + '">';
                      return '<div class="clickable file">' + img + value + '</div>';;
                  }}],
             group_columns: ['t_date'],
             keyfield: "t_date",
             process_row: function(row, rowdata) {
                 $('.file', row).click(function() {
                     var args = {
                         t_date: rowdata['t_date'].toLocaleString(),
                         rpt_name: rowdata['rpt_name']};
                     var args_vec = [];
                     $.each(args, function(x, y) {
                         args_vec.push(x+"="+y);
                     })

                     var xhr = new XMLHttpRequest();
                     xhr.open('GET', 'api_download_file?'+args_vec.join('&'), true);
                     xhr.responseType = 'arraybuffer';

                     xhr.onload = function(e) {
                         if (this.status == 200) {
                             var fr = new FileReader();
                             // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
                             //var binary = fr.readAsArrayBuffer(blob);
                             var blob = new Blob([xhr.response], {type: 'octet/stream'});
                             var downloadUrl = URL.createObjectURL(blob);
                             //window.open(downloadUrl);

                             var a = document.createElement("a");
                             a.href = downloadUrl;
                             a.download = rowdata['rpt_name'];
                             document.body.appendChild(a);
                             a.click();
                             //Do your stuff here
                         }
                     };
                     xhr.send();
                 });
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['t_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['t_date']);
                     dataClone.push(p);
                 });

                 dataClone.sort(function(x, y) {
                     return x.t_date - y.t_date;
                 });
                 return dataClone;
             },
             updateSize: updateSize}
        ), false, false, false);

    PARAMS['widget']['processed-file-gs-otc-acct-bal'] = addTitle(
        $('div#processed-file-gs-otc-acct-bal').init_wfi_table(
            {datasource: 'processed-file-gs-otc-acct-bal',
             title: ko.observable("PROCESSED MTD OTC ACCOUNT BALANCE"),
             init_level: 0,
             init_expand: 0,
             scrollY: '100px',
             columns_setup: [
                 {data: "t_date",
                  title: 'Report Date',
                  sortable: false,
                  visible: true,
                  width: '20%',
                  render: function(value) {
                      return '<div>' + d3.timeFormat('%Y-%m-%d')(value) + '</div>';}},
                 {data: "rpt_name",
                  title: 'Name',
                  sortable: false,
                  visible: true,
                  width: '80%',
                  render: function(value, type, row) {
                      var img = '<img width="16" height="16" border="0" alt="" src="' + excelpng + '">';
                      return '<div class="clickable file">' + img + value + '</div>';;
                  }}],
             group_columns: ['t_date'],
             keyfield: "t_date",
             process_row: function(row, rowdata) {
                 $('.file', row).click(function() {
                     var args = {
                         t_date: rowdata['t_date'].toLocaleString(),
                         rpt_name: rowdata['rpt_name']};
                     var args_vec = [];
                     $.each(args, function(x, y) {
                         args_vec.push(x+"="+y);
                     })

                     var xhr = new XMLHttpRequest();
                     xhr.open('GET', 'api_download_file?'+args_vec.join('&'), true);
                     xhr.responseType = 'arraybuffer';

                     xhr.onload = function(e) {
                         if (this.status == 200) {
                             var fr = new FileReader();
                             // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
                             //var binary = fr.readAsArrayBuffer(blob);
                             var blob = new Blob([xhr.response], {type: 'octet/stream'});
                             var downloadUrl = URL.createObjectURL(blob);
                             //window.open(downloadUrl);

                             var a = document.createElement("a");
                             a.href = downloadUrl;
                             a.download = rowdata['rpt_name'];
                             document.body.appendChild(a);
                             a.click();
                             //Do your stuff here
                         }
                     };
                     xhr.send();
                 });
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['t_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['t_date']);
                     dataClone.push(p);
                 });

                 dataClone.sort(function(x, y) {
                     return x.t_date - y.t_date;
                 });
                 return dataClone;
             },
             updateSize: updateSize}
        ), false, false, false);

    PARAMS['widget']['processed-file-gs-otc-journel'] = addTitle(
        $('div#processed-file-gs-otc-journel').init_wfi_table(
            {datasource: 'processed-file-gs-otc-journel',
             title: ko.observable("PROCESSED MTD OTC JOURNEL ENTRIES"),
             init_level: 0,
             init_expand: 0,
             scrollY: '100px',
             columns_setup: [
                 {data: "t_date",
                  sortable: false,
                  title: 'Report Date',
                  visible: true,
                  width: '20%',
                  render: function(value) {
                      return '<div>' + d3.timeFormat('%Y-%m-%d')(value) + '</div>';}},
                 {data: "rpt_name",
                  sortable: false,
                  visible: true,
                  title: 'Name',
                  width: '80%',
                  render: function(value, type, row) {
                      var img = '<img width="16" height="16" border="0" alt="" src="' + excelpng + '">';
                      return '<div class="clickable file">' + img + value + '</div>';;
                  }}],
             group_columns: ['t_date'],
             keyfield: "t_date",
             process_row: function(row, rowdata) {
                 $('.file', row).click(function() {
                     var args = {
                         t_date: rowdata['t_date'].toLocaleString(),
                         rpt_name: rowdata['rpt_name']};
                     var args_vec = [];
                     $.each(args, function(x, y) {
                         args_vec.push(x+"="+y);
                     })

                     var xhr = new XMLHttpRequest();
                     xhr.open('GET', 'api_download_file?'+args_vec.join('&'), true);
                     xhr.responseType = 'arraybuffer';

                     xhr.onload = function(e) {
                         if (this.status == 200) {
                             var fr = new FileReader();
                             // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
                             //var binary = fr.readAsArrayBuffer(blob);
                             var blob = new Blob([xhr.response], {type: 'octet/stream'});
                             var downloadUrl = URL.createObjectURL(blob);
                             //window.open(downloadUrl);

                             var a = document.createElement("a");
                             a.href = downloadUrl;
                             a.download = rowdata['rpt_name'];
                             document.body.appendChild(a);
                             a.click();
                             //Do your stuff here
                         }
                     };
                     xhr.send();
                 });
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['t_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['t_date']);
                     dataClone.push(p);
                 });

                 dataClone.sort(function(x, y) {
                     return x.t_date - y.t_date;
                 });
                 return dataClone;
             },
             updateSize: updateSize}
        ), false, false, false);

    PARAMS['widget']['processed-file-gs-custody-positions'] = addTitle(
        $('div#processed-file-gs-custody-positions').init_wfi_table(
            {datasource: 'processed-file-gs-cust-positions',
             title: ko.observable("PROCESSED CUSTODY POSITIONS"),
             init_level: 0,
             init_expand: 0,
             scrollY: '100px',
             columns_setup: [
                 {data: "t_date",
                  sortable: false,
                  title: 'Report Date',
                  visible: true,
                  width: '20%',
                  render: function(value) {
                      return '<div>' + d3.timeFormat('%Y-%m-%d')(value) + '</div>';}},
                 {data: "rpt_name",
                  sortable: false,
                  visible: true,
                  title: 'Name',
                  width: '80%',
                  render: function(value, type, row) {
                      var img = '<img width="16" height="16" border="0" alt="" src="' + excelpng + '">';
                      return '<div class="clickable file">' + img + value + '</div>';;
                  }}],
             group_columns: ['t_date'],
             keyfield: "t_date",
             process_row: function(row, rowdata) {
                 $('.file', row).click(function() {
                     var args = {
                         t_date: rowdata['t_date'].toLocaleString(),
                         rpt_name: rowdata['rpt_name']};
                     var args_vec = [];
                     $.each(args, function(x, y) {
                         args_vec.push(x+"="+y);
                     })

                     var xhr = new XMLHttpRequest();
                     xhr.open('GET', 'api_download_file?'+args_vec.join('&'), true);
                     xhr.responseType = 'arraybuffer';

                     xhr.onload = function(e) {
                         if (this.status == 200) {
                             var fr = new FileReader();
                             // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
                             //var binary = fr.readAsArrayBuffer(blob);
                             var blob = new Blob([xhr.response], {type: 'octet/stream'});
                             var downloadUrl = URL.createObjectURL(blob);
                             //window.open(downloadUrl);

                             var a = document.createElement("a");
                             a.href = downloadUrl;
                             a.download = rowdata['rpt_name'];
                             document.body.appendChild(a);
                             a.click();
                             //Do your stuff here
                         }
                     };
                     xhr.send();
                 });
             },
             preProcess: function(data, options) {
                 var dataClone = []
                 data.forEach(function(p) {
                     p['t_date'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['t_date']);
                     dataClone.push(p);
                 });

                 dataClone.sort(function(x, y) {
                     return x.t_date - y.t_date;
                 });
                 return dataClone;
             },
             updateSize: updateSize}
        ), false, false, false);

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
                node[field] = node[weight] == 0 ? 0 : val1 / node[weight];
            }
            if (node.depth<depth) {
                node[field] = "";
            }
        }
    };

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
