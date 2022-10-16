(function($){
    $.fn.init_securities_list = function(options) {
        var self = this;
        this.each(function(i, div) {
            initialize(
                div, options);
        });

        this.select_sid = function(sid) {
            self.each(function(i, div) {
                div.select_sid(sid);
            })
        };
        return this;
    }

    var initialize = function(self, options) {
        // unique id
        $(self).addClass('wfi-securities-list');
        $(self).append(
            '<div id="title" class="widget-title"><div>Security List</div></div> \
                <table class="row-border" style="width: 100%"> \
                <caption></caption> \
                <thead> \
                <tr> \
                <th>group_rank</th> \
                <th>maturity</th> \
                <th>group_name</th> \
                <th>Security ID</th> \
                <th>Description</th> \
                <th>Outstanding</th> \
                </tr> \
                </thead>\
                </table>');

        var height = $(self).height();
        var titleH = $(self).find('#title').height();
        //$(self).find('table').css('height', (height-titleH+0.5));
        //d3.select(self).select('table').style('height', (height-titleH+0.5)+'px');

        var widget = $(self).find("table");
        widget.css('height', height-titleH-120);

        var columns_config = {
            "group_name": {
                "data": "group_name",
                "sortable": false,
                "visible": false,
                "width": "0px"},
            "maturity": {
                "data": "maturity",
                "sortable": false,
                "visible": false,
                "width": "0px"},
            "group_rank": {
                "data": "group_rank",
                "sortable": false,
                "visible": false,
                "width": "0px"},
            "Security ID": {
                "data": "security_id",
                "visible": true,
                "render": function(data) {
                    return '<font class="sid">' + data + "</font>"},
                "width": "60px"},
            "Description": {
                "data": "description",
                "visible": true,
                "width": "100px"},
            "Outstanding": {
                "data": "recent_outstanding",
                "visible": true,
                "render": function(data, type, row) {
                    if (row.product_code == 3) {
                        return '<font class="val">' + d3.format(',.0f')(data) + "MM</font>"
                    } else {
                        return '<font class="val">' + d3.format(',.0f')(data/1000000) + "MM</font>"
                    }
                },
                "width": "100px"}
        };

        var columns_setup = [];
        $(self).find("table tr th").each(function(i, p) {
            columns_setup.push(columns_config[p.textContent]);
        })

        // get columns config
        var tbl = $(widget).DataTable( {
            fixedHeader: {header:false, footer: false},
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            // scrollY: height-titleH-120+"px",
            scrollCollapse: true,
            order: [[0, "asc"], [2, "asc"], [1, "asc"]],
            columns: columns_setup,
            "drawCallback": function (settings) {
                var api = this.api();
                var rows = api.rows().nodes();
                var last = null;
                var selected_group = [];
                var total_rows = 0;
                api.rows().data().each(function(group, i) {
                    total_rows++;
                    $(rows).eq(i)
                        .addClass('security-row')
                        .addClass(group['parents'].map(x=>'company-'+x).join(' '))
                        .addClass('sid-'+group.security_id)
                        .on('click', function(evt) {
                            if (!evt.ctrlKey) {
                                tbl.$('tr.selected').removeClass('selected first');
                                selected_group = [];
                            }

                            if ( $(this).hasClass('selected') ) {
                                $(this).removeClass('selected');
                                selected_group = selected_group.filter(function(value, index, arr){
                                    return value != group;
                                });
                            } else {
                                $(this).addClass('selected');
                                selected_group.push(group)
                            }

                            options.clickfn.call(self, selected_group);
                        });
                    if (last !== group['group_name']) {
                        $(rows).eq(i).before(
                            '<tr class="group"><td colspan="3"><font>' +
                                group['group_name'] + '</font></td></tr>'
                        );
                        last = group['group_name'];
                        total_rows++;
                    }
                });

                this.css("height", 40*total_rows + 40 + "px")
                // end of drawback function
            }
        });

        self.select_sid = function(sid) {
            $('.sid-'+sid, self).trigger('click');
        };

        var data = options.data;
        tbl.rows().remove().draw();
        data.forEach(function(p) {tbl.row.add(p)});
        tbl.draw();

        return this;
    };

    var getData = function() {
        var self = this;
        var ret = []
        self.rows().data().each(function(p) {
            ret.push(p);
        });
        return ret;
    }

    var updateWithData = function(data) {
        var widget = this;
        //widget.rows().each(function(p) {widget.row(0).remove();});
        widget.rows().remove().draw();
        data.forEach(function(p) {widget.row.add(p)});
        widget.draw();
    };

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(server_url) {
            var self = this;
            startLoading();
            $.ajax({
                "url": server_url,
                "method": "GET",
                dataType: 'json',
                "data": {},
                "success": function(data) {
                    endLoading();
                    self.updateWithData(data);
                },
                error: function (err) {
                    endLoading();
                    window.alert("restrictedlist:"+JSON.stringify(err))
                }
            })
        };
        return update;
    }
})(jQuery);
