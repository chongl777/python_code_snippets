function create_screening_table(
    query, title, datasource, cached_setup,
    baseUrl='https://wfiubuntu01.wfi.local/pfmgmt') {
    // currency exposure
    // PARAMS['widget']['pf_ccy_expo'] = addTitle(
    //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
    // delta exposures
    var show_comments = false;
    var TABLE_OPTIONS;
    return $(query).init_wfi_table(
        {datasource: datasource,
         title: ko.observable(title),
         aLengthMenu: [[25, 50, 75, 100], [25, 50, 75, 100]],
         groupdata: true,
         flatten: true,
         bPaginate: true,
         filename: "SecurityScreening",
         input_args: {
             level_1_options: ['product_typ', 'industry_level_1', 'None'],
             level_2_options: ['industry_level_1', 'industry_level_2', 'issuer', 'None'],
             init_expansion_level: cached_setup('init_expansion_level', 3),
             total_expansion_level: cached_setup('total_expansion_level', 3),
             bPaginate: cached_setup('paginate', true),
             true_false_options: [{value: true, display: 'true'}, {value: false, display: 'false'}],
             group_by: [
                 {grp_field: cached_setup('level_1_grp', 'product_typ'),
                  sort_field: cached_setup('level_1_sort', 'product_typ'),
                  ascend: cached_setup('level_1_ascend', true),
                  grp_field_options: ['product_typ', 'industry_level_1', 'industry_level_2',
                                      'issuer', 'score_eh', 'score_rh', 'score_erh', 'None'],
                  sort_field_options: ['product_typ', 'industry_level_1', 'industry_level_2',
                                       'issuer', 'score_eh', 'score_rh', 'score_erh', 'None']},
                 {grp_field: cached_setup('level_2_grp', 'None'),
                  sort_field: cached_setup('level_2_sort', 'None'),
                  ascend: cached_setup('level_2_ascend', false),
                  grp_field_options: ['product_typ', 'industry_level_1', 'industry_level_2',
                                      'issuer', 'score_eh', 'score_rh', 'score_erh', 'None'],
                  sort_field_options: ['product_typ', 'industry_level_1', 'industry_level_2',
                                       'issuer', 'score_eh', 'score_rh', 'score_erh', 'None']}
             ]
         },
         processOption: function() {
             var options = this;
             options.title(title);
             options.start_expansion_level = 1;
             options.total_expansion_level = options.input_args.total_expansion_level() || Number.MAX_VALUE;
             options.init_expansion_level = options.input_args.init_expansion_level();
             options.bPaginate = options.input_args.bPaginate()[0];
             options.flatten = options.bPaginate;

             // group columns
             options.sort_by = [];
             // group columns
             var group = ['Total'];
             options.input_args.group_by.forEach(function(p, i) {
                 if (p.grp_field() != 'None') {
                     group.push(p.grp_field());
                     options.sort_by.push({field: p.sort_field(), ascend: p.ascend()});
                 }
             });
             options.group_columns = group.concat(['security_id']);
             TABLE_OPTIONS = options;
             //options.group_columns = group.concat(['security']);
         },
         process_child_data: function(data, depth) {
             var self = this;
             var n = self.options.sort_by.length;

             if ((self.options.sort_by.slice(depth-1, n)).length > 0) {
                 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
             }
         },
         process_row: function(row, rowdata) {
             var self = this;
             var rdepth = Math.min(self.options.total_expansion_level, self.options.group_columns.length-1) - rowdata.depth + 1;
             $('.sid-clickable', row).click(function() {
                 var url = baseUrl+'/sec_profile/security_profile?sid={sid}';
                 var params = 'trading_records=1&fund_id='+8158+'&paper_trade=0';
                 url = url + "&" + params;

                 url = url.replace(
                     '{sid}', rowdata['security_id']);
                 window.open(url, '_blank');
             });
             $(row).addClass('rlevel-'+rdepth.toString());

             // add comments pop-up
             $('a.comment', row).click(function() {
                 var overlay = $('<div>');
                 var removeDlg = function() {overlay.remove();}
                 self.removeDlg = removeDlg;
                 $('body').append(overlay);
                 overlay.attr('id', 'OVER');
                 overlay.html(
                     '<div class="wfidatatable args-dlg 1tgt-px-dlg" \
                       style="width: 400px; height:auto;"></div>');

                 var dlg = $('div.args-dlg', overlay);
                 dlg.css("top", $(window).height()/2-210)
                     .css('left', $(window).width()/2-315);
                 dlg.html(
                     '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 0px"> \
                         <div id="title"> \
                             <h1 style="float: left; ">View Comment</h1> \
                             <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px;"> \
                               <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                                 <span style="padding:0px;height:16px;width:16px;display:inline-block"> \
                                   <span style="height:16px;width:16px; position:relative; \
                                      display:inline-block; overflow:hidden;" class="s4-clust"> \
                                      <img src="./static/src/images/fgimg.png?rev=23" alt="Close dialog" \
                                       style="left:-0px !important;top:-645px !important;position:absolute;" \
                                       class="ms-dlgCloseBtnImg"> \
                                   </span> \
                                 </span> \
                               </a> \
                             </span> \
                         </div> \
                     </div> \
                     <table id="content" align="center"> \
                          <tbody><tr><td><textarea data-bind="value: comments" \
                              style="margin: 0px; width: 370px; height: 260px; resize: none;"></textarea></td></tr></tbody> \
                     </table> \
                     <div class="dlgSetupButton" style="padding:10px"> \
                         <table id="submit-button" style="width:100%"> \
                             <tr> \
                                <td align="center"> \
                                  <input type="button" value="Okay" data-bind="click: submit, enable: enable"/> \
                                </td> \
                                <td align="center"> \
                                  <input type="button" value="Cancel" data-bind="enable: enable"/> \
                                </td> \
                             </tr> \
                          </table> \
                     </div>');
                 dlg.draggable({handle: 'div.dlgTitle'});

                 $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
                 ko.applyBindings(rowdata, overlay[0]);
             })
         },
         columns_setup: [
             {data: "description",
              sortable: false,
              visible: true,
              title: '<div class="hover" data="description">Security</div>',
              width: '10%',
              render: function(value, type, row, meta) {

                  var rdepth = TABLE_OPTIONS.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="clickable" style="margin-left:' + Math.max(1, row.depth)*8 + 'px">' + row[TABLE_OPTIONS.keyfield] + '</div>';
                  } else {
                      return '<div class="clickable" style="margin-left:' + Math.max(1, row.depth)*8 + 'px">' + value + '</div>';
                  }
              }},
             {data: 'security_id',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="security_id">Sid</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  var rdepth = TABLE_OPTIONS.group_columns.length - row.depth;
                  // var level = group_columns[row.depth-1];
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      return '<div class="value sid-clickable">' + value + '</div>';
                  }
              }},
             {data: 'issuer',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="issuer">Issuer</div>',
              width: '10%',
              render: function(value, type, row, meta) {
                  var rdepth = TABLE_OPTIONS.group_columns.length - row.depth;

                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      return '<div class="value">' + value + '</div>';
                  }

              }},
             {data: 'coupon',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="coupon">Coupon</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  var rdepth = TABLE_OPTIONS.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(".2f")(value) + '%</div>';
                  }
              }},
             {data: 'amt_outstanding',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="amt_outstanding">Outstanding Amt</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (value == null) return '<div class="value">-</div>';
                  return '<div class="value">' + d3.format(",.0f")(value/1000000) + 'M</div>';
              }},
             {data: 'maturity',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="maturity">Maturity</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  var rdepth = TABLE_OPTIONS.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'crr_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="crr_px">Current Px</div>',
              width: '5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', row['pct_chg_1d']);
              }},
             {data: 'g_stw',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="g_stw">Crr STW (bps)</div>',
              width: '6%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + d3.format(',.0f')(value) + '</div>';
              }},
             {data: 'modified_dur',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="modified_dur">Modified Dur</div>',
              width: '5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
              }},
             {data: 'last_px_update',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="last_px_update">Last Update</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'px_vol',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="px_vol">Price Vol</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + d3.format(',.2f')(value*100) + '%</div>';
              }},
             {data: 'max_dd',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="max_dd">Max DD</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + d3.format(',.2f')(value*100) + '%</div>';
              }},
             {data: 'diff_chg_1d',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_1d">Chg 1D</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'diff_chg_5d',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_5d">Chg 5D</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'diff_chg_1m',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_1m">Chg 1M</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'diff_chg_1y',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_1y">Chg 1Y</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'industry_level_1',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="industry_level_1">Industry Level 1</div>',
              width: '10%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + value + '</div>';
              }},
             {data: 'industry_level_2',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="industry_level_2">Industry Level 2</div>',
              width: '10%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + value + '</div>';
              }},
             {data: 'rating_sp_composite',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="rating_sp_composite">S&P Rating</div>',
              width: '6%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + value + '</div>';
              }},
             {data: 'prev_rtg_sp_composite',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="prev_rtg_sp_composite">Prev S&P Rtg</div>',
              width: '6%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + value + '</div>';
              }},
             {data: 'rtg_chg_sp_composite',
              sortable: false,
              visible: false,
              title: '<div class="hover" data="rtg_chg_sp_composite">Rating Chg</div>',
              width: '5%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + value + '</div>';
              }},
             {data: 'last_update_sp_composite',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="last_update_sp_composite">Rating Date</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'score_eh',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="score_eh">Score </br> EH</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + parseFloat((value).toFixed(2)) + '</div>';
              }},
             {data: 'signal_eh',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="signal_eh">Signal </br> EH</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + d3.format(',.2f')(value) + '</div>';
              }},
             {data: 'score_rh',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="score_rh">Score </br> RH</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + parseFloat((value).toFixed(2)) + '</div>';
              }},
             {data: 'signal_rh',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="signal_rh">Signal </br> RH</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + d3.format(',.0f')(value) + '</div>';
              }},
             {data: 'score_erh',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="score_erh">Score </br> ERH</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + parseFloat((value).toFixed(2)) + '</div>';
              }},
             {data: 'score_ei',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="score_eh">Score </br> EI</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + parseFloat((value).toFixed(2)) + '</div>';
              }},
             {data: 'signal_ei',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="signal_eh">Signal </br> EI</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + d3.format(',.2f')(value) + '</div>';
              }},
             {data: 'score_ri',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="score_rh">Score </br> RI</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + parseFloat((value).toFixed(2)) + '</div>';
              }},
             {data: 'signal_ri',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="signal_rh">Signal </br> RI</div>',
              width: '4.5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value signal">' + d3.format(',.0f')(value) + '</div>';
              }},
             {data: 'comments',
              sortable: false,
              visible: show_comments,
              title: '<div class="hover" data="comments" style="text-align: center">Comments</div>',
              width: '800px',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class=""></div>';
                  } else {
                      if (value == null)
                          return '<div class=""><a class="comment"></a></div>';
                      return '<div class=""><a class="comment">'+ value + '</a></div>';
                  }
              }},
         ],
         keyfield: 'security_id',
         postProcess: function(self) {
             d3.select(self).selectAll('div.tooltip')
                 .data([1]).enter()
                 .append('div')
                 .attr('class', 'tooltip').style('display', 'none')
                 .append('table')
             var tooltipTab = d3.select(self).selectAll('div.tooltip table');
             var dursec = self.options.dursec;
             tooltipTab.selectAll('*').remove();

             // lines
             tooltipTab.append('tbody')
                 .attr('class', 'text-area')
                 .append('tr')
                 .html('<td>field_key:</td><td id="field"></td>')

             var tooltip = d3.select(self).selectAll('div.tooltip');
             tooltip.active = false;

             d3.select(self).selectAll('.hover').on("mousemove", null).on("mouseleave", null);

             d3.select(self).selectAll('.hover').on("mousemove", function(d) {
                 tooltip.active = true;
                 // lines tooltip
                 //var v = $(this).attr('data');
                 tooltip.select('#field').text($(this).attr('data'));
                 tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
             }).on("mouseleave", function(d) {
                 tooltip.active = false;
                 tooltip.transition()
                     .attr('duration', dursec)
                     .style("opacity", 0)
                     .style("display", "none")
             });
         },
         preProcess: function(data, options) {
             var dataClone = []
             data.forEach(function(p) {
                 p['Total'] = 'Total';
                 dataClone.push(p);
             });

             // dataClone.sort(sort_by(options.sort_by));
             return dataClone;
         },
         aggfun: function(node) {
             average(node, 'crr_spread', 1);
             average(node, 'pct_chg_1d', 1);
             average(node, 'pct_chg_5d', 1);
             average(node, 'pct_chg_1m', 1);
             average(node, 'pct_chg_1y', 1);
             average(node, 'diff_chg_1d', 1);
             average(node, 'diff_chg_5d', 1);
             average(node, 'diff_chg_1m', 1);
             average(node, 'diff_chg_1y', 1);
             average(node, 'score_eh', 1);
             average(node, 'signal_eh', 1);
             average(node, 'score_rh', 1);
             average(node, 'signal_rh', 1);
             average(node, 'score_ei', 1);
             average(node, 'signal_ri', 1);
             average(node, 'score_erh', 1);
             average(node, 'signal_erh', 1);
             sum(node, 'amt_outstanding', 1);
             average(node, 'crr_px', 1);
             average(node, 'g_stw', 1);
             average(node, 'max_dd', 1);
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
                                  <td colspan=1>Paginate</td> \
                                  <td colspan=1 class="value"> \
                                    <select class="boost1-multiselect" \
                                         data-bind="options: true_false_options, \
                                         optionsText: function(item) { \
                                             return item.display;}, \
                                         optionsValue: \'value\', \
                                         selectedOptions: bPaginate">\
                                    </select> \
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

             xhr.onload = function(e) {
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
    );


    /* ----------------------------------------------------
       Supportive Function
       ---------------------------------------------------- */
    function show_tooltip(tooltip, evt, dursec) {
        // tooltip
        var self = this;
        var w = $(tooltip.node()).width();
        var h = $(tooltip.node()).height();
        var w_total = self.options.width;
        var h_total = $(self).height();
        var x = evt.pageX - $(this).offset().left;
        var y = evt.pageY - $(this).offset().top;
        var right_id = true;
        var down_id = true;

        if ((x + w) > w_total) right_id = false;
        if ((y + h + 20) > h_total) down_id = false;

        tooltip
            .style(
                "left",
                (right_id ? (evt.pageX + 10):
                 (evt.pageX - w - 10)) + "px")
            .style("top", (down_id ? (evt.pageY + 30):
                           (evt.pageY - h - 20)) + "px")
            .style("padding-left", "0px")
            .style("padding-right", "5px")
        tooltip.transition()
            .attr('duration', dursec)
            .style('opacity', 0.99)
            .style('display', 'block');
    }


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

    function average(node, field, depth) {
        if (field in node) {
            return;
        } else {
            if (node.children) {
                node.children.forEach(function(p) {
                    average(p, field, depth);
                });
                var n = node.children.length;
                var val1 = 0;
                node.children.forEach(
                    function(p) {
                        val1 += p[field]});
                node[field] = Math.abs(n) < 0.02 ? 0 : val1 / n;
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
}


function create_monitored_table(
    query, title, datasource, group_level_1, group_level_2,
    start_expansion_level, total_expansion_level=null, paginate=true) {
    // currency exposure
    // PARAMS['widget']['pf_ccy_expo'] = addTitle(
    //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    // delta exposures
    return $(query).init_wfi_table(
        {datasource: datasource,
         title: ko.observable(title),
         bPaginate: paginate,
         aLengthMenu: [[25, 50, 75, 100], [25, 50, 75, 100]],
         groupdata: true,
         flatten: true,
         filename: "SecurityScreening",
         input_args: {
             'group_level_0': ko.observable('security_id'),
             'group_level_1': ko.observable(group_level_1),
             'group_level_2': ko.observable(group_level_2),
             'level_1_options': ['product_typ', 'industry_level_1', 'None'],
             'level_2_options': ['industry_level_1', 'industry_level_2', 'issuer', 'None'],
             'start_expansion_level': start_expansion_level,
             'total_expansion_level': total_expansion_level
         },
         sort_by: [],
         total_expansion_level: null,
         processOption: function() {
             var self = this;
             self.title(title);
             self.total_expansion_level = self.input_args.total_expansion_level || Number.MAX_VALUE;

             self.start_expansion_level = self.input_args.start_expansion_level;

             // group columns
             self.group_columns = [self.input_args.group_level_0()];
             if (self.input_args.group_level_2() != 'None') {
                 self.group_columns.splice(0, 0, self.input_args.group_level_2());
             }

             if (self.input_args.group_level_1() != 'None') {
                 self.group_columns.splice(0, 0, self.input_args.group_level_1());
             }
             self.group_columns.splice(0, 0, 'Total');
         },
         process_row: function(row, rowdata) {
             var self = this;
             var rdepth = Math.min(
                 self.options.total_expansion_level, self.options.group_columns.length-1) - rowdata.depth + 1;

             // add security profile pop-up
             $('.sid-clickable', row).click(function() {
                 var url = 'http://westfieldinvestment/pfmgmt/sec_profile/security_profile?sid={sid}&pid={pid}'
                 url = url.replace(
                     '{sid}', rowdata['security_id']).replace('{pid}', rowdata['parent_id']);
                 window.open(url, '_blank');
             });
             $(row).addClass('rlevel-'+rdepth.toString());

             // add comments pop-up
             $('a.comment', row).click(function() {
                 var overlay = $('<div>');
                 var removeDlg = function() {overlay.remove();}
                 self.removeDlg = removeDlg;
                 $('body').append(overlay);
                 overlay.attr('id', 'OVER');
                 overlay.html(
                     '<div class="wfidatatable args-dlg 1tgt-px-dlg" \
                       style="width: 400px; height:auto;"></div>');

                 var dlg = $('div.args-dlg', overlay);
                 dlg.css("top", $(window).height()/2-210)
                     .css('left', $(window).width()/2-315);
                 dlg.html(
                     '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 0px"> \
                         <div id="title"> \
                             <h1 style="float: left; ">View Comment</h1> \
                             <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px;"> \
                               <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                                 <span style="padding:0px;height:16px;width:16px;display:inline-block"> \
                                   <span style="height:16px;width:16px; position:relative; \
                                      display:inline-block; overflow:hidden;" class="s4-clust"> \
                                      <img src="./static/src/images/fgimg.png?rev=23" alt="Close dialog" \
                                       style="left:-0px !important;top:-645px !important;position:absolute;" \
                                       class="ms-dlgCloseBtnImg"> \
                                   </span> \
                                 </span> \
                               </a> \
                             </span> \
                         </div> \
                     </div> \
                     <table id="content" align="center"> \
                          <tbody><tr><td><textarea data-bind="value: comments" \
                              style="margin: 0px; width: 370px; height: 260px; resize: none;"></textarea></td></tr></tbody> \
                     </table> \
                     <div class="dlgSetupButton" style="padding:10px"> \
                         <table id="submit-button" style="width:100%"> \
                             <tr> \
                                <td align="center"> \
                                  <input type="button" value="Okay" data-bind="click: submit, enable: enable"/> \
                                </td> \
                                <td align="center"> \
                                  <input type="button" value="Cancel" data-bind="enable: enable"/> \
                                </td> \
                             </tr> \
                          </table> \
                     </div>');
                 dlg.draggable({handle: 'div.dlgTitle'});

                 $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
                 ko.applyBindings(rowdata, overlay[0]);
             });
         },
         process_child_data: function(data, depth) {
             var self = this;
             var n = self.options.sort_by.length;
			 data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
         },
         columns_setup: [
             {data: "description",
              sortable: false,
              visible: true,
              title: '<div class="hover" data="description">Security</div>',
              width: '10%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div style="margin-left:' + Math.max(1, row.depth)*8 + 'px">' + row[options.keyfield] + '</div>';
                  } else {
                      return '<div style="margin-left:' + Math.max(1, row.depth)*8 + 'px">' + value + '</div>';
                  }
              }},
             {data: 'security_id',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="security_id">Sid</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  // var level = group_columns[row.depth-1];
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      return '<div class="value sid-clickable clickable">' + value + '</div>';
                  }
              }},
             {data: 'issuer',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="issuer">Issuer</div>',
              width: '10%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;

                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      return '<div class="value">' + value + '</div>';
                  }

              }},
             {data: 'coupon',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="coupon">Coupon</div>',
              width: '4%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return '<div class="value">-</div>';

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(".2f")(value) + '%</div>';
                  }
              }},
             {data: 'amt_outstanding',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="amt_outstanding">Outstanding Amt</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      return '<div class="value">' + d3.format(",.0f")(value/1000000) + 'M</div>';
                  }
              }},
             {data: 'maturity',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="maturity">Maturity</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'crr_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="crr_px">Current Px</div>',
              width: '4%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', row['pct_chg_1d']);
              }},
             {data: 'crr_spread',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="crr_spread">Current Spread (bps)</div>',
              width: '5%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
              }},
             {data: 'last_px_update',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="last_px_update">Last Update</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'px_z_score',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="px_z_score">Period Zscore</div>',
              width: '4%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
              }},
             {data: 'diff_chg_1d',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_1d">Chg 1D</div>',
              width: '4%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'diff_chg_5d',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_5d">Chg 5D</div>',
              width: '4%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'diff_chg_1m',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_1m">Chg 1M</div>',
              width: '4%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'diff_chg_1y',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="diff_chg_1y">Chg 1Y</div>',
              width: '4%',
              render: function(value, type, row) {

                  if (value == null) return '<div class="value">-</div>';
                  // var level = group_columns[row.depth-1];
                  return addSignClass('<div class="value">' + d3.format(',.2f')(value) + '</div>', value);
              }},
             {data: 'monitoring',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="monitoring">Is Monitoring</div>',
              width: '4%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value"></div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + value + '</div>';
              }},
             {data: 'hold_position',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="hold_position">HoldPos</div>',
              width: '4%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value left-border"></div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value left-border">' + value + '</div>';
              }},
             {data: 'ls_flag',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="ls_flag">L/S Flag</div>',
              width: '3%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value"></div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value">' + (value == 1 ? 'long' : 'short') + '</div>';
              }},
             {data: 't_date',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="t_date">Entry Eff. Date</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'entry_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="entry_px">Entry Price</div>',
              width: '4%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
                  }
              }},
             {data: 'exit_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="exit_px">Exit Price</div>',
              width: '4%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
                  }
              }},
             {data: 'target_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="target_px">Target Price</div>',
              width: '4%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (!row['hold_position']) {
                      return '<div class="value left-border">-</div>';
                  }
                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value left-border"></div>';
                  } else {
                      if (value == null) return '<div class="value left-border">-</div>';
                      // var level = group_columns[row.depth-1];
                      return '<div class="value left-border">' + d3.format(',.2f')(value) + '</div>';
                  }
              }},
             {data: 'best_scenario_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="best_scenario_px">Best Case Price</div>',
              width: '4%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (!row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
                  }
              }},
             {data: 'worst_scenario_px',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="worst_scenario_px">Worst Case Price</div>',
              width: '4%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (!row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
                  }
              }},
             {data: 'good_til_date',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="good_til_date">Target Date</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (!row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      var t_date = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(value);
                      return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(t_date) + '</div>';
                  }
              }},
             {data: 'target_ret',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="target_ret">Target Return</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (!row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return addSignClass('<div class="value">' + d3.format(',.2f')(value*100) + '%</div>', value);
                  }
              }},
             {data: 'target_ret_ann',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="target_ret_ann">Ann. Target Return</div>',
              width: '5%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  if (!row['hold_position']) {
                      return '<div class="value">-</div>';
                  }

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return addSignClass('<div class="value">' + d3.format(',.2f')(value*100) + '%</div>', value);
                  }
              }},
             {data: 'analyst',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="comments">Analyst</div>',
              width: '6%',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class="value"></div>';
                  } else {
                      if (value == null) return '<div class="value">-</div>';
                      // var level = group_columns[row.depth-1];
                      return '<div class="value">' + value + '</div>';
                  }
              }},
             {data: 'comments',
              sortable: false,
              visible: true,
              title: '<div class="hover" data="comments" style="text-align: center">Comments</div>',
              width: '800px',
              render: function(value, type, row, meta) {
                  if (meta.settings.oInstance.context == null)
                      return "";

                  var options = meta.settings.oInstance.context.options;
                  var rdepth = options.group_columns.length - row.depth;
                  if (rdepth > 0) {
                      return '<div class=""></div>';
                  } else {
                      if (value == null)
                          return '<div class=""><a class="comment"></a></div>';
                      return '<div class=""><a class="comment">'+ value + '</a></div>';
                  }
              }},
         ],
         keyfield: 'security_id',
         postProcess: function(self) {
             d3.select(self).selectAll('div.tooltip')
                 .data([1]).enter()
                 .append('div')
                 .attr('class', 'tooltip').style('display', 'none')
                 .append('table')
             var tooltipTab = d3.select(self).selectAll('div.tooltip table');
             var dursec = self.options.dursec;
             tooltipTab.selectAll('*').remove();

             // add tooltip
             tooltipTab.append('tbody')
                 .attr('class', 'text-area')
                 .append('tr')
                 .html('<td>field_key:</td><td id="field"></td>')

             var tooltip = d3.select(self).selectAll('div.tooltip');
             tooltip.active = false;

             d3.select(self).selectAll('.hover').on("mousemove", null).on("mouseleave", null);

             d3.select(self).selectAll('.hover').on("mousemove", function(d) {
                 tooltip.active = true;
                 // lines tooltip
                 //var v = $(this).attr('data');
                 tooltip.select('#field').text($(this).attr('data'));
                 tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
             }).on("mouseleave", function(d) {
                 tooltip.active = false;
                 tooltip.transition()
                     .attr('duration', dursec)
                     .style("opacity", 0)
                     .style("display", "none");
             });

             // add border
             $('.value.left-border', self).parent().addClass('left-border');
         },
         preProcess: function(data, options) {
             var dataClone = []
             data.forEach(function(p) {
                 p['Total'] = 'Total';
                 dataClone.push(p);
             });

             // dataClone.sort(sort_by(options.sort_by));
             return dataClone;
         },
         aggfun: function(node) {
             average(node, 'crr_spread', 1);
             average(node, 'pct_chg_1d', 1);
             average(node, 'pct_chg_5d', 1);
             average(node, 'pct_chg_1m', 1);
             average(node, 'pct_chg_1y', 1);
             average(node, 'diff_chg_1d', 1);
             average(node, 'diff_chg_5d', 1);
             average(node, 'diff_chg_1m', 1);
             average(node, 'diff_chg_1y', 1);
         },
         options: function(data) {
             var self = this;
             var html = $(' \
                    <table style="width:300px"> \
                      <col width="40%"> \
                      <col width="30%"> \
                      <tbody> \
                        <tr> \
                           <td colspan=1>Group Level 1</td> \
                           <td colspan=1 class="value"> \
                               <select data-bind="value: group_level_1, options: level_1_options"/> \
                           </td> \
                        </tr> \
                        <tr> \
                           <td colspan=1>Group Level 2</td> \
                           <td colspan=1 class="value"> \
                               <select data-bind="value: group_level_2, options: level_2_options"/> \
                           </td> \
                        </tr> \
                        <tr> \
                           <td colspan=1>Initial Expansion Level</td> \
                           <td colspan=1 class="value"> \
                               <input data-bind="value:start_expansion_level"/> \
                           </td> \
                        </tr> \
                        <tr> \
                           <td colspan=1>Total Expansion Level</td> \
                           <td colspan=1 class="value"> \
                               <input data-bind="value:total_expansion_level"/> \
                           </td> \
                        </tr> \
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
    );


    /* ----------------------------------------------------
       Supportive Function
       ---------------------------------------------------- */
    function show_tooltip(tooltip, evt, dursec) {
        // tooltip
        var self = this;
        var w = $(tooltip.node()).width();
        var h = $(tooltip.node()).height();
        var w_total = self.options.width;
        var h_total = $(self).height();
        var x = evt.pageX - $(this).offset().left;
        var y = evt.pageY - $(this).offset().top;
        var right_id = true;
        var down_id = true;

        if ((x + w) > w_total) right_id = false;
        if ((y + h + 20) > h_total) down_id = false;

        tooltip
            .style(
                "left",
                (right_id ? (evt.pageX + 10):
                 (evt.pageX - w - 10)) + "px")
            .style("top", (down_id ? (evt.pageY + 30):
                           (evt.pageY - h - 20)) + "px")
            .style("padding-left", "0px")
            .style("padding-right", "5px")
        tooltip.transition()
            .attr('duration', dursec)
            .style('opacity', 0.99)
            .style('display', 'block');
    }


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

    function average(node, field, depth) {
        if (field in node) {
            return;
        } else {
            if (node.children) {
                node.children.forEach(function(p) {
                    average(p, field, depth);
                });
                var n = node.children.length;
                var val1 = 0;
                node.children.forEach(
                    function(p) {
                        val1 += p[field]});
                node[field] = Math.abs(n) < 0.02 ? 0 : val1 / n;
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
}


function create_rtg_rnk_tbl(query, title, datasource) {
    return $(query).init_wfi_table(
        {datasource: datasource,
         title: ko.observable(title),
         bPaginate: false,
         groupdata: false,
         flatten: true,
         filename: "Rating Ranking",
         sort_by: [],
         total_expansion_level: null,
         processOption: function() {
             var self = this;
             self.title(title);
         },
         process_child_data: function(data, depth) {
             var self = this;
             var n = self.options.sort_by.length;
         },
         columns_setup: [
             {data: 'rtg',
              sortable: false,
              visible: true,
              title: 'Rating',
              width: '50%',
              render: function(value, type, row, meta) {

                  if (value == null) return '<div class="value signal">-</div>';
                  // var level = group_columns[row.depth-1];
                  return '<div class="value-left">' + value + '</div>';
              }},
             {data: 'rnk',
              sortable: false,
              visible: true,
              title: 'Ranking',
              width: '50px',
              render: function(value, type, row, meta) {
                  if (value == null)
                      return '<div class="">-</div>';
                  return '<div class="value">'+ value + '</a></div>';
              }},
         ],
         keyfield: 'rtg',
         preProcess: function(data, options) {
             var dataClone = []
             data.forEach(function(p) {
                 dataClone.push(p);
             });
             return dataClone;
         }
        });
}
