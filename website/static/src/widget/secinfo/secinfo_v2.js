(function($){
    $.fn.init_sec_info = function(
        startLoading=function(){},
        endLoading=function(){}) {
        this.each(function(i, div) {
            initialize(
                div,
                startLoading,
                endLoading);
        })
        return this;
    }
    var initialize = function(
        self, startLoading, endLoading) {
        // unique id
        $(self).addClass('wfi-sec-info');
        $(self).append(
            '<div style="float: left; display: inline-block; margin-left: 20px;">' +
                '<table id="1" class="row-border" style="width:240px">' +
                "<thead>" +
                "<tr>" +
                "<th>group</th>" +
                "<th>field</th>" +
                "<th>value</th>" +
                "</tr>" +
                "</thead>" +
                "</table>" +
                "</div>" +
                '<div style="float: left; dispaly: inline-block; margin-left: 20px;">' +
                '<table style="width:240px" id="2" class="row-border">' +
                "<thead>" +
                "<tr>" +
                "<th>group</th>" +
                "<th>field</th>" +
                "<th>value</th>" +
                "</tr>" +
                "</thead>" +
                "</table>"+
                "</div>");
        var widget = $('table', self);

        var columns_config = {
            "group": {
                "data": "group",
                "visible": false,
                "width": "0px"},
            "field": {
                "data": "field",
                "visible": true,
                "width": "30%"},
            "value": {
                "data": "value",
                "visible": true,
                "render": function(data) {
                    return '<div class="value">' + data + "</div>"},
                "width": "70%"}};

        var columns_setup = [];
        $(self).find("table#1 tr th").each(function(i, p) {
            columns_setup.push(columns_config[p.textContent]);
        })

        var tables = $(widget).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            bAutoWidth: false,
            columns: columns_setup,
            "drawCallback": function (settings) {
                var api = this.api();
                var rows = api.rows().nodes();
                var last = null;
                api.rows().data().each(function(group, i) {
                    if (last !== group['group']) {
                        $(rows).eq(i).before(
                            '<tr class="group"><td colspan="2"><font>' +
                                group['group'] + '</font></td></tr>'
                        );
                        last = group['group'];}
                })
            }
        });

        self.update = updateWithLoadingIcon(startLoading, endLoading);
        self.updateWithData = function(data) {updateWithData.call(tables, data)};

        return this;
    };

    var updateWithData = function(data) {
        var tbl1 = this.tables('#1');
        var tbl2 = this.tables('#2');

        tbl1.rows().remove().draw();
        data['data1'].forEach(function(p) {tbl1.row.add(p)});
        tbl1.draw();

        //tbl2.rows().each(function(p) {tbl2.row(0).remove();});
        tbl2.rows().remove().draw();
        data['data2'].forEach(function(p) {tbl2.row.add(p)});
        tbl2.draw();
    };

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(server_url, sid) {
            var widget = this;
            startLoading();
            $.ajax({
                "url": "/services/get",
                "method": "GET",
                dataType: 'json',
                "data": {
                    url: server_url + "/get_security_info_v2",
                    data: JSON.stringify(
                        {"sid": sid})},
                "success": function(data) {
                    //data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                    endLoading();
                    widget.updateWithData(data);
                },
                error: function (msg) {
                    endLoading();
                    window.alert(msg);
                }
            })
        };
        return update;
    }
})(jQuery);
