//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.6:9999";
//var widget = {};

var gridster = {};
var PARAMS = {}
var startLoading, endLoading;
var SignOffObj;
var signOffHist;
var timeout = 10000 * 120;
var paramsInput;


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


function update_sign_off_hist(paramsInput) {
    startLoading();
    $.ajax({
        url: "api_sign_off_init",
        method: "GET",
        dataType: 'json',
        timeout: timeout,
        data: {
            t_date: paramsInput.t_date()
        },
        success: function(data) {
            endLoading();
            signOffHist.updateWithData(data)
            // currency risk
        },
        error: function (error) {
            endLoading();
            alert("script:updateContent:"+error.responseText);
        }
    });
}

function updateContent(paramsInput) {
    update_sign_off_hist(paramsInput);
    startLoading();
    $('#sign-off-frame').attr(
        'src', 'pf_cob_ver2?'+
           'autoload=true&pids='+
            JSON.stringify(paramsInput.pids())+'&'+'t_date='+
            paramsInput.t_date()+'&'+'ref_date='+
            paramsInput.ref_date()+'&'+'priority_tag='+
            paramsInput.priority_tag());
     $('#sign-off-frame').on('load', endLoading);
}


function initialize(paramsInput) {
    SignOffObj = new (function(){
        var self = this;
        self.datetime = new Date();
        self.date = paramsInput.t_date;

        self.sign_off_date = ko.observable(d3.timeFormat('%Y-%m-%d')(self.datetime));
        self.sign_off_time = ko.pureComputed(function() {
            return this.datetime.toLocaleTimeString();}, self);
        self.user = ko.observable($('#current-user-name').attr('username'));
        // self.email = ko.observable(
        //     "reportdistro@westfieldinvestment.com");
        self.email = ko.observable(
            "reportdistro@westfieldinvestment.com");
        self.hasSignedOff = ko.observable(false);
        self.comments = ko.observable();
        self.signoff = ko.observable(false);
        self.submit = signOffReport;
        self.send = sendReport;
        self.submit_send = signOffnSendReport;
        self.upload_to_ei = uploadToEI;
        self.send_to_bb = sendToBB;
        self.signOffMsg = ko.observable("");
        self.enable_sign_off = ko.pureComputed(function() {
            return true;
        });
        self.enable_send = ko.pureComputed(function() {
            //return (self.hasSignedOff() == true);
            return true;
        });
        self.enable_sign_off_send = ko.pureComputed(function() {
            //return (self.hasSignedOff() == false);
            return true;
        });
    })();

    ko.applyBindings(SignOffObj, $("#sign-off")[0]);

    var sign_off_tbl = $('#sign-off');
    sign_off_tbl[0].options = {
        title: 'SIGN OFF SHEET'
    };
    addTitle(sign_off_tbl);

    signOffHist = $('#sign-off-hist').init_wfi_table({
        datasource: 'sign-off-hist',
        title: ko.observable("SIGN OFF HISTORY"),
        init_level: 0,
        init_expand: 0,
        groupdata: false,
        sort_by: [{'field': 'Sign_x0020_Off_x0020_Date', ascend: false}],
        process_child_data: function(data, depth) {
            var self = this;
            var n = self.options.sort_by.length;
            data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
        },
        columns_setup: [
            {data: "Title",
             sortable: false,
             visible: true,
             title: '<div class="first-column">Report Type</div>',
             width: '15%',
             render: function(value, type, row) {
                 var self = this;
                 return '<div class="clickable" style="margin-left:' +
                     1*4 + 'px">' + value + '</div>';
             }},
            {data: "pnl",
             sortable: false,
             visible: true,
             title: 'PnL',
             width: '15%',
             render: function(value, type, row) {
                 var self = this;
                 return '<div class="value">' + d3.format(',.2f')(value) + '</div>';
             }},
            {data: "Sign_x0020_Off_x0020_Date",
             sortable: false,
             visible: true,
             title: 'Sign Off Date',
             width: '15%',
             render: function(value, type, row) {
                 try {
                     return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(value) + '</div>';
                 } catch(err) {
                     return '<div class="value"></div>'
                 }
             }},
            {data: "Sign_x0020_Off_x0020_Person",
             sortable: false,
             visible: true,
             title: 'Sign Off Person',
             width: '15%',
             render: function(value, type, row) {
                 return '<div class="value">' + value + '</div>';
             }},
            {data: "Sign_x0020_Off",
             sortable: false,
             visible: true,
             title: 'Sign Off',
             width: '15%',
             render: function(value, type, row) {
                 return '<div class="value">' + value + '</div>';
             }},
            {sortable: false,
             visible: true,
             title: 'Attachment',
             width: '30%',
             render: function(value, type, row) {
                 return '<div class="value"><a alt="" ' +
                     'style="display:inline-block; width:180px; height:15px;" ' +
                     //'background-image: url(./static/src/images/file-image/icxlsx.png)"' +
                     ' href="https://' + row["attachment-link"] + '">' +
                     '<img src="./static/src/images/file-image/ichtm.gif"/>' +
                     row["attachment-filename"] + '</a></div>';
             }},
        ],

        preProcess: function(data, options) {
            var dataClone = [];
            data.forEach(function(p) {
                p['Sign_x0020_Off_x0020_Date'] = d3.timeParse('%Y-%m-%dT%H:%M:%SZ')(
                    p['Sign_x0020_Off_x0020_Date']);
                dataClone.push(p);
            });

            dataClone.sort(sort_by(options.sort_by));
            return dataClone;
        }
    });

    var sign_off_frame = $('#sign-off-frame-div');
    sign_off_frame[0].options = {
        title: 'COB REPORTS'
    };
    // addTitle(sign_off_frame);
    updateContent(paramsInput);
}

