(function($){
    $.fn.init_wfi_expandable_table = function(options) {
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
        $(self).addClass('wfi-expandable-table');
        init_options(self);
        add_table(self);
        self.update = updateWithLoadingIcon.call(self);

        self.updateWithData = function(data) {
            data = self.options.preProcess(data);
            self.rawdata = clone(data);
            updateWithData.call(self.tbl, data, self.options)
        };

        self.open_option_setup = function() {
            var html = self.options['options']();
            var overlay = $('<div>');
            var removeDlg = function() {overlay.remove();}
            self.removeDlg = removeDlg;
            overlay.attr('id', 'OVER');
            overlay.html('<div class="wfiexpandabletable args-dlg 1tgt-px-dlg" style="width: 400px; height:auto;"></div>');

            var dlg = $('div.args-dlg', overlay);
            dlg.css("top", $(window).height()/2-210)
                .css('left', $(window).width()/2-315);
            dlg.draggable();
            dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                 <h1 style="float: left; margin-top: 0px; margin-button: 0px">Setup Parameters</h1> \
                 <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px;"> \
                   <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                     <span style="padding:0px;height:16px;width:16px;display:inline-block"> \
                       <span style="height:16px;width:16px; position:relative; \
                          display:inline-block; overflow:hidden;" class="s4-clust"> \
                          <img src="/_layouts/15/images/fgimg.png?rev=23" alt="Close dialog" \
                           style="left:-0px !important;top:-645px !important;position:absolute;" \
                           class="ms-dlgCloseBtnImg"> \
                       </span> \
                     </span> \
                   </a> \
                 </span> \
             </div> \
             <table id="content" align="center"> \
                  <tbody> </tbody> \
             </table> \
             <div class="dlgSetupButton" style="padding:10px"> \
                 <table id="submit-button" style="width:100%"> \
                     <tr> \
                        <td align="center"> \
                          <input type="button" value="Okay" data-bind="click: submit"/> \
                        </td> \
                        <td align="center"> \
                          <input type="button" value="Cancel"/> \
                        </td> \
                     </tr> \
                  </table> \
             </div>');

            $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
            $('#content tbody', dlg).append(html);
            overlay.removeDlg = removeDlg;
            // overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
            // overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
            $('body').append(overlay);
            ko.applyBindings(self.options['input_args'], overlay[0]);
        }

        return this;
    };

    function init_options(self) {
        self.options['processOption'] = self.options['processOption'] || function () {};
        self.options['preProcess'] = self.options['preProcess'] || function (data) {return data;};
        self.options['group_row'] = (self.options['group_row'] == null) ? true: self.options['group_row'];
        self.options['keyfield'] = self.options['keyfield'] || 'key';
        self.options['aggfun'] = self.options['aggfun'] || function(d) {return d};
        self.options['sort'] = self.options['sort'] || function(d) {return d};
        self.options['options'] = self.options['options'] || function() {};

        self.options['input_args'] = self.options['input_args'] || {};
        self.options['input_args']['submit'] = function() {
            self.removeDlg();
            start_loading.call(self);
            var f = self.options['input_args']['submit_func'] ||
                    function() {
                        try {
                            updateWithData.call(self.tbl, clone(self.rawdata), self.options);
                        } catch(error) {
                            console.log(error);
                        };
                        end_loading.call(self);}
            f.call(self);
            self.options.update();
        };
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
        var widget = $(self).find("table");
        var columns_setup = self.options['columns_setup'];

        self.tbl = $(widget).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            "autoWidth": false,
            order: [[0, "desc"], [1, "asc"]],
            columns: columns_setup,
            "drawCallback": function (settings) {
                redraw_table.call(this, settings, self.options.group_row, self.options['keyfield']);
            }
        });

        function add_child_table(data) {
            var html = $(' \
               <table class="child-table"> \
               </table>');
            html.DataTable({
                bPaginate: false, bFilter: false, bInfo: false,
                bDestroy: true,
                bSort: false,
                fixedHeader: true,
                "autoWidth": false,
                /*order: [[0, "asc"], [1, "asc"]], */
                columns: columns_setup,
                data: data,
                "drawCallback": function (settings) {
                    redraw_table.call(this, settings, false, self.options['keyfield']);
                }
            })
            return html;
        }

        function redraw_table(settings, groupRows=false, key='key') {
            var api = this.api();
            var rows = api.rows().nodes();
            var last = null;
            api.rows().data().each(function(data, i) {
                if (data.children) {
                    var row = self.tbl.row(rows[i]);
                    var childtbl = add_child_table(data.children);
                    // row.child(childtbl).show();

                    var childrow = $("<tr class=\"child-tbl hidden\"></tr>")
                    childrow.insertAfter($(rows[i]));
                    // // $(row[i]).after(childrow);
                    // childrow.append('<td colspan="{col}"></td>'.replace('{col}', columns_setup.length));
                    childrow.append('<td></td>');
                    $('td', childrow)
                        .attr('colspan', columns_setup.length)
                        .append(childtbl);

                    $('.clickable', rows[i]).click(
                        function() {
                            if (childrow.hasClass('shown')) {
                                childrow.addClass('hidden').removeClass('shown');
                            } else {
                                childrow.addClass('shown').removeClass('hidden');
                            }
                            (self.options['update'] || function(){})();
                        }
                    );
                }

                if ((groupRows) && (last !== data.parent[key])) {
                    var group = $('<tr class="group clickable"></tr>');
                    self.options['columns_setup'].forEach(function(p) {
                        group.append('<td>'+p.render(data.parent[p.data])+'</td>');
                    });

                    $(rows).eq(i).before(group);
                    last = data.parent[key];
                }
            });
        }
    }

    var updateWithData = function(data, options) {
        var self = this;
        options.processOption();

        data = groupdata(
            data, options['group_columns'],
            options['keyfield'], options['aggfun']);
        var res = options.sort(data);
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

    function groupdata(data, grpcols, keyfield, aggfun) {
        var self = this;
        var dtgrp = new function(){ this.children=[], this[keyfield]='Total'; return this};
        // var grpname = cols[0];
        data.forEach(function(p) {
            addmember.call(dtgrp, p, grpcols, keyfield);
        });

        var partition = d3.layout.partition()
                .sort(function(a, b) { return d3.ascending(b.quantity, a.quantity); })

        partition.value(function(d) {return 0})
            .nodes(dtgrp).forEach(function(d) {
            });

        aggfun(dtgrp)


        //return {name: 'total', children: dtgrp};
        return dtgrp.children;
    }

    function addmember(memb, grpcols, keyfield) {
        var self = this;
        var grpname;
        if (grpcols.length == 1) {
            grpname = grpcols[0];
            memb[keyfield] = memb[grpname];
            self.children.push(memb);
        } else {
            grpname = grpcols[0];
            var dd = contains.call(self.children, memb[grpname], keyfield);
            if (!dd) {
                dd = new function(){ this.children=[], this[keyfield]=memb[grpname]; return this};
                //dd[keyfield] = memb[grpname],
                self.children.push(dd);
            }
            addmember.call(dd, memb, grpcols.slice(1), keyfield);
        }
    }

    function contains(data, keyfield='key') {
        for(var i=0; i<this.length; i++) {
            if (this[i][keyfield] == data) {
                return this[i];
            }
        }
        return null;
    }

    function start_loading() {
        var self = this;
        var html = '<div class="overlay-inner" style="width: 100%; height: 100%; position: absolute; \
                         background-color: rgba(12,12,3,0.4); top: 0px;">\
                         <img src="../SiteAssets/static/image/loadingAnimation.gif" style=" \
                             top: 35%; \
                             left: 45%; \
                             position: absolute;\
                             height: 30%;"> \
                    </div>'
        d3.select(self).selectAll('div.overlay').data([1]).enter()
            .append('div').attr('class', 'overlay');
        d3.select(self).select('div.overlay').html(html);
    }

    function end_loading() {
        var self = this;
        d3.select(self).select('div.overlay').html("");
    }

    function clone(data) {
        var newdata = [];
        data.forEach(function(p) {
            newdata.push(jQuery.extend({}, p));
        })
        return newdata;
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
