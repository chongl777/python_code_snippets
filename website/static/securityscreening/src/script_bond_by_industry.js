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
var preventSubmit=false;


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


function updateContent(submit) {
    var t_date = d3.timeParse('%Y-%m-%d')(
        paramsInput.t_date())
    var s_date = d3.timeParse('%Y-%m-%d')(
        paramsInput.s_date())

    startLoading();
    $.ajax({
        url: "daily_screening_report_industry",
        method: "POST",
        dataType: 'json',
        timeout: 1000*120,
        async: false,
        data: {
            t_date: d3.timeFormat('%Y-%m-%d')(t_date),
            s_date: d3.timeFormat('%Y-%m-%d')(s_date),
            filter: paramsInput.filter()
        },
        success: function(data) {
            endLoading();
            preventSubmit = true;
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
            });
            submit != null && submit();
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.statusText+
                  ":"+error.responseText);
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

var paramsInput = new (function () {
    var t_date = new Date();
    var s_date = new Date();
    var self = this;
    s_date.setYear(t_date.getFullYear()-3);

    this.t_date = ko.observable(d3.timeFormat("%Y-%m-%d")(t_date));
    this.s_date = ko.observable(d3.timeFormat("%Y-%m-%d")(s_date));
    this.title = ko.pureComputed(function() {
        return "Bond Screening Report By Industry (As Of " + self.t_date().slice(0, 10) + ")";
    });
    this.filter = ko.observable("");

    return this;
})();


var main = function() {
    //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
    var toolbar = (url.searchParams.get("toolbar") || 'true') == 'true';
    $('#main-frame').css('height', toolbar ? 'calc(100% - 40px)' : '100%')
    url.searchParams.get('t_date') && paramsInput.t_date(url.searchParams.get('t_date'));
    url.searchParams.get('s_date') && paramsInput.ref_date(url.searchParams.get('s_date'));
    var download = url.searchParams.get("download") || "false";
    PARAMS['download'] = download == "false" ? false : true;

    [startLoading, endLoading] = loadingIcon();

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: updateContent,
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
        updateContent(formTarget.submit)
    });
    $('#control-panel form').keypress(function(e) {
        console.log("yoyo")
        preventSubmit = false;
    })

    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    initialize(PARAMS);
    // autoload && updateContent();
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

$(document).ready(main);

function initialize(PARAMS) {
    PARAMS['widget']['security-screening-0'] = addTitle(
        create_screening_table(
            query='div#security-screening-0',
            title='SECTOR PERFORMANCE',
            datasource='security_screening_0',
            group_level_1='industry_level_1',
            group_level_2='None',
            start_expansion_level=1,
            total_expansion_level=1,
            pingate=false), true, PARAMS['download']);

    PARAMS['widget']['security-screening-1'] = addTitle(
        create_screening_table(
            query='div#security-screening-1',
            title='BOTTOM PERFORMERS - 1D',
            datasource='security_screening_1',
            group_level_1='industry_level_1',
            group_level_2='None',
            start_expansion_level=1,
            total_expansion_level=null,
            pingate=false), true, PARAMS['download']);

    PARAMS['widget']['security-screening-2'] = addTitle(
        create_screening_table(
            query='div#security-screening-2',
            title='TOP PERFORMERS - 1D',
            datasource='security_screening_2',
            group_level_1='industry_level_1',
            group_level_2='None',
            start_expansion_level=1,
            total_expansion_level=null,
            pingate=false), true, PARAMS['download']);
}
