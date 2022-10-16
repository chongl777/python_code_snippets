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


function addTitle(obj) {
    var source = '<header class="title"> \
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
}


function updateContent(paramsInput) {
    var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.t_date())
    var ref_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.ref_date())
    var pids = paramsInput.pids();
    var cache = paramsInput.cache()[0];

    startLoading();
    $.ajax({
        url: "get_portfolio_cob",
        method: "GET",
        dataType: 'json',
        timeout: 1000*120,
        data: {
            pids: JSON.stringify(pids),
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
                // PARAMS['widget'][d].updateWithData(
                //     data[PARAMS['widget'][d].datasource]);

                try {
                    PARAMS['widget'][d].updateWithData(
                        data[PARAMS['widget'][d].datasource]);
                }
                catch (err) {
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


var main = function(fund_info) {
  //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    var all_funds = JSON.parse(fund_info.replace(/&#34;/g,"\""));
    var paramsInput = new (function () {
      var t_date = new Date();
      var ref_date = new Date();
      var self = this;
      ref_date.setDate(t_date.getDate()-1);
      ref_date.setHours(23);
      ref_date.setMinutes(59);

      this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
      this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(ref_date));
      this.pids = ko.observable(all_funds.map(x=>x.pid));
      this.accounts = ['GS', 'IB', 'SS'];
      this.selectedAccounts = ko.observable(['GS', 'IB', 'SS']);
      this.title = ko.pureComputed(function() {
        return "Portfolio COB Report (As Of " + self.t_date().slice(0, 10) + ")";
      });
      this.cache = ko.observable([false]);
      this.cache_opt = ko.observable([true, false]);
      return this;
    })();

    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
    url.searchParams.get('t_date') && paramsInput.t_date(url.searchParams.get('t_date'));
    url.searchParams.get('ref_date') && paramsInput.ref_date(url.searchParams.get('ref_date'));

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

    [startLoading, endLoading] = loadingIcon();
    // ko.applyBindings(paramsInput);
    // ko.applyBindings(paramsInput, $("#control-panel")[0]);
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    initialize(PARAMS);

    autoload && updateContent(paramsInput);
}

/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
