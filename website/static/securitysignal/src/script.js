function func_filter( array, term ) {
		var matcher = new RegExp( $.ui.autocomplete.escapeRegex( term ), "i" );
		return $.grep( array, function( value ) {
			  return matcher.test( value.keywords );
		});
}

function main(data, search_list) {
    var [startLoading, endLoading] = loadingIcon($('#content-panel')[0]);
    var preventSubmit = false;

    var PARAMS = {}
    var url_parms = {}
    var url = new URL(window.location.href);
    url_parms['trading_records'] = parseInt(url.searchParams.get("trading_records")) || 0;
    if (url_parms['trading_records']) {
        url_parms['fund_ids'] = url.searchParams.get("fund_ids");
        url_parms['paper_trade'] =  url.searchParams.get("paper_trade") != null? parseInt(
            url.searchParams.get("paper_trade")) : 1;
        url_parms['hide_panel'] = url.searchParams.get("hide_panel") != null? parseInt(
            url.searchParams.get("hide_panel")) : 1;
    }

    function securitySelect(selected_sids) {
        var sec = selected_sids[0];
        $.each(PARAMS['widget'], function(d) {
            PARAMS['widget'][d].startLoading();
        });
        $.ajax({
            url: "../sec_profile/security_returns_and_trading_records",
            method: "GET",
            dataType: 'text',
            data: {
                sids: JSON.stringify([sec.security_id]),
                trading_records: url_parms['trading_records'],
                fund_ids: url_parms['fund_ids'],
                paper_trade: url_parms['paper_trade']
            },
            success: function(ts) {
                var px_trd_hist = JSON.parse(ts.replace(/NaN/g, 'null'));
                updateContent(sec.security_id, px_trd_hist);

                // self.update_options_lines(
                //     line_configuration(ts));

                // format each data point
                // self.updateWithData(ts['px_trd_hist']);
            },
            error: function (error) {
                endLoading();
                window.alert(JSON.parse(error.responseText)["message"]);
            }
        });
    }

    function updateContent(sid, px_trd_hist) {
        $.each(PARAMS['widget'], function(d) {
            PARAMS['widget'][d].endLoading();
            PARAMS['widget'][d].update(sid, px_trd_hist);
        });
    }

    $("#control-panel").init_wfi_control_panel({
        inputs: {sec_profile: "../sec_profile/security_profile"+url.search},
        hidePanel: Boolean(url_parms['hide_panel']),
        update: function() {},
        showSettingPages: false,
        input_args: {
            submit_func: function() {
                var self = this;
            },
            cancel_func: function() {
                var self = this;
            }
        }
    });

    $('#control-panel form').submit(function(e) {
        e.preventDefault();
        var formTarget = $(this);
        if (preventSubmit) return;
        updateContent(formTarget.submit.bind(formTarget), paramsInput);
    });

    $('div#search').wfi_autocomplete({
        show_config: true,
        search_options: ['Companies/Securities', 'Companies', 'Securities'],
        onsearch: function(selected_item) {
            var params = [];
            url_parms['hide_panel'] = 0;
            $.each(url_parms, (x, y) => {
                params.push(x + "=" +y)});
            var data = selected_item['data']
            if (data.type == 'Company')
                window.location.href = "./index?pid=" + data['value'] + '&' + params.join('&');
            else
                window.location.href = "./index?sid=" + data['value'] + '&' + params.join('&');
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

    PARAMS['securities_list'] = $('#securities-list').init_securities_list({
        data: data['sec_list'],
        clickfn: securitySelect
    });
    PARAMS['widget'] = {};
    initialize(PARAMS, add_title);

    PARAMS['securities_list'].select_sid(data['sid']);
    // updateContent(data['sid']);
}


function ready_func(data) {
    $.ajax({
        url: "../sec_profile/all_securities",
        method: "GET",
        dataType: 'json',
        success: function(d) {
            $('#body-panel').css('display', 'block')
            var search_list = d;
            main(data, search_list);
            $('#wait-overlay').toggleClass('wait ready');
        },
        error: function (msg) {
            alert(msg);
        }
    });

}