function signOffReport() {
    sign_off_send_rpt(false, false, true, false);
}

function sendReport() {
    sign_off_send_rpt(true, false, false, false);
}

function signOffnSendReport() {
    sign_off_send_rpt(true, true, true, true);
}

function uploadToEI() {
    sign_off_send_rpt(false, true, false, false);
}

function sendToBB() {
    sign_off_send_rpt(false, false, false, true);
}


var main = function(fund_info) {
  //"http://wfdb01:7777/sites/Research/SitePages/SecurityProfile.aspx?sid=5&pid=8502156";
    var all_funds = JSON.parse(fund_info.replace(/&#34;/g,"\""));
    paramsInput = new (function () {
        var self = this;

        var _t_date = new Date();
        var _ref_date = new Date();

        _ref_date.setDate(_t_date.getDate()-1);
        _ref_date.setHours(23);
        _ref_date.setMinutes(59);

        this.t_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(_t_date));
        this.ref_date = ko.observable(d3.timeFormat("%Y-%m-%dT%H:%M")(_ref_date));
        this.pids = ko.observable(all_funds.map(x=>x.pid));

        // this.t_date = ko.pureComputed({
        //     read: d3.timeFormat("%Y-%m-%dT%H:%M")(self._t_date),
        //     write: function(value) {
        //         self._t_date = d3.timeFormat("%Y-%m-%dT%H:%M").parse(value);
        //     },
        //     owner: self
        // })
        this.accounts = ['GS', 'IB', 'SS'];
        this.selectedAccounts = ko.observable(['GS', 'IB', 'SS']);
        this.title = ko.pureComputed(function() {
            return "Sign Off (As Of " + self.t_date().slice(0, 10) + ")";
        });
        this.cache = ko.observable([false]);
        this.cache_opt = ko.observable([true, false]);
        this.priority_tag = ko.observable(7);
        return this;
    })();

    var url_string = window.location.href;
    var url = new URL(url_string);
    var autoload = url.searchParams.get("autoload") || false;
    [startLoading, endLoading] = loadingIcon();
    url.searchParams.get('priority_tag') && paramsInput.priority_tag(url.searchParams.get('priority_tag'));

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: () => updateContent(paramsInput),
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
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);
    $('#tabs').tabs();
    initialize(paramsInput);
    //PARAMS['currentTab'] = '#' + $('#tabs>div').attr('id');
    autoload && updateContent(paramsInput);
}


function sign_off_send_rpt(email=false, upload_to_ei=false, signoff=false, send_to_bb=false) {
    startLoading();
    var lastResponseLength = false;
    var delimiter = '|%$|'
    var pos;
    var doc = $('#sign-off-frame').contents()[0];
    var [html, css] = html_css(doc);
    $('#status').html("");
    $.ajax({
        url: "sign_off_portfolio",
        method: "POST",
        dataType: 'text',
        timeout: timeout,
        data: {
            html: html,
            css: css,
            email: email,
            signoff: signoff,
            upload_to_ei: upload_to_ei,
            send_to_bb: send_to_bb,
            email_list: SignOffObj.email(),
            signOffMsg: SignOffObj.signOffMsg(),
            user: SignOffObj.user(),
            date: SignOffObj.date(),
            signOfftime: SignOffObj.sign_off_time(),
            signOffDate: SignOffObj.sign_off_date(),
            ref_date: paramsInput.ref_date()
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

                pos = progressResponse.indexOf(delimiter);
                // console.log(progressResponse);
                while (pos != -1) {
                    var data = progressResponse.substring(0, pos);
                    updateStatus(data);
                    lastResponseLength += pos + delimiter.length;
                    progressResponse = response.substring(lastResponseLength);
                    pos = progressResponse.indexOf(delimiter);
                }
            }
        },
        success: function(data) {
            endLoading();
            update_sign_off_hist(paramsInput);
        },
        error: function (error) {
            endLoading();
            if (error.status == 307) {
                var resp = JSON.parse(error.responseText);
                window.open(
                    window.location.origin + '/auth/oauth/login'+'?next=/auth/oauth/close',
                    // resp['redirect_url']+'?next=/auth/close',
                    "Ratting",
                    "width=700,height=500,left=150,top=200,toolbar=0,status=0,")
            } else {
                alert("error:"+error.statusText+":"+error.responseText);
            }

        }
    })
}


function updateStatus(msg) {
    // console.log(msg)
    $('#status').append(msg);
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


function download_html_version(doc) {
    // var html = $("html")[0].outerHTML;
    var html  = doc.documentElement.outerHTML;
    var css = all_css(doc);

    $.ajax({
        url: "api_download_html_version",
        method: "POST",
        dataType: 'text',
        timeout: timeout,
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

function html_css(doc) {
    // var html = $("html")[0].outerHTML;
    var html  = doc.documentElement.outerHTML;
    var css = all_css(doc);
    return [html, css]
}


function sort_by(by) {
    var default_cmp = function(a, b) {
        if (a == b) return 0;
        return a < b ? -1 : 1;
    }

    var fn = function(x, y) {
        var rnk;
        var field;
        var ascend;
        for (var i=0; i< by.length; i++) {
            field = by[i]['field'];
            ascend = by[i]['ascend'];
            rnk = default_cmp(x[field], y[field]);
            if (rnk != 0) {
                return ascend == true ? rnk: -rnk;
            }
        }
        return -1;
    };
    return fn;
};


/*
 $(window).on('load', function() {
    getCompanyId('cid')
})
 */
