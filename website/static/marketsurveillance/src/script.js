//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.61:9999";
//var widget = {};
var gridster = {};
var PARAMS = {}
var tabs = {};

PARAMS['widget'] = {};
PARAMS['rLib'] = "ResearchDocuments";
PARAMS['heightIncrement'] = 10;
PARAMS['widthIncrement'] = 150;
PARAMS['vMargin'] = 10;

PARAMS['t_date'] = new Date();
PARAMS['n'] = 5;  // look back period
var startLoading, endLoading;

var paramsInput = new (function () {
    var t_date = new Date();
    this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
    this.lookback = ko.observable(5);
    return this;
})();

function addTitle2(obj, title) {
    var source = '<header class="title"> \
                    <h>{{title}}</h> \
                    <img class="config" src="./static/src/images/settings.png"> \
                  </header>';
    obj.each(function(i, div) {
        var $html = $(Handlebars.compile(source)({title: title}));
        $('img', $html).on('click', function(p) {
            div.open_option_setup(div);
        })
        $(this).prepend($html);
    });
    return obj;
}


function addTitle(obj) {
    var source = '<header class="title"> \
                    <h data-bind="text: title"></h> \
                    <img class="config" src="./static/src/images/settings.png"> \
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
    var H = Math.ceil(parseInt($('div', widget).height()) /
                      (PARAMS['heightIncrement']+PARAMS['vMargin']));
    return H;
}

var updateSize = function() {
    var $widgets = gridster[PARAMS['currentTab']].$widgets;
    for (var i=0; i<$widgets.length; i++) {
        //$(gridster.$widgets[i]).attr("data-sizey")
        var h = calcDimension($widgets[i]);
        gridster[PARAMS['currentTab']].resize_widget($widgets.eq(i), null, h);
    }
}

function resize(e, ui, $widget) {
    var id = $('div.widget', $widget).attr("id");
    try {
        PARAMS['widget'][id].resize();
    } catch (erro) {};
}


var updateContent = function() {
    startLoading();
    $.ajax({
        url: PARAMS['method'],
        "method": "GET",
        dataType: 'json',
        "data": {
            n: parseInt(paramsInput.lookback()),
            t_date: (new Date(paramsInput.t_date())).toLocaleString()},
        "success": function(data) {
            endLoading();
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
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.responseText);
        }
    });
}

function clickTab() {
    var self = this;
    PARAMS['method'] = $(self).attr('method');
    PARAMS['currentTab'] = $(self).attr('href');

    if (!tabs[$(self).attr('href')]) {
        updateContent();
        tabs[$(self).attr('href')] = true;
    }
};


function siteSetting() {
}


var main = function() {
    var url_string = window.location.href;
    var url = new URL(url_string);
    [startLoading, endLoading] = loadingIcon();

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: updateContent,
        showSettingPages: false,
        siteSetting: siteSetting,
        input_args: {
            submit_func: function() {
                var self = this;
                PARAMS['server_url'] = self.options['input_args'].server_url;
                createCookie('server_url_mkt_svl', PARAMS['server_url']);
            },
            cancel_func: function() {
                var self = this;
                self.options['input_args'].server_url = PARAMS['server_url'];
            }
        },
        options: function(data) {
           var self = this;
           var html = $(' \
              <table style="width:300px"> \
                <col width="30%"> \
                <col width="70%"> \
                <tbody> \
                  <tr> \
                     <td colspan=1>Server Url</td> \
                     <td colspan=1 class="value"> \
                         <input style="width: 100%" data-bind="value:server_url"/> \
                     </td> \
                  </tr> \
                </tbody> \
              </table>');
            return html;
        }
    });

    PARAMS['method'] = 'api_oil_surveillance_art';
    $(".gridster ul").each(function(i, p) {
        var grid = $(p).gridster({
            widget_margins: [20, PARAMS['vMargin']],
            widget_base_dimensions: [PARAMS['widthIncrement'], PARAMS['heightIncrement']],
            resize: {enabled: true, resize: resize, stop: resize},
            max_rows: 500,
            draggable: {handle: 'header, header *'},
            shift_widgets_up: true,
            shift_larger_widgets_down: false,
            collision: {wait_for_mouseup: true}
        }).data("gridster");
        gridster[$($('a.widget-title')[i]).attr('href')] = grid;
    })

    initialize(PARAMS);
    initialize_crude_total(PARAMS);
    initialize_crude_art(PARAMS);
    initialize_natural_gas(PARAMS);
    initialize_crude_time_spread(PARAMS);

    $('#tabs').tabs();
    $('a.widget-title').each(function(i, p) {
        tabs[$(p).attr('href')] = false;
    })
    PARAMS['currentTab'] = $($('a.widget-title')[0]).attr('href');

    $('li a.widget-title').click(clickTab);
    tabs[$('a.widget-title').attr('href')] = true;
};

$(document).ready(main);

/*
 $(window).on('load', function() {
 getCompanyId('cid')
 })
 */
