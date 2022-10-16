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


function updateContent() {
    var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.t_date())
    var ref_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.ref_date())
    var pid = paramsInput.pid();
    var cache = paramsInput.cache()[0];

    startLoading();
    $.ajax({
        url: "get_portfolio_risk",
        method: "GET",
        dataType: 'json',
        timeout: 1000*120,
        data: {
            pid: parseInt(pid),
            t_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(t_date),
            ref_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(ref_date),
            set_accts: JSON.stringify(paramsInput.selectedAccounts()),
            cache: cache
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
            alert("script:updateContent:"+error.responseText);
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


function streamContent() {
    var lastResponseLength = false;
    var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.t_date())
    var ref_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.ref_date())
    var pid = paramsInput.pid();
    var cache = paramsInput.cache()[0];
    var pos;
    var delimiter = '|%$|'

    startLoading();
    $.ajax({
        url: "get_portfolio_risk_stream",
        method: "POST",
        dataType: 'text',
        timeout: 1000*120,
        data: {
            pid: parseInt(pid),
            t_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(t_date),
            ref_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(ref_date),
            set_accts: JSON.stringify(paramsInput.selectedAccounts()),
            cache: cache
        },
        xhrFields: {
            // Getting on progress streaming response
            onprogress: function(e)
            {
                var progressResponse;
                var response = e.currentTarget.response;
                if(lastResponseLength === false)
                {
                    progressResponse = response;
                }
                else
                {
                    progressResponse = response.substring(lastResponseLength);
                }

                pos = progressResponse.indexOf(delimiter)
                // console.log(progressResponse);
                while (pos != -1) {
                    var data = JSON.parse(progressResponse.substring(0, pos));
                    updateWidget(data);
                    lastResponseLength += pos + delimiter.length;
                    progressResponse = response.substring(lastResponseLength);
                    pos = progressResponse.indexOf(delimiter)
                }
            }
        },
        success: function(data) {
            endLoading();
            updateSize();
            // paramsInput.cache([true]);
            // currency risk
            //updateSize();
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.statusText+":"+error.responseText);
        }
    })
}


function clickTab(event, ui) {
    PARAMS['currentTab'] = $(event.currentTarget).attr('href');
    //updateSize();
};

var paramsInput = new (function () {
    var t_date = new Date();
    var ref_date = new Date();
    var self = this;
    ref_date.setDate(t_date.getDate()-1);
    ref_date.setHours(23);
    ref_date.setMinutes(59);

    this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
    this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(ref_date));
    this.pid = ko.observable(8158);
    this.accounts = ['GS', 'IB', 'SS'];
    this.selectedAccounts = ko.observable(['GS', 'IB', 'SS']);
    this.title = ko.pureComputed(function() {
        return "Portfolio Risk Dashboard (As Of " + self.t_date().slice(0, 10) + ")";
    });
    this.cache = ko.observable([false]);
    this.cache_opt = ko.observable([true, false]);
    return this;
})();


var main = function() {
    //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
    var toolbar = (url.searchParams.get("toolbar") || 'true') == 'true';
    url.searchParams.get('t_date') && paramsInput.t_date(url.searchParams.get('t_date'));
    url.searchParams.get('ref_date') && paramsInput.ref_date(url.searchParams.get('ref_date'));

    [startLoading, endLoading] = loadingIcon();

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: streamContent,
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

    initialize(PARAMS);
    $('#tabs').tabs({
        activate: clickTab});
    PARAMS['currentTab'] = '#' + $('#tabs>div').attr('id');

    // autoload && updateContent();
    if (!(toolbar)) {
        $('#control-panel').css('display', 'none');
        $('nav.navbar').css('display', 'none');
    }
    autoload && streamContent();
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

$(document).ready(main);

/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
