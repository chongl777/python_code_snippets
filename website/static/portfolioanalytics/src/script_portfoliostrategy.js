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
    var filter = paramsInput.filter();
    var init_cap = parseFloat(paramsInput.init_cap()) || 0;
    var strategy_tag = paramsInput.selected_tag();
    var data_priority = paramsInput.selected_priority()[0].priority_tag;

    startLoading();
    $.ajax({
      url: "get_portfolio_lookthrough_by_strategy",
      method: "GET",
      dataType: 'json',
      timeout: 1000*1200,
      data: {
        pids: JSON.stringify(pids),
        t_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(t_date),
        ref_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(ref_date),
        filter: filter,
        init_cap: init_cap,
        strategy_tag: JSON.stringify(strategy_tag),
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
        preventSubmit = true;
        (submit != null) && submit();
      },
      error: function (error) {
        endLoading();
        alert("script:updateContent:"+error.statusText+":"+error.responseText);
      }
    });
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


var main = function(fund_info, strategies, priorities) {
    var available_funds = JSON.parse(fund_info.replace(/&#34;/g,"\""));
    var available_strategies = JSON.parse(strategies.replace(/&#34;/g,"\""));
    var available_priorities = JSON.parse(priorities.replace(/&#34;/g,"\""));
    var paramsInput = new (function () {
        var t_date = new Date();
        var ref_date = new Date();
        var self = this;
        t_date.setHours(23);
        t_date.setMinutes(59);

        ref_date.setDate(t_date.getDate()-1);
        ref_date.setHours(23);
        ref_date.setMinutes(59);
        // var funds = JSON.loads(fund_info);
        var cached_setup = CachedParams('pf_lookthrough_strategy');

        this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
        this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(ref_date));
        this.available_funds = ko.observableArray(available_funds);

        this.selected_fund = cached_setup('selected_funds', [available_funds[0].pid]);

        this.title = ko.pureComputed(function() {
            return "Portfolio By Strategy (As Of " + self.t_date().slice(0, 10) + ")";
        });

        this._init_cap = ko.observable(0);
        this.init_cap = ko.computed({
            read: function() {
                return self._init_cap();
            },
            write:function(value) {
                self._init_cap(value);
                if (self._filter() != '') {
                    $.cookie("init_cap", value, {expires: 360})
                }
            }
        });

        this.available_tags = ko.observableArray(available_strategies);
        this.selected_tag = cached_setup('selected_tag', [this.available_tags()[0].strategy_tag]);
        // this.selected_tag = ko.observableArray([{selected_tag: 1}]);
        // this is necessary since the object equivalent is not decided by value
        try {
            this.available_tags().forEach(function(p, i) {
                if (p.strategy_tag == self.selected_tag()[0].strategy_tag) {
                    self.selected_tag([p]);
                }
            });
        } catch(err) {
            this.selected_tag([this.available_tags()[0]]);
        }

        this.available_priorities = ko.observableArray(available_priorities);
        this.selected_priority = cached_setup('selected_priority_tag', [this.available_priorities()[0]]);

        this.available_priorities().forEach(function(p, i) {
            if (p.priority_tag == self.selected_priority()[0].priority_tag) {
                self.selected_priority([p]);
            }
        });

        this._filter = ko.observable();
        this.filter = ko.computed({
            read: function() {
                return self._filter();
            },
            write:function(value) {
                self._filter(value);
                if (value != '') {
                    self.init_cap($.cookie("init_cap"));
                } else {
                    self.init_cap(0);
                }
            },
            owner: this
        });

        return this;
    })();

    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
    var toolbar = (url.searchParams.get("toolbar") || 'true') == 'true';
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
        if (preventSubmit) return;
        updateContent(formTarget.submit.bind(formTarget), paramsInput);
    });
    $('#control-panel form').keypress(function(e) {
        preventSubmit = false;
    })

    // ko.applyBindings(paramsInput);
    // ko.applyBindings(paramsInput, $("#control-panel")[0]);
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);

    initialize(PARAMS, paramsInput, '..', true, false);
    $('#tabs').tabs({
        activate: clickTab});
    PARAMS['currentTab'] = '#' + $('#tabs>div').attr('id');

    if (!(toolbar)) {
        $('#control-panel').css('display', 'none');
        $('nav.navbar').css('display', 'none');
    }

    $('#example-getting-started').multiselect();

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
