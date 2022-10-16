(function($){
    $.fn.init_wfi_table = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })
        self.updateWithData = function(data, args) {
            self.each(function(i, div) {
                div.updateWithData(data, args);
            })
        }
        this.datasource = options.datasource;
        return self;
    }

    var initialize = function(options) {
        // unique id
        var self = this;
        self.options = options;
        $(self).addClass('wfi-pf-delta-expo');
        init_options(self);
        add_table(self);
        self.update = updateWithLoadingIcon.call(self);

        self.updateWithData = function(data) {
            data = self.options.preProcess(data);
            self.data = data;
            updateWithData.call(self.tbl, data, self.options)
        };
        return this;
    };

    function init_options(self) {
        self.options['preProcess'] = self.options['preProcess'] || function (data) {return data;};
    }

    function add_table(self) {
        var html = $(' \
             <table> \
               <thead> \
                 <tr> \
                 </tr> \
               </thead> \
             </table>');
        self.options['header'].forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        })

        $(self).append(html);

        var height = $(self).height();
        var fmt = d3.format(",.2f");
        var widget = $(self).find("table");
        var columns_setup = self.options['columns_setup'];

        self.tbl = $(widget).DataTable( {
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
                        function() {click_element.call(self, data.children)});

                    if (last !== data.parent.key) {
                        var group = $('<tr class="group clickable"></tr>');
                        self.options['columns_setup'].forEach(function(p) {
                            group.append('<td>'+p.render(data.parent[p.data])+'</td>');
                        });
                        group.click(function() {click_element.call(self, data.parent.parent.children)});

                        $(rows).eq(i).before(group);
                        last = data.parent.key;
                    }
                })
            }
        });
    }

    var updateWithData = function(data, options) {
        var self = this;
        data = groupdata(
            data, options['group_columns'],
            options['sum_columns']);
        var res = data;
        for (var i=0; i<options['init_level']; i++) {
            var n = res.length;
            for(var j=0; j<n; j++) {
                res.unshift.apply(res, res.pop().children);
            }
        }
        updateData.call(self, res);
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
        updateData.call(this.tbl, data);
        (this.options['update'] || function(){})();
    }

    function groupdata(data, grpcols, sumcols) {
        var dtgrp = {key: 'Total', children: []};
        sumcols.forEach(function(p) {dtgrp[p] = 0;});
        // var grpname = cols[0];
        data.forEach(function(p) {
            addmember.call(dtgrp, p, grpcols, sumcols);
        });

        var partition = d3.layout.partition()
                .sort(function(a, b) { return d3.ascending(b.quantity, a.quantity); })

        partition.value(function(d) {return 0})
            .nodes(dtgrp).forEach(function(d) {
            });

        //return {name: 'total', children: dtgrp};
        return dtgrp.children;
    }

    function addmember(memb, grpcols, sumcols) {
        var self = this;
        var grpname;
        if (grpcols.length == 1) {
            grpname = grpcols[0];
            memb['key'] = memb[grpname];
            sumcols.forEach(function(p) {self[p] += memb[p];});
            self.children.push(memb);
        } else {
            grpname = grpcols[0];
            var dd = contains.call(self.children, memb[grpname])
            if (!dd) {
                dd = {key: memb[grpname], children: []};
                sumcols.forEach(function(p) {dd[p] = 0;});
                self.children.push(dd);
            }
            sumcols.forEach(function(p) {self[p] += memb[p];});
            addmember.call(dd, memb, grpcols.slice(1), sumcols);
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

    // update elements
    var updateWithLoadingIcon = function() {
        var startLoading, endLoading = loadingIcon(this);
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
})(jQuery);
