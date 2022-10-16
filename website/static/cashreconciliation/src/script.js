//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.6:9999";
//var widget = {};

var gridster = {};
var PARAMS = {}
//PARAMS['server_url'] = "http://192.168.168.6:5500";
PARAMS['cid'] = null;
PARAMS['cid_bcd'] = null;
PARAMS['folderName'] = null;
PARAMS['widget'] = {};
PARAMS['rLib'] = "ResearchDocuments";
PARAMS['heightIncrement'] = 20
PARAMS['widthIncrement'] = 125
PARAMS['vMargin'] = 10
var startLoading, endLoading;


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


function updateWidget(data) {
    $.each(PARAMS['widget'], function(d) {
        if (!(PARAMS['widget'][d].datasource in data))
            return
        PARAMS['widget'][d].updateWithData(
            data[PARAMS['widget'][d].datasource]);

        try {
        } catch (err) {
            console.log(err.message);
        }
    })
    updateSize();
}


function updateContent(paramsInput) {

    var start_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.start_date())

    var end_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.end_date())

    var pid = paramsInput.selected_fund()[0];
    var priority = paramsInput.selected_priority()[0].priority_tag;

    startLoading();
    $.ajax({
        "url": "api_cash_reconciliation",
        "method": "GET",
        dataType: 'text',
        "data": {
            pid: parseInt(pid),
            start_date: start_date.toLocaleString(),
            end_date: end_date.toLocaleString(),
            priority: priority},
        "success": function(data) {
            endLoading();
            DATA = data;
            updateWidget(JSON.parse(data.replace(/NaN/g, "0")));
            // currency risk
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.responseText);
        }
    })
}

function clickTab(event, ui) {
    PARAMS['currentTab'] = $(event.currentTarget).attr('href');
    updateSize();
};


function main(data={}, available_funds=[], priorities) {
    //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    var url_string = window.location.href;
    var url = new URL(url_string);
    var available_priorities = JSON.parse(priorities.replace(/&#34;/g,"\""));

    [startLoading, endLoading] = loadingIcon();
    var autoload = url.searchParams.get("autoload") || false;
    var paramsInput = new (function () {
        var url = new URL(window.location.href);
        var params = data.params || {};
        var end_date = params.t_date == null ? new Date(): d3.timeParse('%Y-%m-%dT%H:%M:%S')(params.t_date);
        var start_date = params.s_date == null ? new Date(): d3.timeParse('%Y-%m-%dT%H:%M:%S')(params.s_date);

        var self = this;
        params.s_date || start_date.setDate(0);
        start_date.setHours(23);
        start_date.setMinutes(59);

        end_date.setHours(23);
        end_date.setMinutes(59);

        this.available_funds = ko.observableArray(available_funds);
        this.selected_fund = ko.observable([available_funds[0].pid]);
        this.start_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(start_date));
        this.end_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(end_date));

        this.available_priorities = ko.observableArray(available_priorities);

        let priority_tag = url.searchParams.get("priority") || 13;
        let selected_priority = available_priorities.filter(x=>x.priority_tag == priority_tag);
        this.selected_priority = ko.observable(selected_priority);

        this.available_priorities().forEach(function(p, i) {
            if (p.priority_tag == self.selected_priority()[0].priority_tag) {
                self.selected_priority([p]);
            }
        });

        this.title = ko.pureComputed(function() {
            return "Portfolio Position/Cash Reconciliation";
        })
        return this;
    })();

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: function() {updateContent(paramsInput)},
        hidePanel: false
    });

    $('#control-panel form').submit(function(e) {
        e.preventDefault();
        updateContent();
    });
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    $(".gridster ul").each(function(i, p) {
        var grid = $(p).gridster({
            widget_margins: [20, PARAMS['vMargin']],
            widget_base_dimensions: [PARAMS['widthIncrement'], PARAMS['heightIncrement']],
            resize: {enabled: false, resize: resize, stop: resize},
            max_rows: 1000,
            draggable: {handle: 'header, header *'},
            shift_widgets_up: true,
            shift_larger_widgets_down: false,
            collision: {wait_for_mouseup: true}
        }).data("gridster");
        gridster[$($('a.widget-title')[i]).attr('href')] = grid;
    })

    initialize(PARAMS, paramsInput);
    $('#tabs').tabs({
        activate: clickTab});
    PARAMS['currentTab'] = '#' + $('#tabs>div').attr('id');

    updateWidget(data);
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


// $(document).ready(main);

/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
