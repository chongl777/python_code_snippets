//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.6:9999";
//var widget = {};

var gridster = {};
var PARAMS = {}
PARAMS['widget'] = {};
var startLoading, endLoading;
var preventSubmit = false;


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


function updateContent(submit, paramsInput) {
    var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.t_date())
    var ref_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.ref_date())
    var f_date = d3.timeParse('%Y-%m-%dT%H:%M')(
        paramsInput.f_date())

    var pid = paramsInput.selected_fund()[0].pid;
    var strategy_tag = paramsInput.selected_tag();
    var priority_tag = paramsInput.selected_priority()[0].priority_tag;

    startLoading();
    $.ajax({
        url: "get_portfolio_lookthrough_scenario_test",
        method: "GET",
        dataType: 'json',
        timeout: 10000*120,
        data: {
            pid: pid,
            t_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(t_date),
            ref_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(ref_date),
            f_date: d3.timeFormat('%Y-%m-%dT%H:%M:%S')(f_date),
            strategy_tag: JSON.stringify(strategy_tag),
            priority_tag: priority_tag
        },
        success: function(data) {
            endLoading();
            paramsInput.title(
                paramsInput.selected_fund()[0].pf_grp + " (" +paramsInput.selected_fund()[0].pf_name + ")");
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

            preventSubmit = true;
            (submit != null) && submit();
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


var main = function(fund_info, strategies, priorities) {
    var available_funds = JSON.parse(fund_info.replace(/&#34;/g,"\""));
    var available_strategies = JSON.parse(strategies.replace(/&#34;/g,"\""));
    var available_priorities = JSON.parse(priorities.replace(/&#34;/g,"\""));
    var available_grps = [...new Set(available_funds.map(function(p) {return p.pf_grp}))];

    var strategies_maps = {};
    available_strategies.forEach(function(p, i) {
        strategies_maps[p.strategy_tag] = p;
    });
    var paramsInput = new (function () {
        var cached_setup = CachedParams('paper_port_selection');
        var self = this;
        var t_date = new Date();
        var ref_date = new Date();
        t_date.setHours(23);
        t_date.setMinutes(59);

        ref_date.setDate(t_date.getDate()-1);
        ref_date.setHours(23);
        ref_date.setMinutes(59);
        // var funds = JSON.loads(fund_info);

        this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));
        this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(ref_date));
        this.pid = ko.pureComputed(function() {
            return self.selected_fund()[0].pid;
        });
        this.f_date = cached_setup('f_date', d3.timeFormat("%Y-%m-%dT%H:%M")(t_date));

        this.available_grps = available_grps;
        this._selected_grp = cached_setup('selected_grp', available_grps[0]);
        this.selected_grp = ko.computed({
            read: function() {
                return [self._selected_grp()];
            },
            write: function(val) {
                var selected_grp = val[0];
                self._selected_grp(selected_grp);

                var _available_funds = available_funds.filter(function(p) {return p.pf_grp ==  selected_grp})
                self.available_funds(_available_funds);
            },
            owner: this
        });

        this.available_funds = ko.observableArray(
            available_funds.filter(function(p) {return p.pf_grp ==  self._selected_grp()}));
        this.selected_fund = cached_setup('selected_fund', [self.available_funds()[0]]);
        try {
            this.available_funds().forEach(function(p, i) {
                if (p.pid == self.selected_fund()[0].pid) {
                    self.selected_fund([p]);
                }
            });
        } catch(err) {
            self.selected_tag([self.available_tags()[0]]);
        }

        this.available_tags = ko.observableArray(available_strategies);
        this.selected_tag = cached_setup('selected_tag', [self.available_tags()[0]]);
        // this is necessary since the object equivalent is not decided by value
        try {
            this.available_tags().forEach(function(p, i) {
                if (p.strategy_tag == self.selected_tag()[0].strategy_tag) {
                    self.selected_tag([p]);
                }
            });
        } catch(err) {
            self.selected_tag([self.available_tags()[0]]);
        }

        this.available_priorities = ko.observableArray(available_priorities);
        this.selected_priority = cached_setup('selected_priority_tag', [self.available_priorities()[0]]);
        try {
            this.available_priorities().forEach(function(p, i) {
                if (p.priority_tag == self.selected_priority()[0].priority_tag) {
                    self.selected_priority([p]);
                }
            })
        } catch(err) {
            self.selected_priority([self.available_priorities()[0]]);
        }

        this.title = ko.observable("Select Paper Portfolio");
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
        update: function() {updateContent(null, paramsInput);},
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

    initialize(PARAMS, paramsInput, 'https://wfiubuntu01.wfi.local/pfmgmt',
               true, true);
    $('#tabs').tabs();
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
