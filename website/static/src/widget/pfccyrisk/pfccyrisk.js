(function($){
    $.fn.init_pf_ccy_risk = function(
        startLoading=function(){},
        endLoading=function(){}) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(
                div,
                startLoading,
                endLoading);
        })
        self.updateWithData = function(data, args) {
            self.each(function(i, div) {
                div.updateWithData(data, args);
            })
        }
        return self;
    }
    var initialize = function(startLoading, endLoading) {
        // unique id
        var self = this;
        $(self).addClass('wfi-pf-ccy-risk');
        $(self).append(
            '<table> \
               <thead> \
                 <tr> \
                   <th></th> \
                   <th id="value">Exposure</th> \
                 </tr> \
               </thead> \
             </table>');

        var height = $(self).height();
        // var titleH = $(self).find('#title').height();
        //$(self).find('table').css('height', (height-titleH+0.5));
        //d3.select(self).select('table').style('height', (height-titleH+0.5)+'px');
        var fmt = d3.format(",.2f");

        var widget = $(self).find("table");
        var columns_config = {
            currency: {
                data: "currency",
                sortable: false,
                visible: false,
                width: "0px"},
            "": {
                data: "key",
                sortable: false,
                visible: true,
                width: "50px",
                render: function(sec) {
                    return '<div class="clickable">' + sec+ '</div>'}},
            Exposure: {
                data: "value",
                sortable: false,
                visible: true,
                width: "50px",
                render: function(data) {
                    return '<div class="number">'+fmt(data)+'</div>'}}};

        var columns_setup = [];
        $(self).find("table tr th").each(function(i, p) {
            columns_setup.push(columns_config[p.textContent]);
        })

        var tbl = $(widget).DataTable( {
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            "autoWidth": false,
            order: [[0, "asc"], [1, "asc"]],
            columns: columns_setup,
            "drawCallback": function (settings) {
                var api = this.api();
                var rows = api.rows().nodes();
                var last = null;
                api.rows().data().each(function(data, i) {
                    $('.clickable', rows[i]).click(
                        function() {click_element.call(tbl, data.children)});

                    if (last !== data.parent.key) {
                        var source ='\
                            <tr class="group clickable"> \
                                <td colspan="1"><font>{{title}}</font></td> \
                                <td><div class="number">{{number}}</div></td> \
                            </tr>'
                        var group = $(
                            Handlebars.compile(source)({
                                title: data.parent.key,
                                number: fmt(data.parent.value)
                            }));
                        group.click(function() {click_element.call(tbl, data.parent.parent.children)});

                        $(rows).eq(i).before(group);
                        last = data.parent.key;
                    }
                })
            }
        });

        self.update = updateWithLoadingIcon(startLoading, endLoading);
        self.updateWithData = function(data, cols) {
            updateWithData.call(tbl, data, cols)
        };
        return this;
    };

    var updateWithData = function(data, cols=['currency', 'security']) {
        var self = this;
        data = groupdata(data, cols);
        updateData.call(self, data);
    };

    var updateData = function(data) {
        var self = this;
        self.rows().remove().draw();
        data.forEach(function(p) {self.row.add(p)});
        self.draw();
    };

    var click_element = function(data) {
        if ((data == null) || (data.length == 0))
            return;
        updateData.call(this, data);
    }

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(server_url, pid, clickfn) {
            var self = this;
            startLoading();
            $.ajax({
                "url": "/services/get",
                "method": "GET",
                dataType: 'json',
                "data": {
                    url: server_url + "/get_parent_securities",
                    data: JSON.stringify(
                        {"pid": parseInt(pid)})},
                "success": function(data) {
                    endLoading();
                    self.updateWithData(data, clickfn);
                },
                error: function () {
                    endLoading();
                }
            })
        };
        return update;
    }

    function groupdata(data, cols) {
        var dtgrp = {key: 'Total', children: []};
        // var grpname = cols[0];
        data.forEach(function(p) {
            addmember.call(dtgrp, p, cols);
        });

        var partition = d3.layout.partition()
                .sort(function(a, b) { return d3.ascending(a.value, b.value); })

        partition.value(function(d) {return d['value']})
            .nodes(dtgrp).forEach(function(d) {
                d.sum = d.value;
            });

        //return {name: 'total', children: dtgrp};
        return dtgrp.children;
    }

    function addmember(memb, cols) {
        var grpname;
        if (cols.length == 1) {
            grpname = cols[0];
            memb['key'] = memb[grpname];
            this.children.push(memb);
        } else {
            grpname = cols[0];
            var dd = contains.call(this.children, memb[grpname])
            if (!dd) {
                dd = {key: memb[grpname], children: []};
                this.children.push(dd);
            }
            addmember.call(dd, memb, cols.slice(1));
        }
    }

    function contains(data) {
        for(var i=0; i<this.length; i++) {
            if (this[i].key == data) {
                return this[i];
            }
        }
        return null;
    }

})(jQuery);
