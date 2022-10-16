//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.6:9999";
//var widget = {};

var gridster = {};
var PARAMS = {}
PARAMS['cid'] = null;
PARAMS['cid_bcd'] = null;
PARAMS['folderName'] = null;
PARAMS['widget'] = {};
PARAMS['rLib'] = "ResearchDocuments";
PARAMS['heightIncrement'] = 13;
PARAMS['widthIncrement'] = 125;
PARAMS['vMargin'] = 20;
var startLoading, endLoading;
var preventSubmit = false;


function calcDimension(widget) {
    var h1 = parseInt($('div', widget).height());
    var H = Math.ceil(h1 / (PARAMS['heightIncrement']+PARAMS['vMargin']));
    return H;
}

var updateSize = function() {
    var $widgets;
    var q = gridster[PARAMS['currentTab']];

    $widgets = q.$widgets;
    for (var i=0; i<$widgets.length; i++) {
        var h = calcDimension($widgets[i]);
        q.resize_widget($widgets.eq(i), null, h);
    }
}

function resize(e, ui, $widget) {
    var id = $('div.widget', $widget).attr("id");
    try {
        PARAMS['widget'][id].resize();
    } catch (erro) {};
}


function updateContent(submit, paramsInput) {
    var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.t_date())
    var ref_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.ref_date())
    var pids = paramsInput.selected_fund();
    var data_priority = paramsInput.selected_priority()[0].priority_tag;

    startLoading();
    $.ajax({
        url: paramsInput['api_url'],
        method: "GET",
        dataType: 'json',
        timeout: 1000*2400,
        data: {
            pids: JSON.stringify(pids),
            t_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(t_date),
            ref_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(ref_date),
            set_accts: JSON.stringify(paramsInput.selectedAccounts()),
            num_cores: paramsInput.num_cores()[0],
            data_priority: data_priority
        },
        success: function(data) {
            endLoading();
            // currency risk
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
            })
            //updateSize();
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.statusText+":"+error.responseText);
        }
    })
}


function updateWidget(data) {
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
    })
}


function clickTab(event, ui) {
    PARAMS['currentTab'] = $(event.currentTarget).attr('href');
    //updateSize();
};

var main = function(fund_info, priorities, api_url="get_portfolio_lookthrough") {
    //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    var available_priorities = JSON.parse(priorities.replace(/&#34;/g,"\""));
    var available_funds = JSON.parse(fund_info.replace(/&#34;/g,"\""));

    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
    var toolbar = (url.searchParams.get("toolbar") || 'true') == 'true';

    var paramsInput = new (function () {
        var t_date = new Date();
        var ref_date = new Date();
        var self = this;
        var cached_setup = CachedParams('pf_lookthrough');
        t_date.setHours(23);
        t_date.setMinutes(59);

        ref_date.setDate(t_date.getDate()-1);
        ref_date.setHours(23);
        ref_date.setMinutes(59);

        this.api_url = api_url;
        this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
        this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(ref_date));

        this.available_funds = ko.observableArray(available_funds);
        this.selected_fund = cached_setup('selected_funds', [available_funds[0].pid]);

        this.accounts = ['GS', 'IB', 'SS'];
        this.selectedAccounts = ko.observable(['GS', 'IB', 'SS']);
        this.num_cores = ko.observable([8]);
        this.num_cores_options = ko.observable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        this.title = ko.pureComputed(function() {
            return "Portfolio Risk Dashboard (As Of " + self.t_date().slice(0, 10) + ")";
        });
        this.cache = ko.observable([false]);
        this.cache_opt = ko.observable([true, false]);

        self._selected_priority = ko.observable();
        this.available_priorities = ko.observableArray(available_priorities);
        var init_priority_tag = parseInt($.cookie("init_priority_tag")) || available_priorities[0].priority_tag;
        this.available_priorities().forEach(function(p, i) {
            if (p.priority_tag == init_priority_tag) {
                self._selected_priority([p]);
            }
        });

        this.selected_priority = ko.computed({
            read: function() {
                return self._selected_priority();
                // return [self.available_tags()[1]];
            },
            write:function(value) {
                self._selected_priority(value);
                $.cookie("init_priority_tag", value[0].priority_tag, {expires: 360})
            },
            owner: this
        });

        return this;
    })();

    url.searchParams.get('t_date') && paramsInput.t_date(url.searchParams.get('t_date'));
    url.searchParams.get('ref_date') && paramsInput.ref_date(url.searchParams.get('ref_date'));

    [startLoading, endLoading] = loadingIcon();

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: function() {updateContent(null, paramsInput)},
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
        updateContent(formTarget.submit.bind(formTarget), paramsInput);
    });
    // ko.applyBindings(paramsInput);
    // ko.applyBindings(paramsInput, $("#control-panel")[0]);
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    $(".gridster ul").each(function(i, p) {
        var grid = $(p).gridster({
            widget_margins: [20, PARAMS['vMargin']],
            widget_base_dimensions: [PARAMS['widthIncrement'], PARAMS['heightIncrement']],
            resize: {enabled: true, resize: resize, stop: resize},
            max_rows: 1000,
            draggable: {handle: 'header, header *'},
            shift_widgets_up: true,
            shift_larger_widgets_down: false,
            collision: {wait_for_mouseup: true}
        }).data("gridster");
        gridster[$($('a.widget-title')[i]).attr('href')] = grid;
    })

    initialize(PARAMS, paramsInput, '..', true, false);
    $('#tabs').tabs({
        activate: clickTab});
    PARAMS['currentTab'] = '#' + $('#tabs>div').attr('id');

    if (!(toolbar)) {
        $('#control-panel').css('display', 'none');
        $('nav.navbar').css('display', 'none');
    }
    autoload && updateContent();
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


/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
