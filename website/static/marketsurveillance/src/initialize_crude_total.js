function plotdata(rowdata) {
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    var overlay = $('<div>');
    var removeDlg = function() {overlay.remove();}
    self.removeDlg = removeDlg;
    overlay.attr('id', 'OVER');
    overlay.html('<div class="wfidatatable child-view" style="width: 900px; height:400px;"></div>');
    var dlg = $('div.child-view', overlay);
    dlg.css("top", $(window).height()/2-210)
        .css('left', $(window).width()/2-315);
    dlg.html(
        '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                 <h1 style="float: left; margin-top: 0px; margin-button: 0px">' + rowdata['key'] + '</h1> \
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
             <table id="content" align="center"> \
                  <tbody> \
                      <tr><td> \
                      <div id="hist-plot" class="widget" \
                       style="width:870px; display:inline-block; height: 330px;"> \
                      </td></tr> \
                  </div> \
             </tbody> \
             </table>');
    dlg.draggable({handle: 'div.dlgTitle'});
    $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
    // $('#content tbody', dlg).append(html);
    overlay.removeDlg = removeDlg;
    // overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
    // overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
    $('body').append(overlay);
    var plot = $('#hist-plot', dlg).init_wfi_plot(
        {lines: {
            data: [
                {field: 'inv', axis: 'yaxis1', legend: 'weekly'},
                {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg'},
                {field: 'rolling_avg_2m', axis: 'yaxis1', legend: '2-month-rolling-avg'},
                {field: 'rolling_avg_1m', axis: 'yaxis1', legend: '1-month-rolling-avg'}],
            color: function(i){
                return colors(i);}},
         xaxis: {field: 'date',
                 fmt: d3.timeFormat('%Y-%m-%d'),
                 tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                 scale: d3.scaleTime()},
         yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                  tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                  scale:d3.scaleLinear()},
         areas: {
             data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
             color: function(i) {
                 return colors(1);}},
         navigator: {
             field: 'date',
             fmt: d3.timeFormat('%b %y'),
             tooltipfmt: d3.timeFormat('%Y-%m-%d'),
             domainfmt: d3.timeFormat('%m/%d/%Y'),
             scale: d3.scaleTime(),
             default: function(navi) {
                 var end = navi[navi.length-1];
                 var start = new Date(end);
                 start.setFullYear(start.getFullYear()-1);
                 start.setMonth(11);
                 start.setDate(31);
                 return [start, end];
             }
         },
         zoombar: true,
         legendbar: true,
         preProcess: function(data) {
             var dataClone = {}
             $.each(data, function(p) {
                 dataClone[p] = data[p].slice();});
             dataClone['date'] = dataClone['date'].map(
                 function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
             return dataClone;
         }});
    startLoading();
    $.ajax({
        url: 'api_get_avg_plot',
        method: "GET",
        dataType: 'json',
        "data": {
            n: parseInt(paramsInput.lookback()),
            t_date: (new Date(paramsInput.t_date())).toLocaleString(),
            component: JSON.stringify(rowdata['component'])},
        "success": function(data) {
            endLoading();
            plot.updateWithData(data);
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.responseText);
        }
    });
}


var initialize_crude_total = function(PARAMS) {
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

    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    // ----------------- begin of Crude Oil + Total Product page ------------------------
    PARAMS['widget']['wow-summary-total'] = addTitle(
        $('div#wow-summary-total').init_wfi_table({
            datasource: 'wow-summary-total',
            title: ko.observable("OIL+PRODUCTS COMPARATIVE INVENTORY"),
            groupdata: false,
            preProcess: function(data, options) {
                var t_date = d3.timeParse("%Y-%m-%dT00:00:00.000Z")(data[0]["last_date"]);
                options.title("OIL+PRODUCTS COMPARATIVE INVENTORY (AS OF " +
                           d3.timeFormat('%Y-%m-%d')(t_date)+ ")");
            },
            columns_setup: [
                {data: "key",
                 sortable: false,
                 title: "EIA Reports",
                 visible: true,
                 width: '20%',
                 render: function(value, type, row) {
                     return '<div class="clickable" style="margin-left:' +
                         (row.depth)*4 + 'px">' + value + '</div>';}},
                {title: " ",
                 sortable: false,
                 visible: true,
                 width: '3%',
                 render: function(value) {
                     return '<div class="clickable-button"> \
                                 <img src="./static/src/images/histchart.png" \
                                 style="left:0px !important; top:0px !important; height:10px;"\
                            </div>';}},
                {data: "crrlvl",
                 title: "Current Level",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},

                {data: "wow_chg",
                 title: "WoW Chg",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
                {data: "ci_wow_chg",
                 title: "CI WoW Chg",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
    			      {data: "nxt_5y_avg_predict",
                 title: "Next Week Chg 5yAvg",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.2f")(value/1000) + '</div>'}},
            ],
            group_columns: ['key'],
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_ny_avg'],
            init_level: 0,
            init_expand: 1,
            update: updateSize,
            process_row: function(row, rowdata) {
                $('.clickable-button', row).click(function() {
                    plotdata(rowdata);
                })}
        }));

    PARAMS['widget']['wow-supply-demand-total'] = addTitle(
        $('div#wow-supply-demand-total').init_wfi_table({
            datasource: 'wow-supply-demand-total',
            title: "OIL SUPPLY DEMAND BALANCE",
            columns_setup: [
                {data: "key",
                 title: 'Supply Demand (kb/d)',
                 sortable: false,
                 visible: true,
                 width: '28%',
                 render: function(value, type, row) {
                     return '<div class="clickable" style="margin-left:' +
                         (row.depth)*4 + 'px">' + value + '</div>';}},
                {title: " ",
                 sortable: false,
                 visible: true,
                 width: '3%',
                 render: function(value) {
                     return '<div class="clickable-button"> \
                                 <img src="./static/src/images/histchart.png" \
                                 style="left:0px !important; top:0px !important; height:10px;"\
                            </div>';}},

                {data: "crrlvl",
                 title: "Current",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},

                {data: "wow_chg",
                 sortable: false,
                 title: "WoW Chg",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
                {data: "ci_wow",
                 sortable: false,
                 title: "Comparative Level",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
    			      {data: "nxt_chg_5y_avg",
                 sortable: false,
                 title: "Next Week 5yAvg",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
            ],
            aggfun: function(node) {
                // sum(node, 'crrlvl', 1);
                // sum(node, 'wow_chg', 1);
                // sum(node, 'ci_wow', 1);
                // sum(node, 'nxt_chg_5y_avg', 1);
            },
            process_row: function(row, rowdata) {
                $('.clickable-button', row).click(function() {

                    var overlay = $('<div>');
                    var removeDlg = function() {overlay.remove();}
                    self.removeDlg = removeDlg;
                    overlay.attr('id', 'OVER');
                    overlay.html('<div class="wfidatatable child-view" style="width: 900px; height:400px;"></div>');
                    var dlg = $('div.child-view', overlay);
                    dlg.css("top", $(window).height()/2-210)
                        .css('left', $(window).width()/2-315);
                    dlg.html(
                    '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                         <h1 style="float: left; margin-top: 0px; margin-button: 0px">' + rowdata['key'] + '</h1> \
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
                     <table id="content" align="center"> \
                          <tbody> \
                              <tr><td> \
                              <div id="hist-plot" class="widget" \
                               style="width:870px; display:inline-block; height: 330px;"> \
                              </td></tr> \
                          </div> \
                     </tbody> \
                     </table>');
                    dlg.draggable({handle: 'div.dlgTitle'});
                    $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
                    // $('#content tbody', dlg).append(html);
                    overlay.removeDlg = removeDlg;
                    // overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
                    // overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
                    $('body').append(overlay);
                    var plot = $('#hist-plot', dlg).init_wfi_plot(
                        {lines: {
                            data: [
                                {field: 'inv', axis: 'yaxis1', legend: 'weekly'},
                                {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg'},
                                {field: 'rolling_avg_2m', axis: 'yaxis1', legend: '2-month-rolling-avg'},
                                {field: 'rolling_avg_1m', axis: 'yaxis1', legend: '1-month-rolling-avg'}],
                            color: function(i){
                                return colors(i);}},
                         xaxis: {field: 'date',
                                 fmt: d3.timeFormat('%Y-%m-%d'),
                                 tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                                 scale: d3.scaleTime()},
                         yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                                  tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                                  scale:d3.scaleLinear()},
                         areas: {
                             data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
                             color: function(i) {
                                 return colors(1);}},
                         navigator: {
                             field: 'date',
                             fmt: d3.timeFormat('%b %y'),
                             tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                             domainfmt: d3.timeFormat('%m/%d/%Y'),
                             scale: d3.scaleTime(),
                             default: function(navi) {
                                 var end = navi[navi.length-1];
                                 var start = new Date(end);
                                 start.setFullYear(start.getFullYear()-1);
                                 start.setMonth(11);
                                 start.setDate(31);
                                 return [start, end];
                             }
                         },
                         zoombar: true,
                         legendbar: true,
                         preProcess: function(data) {
                             var dataClone = {}
                             $.each(data, function(p) {
                                 dataClone[p] = data[p].slice();});
                             dataClone['date'] = dataClone['date'].map(
                                 function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                             return dataClone;
                         }});
                    startLoading();
                    $.ajax({
                        url: 'api_get_avg_plot',
                        method: "GET",
                        dataType: 'json',
                        "data": {
                            n: parseInt(paramsInput.lookback()),
                            t_date: (new Date(paramsInput.t_date())).toLocaleString(),
                            component: JSON.stringify(rowdata['component'])},
                        "success": function(data) {
                            endLoading();
                            plot.updateWithData(data);
                        },
                        error: function (error) {
                            endLoading();
                            alert("script:updateContent:"+error.responseText);
                        }
                    });
                });
             },
            group_columns: [1, 2, 3, 4, 5, 6],
            groupdata: false,
            init_level: 0,
            init_expand: 0,
            update: updateSize
        }));

    PARAMS['widget']['wow-supply-demand-total-ver2'] = addTitle(
        $('div#wow-supply-demand-total-ver2').init_wfi_table({
            datasource: 'wow-supply-demand-total-ver2',
            title: "OIL SUPPLY DEMAND BALANCE (VER 2)",
            columns_setup: [
                {data: "key",
                 title: 'Supply Demand (kb/d)',
                 sortable: false,
                 visible: true,
                 width: '28%',
                 render: function(value, type, row) {
                     return '<div class="clickable" style="margin-left:' +
                         (row.depth)*4 + 'px">' + value + '</div>';}},
                {title: " ",
                 sortable: false,
                 visible: true,
                 width: '3%',
                 render: function(value) {
                     return '<div class="clickable-button"> \
                                 <img src="./static/src/images/histchart.png" \
                                 style="left:0px !important; top:0px !important; height:10px;"\
                            </div>';}},

                {data: "crrlvl",
                 title: "Current",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},

                {data: "wow_chg",
                 sortable: false,
                 title: "WoW Chg",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
                {data: "ci_wow",
                 sortable: false,
                 title: "Comparative Level",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
    			      {data: "nxt_chg_5y_avg",
                 sortable: false,
                 title: "Next Week 5yAvg",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
            ],
            aggfun: function(node) {
                // sum(node, 'crrlvl', 1);
                // sum(node, 'wow_chg', 1);
                // sum(node, 'ci_wow', 1);
                // sum(node, 'nxt_chg_5y_avg', 1);
            },
            process_row: function(row, rowdata) {
                $('.clickable-button', row).click(function() {

                    var overlay = $('<div>');
                    var removeDlg = function() {overlay.remove();}
                    self.removeDlg = removeDlg;
                    overlay.attr('id', 'OVER');
                    overlay.html('<div class="wfidatatable child-view" style="width: 900px; height:400px;"></div>');
                    var dlg = $('div.child-view', overlay);
                    dlg.css("top", $(window).height()/2-210)
                        .css('left', $(window).width()/2-315);
                    dlg.html(
                    '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                         <h1 style="float: left; margin-top: 0px; margin-button: 0px">' + rowdata['key'] + '</h1> \
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
                     <table id="content" align="center"> \
                          <tbody> \
                              <tr><td> \
                              <div id="hist-plot" class="widget" \
                               style="width:870px; display:inline-block; height: 330px;"> \
                              </td></tr> \
                          </div> \
                     </tbody> \
                     </table>');
                    dlg.draggable({handle: 'div.dlgTitle'});
                    $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
                    // $('#content tbody', dlg).append(html);
                    overlay.removeDlg = removeDlg;
                    // overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
                    // overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
                    $('body').append(overlay);
                    var plot = $('#hist-plot', dlg).init_wfi_plot(
                        {lines: {
                            data: [
                                {field: 'inv', axis: 'yaxis1', legend: 'weekly'},
                                {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg'},
                                {field: 'rolling_avg_2m', axis: 'yaxis1', legend: '2-month-rolling-avg'},
                                {field: 'rolling_avg_1m', axis: 'yaxis1', legend: '1-month-rolling-avg'}],
                            color: function(i){
                                return colors(i);}},
                         xaxis: {field: 'date',
                                 fmt: d3.timeFormat('%Y-%m-%d'),
                                 tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                                 scale: d3.scaleTime()},
                         yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                                  tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                                  scale:d3.scaleLinear()},
                         areas: {
                             data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
                             color: function(i) {
                                 return colors(1);}},
                         navigator: {
                             field: 'date',
                             fmt: d3.timeFormat('%b %y'),
                             tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                             domainfmt: d3.timeFormat('%m/%d/%Y'),
                             scale: d3.scaleTime(),
                             default: function(navi) {
                                 var end = navi[navi.length-1];
                                 var start = new Date(end);
                                 start.setFullYear(start.getFullYear()-1);
                                 start.setMonth(11);
                                 start.setDate(31);
                                 return [start, end];
                             }
                         },
                         zoombar: true,
                         legendbar: true,
                         preProcess: function(data) {
                             var dataClone = {}
                             $.each(data, function(p) {
                                 dataClone[p] = data[p].slice();});
                             dataClone['date'] = dataClone['date'].map(
                                 function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                             return dataClone;
                         }});
                    startLoading();
                    $.ajax({
                        url: 'api_get_avg_plot',
                        method: "GET",
                        dataType: 'json',
                        "data": {
                            n: parseInt(paramsInput.lookback()),
                            t_date: (new Date(paramsInput.t_date())).toLocaleString(),
                            component: JSON.stringify(rowdata['component'])},
                        "success": function(data) {
                            endLoading();
                            plot.updateWithData(data);
                        },
                        error: function (error) {
                            endLoading();
                            alert("script:updateContent:"+error.responseText);
                        }
                    });
                });
             },
            group_columns: [1, 2, 3, 4, 5, 6],
            groupdata: false,
            init_level: 0,
            init_expand: 0,
            update: updateSize
        }));

    PARAMS['widget']['oil-wow-details-total'] = addTitle(
        $('div#oil-wow-details-total').init_wfi_table({
            datasource: 'oil-wow-detail-total',
            title: ko.observable("Past 5 Years WoW Details"),
            preProcess: function(data, options) {
                var t_date = d3.timeParse("%Y-%m-%dT00:00:00.000Z")(data[0]["nxt_week_date"]);
                options.title("Past 5 Years WoW Details (AS OF " +
                           d3.timeFormat('%Y-%m-%d')(t_date)+ ")");
            },
            columns_setup: [
                {data: "key",
                 title: "Date",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div>' + value + '</div>';
                 }},
                {data: "oil_spr",
                 title: "Crude",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "cushing",
                 sortable: false,
                 title: "(Cushing)",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "gas",
                 title: "Gas",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "distil",
                 title: "Distill",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "resfueloil",
                 sortable: false,
                 title: "ResiFuel",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "propane",
                 title: "Propane",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "jetfuel",
                 title: "JetFuel",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "ethanol",
                 title: "Ethanol",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
                {data: "otheroil",
                 title: "Other",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + '</div>'}},
    			      {data: "total_crude_spr_product_other",
                 sortable: false,
                 title: "Total",
                 visible: true,
                 width: '20%',
                 render: function(value) {
                     return '<div class="value bold">' + d3.format(",.2f")(value/1000) + '</div>'}}
            ],
            sort: function(data) {
                return data.sort(function(a, b) {return a['key'] > b['key']});
            },
            group_columns: ['key'],
            group_row: false,
            sum_columns: ['crrlvl', 'wow_chg', 'nxt_chg_5y_avg', 'nxt_chg_10y_avg'],
            init_level: 0,
            preProcess: function(data) {
                return data;
            },
            update: updateSize
        }));


	  PARAMS['widget']['ci-avg-total'] = addTitle(
        $('div#ci-avg-total').init_wfi_plot({
            datasource: 'oil-ci-prod-avg-total',
            title: "COMPARATIVE INVENTORY VS 5 YEAR AVG. ( in MM )",
            lines: {
                data: [{field: 'ci', axis: 'yaxis2', legend: 'c.i. (lhs)'},
                       {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg (rhs)'},
                       {field: 'inv', axis: 'yaxis1', legend: 'inventory (rhs)'}],
                color: function(i) {return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x/1000)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            yaxis2: {fmt: function(x) {return d3.format(',.0f')(x/1000)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}));


    PARAMS['widget']['consumption-avg-band-total'] = addTitle(
        $('div#consumption-avg-band-total').init_wfi_plot({
            datasource: 'consumption-avg-band-total',
            title: ko.observable("CONSUMPTION VS 5 YEAR AVG. (THOUSAND BPD)"),
            lines: {
                data: [
                    {field: 'inv', axis: 'yaxis1', legend: 'inventory'},
                    {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg'},
                    {field: 'rolling_avg_2m', axis: 'yaxis1', legend: '2m-rolling-avg'},
                    {field: 'rolling_avg_1m', axis: 'yaxis1', legend: '1m-rolling-avg'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            areas: {
                data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
                color: function(i) {
                    return colors(1);}},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    start.setMonth(11);
                    start.setDate(31);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}));


    PARAMS['widget']['supply-adj-avg-band-total'] = addTitle(
        $('div#supply-adj-avg-band-total').init_wfi_plot({
            datasource: 'supply-adj-avg-band-total',
            title: ko.observable("SUPPLY+ADJ VS 5 YEAR AVG. (THOUSAND BPD)"),
            lines: {
                data: [
                    {field: 'inv', axis: 'yaxis1', legend: 'inventory'},
                    {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg'},
                    {field: 'rolling_avg_2m', axis: 'yaxis1', legend: '2m-rolling-avg'},
                    {field: 'rolling_avg_1m', axis: 'yaxis1', legend: '1m-rolling-avg'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            areas: {
                data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
                color: function(i) {
                    return colors(1);}},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    start.setMonth(11);
                    start.setDate(31);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}));


    PARAMS['widget']['cushing-avg-band-total'] = addTitle(
        $('div#cushing-avg-band-total').init_wfi_plot({
            datasource: 'cushing-avg-band-total',
            lines: {
                data: [{field: 'inv', axis: 'yaxis1', legend: "inventory"},
                       {field: 'avg', axis: 'yaxis1', legend: "5-yr-avg"} ],
                color: function(i){
                    return colors(i);}},
            input_args: {
                'rolling_years': ko.observable(5)
            },
            title: ko.observable("CUSHING INVENTORY VS 5 YEAR AVG."),
            update: function(f) {
                var self = this;
                var n = parseInt(self.options['input_args'].rolling_years());
                $.ajax({
                    "url": '/api_cushing_avg_band',
                    "method": "GET",
                    dataType: 'json',
                    "data": {
                        n: n,
                        t_date: PARAMS['t_date'].toISOString()},
                    "success": function(data) {
                        f(data);
                    },
                    error: function (error) {
                        f();
                        alert("script:updateContent:"+error.responseText);
                    }
                });
            },
            options: function(data) {
                var self = this;
                var html = $(' \
                     <table style="width:300px"> \
                       <col width="40%"> \
                       <col width="40%"> \
                       <tbody> \
                         <tr> \
                            <td colspan=1>Roling Period</td> \
                            <td colspan=1 class="value"> \
                                <input data-bind="value: rolling_years"/> \
                            </td> \
                         </tr> \
                       </tbody> \
                     </table>');
                return html
            },
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            areas: {
                data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
                color: function(i) {
                    return colors(1);}},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    start.setMonth(11);
                    start.setDate(31);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}));


    PARAMS['widget']['supply-avg-band-total'] = addTitle(
        $('div#supply-avg-band-total').init_wfi_plot({
            datasource: 'supply-avg-band-total',
            title: ko.observable("SUPPLY VS 5 YEAR AVG. (THOUSAND BPD)"),
            lines: {
                data: [{field: 'inv', axis: 'yaxis1', legend: 'supply'},
                       {field: 'avg', axis: 'yaxis1', legend: '5-yr-avg'},
                       {field: 'rolling_avg_2m', axis: 'yaxis1', legend: '2m-rolling-avg'},
                       {field: 'rolling_avg_1m', axis: 'yaxis1', legend: '1m-rolling-avg'}],
                color: function(i){
                    return colors(i);}},
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%Y-%m-%d'),
                    tooltipfmt: function(x) {return d3.timeFormat('%Y-%m-%d')(x)},
                    scale: d3.scaleTime()},
            yaxis1: {fmt: function(x) {return d3.format(',.0f')(x)},
                     tooltipfmt: function(x) {return d3.format(',.0f')(x)},
                     scale:d3.scaleLinear()},
            areas: {
                data: [{upper: 'past_max', lower: 'past_min', axis: 'yaxis1', name: 'past-band'}],
                color: function(i) {
                    return colors(1);}},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-1);
                    start.setMonth(11);
                    start.setDate(31);
                    return [start, end];
                }

            },
            zoombar: true,
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}));


    PARAMS['widget']['oil-ci-total'] = addTitle(
        $('div#oil-ci-total').init_wfi_plot({
            datasource: 'oil-ci-total',
            title: "OIL COMPARATIVE INVENTORY - Regression",
            scatters: {
                data: {field: 'price', axis: 'yaxis1', radius: 4, hightlightlast: true},
                color: function(j, d){
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d.j/d.n);}},
            fitcurve: {data: [{field: 'fit2', axis: 'yaxis1', sort: true}],
                       color: colors},
            xaxis: {field: 'ci',
                    legend: 'c.i. (lhs)',
                    fmt: function(x) {return d3.format(',.0f')(x/1000)+'M'},
                    tooltipfmt: function(x) {return d3.format(',.0f')(x/1000)+'M'},
                    scale:d3.scaleLinear()},
            yaxis1: {fmt: function(x) {return d3.format('.2f')(x)},
                     tooltipfmt: function(x) {return d3.format('.2f')(x)},
                     scale:d3.scaleLinear()},
            navigator: {
                field: 'date',
                fmt: d3.timeFormat('%b %y'),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%m/%d/%Y'),
                scale: d3.scaleTime(),
                gradient: {color: function(d) {
                    var color =d3.scaleLinear().domain([0, 1])
                            .interpolate(d3.interpolateHcl)
                            .range([d3.rgb("yellow"), d3.rgb('red')]);
                    return color(d);
                }},
                default: function(navi) {
                    var end = navi[navi.length-1];
                    var start = new Date(end);
                    start.setFullYear(start.getFullYear()-4);
                    return [start, end];
                }
            },
            zoombar: true,
            legendbar: false,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            }}));
    // ----------------- end of Crude Oil Total page ------------------------
}
