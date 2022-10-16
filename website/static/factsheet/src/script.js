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


var main = function(available_funds) {
    var selectedPages;

    function download_file(url, args, fn) {
        startLoading();
        var args_vec = [];
        $.each(args, function(x, y) {
            args_vec.push(x+"="+y);
        });

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url +'?'+args_vec.join('&'), true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function(e) {
            fn.call(this, xhr, args);
        };
        xhr.onerror = function() {
            endLoading();
        }
        xhr.send();
    }

    function send_file(url, args) {
        startLoading();
        $.ajax({
            url: url,
            method: "GET",
            dataType: 'text',
            timeout: 1000*120,
            data: args,
            success: function(data) {
                endLoading();
                alert("email sent!");
            },
            error: function (error) {
                endLoading();
                alert("script:updateContent:"+error.responseText);
            }
        })
    }

    var cached_setup = CachedParams('fact_sheet_cache');
    var paramsInput = new (function () {
        let self = this;
        let t_date = new Date();
        let s_date = new Date();
        let available_bmk = this.available_bmk = ['H0A0 Index', 'NDDUWI Index', 'HYG', 'SPX Index'];

        this._selected_bmk1 = cached_setup('selected_bmk1', available_bmk[0]);
        this._selected_bmk2 = cached_setup('selected_bmk2', available_bmk[1]);

        this.selected_bmk1 = ko.computed({
            read: function() {
                return [self._selected_bmk1()];
            },
            write: function(val) {
                var selected_bmk1 = val[0];
                self._selected_bmk1(selected_bmk1);
            },
            owner: this
        });

        this.selected_bmk2 = ko.computed({
            read: function() {
                return [self._selected_bmk2()];
            },
            write: function(val) {
                var selected_bmk2 = val[0];
                self._selected_bmk2(selected_bmk2);
            },
            owner: this
        });

        t_date.setHours(23)
        t_date.setMinutes(59)
        self._t_date = d3.timeFormat("%Y-%m-%dT%H:%M")(t_date);

        self.t_date = ko.pureComputed({
            read: function() {
                return self._t_date;
            },
            write: function(value) {
                t_date = d3.timeParse("%Y-%m-%dT%H:%M")(value);
                self._t_date = d3.timeFormat("%Y-%m-%dT%H:%M")(t_date);

                t_date.setDate(0);
                self.filename("Westfield Fact Sheet " + d3.timeFormat('%b %Y')(t_date));
            },
            owner: self
        });

        var cdate = new Date(t_date);
        cdate.setDate(0);


        // self.fund = ko.observable("Westfield Fund LP");
        this.available_funds = ko.observableArray(available_funds);
        this.selected_fund = cached_setup('selected_funds', [available_funds[0].pf_name]);

        self.filename = ko.observable(
            "Westfield Fact Sheet " + d3.timeFormat('%b %Y')(cdate));
        self.buttonText = ko.observable("Download Report");
        self.selectedoption = "download";
        self.selectedOption = ko.pureComputed({
            read: function() {
                return self.selectedoption;
            },
            write: function(value) {
                self.selectedoption = value;
                self.buttonText(value == 'download' ? "Download Report" : "Email Report");
            },
            owner: this
        });
        this.email = "";
        return this;
    })();


    function downloadFile(xhr, args) {
        endLoading();
        if (this.status == 200) {
            // var blob = new Blob([xhr.response], {type: 'application/vnd.ms-excel'});
            //var binary = fr.readAsArrayBuffer(blob);
            var blob = new Blob([xhr.response], {type: 'octet/stream'});
            var downloadUrl = URL.createObjectURL(blob);
            //window.open(downloadUrl);

            var a = document.createElement("a");
            a.href = downloadUrl;
            a.download = args.filename;
            document.body.appendChild(a);
            a.click();
            //Do your stuff here
        } else {
            alert("error!");
        }

    }


    function initialize(PARAMS) {
        $("#pages #sortable").sortable({
            axis: "x",
            classes: {
                "ui-sortable": "highlight"
            },
            cursor: "move",
            handle: ".handle"
        }).selectable({
            filter: "li",
            cancel: ".handle"
        }).find( "li" ).addClass( "ui-corner-all" )
            .prepend( "<div class='handle'><span class='ui-icon ui-icon-carat-2-n-s'></span></div>" );;
    }

    function get_pages() {
        var pages = [];
        selectedPages = $('#pages #sortable li')
        selectedPages.each(function(i, p) {
            if ($(p).hasClass("ui-selected"))
                pages.push($(p).attr('id'));
        });
        return JSON.stringify(pages);
    }

    // ---------------------------------------------------
    var maps, sidebar;
    [startLoading, endLoading] = loadingIcon();


    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: function() {
            var t_date = d3.timeParse('%Y-%m-%dT%H:%M')(
                paramsInput._t_date);
            var fund = paramsInput.selected_fund()[0];
            if (paramsInput.selectedoption == "email") {
                send_file(
                    'email_report',
                    {
                        t_date: d3.timeFormat('%Y-%m-%d')(t_date),
                        fund: fund,
                        bmk1: paramsInput.selected_bmk1(),
                        bmk2: paramsInput.selected_bmk2(),
                        filename: paramsInput.filename()+'.pdf',
                        pages: get_pages(),
                        email: paramsInput.email
                    });
            } else {
			          download_file(
                    'download_report',
                    {
                        t_date: d3.timeFormat('%Y-%m-%d')(t_date),
                        fund: fund,
                        bmk1: paramsInput.selected_bmk1(),
                        bmk2: paramsInput.selected_bmk2(),
                        filename: paramsInput.filename()+'.pdf',
                        pages: get_pages()
                    }, downloadFile);
            }
        },
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
}
