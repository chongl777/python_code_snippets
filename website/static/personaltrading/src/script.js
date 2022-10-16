
function main(search_list, data) {
    var [startLoading, endLoading] = loadingIcon($('#content-panel')[0]);

    var PARAMS = {}
    var url = new URL(window.location.href);

    PARAMS['approver_email'] = data['approver_email'];
    PARAMS['approver_id'] = data['approver_id'];
    // PARAMS['approver_email'] = 'chong.liu@westfieldinvestment.com';
    PARAMS['type'] = url.searchParams.get("Type") || "Request";

    function request_info_to_dict(data) {
        return {
            ID: RequestInfoObj.ID,
            requester: data.requester(),
            requester_email: data.requester_email,
            security_id: data.sid(),
            security_name: data.security_name(),
            security_ticker: data.security_ticker(),
            shares: data.shares(),
            broker: data.broker(),
            account: data.account(),
            order_dir: data.orderDirection(),
            order_other_explain: data.otherOrderTypeExplain(),
            account_type: data.acctType(),
            order_type: data.orderType(),
            approver_id: PARAMS['approver_id'],
            approver_email: PARAMS['approver_email'],
            approve_days: data.approveDays(),
            approve: data.approve(),
            attachment: get_form_html()
        }
    }


    var RequestInfoObj = new (function() {
        var self = this;
        this.ID = null;
        this.preapproved = ko.observable();
        this.requester = ko.observable();

        this.requester_email = null;
        this.isRestricted = ko.observable(false);
        this.submit = submitForm;
        this.rdate = ko.observable(new Date());
        this.message = ko.observable();
        this.status_message = ko.observable();
        this.StatusClass = ko.observable()

        this.sid = ko.observable();
        this.request_date = ko.pureComputed(function() {
            return d3.timeFormat('%m/%d/%Y')(this.rdate());
        }, this);

        this.adate = ko.observable(new Date());
        this.approve_date = ko.observable();

        this.security_name = ko.observable();
        this.security_ticker = ko.observable();

        this.orderType = ko.observable();
        this.orderType1 = ko.pureComputed(function(){
            return this.orderType()=="Market"}, this);
        this.orderType2 = ko.pureComputed(function(){
            return this.orderType()=="Limit"}, this);
        this.orderType3 = ko.pureComputed(function(){
            return this.orderType()=="Stop"}, this);

        this.orderDirection = ko.observable();
        this.orderDirection1 = ko.pureComputed(function(){
            return this.orderDirection()=="Buy"}, this);
        this.orderDirection2 = ko.pureComputed(function(){
            return this.orderDirection()=="Sell"}, this);
        this.orderDirection3 = ko.pureComputed(function(){
            return this.orderDirection()=="Other"}, this);

        this.otherOrderTypeExplain = ko.observable();
        this.enableOtherOrderTypeExplain = ko.pureComputed(
            function() {
                if (this.orderDirection() == "Other") {
                    return true;
                }
                return false;
            }, this);

        this.shares = ko.observable();
        this.broker = ko.observable();
        this.account = ko.observable();
        this.acctType = ko.observable();

        this.acctType1 = ko.pureComputed(function(){
            return this.acctType()=="Individual"}, this);
        this.acctType2 = ko.pureComputed(function(){
            return this.acctType()=="Joint"}, this);
        this.acctType3 = ko.pureComputed(function(){
            return this.acctType()=="Other"}, this);

        this.otherAcctTypeExplain = ko.observable();
        this.requester_signature_url = ko.observable();
        this.enableOtherAcctTypeExplain = ko.pureComputed(
            function() {
                if (this.acctType() == "Other") {
                    return true;
                }
                return false;
            }, this);

        this.approver_signature_url = ko.observable();
        this.approve = ko.observable();
        this.approveDays = ko.observable(3);
        this.approve1 = ko.pureComputed(function(){
            return this.approve()=="Approved"}, this);
        this.approve2 = ko.pureComputed(function(){
            return this.approve()=="Denied"}, this);

        this.approver = ko.observable();
        this.denialExplain = ko.observable();
        this.enableDenialExplain = ko.pureComputed(
            function() {
                if (this.approve() == "Denied") {
                    return true;
                }
                return false;
            }, this);

        this.verify = ko.observable();
        this.verifyNoExplain = ko.observable();
        this.enableVerifyNoExplain = ko.pureComputed(
            function() {
                if (this.approve() == "Denied") {
                    return true;
                }
                return false;
            }, this);
        this.MessageClass = ko.observable();

        this.formType = ko.observable();

        this.canSubmit = ko.pureComputed(function() {
            $('#submit-button').prop('disabled', false);
            if (this.isRestricted()) {
                return false;
            }
            if (this.formType() == "Request") {
                this.MessageClass('warning');
                if (this.requester() == null ||  this.requester() == undefined) {
                    return false;
                }

                if (this.rdate == null ||  this.rdate == undefined) {
                    return false;
                }

                if (this.security_name() == null ||  this.security_name() == undefined) {
                    this.message('input security name.');
                    return false;
                }

                if (this.security_ticker() == null ||  this.security_ticker() == undefined) {
                    this.message('input security ticker.');
                    return false;
                }


                if (this.orderType() == null ||  this.orderType() == undefined) {
                    this.message('input order type.');
                    return false;
                } else if (this.orderType() == "Other") {
                    if (this.otherOrderTypeExplain() == null ||  this.otherOrderTypeExplain() == undefined) {
                        this.message('input order type.');
                        return false;
                    }
                }

                if (this.orderDirection() == null ||  this.orderDirection() == undefined) {
                    this.message('input order direction.');
                    return false;
                }

                if (this.shares() == null ||  this.shares() == undefined) {
                    this.message('input number of shares.');
                    return false;
                }

                if (this.broker() == null ||  this.broker() == undefined) {
                    this.message('input broker.');
                    return false;
                }

                if (this.account() == null ||  this.account() == undefined) {
                    this.message('input account number.');
                    return false;
                }

                if (this.acctType() == null ||  this.acctType() == undefined) {
                    this.message('choose account type.');
                    return false;
                } else if (this.acctType() == "Other") {
                    if (this.otherAcctTypeExplain() == null ||  this.otherAcctTypeExplain() == undefined) {
                        return false;
                    }
                }

                // if (this.signature_url() == null ||  this.signature_url() == undefined) {
                //     this.message('signature is required.');
                //     return false;
                // }
                this.message('Ready to submit.');
                this.MessageClass('ready');
                return true;
            } else if (this.formType() == 'Approve') {
                self.MessageClass('warning');
                if (this.approve() == null ||  this.approve() == undefined) {
                    this.message('Please approve or deny the request');
                    return false;
                }
                self.MessageClass('ready');
                return true;
            } else if (this.formType() == 'Verify' ) {
                return false;
            }
        }, this);

        this.buttonText = ko.pureComputed(
            function() {
                if (self.formType() == "Request") {
                    return "Send request";
                } else if (self.formType() == "Approve") {
                    if (self.approve() == 'Approved')
                        return "Approve";
                    else
                        return "Deny"
                } else if (self.formType() == "Verify") {
                    return "Verify";
                }
            }, this);
        this.showSearch = ko.pureComputed(
            function() {
                if (this.formType() == "Request") {
                    return true;
                } else {
                    return false;
                }
            }, this
        )
        return this;
    })();

    function func_filter( array, term ) {
		    var matcher = new RegExp( $.ui.autocomplete.escapeRegex( term ), "i" );
		    return $.grep( array, function( value ) {
			      return matcher.test( value.keywords );
		    });
    }


    function checkRestricted(sid, cid) {
        if (PARAMS['restricted_list'] == null) {
            RequestInfoObj.isRestricted(true);
            RequestInfoObj.message("cannot find restricted list");
        }
        var data = PARAMS['restricted_list'].getData();
        for(var i in data) {
            if (sid == data[i]['security_id'] || (cid != null && cid == data[i]['company_id'])){
                RequestInfoObj.isRestricted(true);
                RequestInfoObj.message("this security is in the restricted list");
                return;
            }
        }
        RequestInfoObj.isRestricted(false);
        RequestInfoObj.message(null);
    }


    function submitForm() {
        if (PARAMS['type'] == "Request") {
            if (RequestInfoObj.preapproved()) {
                send_to_approver_preapproved(RequestInfoObj);
            } else {
                send_to_approver(RequestInfoObj);
            }

        } else if (PARAMS['type'] == "Approve") {
            send_to_requester(RequestInfoObj);
        }
    }

    function send_to_approver(RequestData) {
        startLoading();
        $.ajax({
            url: "api_send_to_approver",
            method: "POST",
            dataType: 'text',
            timeout: 1000*120,
            data: request_info_to_dict(RequestData),
            success: function(data) {
                RequestData.message('request sent!');
                $('#submit-button').prop('disabled', true);
                endLoading();
            },
            error: function (error) {
                endLoading();
                if (error.status == 307) {
                    var resp = JSON.parse(error.responseText);
                    window.open(
                        resp['redirect_url']+'?next=/auth/close',
                        "Ratting",
                        "width=700,height=500,left=150,top=200,toolbar=0,status=0,")
                    // window.location.href = resp['redirect_url']+"?next="+window.location.pathname.replace(/\//g, "%2F");
                } else {
                    alert("error:"+error.statusText+":"+error.responseText);
                }
            }
        })
    }

    function send_to_approver_preapproved(RequestData) {
        startLoading();
        $.ajax({
            url: "api_send_to_approver_preapproved",
            method: "POST",
            dataType: 'text',
            timeout: 1000*120,
            data: request_info_to_dict(RequestData),
            success: function(data) {
                endLoading();
                RequestData.message('request approved!');
                $('#submit-button').prop('disabled', true);
            },
            error: function (error) {
                endLoading();
                if (error.status == 307) {
                    var resp = JSON.parse(error.responseText);
                    window.open(
                        resp['redirect_url']+'?next=/auth/close',
                        "Ratting",
                        "width=700,height=500,left=150,top=200,toolbar=0,status=0,")
                    // window.location.href = resp['redirect_url']+"?next="+window.location.pathname.replace(/\//g, "%2F");
                } else {
                    alert("error:"+error.statusText+":"+error.responseText);
                }
            }
        })
    }


    function send_to_requester(RequestData) {
        startLoading();
        $.ajax({
            url: "api_send_to_requester",
            method: "POST",
            dataType: 'text',
            timeout: 1000*120,
            data: request_info_to_dict(RequestData),
            success: function(data) {
                endLoading();
                RequestData.message('Request '+RequestData.approve()+'!');
                $('#submit-button').prop('disabled', true);

            },
            error: function (error) {
                endLoading();
                if (error.status == 307) {
                    var resp = JSON.parse(error.responseText);
                    window.open(
                        resp['redirect_url'],
                        "Ratting",
                        "width=700,height=500,left=150,top=200,toolbar=0,status=0,")
                } else {
                    alert("error:"+error.statusText+":"+error.responseText);
                }
            }
        })
    }

    function selectSecurity(input) {
        if (input.data.type == 'Fund') {
            RequestInfoObj.preapproved(true);
            RequestInfoObj.approve('Approved');
            RequestInfoObj.approver_signature_url(data['approver_signature'])
            RequestInfoObj.status_message('This trade is preapproved.')
            RequestInfoObj.StatusClass('ready')

            RequestInfoObj.approve_date(d3.timeFormat('%m/%d/%Y')(new Date()));
        } else {
            RequestInfoObj.status_message('This trade needs to be approved.')
            RequestInfoObj.StatusClass('warning')
            RequestInfoObj.preapproved(false);
            RequestInfoObj.approver_signature_url(undefined);
        }
        RequestInfoObj.security_name(input.data.ticker);
        RequestInfoObj.security_ticker(input.value);
        RequestInfoObj.sid(input.data.id);
        //RequestInfoObj.canSubmit();
    }


    function updateInfo() {
        RequestInfoObj.formType(PARAMS['type']);
        var item = data;

        if (PARAMS['type'] == "Request") {
            RequestInfoObj.status_message('Input security here.')
            RequestInfoObj.requester(item['requester_name']);
            RequestInfoObj.requester_email = item['requester_email'];
            RequestInfoObj.requester_signature_url(item['requester_signature']);
        } else if ((PARAMS['type'] == "Approve") || (PARAMS['type'] == 'Verify')) {
            RequestInfoObj.ID = item['ID'];
            RequestInfoObj.requester(item['Requester']);
            RequestInfoObj.requester_signature_url(item['requester_signature']);
            RequestInfoObj.rdate(d3.timeParse("%Y-%m-%dT%H:%M:%SZ")(item['RequestDate']));
            RequestInfoObj.security_name(item['SecurityName']);
            RequestInfoObj.security_ticker(item['Ticker']);
            RequestInfoObj.otherOrderTypeExplain(item['OrderOtherTypeExplain']);
            RequestInfoObj.orderType(item['OrderType']);
            RequestInfoObj.orderDirection(item['OrderDirection']);
            RequestInfoObj.shares(item['Shares']);
            RequestInfoObj.broker(item['Broker']);
            RequestInfoObj.account(item['Account']);
            RequestInfoObj.acctType(item['AcctType']);
            RequestInfoObj.otherAcctTypeExplain(item['OtherAcctTypeExplain']);
            RequestInfoObj.approver_signature_url(PARAMS['user_signature'])

            RequestInfoObj.adate(d3.timeParse("%Y-%m-%dT%H:%M:%SZ")(item['ApproveDate']) || new Date());
            RequestInfoObj.approver(item['Approver']);
            // RequestInfoObj.approver_email(item['approver_email']);
            RequestInfoObj.approver_signature_url(item['approver_signature']);
            RequestInfoObj.approve_date(d3.timeFormat('%m/%d/%Y')(new Date()));

            RequestInfoObj.approve(item['Approver'] == null ? null : (item['Approved'] ? "Approved" : "Denied"));
            RequestInfoObj.denialExplain($(item['DenialExplain']).text());
            RequestInfoObj.sid(item['SecurityID']);
            RequestInfoObj.requester_email = item['RequesterEmail'];
            RequestInfoObj.approve_date(d3.timeFormat('%m/%d/%Y')(new Date()));

            if (PARAMS['type'] == "Verify") {
                RequestInfoObj.message(RequestInfoObj.approver() + " has " + RequestInfoObj.approve() + " the request!");
                RequestInfoObj.MessageClass('ready');
                RequestInfoObj.approve_date(d3.timeFormat('%m/%d/%Y')(item.ApproveDate()));
            }
        }
    }

    $('#security-input').wfi_autocomplete({
        show_config: false,
        search_options: ['Companies/Securities', 'Companies', 'Securities'],
        placeholder: "Security To Trade",
        onsearch: function(selected_item) {
            selectSecurity(selected_item);
        },
        groupby: 'type',
        selection_structure: function(item) {
            return '<td><div style="width: 70px">'+item['id']+"</div></td>" +
                '<td><div style="width: 150px">'+item['value']+"</div></td>" +
                '<td><div style="width: 130px">'+item['ticker']+"</div></td>";
        },
        search_list: search_list,
        update_fn: function(val, update_selectoptions) {
            var self = this;
            var items = func_filter(
                self.options.search_list, val) ;
            var secs = $.grep(items, function( value ) {return true}).sort(
                function(p, q) {return -((p.id == val) - (q.id == val))}).slice(0, 20);
            update_selectoptions(secs);
        },
        selected: function(p, item) {
            item = item['data'];
            var id = item['id'];
            item['id'] = id;
            item['value'] = item['value'];
        }
    });

    PARAMS['restricted_list'] = $('#restricted-list').init_restricted_list(
        startLoading, endLoading)[0];
    PARAMS['restricted_list'].update('get_restricted_list');

    //ko.applyBindings(RequestInfoObj, $('#submit-form')[0]);
    ko.applyBindings(RequestInfoObj, $('#submit-form-area')[0]);
    ko.applyBindings(RequestInfoObj, $('#control-unit')[0]);
    ko.applyBindings(RequestInfoObj, $('#statusBox')[0]);
    updateInfo();
}


function ready_func(data) {
    var [startLoading, endLoading] = loadingIcon($('#content-panel')[0]);

    startLoading();
    $.ajax({
        url: "all_securities",
        method: "GET",
        dataType: 'json',
        success: function(search_list) {
            endLoading();
            $('#body-panel').css('display', 'inherit')
            main(search_list, data);
        },
        error: function (msg) {
            alert(msg);
        }
    });
}


function all_css(doc) {
    var stylesheets = [doc.styleSheets[7]];
    return [].slice.call(stylesheets)
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


function get_form_html() {
    var css = all_css(document);
    var htmlTemplate =
        '<html> \
            <head> \
              <style> \
              {0} \
              </style> \
            </head> \
          <body> \
          <b style="font-size:30px">Personal Securities Trading Request</b><br/> \
          {1} \
          </body> \
         </html>';
    return htmlTemplate.replace('{0}', css).replace('{1}', $('#submit-form.trading-submit').html());
}
