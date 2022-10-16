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


// function addTitle(obj, config=false, download=false) {
//     var source = '<header class="title"> \
//                     <h data-bind="text: title"></h> \
//                     <div id="buttons" style="cursor: pointer"> \
//                         <span id="download" \
//                          class="config tab-icon-download"></span> \
//                         <img id="config" class="config" src="./static/src/images/settings.png"> \
//                     </div> \
//                   </header>';
//     obj.each(function(i, widget) {
//         // var $html = $(Handlebars.compile(source)({title: div.options.title()}));
//         var $html = $(source);
//         (!config) && $('#config', $html).css('display', 'none');
//         (!download) && $('#download', $html).css('display', 'none');

//         $('#config', $html).on('click', function(p) {
//             widget.open_option_setup(widget);
//         });
//         $(this).prepend($html);

//         ko.applyBindings(widget.options, $html[0]);
//     });
//     return obj;
// }

function calcDimension(widget) {
    var h1 = parseInt($('div', widget).height());
    var H = Math.ceil(h1 / (PARAMS['heightIncrement']+PARAMS['vMargin']));
    return H;
}

var updateSize = function() {
}


function updateContent(data, paramsInput) {
    // var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
    //     paramsInput.t_date())
    // var ref_date = d3.timeParse('%Y-%m-%dT%H:%M')(
    //     paramsInput.ref_date())
    // var pids = paramsInput.pids();
    // var cache = paramsInput.cache()[0];
    // var loading = true;
    // var args_vec = [
    //     't_date=' + t_date.toLocaleString(),
    //     'pids=' + JSON.stringify(pids),
    //     'ref_date='+ ref_date.toLocaleString()]

    $.each(PARAMS['widget'], function(d) {
        if (!(PARAMS['widget'][d].datasource in data))
            return
        // PARAMS['widget'][d].updateWithData(
        //     data[PARAMS['widget'][d].datasource]);
        try {
            PARAMS['widget'][d].updateWithData(
                data[PARAMS['widget'][d].datasource]);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}


function get_html() {
    var [html, css] = html_css(document);
    var res;
    var running = {status: true};

    $.ajax({
        url: "api_download_html_version",
        method: "POST",
        dataType: 'text',
        timeout: 10000*120,
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


var main = function(data, params) {
    //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    let available_funds = params['fund_info'];
    let autoload = params['autoload'];
    let available_strategies = params['available_strategies'];
    let available_priorities = params['available_priorities'];

    var paramsInput = new (function () {
        var t_date = new Date();
        var ref_date = new Date();
        var self = this;
        ref_date.setDate(t_date.getDate()-1);
        ref_date.setHours(23);
        ref_date.setMinutes(59);

        this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
        this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(ref_date));

        this.available_funds = ko.observableArray(available_funds);
        this.selected_fund = ko.observableArray([available_funds[0].pid]);

        this.available_tags = ko.observableArray(available_strategies);
        this.selected_tag = ko.observableArray([this.available_tags()[0].strategy_tag]);

        // try {
        //     this.available_tags().forEach(function(p, i) {
        //         if (p.strategy_tag == self.selected_tag()[0].strategy_tag) {
        //             self.selected_tag([p]);
        //         }
        //     });
        // } catch(err) {
        //     this.selected_tag([this.available_tags()[0]]);
        // }

        this.pids = ko.observable(this.available_funds().map(x=>x.pid));
        this.accounts = ['GS', 'IB', 'SS'];
        this.selectedAccounts = ko.observable(['GS', 'IB', 'SS']);
        this.title = ko.pureComputed(function() {
            return "Portfolio COB Report (As Of " + self.t_date().slice(0, 10) + ")";
        });
        this.cache = ko.observable([false]);
        this.cache_opt = ko.observable([true, false]);

        this.available_priorities = ko.observableArray(available_priorities);
        this.selected_priority = ko.observableArray([this.available_priorities()[1]]);

        // this.available_priorities().forEach(function(p, i) {
        //     if (p.priority_tag == self.selected_priority()[0].priority_tag) {
        //         self.selected_priority([p]);
        //     }
        // });

        return this;
    })();

    var url_string = window.location.href;
    var url = new URL(url_string);

    params['t_date'] && paramsInput.t_date(params['t_date']);
    params['ref_date'] && paramsInput.ref_date(params['ref_date']);
    params['priority_tag'] && paramsInput.selected_priority([parseInt(params['priority_tag'])]);
    // params['priority_tag'] && paramsInput.selected_priority([2]);
    params['pids'] && paramsInput.selected_fund(params['pids']);


    [startLoading, endLoading] = loadingIcon();
    // ko.applyBindings(paramsInput);
    // ko.applyBindings(paramsInput, $("#control-panel")[0]);
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: function() {updateContent(null, paramsInput)},
        hidePanel: params['hidePanel'] || false,
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

    initialize(PARAMS, paramsInput);

    autoload && updateContent(data, paramsInput);
    console.log(document.readyState);
}


function html_css(doc) {
    // var html = $("html")[0].outerHTML;
    var html  = doc.documentElement.outerHTML;
    var css = all_css(doc);
    return [html, css]
}


function all_css(doc) {
    return [].slice.call(doc.styleSheets)
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

// document.load = main;
//$(document).ready(main);

/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
