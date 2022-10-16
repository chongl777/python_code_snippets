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
PARAMS['heightIncrement'] = 13;
PARAMS['widthIncrement'] = 125;
PARAMS['vMargin'] = 20;
var startLoading, endLoading;


function addTitle(obj, config=true) {
    var source = config?
            '<header class="title"> \
                    <h data-bind="text: title"></h> \
                    <img class="config" src="./static/src/images/settings.png"> \
                  </header>' :
            '<header class="title"> \
                    <h data-bind="text: title"></h> \
                  </header>';
    obj.each(function(i, div) {
        // var $html = $(Handlebars.compile(source)({title: div.options.title()}));
        var $html = $(source);

        $('img', $html).on('click', function(p) {
            var widget = div;
            widget.open_option_setup(widget);
        })
        $(this).prepend($html);

        ko.applyBindings(div.options, $html[0]);
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
            t_date: t_date.toLocaleString(),
            ref_date: ref_date.toLocaleString(),
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

function clickTab(event, ui) {
    PARAMS['currentTab'] = $(event.currentTarget).attr('href');
    updateSize();
};

var paramsInput = new (function () {
    var t_date = new Date();
    var self = this;
    this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
    this.pid = ko.observable(8158);
    this.title = ko.pureComputed(function() {
        return "Portfolio Sensitivity Analysis";
    });
    return this;
})();


var main = function() {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
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
    // ko.applyBindings(paramsInput);
    // ko.applyBindings(paramsInput, $("#control-panel")[0]);
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    initialize(PARAMS);
    $('#tabs').tabs({
        activate: clickTab});
    PARAMS['currentTab'] = '#' + $('#tabs>div').attr('id');
    // autoload && updateContent();
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
            alert("script:download_html_version:"+error.responseText);
        }
    })

}

$(document).ready(main);

/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
