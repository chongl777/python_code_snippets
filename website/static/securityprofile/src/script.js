function main(company_info) {
    var PARAMS = {};
    var CURR_POS = null
    var url = new URL(window.location.href);

    company_info = JSON.parse(
        company_info.replace(/&#34;/g,"\"").replace(/&#39;/g, "'"));
    var sp_url = "https://westfieldinvestmentllc.sharepoint.com/sites/Investment";
    var widget = {};
    var rLib = "ResearchDocuments";
    var cid = url.searchParams.get("pid");;
    var startLoading, endLoading;

    function func_filter( array, term ) {
		    var matcher = new RegExp( $.ui.autocomplete.escapeRegex( term ), "i" );
		    return $.grep( array, function( value ) {
			      return matcher.test( value.keywords );
		    });
    }

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    function createFolder(dname) {
        // var name = "linn";
        var folder = rLib;

        var subfolder = prompt("Please enter company name", dname);
        if (subfolder == null) {
            return;
        }
        createFolderName(cid, subfolder);
    }

    function openFolder(title, name) {
        window.open(sp_url + "/" + title + "/" + name,
                    cid);
    }


    function createFolderName(pid, subfolder, callback) {
        var [startLoading, endLoading] = loadingIcon();
        startLoading();
        $.ajax({
            type: "POST",
            url: "update_folder_name",
            dataType: 'json',
            data: {
                "pid": pid,
                "pfolder": rLib,
                "subfolder": subfolder},
            success: function(data) {
                endLoading();
                location.reload();
            },
            error: function(msg) {
                endLoading();
                window.alert(msg);
            }
        });
    };


    function updateContent(sids, timeline=false) {
        CURR_POS = null;
        widget['plot'].update(sids);

        widget['sec_info'].each(function(i, p) {
            p.update(sids[0], PARAMS);
        });

        // widget['finra-trace'].each(function(i, p) {
        //     p.update(sids[0]);
        // });

        widget['cash-flow'].each(function(i, p) {
            p.update(sids[0]);
        });

        widget['analyst-rating'].each(function(i, p) {
            p.update(sids[0]);
        });

        widget['sec_analytic'].init_calc(sids[0], new Date());

        if (timeline) {
            widget['sec_time_line'].each(function(i, p) {
                p.update(
                    cid, PARAMS);
            });
        };
    }

    function securitySelect(selected_sids) {
        var sids = [];
        if ([1, 16].indexOf(selected_sids[0].product_code) != -1) {
            $('[aria-controls="tabs-2"]').css('display', 'list-item')
        } else {
            $('[aria-controls="tabs-2"]').css('display', 'none')
        }

        $('div#company-cast g#nodes-group g.node').removeClass('current-company');
        selected_sids.forEach(function(p, i) {
            sids.push(p.security_id);
            $('div#company-cast g#nodes-group g.company-'+p.company_id).addClass('current-company');
        });
        updateContent(sids, false);
    }

    function update_finra_id(cid, sid) {
        var [startLoading, endLoading] = loadingIcon();
        startLoading();
        $.ajax({
            type: "POST",
            url: "update_finra_id",
            dataType: 'json',
            data: {
                sid: sid,
                cid: cid
            },
            success: function(data) {
                endLoading();
                var msg = '<table id="finra-confirm-diag"><thead><th>SecurityId</th><th>FinraID</th></thead>\
                  <tbody>';
                $.each(data, function(sid){
                    msg += '<tr><td>' +sid + "</td><td>" + data[sid] + '</td></tr>';
                })
                msg += '</tbody></table>';
                $.confirm({
                    title: 'Finra ID Updated',
                    content: msg,
                    buttons: {
                        confirm: {
                            text: 'Reload Window',
                            action:function () {
                                window.location.reload();
                            }
                        }}
                });
            },
            error: function(msg) {
                endLoading();
                window.alert(msg.responseText);
            }
        });
    }

    function update_corp_structure_bbg(cid, sid) {
        var [startLoading, endLoading] = loadingIcon();
        startLoading();
        $.ajax({
            type: "POST",
            url: "update_corp_structure_bbg",
            dataType: 'text',
            data: {
                sid: sid,
                cid: cid
            },
            success: function(data) {
                endLoading();
                $.confirm({
                    title: 'Data Updated',
                    buttons: {
                        confirm: {
                            text: 'Reload Window',
                            action:function () {
                                window.location.reload();
                            }
                        }}
                });
            },
            error: function(msg) {
                endLoading();
                window.alert(msg.responseText);
            }
        });
    }

    function update_cached_value() {
        var [startLoading, endLoading] = loadingIcon();
        startLoading();
        $.ajax({
            type: "POST",
            url: "update_cached_value",
            dataType: 'text',
            success: function(data) {
                endLoading();
                $.confirm({
                    title: 'Data Updated',
                    buttons: {
                        confirm: {
                            text: 'Reload Window',
                            action:function () {
                                window.location.reload();
                            }
                        }}
                });
            },
            error: function(msg) {
                endLoading();
                window.alert(msg.responseText);
            }
        });
    }

    function update_sec_price_bbg(cid, sid) {
        var [startLoading, endLoading] = loadingIcon();
        startLoading();
        $.ajax({
            type: "POST",
            url: "update_sec_price_bbg",
            dataType: 'text',
            data: {
                sid: sid,
                cid: cid
            },
            success: function(data) {
                endLoading();
                $.confirm({
                    title: 'Price Updated',
                    buttons: {
                        confirm: {
                            text: 'Reload Window',
                            action:function () {
                                window.location.reload();
                            }
                        }}
                });
            },
            error: function(msg) {
                endLoading();
                window.alert(msg.responseText);
            }
        });
    }

    function update_sec_price_finra(cid, sid) {
        $.confirm({
            title: 'Finra Pirce is updating and might take long time to finish.',
            buttons: {
                confirm: {
                    text: 'Confirm',
                    action:function () {
                    }
                }}
        });
        $.ajax({
            type: "POST",
            url: "update_sec_price_finra",
            dataType: 'text',
            timeout: 1000 * 60 * 20,
            data: {
                sid: sid,
                cid: cid
            },
            success: function(data) {
                $.confirm({
                    title: 'Price Updated',
                    buttons: {
                        confirm: {
                            text: 'Confirm',
                            action:function () {
                            }
                        }}
                });
            },
            error: function(msg) {
                window.alert(msg.responseText);
            }
        });
    }

    function init_data_update(div, cid, sid) {
        div.html('\
          <button id="finra-update" class="data-update-button">Update Finra ID</button>\
          <button id="corp-structure-update" class="data-update-button">Update Corporate Structure (BBG)</button>\
          <button id="price-update-bbg" class="data-update-button">Update History Price <br/> (BBG)</button>\
          <button id="price-update-finra" class="data-update-button">Update History Price <br/> (FINRA)</button>\
          <button id="cached-value-update" class="data-update-button">Update Cached Value</button>');

        $('#finra-update', div).click(function() {
            update_finra_id(cid, sid);
        });

        $('#corp-structure-update', div).click(function() {
            update_corp_structure_bbg(cid, sid);
        });

        $('#price-update-bbg', div).click(function() {
            update_sec_price_bbg(cid, sid);
        });

        $('#price-update-finra', div).click(function() {
            update_sec_price_finra(cid, sid);
        });

        $('#cached-value-update', div).click(function() {
            update_cached_value();
        });
    }

    function update_sec_analytic(sid, trade_dt, startloading, endloading) {
        startloading();
        var self = this;
        $.ajax({
            url: "calc_sec_analytic",
            method: "GET",
            dataType: 'text',
            data: {
                sid: sid,
                trade_dt: d3.timeFormat('%Y-%m-%d')(trade_dt)},
            success: function(data) {
                endloading();
                data = JSON.parse(data.replace(/Infinity/g, "null"));
                self.update(data, true);
            },
            error: function (error) {
                endloading('error!', true);
            }
        });
    }

    function recalculate_analytics(sid, price, trade_dt, startloading, endloading) {
        startloading();
        var self = this;
        $('td.calc-field', self).removeClass('val-changed');
        $('td.calc-field', self).addClass('val-prechange');
        $.ajax({
            url: "recalc_sec_analytic",
            type: "POST",
            dataType: 'text',
            data: {
                sid: sid,
                price: price,
                trade_dt: trade_dt,
                data: JSON.stringify(self.data)},
            success: function(data) {
                endloading();
                data = JSON.parse(data.replace(/Infinity/g, "null"));
                self.update(data);
                $('td.calc-field', self).addClass('val-changed');
                $('td.calc-field', self).removeClass('val-prechange');

            },
            error: function (e) {
                endloading('error!', true);
            }
        });
    }

    function update_sec_price(sid, trade_dt, startloading, endloading) {
        startloading('updating price ...');
        var self = this;
        $.ajax({
            url: "update_price",
            method: "GET",
            dataType: 'json',
            data: {
                sid: sid,
                trade_dt: trade_dt},
            success: function(data) {
                endloading('ready');
                self.update(data);
            },
            error: function () {
                endloading('error!', true);
            }
        });
    }

    function line_configuration(data) {
        var sec_types = data['sec_types'];
        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        var config = data["sids"].map(function(x, i) {
            var ret = {
                field: x,
                color: () => (colors()),
                axis: (sec_types[x] == 3) & (data['sids'].length > 1) ? 'yaxis2': 'yaxis1',
                legend: x};

            if (i == 0 && PARAMS['trading_records']) {
                ret['tag'] = {
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
                             <thead><tr><th>fund</th><th>date</th><th>quantity</th>\
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
            }
            return ret
        })

        var hld_periods = data['holding_periods'].map((x)=>{
            return {
                show_legend: false,
                show_tooltip: false,
                field: x['name'],
                color: () => (x['dir'] == 'long' ? 'green' : 'red'),
                axis: config[0]['axis']}
        });

        return hld_periods.concat(config);
        // return config.concat(hld_periods);
    }

    function initialize(cid, sid) {
        widget['sec_list'] = $('div#security-select').init_sec_list(
            {clickfn: securitySelect
            });

        widget['plot'] = $('div#plot.price-plot').init_interactive_plot({
            lines: {
                data: []
            },
            xaxis: {field: 'date',
                    fmt: d3.timeFormat('%m/%Y'),
                    tooltipfmt: function(x) {return d3.timeFormat('%m/%d/%Y')(x)},
                    scale: d3.scaleTime()},
            yaxis: {
                yaxis1: {
                    fmt: function(x) {return d3.format(',.2f')(x)},
                    domain_margin: 0.2,
                    anchor: 'right',
                    pos: function() {return this.options.width},
                    tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                    scale:d3.scaleLinear()},
                yaxis2: {
                    fmt: function(x) {return d3.format(',.2f')(x)},
                    anchor: 'left',
                    pos: function() {return 0},
                    domain_margin: 0.2,
                    tooltipfmt: function(x) {return d3.format(',.2f')(x)},
                    scale:d3.scaleLinear()}},
            navigator: {
                plotarea: 'plot_area',
                field: 'date',
                fmt: d3.timeFormat("%b '%y"),
                tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                domainfmt: d3.timeFormat('%Y-%m-%d'),
                scale: d3.scaleTime()
            },
            zoombar: true,
            naviH: "40",
            legendbar: true,
            preProcess: function(data) {
                var dataClone = {}
                $.each(data, function(p) {
                    dataClone[p] = data[p].slice();});
                dataClone['date'] = dataClone['date'].map(
                    function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                return dataClone;
            },
            update: function(sids) {
                if ((sids == null) || !(sids.length)) {
                    return;
                }
                var self = this;
                startLoading();
                $.ajax({
                    url: "security_returns_and_trading_records",
                    method: "GET",
                    dataType: 'text',
                    data: {
                        sids: JSON.stringify(sids),
                        trading_records: PARAMS['trading_records'],
                        fund_ids: PARAMS['fund_id'] || null,
                        paper_trade: PARAMS['paper_trade']
                    },
                    success: function(ts) {
                        endLoading();
                        ts = JSON.parse(ts.replace(/NaN/g, 'null'));

                        self.update_options_lines(
                            line_configuration(ts));

                        // update current allocation
                        if (ts['px_trd_hist']['position'] != null) {
                            CURR_POS = ts['px_trd_hist']['position'][ts['px_trd_hist']['position'].length-1];
                            $('#sec-info-current-allocation').html(d3.format(',.0f')(CURR_POS));
                        }

                        // format each data point
                        self.updateWithData(ts['px_trd_hist']);
                    },
                    error: function (error) {
                        endLoading();
                        window.alert(JSON.parse(error.responseText)["message"]);
                    }
                });
            }
        });

        widget['sec_info'] = $('div#sec-info').init_sec_info(
            {
                update: function(sid, params) {
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
                            data.general_info.strategy_page = '?sid='+sid;
                            widget.updateWithData(data);
                            $('#sec-info-current-allocation', widget).html(d3.format(',.0f')(CURR_POS));
                        },
                        error: function (msg) {
                            endLoading();
                            window.alert("secinfo.js:"+msg.responseText);
                        }
                    })
                }
            });

        widget['sec_analytic'] = $('div#sec-analytic').init_sec_analytic(
            {recalculate: recalculate_analytics,
             init_calc: update_sec_analytic,
             update_price: update_sec_price});
        // widget['sec_analytic'].init_calc(sid[0], new Date());

        // widget['finra-trace'] = $('div#finra-trace').init_finra_trace(
        //     startLoading, endLoading);

        widget['cash-flow'] = $('div#cash-flow').init_sec_info_cashflow(
            startLoading, endLoading);

        widget['analyst-rating'] = $('div#analyst-rating').init_analyst_px_target(
            startLoading, endLoading);

        init_data_update($('div#data-update'), cid, sid[0]);

        widget['company-cast'] = $('div#company-cast').init_tree_chart({
            margins: {left: 50, right: 50, top: 25, bottom: 25},
            node_width: 90,
            node_height: 50,
            click_nodes: function(svg, d) {
                var self = this;
                d3.select(svg).selectAll('g.node').classed('selected', false);
                d3.select(this).classed('selected', true);
                // $('div#security-select tr.security-row:not(.'+d.data.id+')').css('display', 'none');
                d3.selectAll('div#security-select tr.security-row.company-'+d.data.id)
                    .classed('show-row', true)
                    .classed('hide-row', false);

                d3.selectAll('div#security-select tr.security-row:not(.company-'+d.data.id+')')
                    .classed('hide-row', true)
                    .classed('show-row', false);
            },
            tooltip_display: function(d) {
                return "<tr><td>CompanyID:</td><td>"+d.data.id+"</td></tr>\
                   <tr><td>CompanyName:</td><td>"+d.data.name+"</td></tr>";
            },
            html: '\
              <defs> \
                <pattern id="current_company_pattern" width="8" height="8" patternUnits="userSpaceOnUse" \
                  patternTransform="rotate(45)"> \
                  <rect width="4" height="8" transform="translate(0,0)" fill="orange"></rect> \
                </pattern> \
                <pattern id="current_select_company_pattern" width="8" height="8" patternUnits="userSpaceOnUse" \
                  patternTransform="rotate(45)" style="background-color: steelblue"> \
                  <rect width="4" height="8" transform="translate(0,0)" fill="orange"></rect> \
                  <rect width="8" height="8" transform="translate(4,0)rotate(0)" fill="steelblue"></rect> \
                </pattern> \
              </defs>'
        })

        var [s, e] = loadingIcon("div#sec-time-line");
        widget['sec_time_line'] = $('div#sec-time-line').init_time_line(
            2, s, e);

        (function() {
            function update_folder(data) {
                $('#folder-name').text(data['folder_name']);
                $('div.research_link').css('display', 'inline-block');
                $('div.research_link a')
                    .attr(
                        'href', sp_url + "/" + rLib + "/" + company_info['folder_name'])
                    .attr('target', '_blank');
                $('div.research_create').css('display', 'none');
            }

            if (isEmpty(company_info)) {
                $('#folder-panel').css('display', 'none');
            } else if (!company_info['need_update']) {
                update_folder(company_info)
            } else {
                $('div.research_create')
                    .css('display', 'inline-block')
                    .click(
                        function() {
                            createFolder(company_info['folder_name'] || company_info['parent_name'], update_folder)});
            }
        })();

        if (cid != null) {
            startLoading();
            $.ajax({
                url: "get_all_securities_in_parent",
                method: "GET",
                dataType: 'json',
                data: {
                    pid: cid},
                success: function(data) {
                    try {
                        widget['company-cast'].updateWithData(data['company-cast']);
                        widget['sec_list'].updateWithData(data['sec-list']);
                    } catch(err) {
                    } finally {
                        endLoading();
                    }
                    $('div#company-cast .company-'+cid).addClass('selected');
                    if (sid != null) {
                        widget['sec_list'].select_sid(parseInt(sid));
                        //$('#security-select tr.security-row.sid-'+sid[0]).addClass('selected');
                        //securitySelect([{security_id: parseInt(sid), company_id: parseInt(cid)}]);
                    }
                },
                error: function (error) {
                    endLoading();
                    alert(JSON.parse(error.responseText)['message']);
                }
            });


        } else {
            return null;
        }

        if (sid != null) {
            widget['sec_time_line'].each(function(i, p) {
                p.update(
                    cid, PARAMS);
            });
        }
    }

    function initializing(search_list, sid) {
        [startLoading, endLoading] = loadingIcon("#sec-panel");

        $('div#search').wfi_autocomplete({
            show_config: true,
            search_options: ['Companies/Securities', 'Companies', 'Securities'],
            onsearch: function(selected_item) {
                var params = [];
                $.each(PARAMS, (x, y) => {
                    params.push(x + "=" +y)});
                var data = selected_item['data']
                if (data.type == 'Company')
                    window.location.href = "./security_profile?pid=" + data['value']+'&'+params.join('&');
                else
                    window.location.href = "./security_profile?sid=" + data['value']+'&'+params.join('&');
            },
            groupby: 'type',
            selection_structure: function(item) {
                return '<td><div style="width: 70px">'+item['id']+"</div></td>" +
                    '<td><div style="width: 150px">'+item['value']+"</div></td>" +
                    '<td><div style="width: 130px">'+item['ticker']+"</div></td>";
            },
            search_list: search_list,
            update_fn: function(val, update_selectoptions) {
                var self = this;
                var items = func_filter(
                    self.options.search_list, val) ;
                var coms = $.grep(items, function( value ) {return value.type == 'Company'}).slice(0, 10);
                var secs = $.grep(items, function( value ) {return value.type == 'Security'}).sort(
                    function(p, q) {return -((p.id == val) - (q.id == val))}).slice(0, 10);
                update_selectoptions(coms.concat(secs));
            },
            selected: function(p, item) {
                item = item['data'];
                var id = item['id'];
                item['id'] = item['value'];
                item['value'] = id;
                //$(this).attr('pid', item['id']);
            }
        });
        initialize(cid, [sid])
    }

    (function() {
        var sid = url.searchParams.get("sid") || null;
        PARAMS['trading_records'] = parseInt(url.searchParams.get("trading_records")) || 0;
        if (PARAMS['trading_records']) {
            PARAMS['fund_id'] = parseFloat(url.searchParams.get("fund_id")).toFixed(3);
            PARAMS['paper_trade'] =  url.searchParams.get("paper_trade") != null? parseInt(
                url.searchParams.get("paper_trade")) : 1;
        }

        $('div#tabs').tabs();
        $.ajax({
            url: "all_securities",
            method: "GET",
            dataType: 'json',
            success: function(data) {
                $('#body-panel').css('display', 'block')
                var search_list = data;
                initializing(search_list, sid);
                $('#wait-overlay').toggleClass('wait ready');
            },
            error: function (msg) {
                alert(msg);
            }
        });

    })();
}
