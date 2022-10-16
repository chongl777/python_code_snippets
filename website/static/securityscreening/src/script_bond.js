//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.6:9999";
//var widget = {};

var gridster = {};
var PARAMS = {};
PARAMS['widget'] = {};
PARAMS['data'] = null;
var startLoading, endLoading;
var preventSubmit=false;
var paramsInput;


// Object.prototype.isEmpty = function() {
//     for(var key in this) {
//         if(this.hasOwnProperty(key))
//             return false;
//     }
//     return true;
// }

function isEmpty(obj) {
    return Object.keys(obj).length === 0
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

function updateContent(paramsInput) {
    var t_date = d3.timeParse('%Y-%m-%d')(
        paramsInput.t_date())
    var s_date = d3.timeParse('%Y-%m-%d')(
        paramsInput.s_date())

    startLoading();
    $.ajax({
        url: "calc_securities_attr_bond",
        method: "POST",
        dataType: 'json',
        timeout: 1000*360,
        //timeout: 1,
        data: {
            t_date: d3.timeFormat('%Y-%m-%d')(t_date),
            s_date: d3.timeFormat('%Y-%m-%d')(s_date),
            filter: paramsInput.filter()
        },
        success: function(data) {
            endLoading();
            preventSubmit = true;
            updateWidget(data);
            paramsInput._updated = true;
        },
        error: function (error) {
            endLoading();
            paramsInput._updated = false;
            if (error.responseJSON != null) {
                alert(error.responseJSON);
            } else {
                alert(error.statusText + ":" + error.responseText);
            }
        }
    })
}

function requery(paramsInput) {
    startLoading();
    var data_str = JSON.stringify(PARAMS['data']);
    $.ajax({
        url: "requery_data",
        method: "POST",
        dataType: 'json',
        timeout: 1000*120,
        data: {
            filter: paramsInput.filter(),
            data: JSON.stringify(PARAMS['data'])
        },
        success: function(data) {
            endLoading();
            preventSubmit = true;
            updateWidget(data);
            paramsInput._updated = true;
        },
        error: function (error) {
            endLoading();
            if (error.responseJSON != null) {
                alert(error.responseJSON);
            } else {
                alert(error.statusText + ":" + error.responseText);
            }
        }
    })
}


function updateWidget(data) {
    if ('full_data' in data) {
        PARAMS['data'] = data['full_data'];
    }

    if (!('security_screening_data' in data)) {
        data['security_screening_data'] = data['full_data'];
    }

    $.each(PARAMS['widget'], function(d) {
        if (!(PARAMS['widget'][d].datasource in data))
            return
        try {
            PARAMS['widget'][d].updateWithData(
                data[PARAMS['widget'][d].datasource]);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}


function main(data={}) {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var toolbar = (url.searchParams.get("toolbar") || 'true') == 'true';
    var recent_date = new Date();
    recent_date.setMonth(recent_date.getMonth()-1);

    var saved_queries = [
        {query_name: 'None Selected', query: ''},
        {query_name: 'High EMC score, High RVS score', query: 'WHERE score_eh >= 8 AND score_rh > 5 AND crr_px > 80 AND crr_px is not null ORDER BY signal_eh desc, signal_rh desc'},
        {query_name: 'Low EMC score', query: 'WHERE score_eh <= 2 AND crr_px > 80 ORDER BY signal_eh asc, signal_rh asc'},
        {query_name: 'Fallen Angel', query: "WHERE rtg_rnk_sp_composite >= 11 AND prev_rtg_rnk_sp_composite <= 10 AND rating_sp_composite != 'NR' AND last_update_sp_composite > '{recent_date}'"},
        {query_name: 'Recent Upgraded', query: "WHERE rtg_chg_sp_composite > 0 AND rating_sp_composite != 'NR' AND last_update_sp_composite > '{recent_date}' ORDER BY rtg_chg_sp_composite desc"},
        {query_name: 'Recent Downgraded', query: "WHERE rtg_chg_sp_composite < 0 AND rating_sp_composite != 'NR' AND last_update_sp_composite > '{recent_date}' ORDER BY rtg_chg_sp_composite asc"}
    ];
    saved_queries.forEach(function(p, i) {
        p.query = p.query.replace(/{recent_date}/g, d3.timeFormat('%Y-%m-%d')(recent_date))
    });
    var cached_setup = CachedParams('security_screening');
    var params = data.params || {};

    paramsInput = new (function () {
        var self = this;

        var t_date = params.t_date == null ? new Date(): d3.timeParse('%Y-%m-%dT%H:%M:%S')(params.t_date);
        var s_date = new Date();
        s_date.setYear(t_date.getFullYear()-3);
        s_date = params.s_date == null ? s_date: d3.timeParse('%Y-%m-%dT%H:%M:%S')(params.s_date);
        self._updated = false;

        self._t_date = ko.observable(t_date);
        self.t_date = ko.computed({
            read: function() {
                return d3.timeFormat("%Y-%m-%d")(self._t_date())
            },
            write: function(val) {
                self._t_date(d3.timeParse('%Y-%m-%d')(val));
                self._updated = false;
            }
        });

        self._s_date = ko.observable(s_date);
        self.s_date = ko.computed({
            read: function() {
                return d3.timeFormat("%Y-%m-%d")(self._s_date())
            },
            write: function(val) {
                self._s_date(d3.timeParse('%Y-%m-%d')(val));
                self._updated = false;
            },
            owner: self
        });
        self.title = ko.pureComputed(function() {
            return "Bond Screening (As Of " + self.t_date().slice(0, 10) + ")";
        });

        self.filter = cached_setup('filters', '');

        self.customized_queries = cached_setup('customized_query', []);
        self.available_queries = ko.pureComputed(function() {
            return saved_queries.concat(self.customized_queries());
        });

        self.selected_query = ko.computed({
            read: function(val) {
                return [];
            },
            write: function(val) {
                var selected = self.available_queries().filter((x)=>(x.query_name == val))[0];
                self.filter(selected.query);
            },
            owner: self
        });

        self.save_query = function() {
            var i = 1;
            while(self.customized_queries().filter((x) => (x.query_name=="Saved Query "+i)).length > 0) {
                i++;
            }
            var query_name = prompt("Please enter name for this query", "Saved Query "+i);

            if (query_name == "") {
                alert("Must type in a query name");
            } else if (query_name == null) {
            } else if (saved_queries.filter((x) => (x.query_name == query_name)).length>0) {
                alert("This query name is reserved, choose another one");
            }else {
                var filtered_queries = self.customized_queries().filter((x) => (x.query_name != query_name));
                self.customized_queries(filtered_queries.concat([{query_name: query_name, query: self.filter()}]));
                rebuild_select();
            }
        }

        return this;
    })();

    // $('#main-frame').css('height', toolbar ? 'calc(100% - 40px)' : '100%')

    [startLoading, endLoading] = loadingIcon();

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: function(submit) {
            updateContent(paramsInput);
        },
        submit: function(submit) {
            if (!paramsInput._updated) {
                updateContent(paramsInput);
            } else {
                requery(paramsInput);
            }
        },
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

    $("#control-panel svg#save").html(SVGICON.icon_save());

    $('#control-panel form').keypress(function(e) {
        preventSubmit = false;
    })

    var multiselect = $('#control-panel select#saved-queries').multiselect({
        enableHTML: true,
        templates: {
            li: '<li><a><label style="display:inline;"></label>\
                 <svg class="delete-query" style="width: 15px; height: 15px"><g transform="scale(0.03)rotate(45)translate(100, -200)">' +
                SVGICON.icon_plus()
                + '</g></svg></a></li>'
        },
        onChange: function() {
            var a = 1;
        }
    });

    function rebuild_select() {
        multiselect.multiselect('rebuild');
        $('svg.delete-query').each(function(i, p) {
            var title = $('label', $(p).parent()).attr('title');
            if (saved_queries.filter((x)=>(x.query_name == title)).length > 0) {
                $(p).css('display', 'none');
            } else {
                $(p).click(function() {
                    var filtered_queries = paramsInput.customized_queries().filter((x) => (x.query_name != title));
                    paramsInput.customized_queries(filtered_queries);
                    rebuild_select();
                });
            }
        });
    }
    rebuild_select();

    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    initialize_bond(PARAMS, cached_setup);

    if (!(toolbar)) {
        $('#control-panel').css('display', 'none');
        $('nav.navbar').css('display', 'none');
    }

    if (!isEmpty(data)) {
        paramsInput._updated = true;
        updateWidget(data);
    }
}


function all_css() {
    return [].slice.call(document.styleSheets)
        .reduce(function (prev, styleSheet) {
            if (styleSheet.cssRules) {
                return prev +
                    [].slice.call(styleSheet.cssRules)
                    .reduce(function (prev, cssRule) {
                        return prev + cssRule.cssText;
                    }, '');
            } else {
                return prev;
            }
        }, '');
}


function html_css(doc) {
    // var html = $("html")[0].outerHTML;
    var html  = doc.documentElement.outerHTML;
    var css = all_css(doc);
    return [html, css]
}


function get_html() {
    var [html, css] = html_css(document);
    var res;
    var running = {status: true};

    $.ajax({
        url: "api_download_html_version",
        method: "POST",
        dataType: 'text',
        timeout: 1000*120,
        async: false,
        data: {
            html: html,
            css: css
        },
        success: function(data) {
            running.status = false;
            console.log(running.status);
            res = data;
        },
        error: function (data) {
            running.status = false;
            console.log(running.status);
            res = data;
        }
    });
    while (running.status) {
        console.log(running.status);
    };
    return res;
}


function download_html_version() {
    var html = $("html")[0].outerHTML;
    var css = all_css();

    $.ajax({
        url: "api_download_html_version",
        method: "POST",
        dataType: 'text',
        timeout: 1000*120,
        data: {
            html: html,
            css: css
        },
        success: function(data) {
        },
        error: function (error) {
            alert("script:download_html_version:"+error.statusText+":"+error.responseText);
        }
    })

}

var create_screening_table, create_rtg_rnk_tbl;

function initialize_bond(PARAMS, cached_setup) {
    PARAMS['widget']['security-screening'] = addTitle(
        create_screening_table(
            'div#security-screening',
            'SCREENING RESULT',
            'security_screening_data',
            cached_setup), true, true);

    PARAMS['widget']['rating_rank'] = addTitle(
        create_rtg_rnk_tbl(
            query='div#rating-rank',
            title='RATING RANK', datasource='rating_ranking'), false, false);
}

/*
  $(window).on('load', function() {
  getCompanyId('cid')
  })
*/
