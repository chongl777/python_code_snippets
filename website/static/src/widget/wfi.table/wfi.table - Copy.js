(function($){
    $.fn.init_wfi_table = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })
        self.updateWithData = function(data, args) {
            self.each(function(i, div) {
                div.updateWithData(data, args);
            });
        }

        self.refresh = function() {
            self.each(function(i, div) {
                div.update();
            });
        }

        this.datasource = options.datasource;
        return self;
    }

    var initialize = function(options) {
        // unique id
        var self = this;
        self.options = options;
        $(self).addClass('wfi-data-table');
        init_options(self);
        add_table(self);
        self.update = function() {
            try {
                updateWithData.call(self.tbl, clone(self.rawdata), self.options);
            } catch(error) {
                console.log(error);
            };
        };

        self.call_function_n1 = options.call_function_n1 || function() {};

        self.updateWithData = function(data) {
            self.rawdata = clone(data);
            updateWithData.call(self.tbl, data, self.options)
        };

        self.open_option_setup = function() {
            var html = self.options['options']();
            var overlay = $('<div>');
            var removeDlg = function() {overlay.remove();}
            self.removeDlg = removeDlg;
            overlay.attr('id', 'OVER');
            overlay.html('<div class="wfidatatable args-dlg 1tgt-px-dlg" style="display:inline-block; width: auto; height:auto;"></div>');

            var dlg = $('div.args-dlg', overlay);
            dlg.css("top", $(window).height()/2-210)
                .css('left', $(window).width()/2-315);
            dlg.html(
            '<div class="dlgTitle" style="cursor: move; \
                 position:relative; clear:both; padding: 0px"> \
                 <div id="title"> \
                     <h1 style="float: left; ">Setup Parameters</h1> \
                     <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px;"> \
                       <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                         <span style="padding:0px;height:16px;width:16px;display:inline-block"> \
                           <span style="height:16px;width:16px; position:relative; \
                              display:inline-block; overflow:hidden;" class="s4-clust"> \
                              <img src="./static/src/images/fgimg.png?rev=23" alt="Close dialog" \
                               style="left:-0px !important;top:-645px !important;position:absolute;" \
                               class="ms-dlgCloseBtnImg"> \
                           </span> \
                         </span> \
                       </a> \
                     </span> \
                 </div> \
             </div> \
             <table id="content" align="center" style="margin-left: 20px; margin-right: 20px;"> \
                  <tbody> </tbody> \
             </table> \
             <div class="dlgSetupButton" style="padding:10px;"> \
                 <table id="submit-button" style="width:100%"> \
                     <tr> \
                        <td align="center"> \
                          <input type="button" value="Okay" data-bind="click: submit, enable: enable"/> \
                        </td> \
                        <td align="center"> \
                          <input type="button" value="Cancel" data-bind="enable: enable"/> \
                        </td> \
                     </tr> \
                  </table> \
             </div>');

            dlg.draggable({handle: 'div.dlgTitle'});

            $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
            $('#content tbody', dlg).append(html);
            overlay.removeDlg = removeDlg;
            // overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
            // overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
            $('body').append(overlay);

            function start_loading() {
                self.options.input_args.enable(false);
                document.body.style.cursor = "wait"
            }

            function end_loading() {
                self.options.input_args.enable(true);
                document.body.style.cursor = "default"
            }

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
            self.options.input_args.enable = ko.observable(true);

            ko.applyBindings(self.options['input_args'], overlay[0]);
            $(".boost-multiselect", dlg).multiselect({
                includeSelectAllOption: true
            });
        }

        self.open_download_setup = function() {
            var overlay = $('<div>');
            var removeDlg = function() {overlay.remove();}
            self.removeDlg = removeDlg;
            overlay.attr('id', 'OVER');
            overlay.html('<div class="wfidatatable args-dlg 1tgt-px-dlg" style="width: 400px; height:auto;"></div>');

            var dlg = $('div.args-dlg', overlay);
            dlg.css("top", $(window).height()/2-210)
                .css('left', $(window).width()/2-315);
            dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 0px"> \
                 <div id="title"> \
                     <h1 style="float: left;">Downlaod Data</h1> \
                 </div> \
             </div> \
             <table id="content" align="center"> \
                  <tbody> \
                     <tr><td> \
                     <table style="width:300px"> \
                         <colgroup><col width="20%"><col width="80%"> \
                         </colgroup> \
                         <tbody> \
                             <tr> \
                                <td colspan="1">FileName</td> \
                                <td colspan="1" class="value"> \
                                    <div style="display:flex"> \
                                        <input style="width:90%" data-bind="value:file_name" style="text-align:right;"> \
                                        <div><p style="display:block; margin: 2px 0px 2px 0px">.csv</p></div>\
                                    </div> \
                                </td> \
                             </tr> \
                         </tbody> \
                     </table> \
                     </tr></td>\
                  </tbody> \
             </table> \
             <div class="dlgSetupButton" style="padding:10px"> \
                 <table id="submit-button" style="width:100%"> \
                     <tr> \
                        <td align="center"> \
                          <input type="button" value="download" data-bind="click: submit, enable: enable"/> \
                        </td> \
                        <td align="center"> \
                          <input type="button" value="Cancel" data-bind="enable: enable"/> \
                        </td> \
                     </tr> \
                  </table> \
             </div>');

            dlg.draggable({handle: 'div.dlgTitle'});
            $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
            overlay.removeDlg = removeDlg;

            function start_loading() {
                args.enable(false);
                document.body.style.cursor = "wait"
            }

            function end_loading() {
                args.enable(true);
                document.body.style.cursor = "default"
            }

            $('body').append(overlay);
            var args = {
                file_name: self.options['filename'] || 'downlaod',
                enable: ko.observable(true),
                submit: function() {
                    start_loading();
                    self.options['download'](args.file_name+".csv", self.rawdata, function() {
                        end_loading();
                        removeDlg();})}};
            ko.applyBindings(args, overlay[0]);
        }

        return this;
    };

    function init_options(self) {
        self.options['processOption'] = self.options['processOption'] || function () {};
        self.options['preProcess'] = self.options['preProcess'] || function (data) {return data;};
        self.options['group_row'] = (self.options['group_row'] == null) ? true: self.options['group_row'];
        self.options['groupdata'] = (self.options['groupdata'] == null) ? true: self.options['groupdata'];
        self.options['keyfield'] = self.options['keyfield'] || 'key';
        self.options['aggfun'] = self.options['aggfun'] || function(d) {return d};
        self.options['sort'] = self.options['sort'] || function(d) {return d};
        self.options['options'] = self.options['options'] || function() {};
        self.options['scrollCollapse'] = self.options['scrollCollapse'] || true;
        self.options['scrollY'] = self.options['scrollY'] || '';
        self.options['init_expansion_level'] = self.options['init_expansion_level'] || 0;
        self.options['start_expansion_level'] = self.options['start_expansion_level'] || 0;
        self.options['total_expansion_level'] = self.options['total_expansion_level'] || Number.MAX_VALUE;
        self.options['group_columns'] = self.options['group_columns'] || [];

        self.options['update'] = self.options['update'] || function(){};
        self.options['process_row'] = self.options['process_row'] || function(){};
        self.options['sort_by'] = self.options['sort_by'] || [];
        self.options['process_child_data'] = self.options['process_child_data'] || function() {};

        self.options['bPaginate'] = self.options['bPaginate'] || false;
        self.options['iDisplayLength'] = self.options['iDisplayLength'] || 50;
        self.options['aLengthMenu'] = self.options['aLengthMenu'] || [[25, 50, 75, 100, -1], [25, 50, 75, 100, "All"]];

        self.options['groupdataProcess'] = self.options['groupdataProcess'] || function(x) {};

        self.options['postProcess'] = self.options['postProcess'] || function(x) {};
        self.options['flatten'] = self.options['flatten'] || false;

        self.options['input_args'] = self.options['input_args'] || {};
        self.options['download'] = self.options['download'] || function() {};
    }

    function add_table(self) {
        var html = $(' \
             <table> \
             </table>');
        // self.header = html;
        $(self).append(html);

        var height = $(self).height();
        var widget = $(self).find("table");
        var columns_setup = self.options['columns_setup'];

        self.tbl = $(widget).DataTable({
            // bPaginate: false,
            bPaginate: self.options['bPaginate'],
            iDisplayLength: self.options['iDisplayLength'],
            aLengthMenu: self.options['aLengthMenu'],
            bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: {
                header: false,
                footer: false
            },
            scrollCollapse: self.options['scrollCollapse'],
            scrollY: self.options['scrollY'],
            autoWidth: false,
            //order: [[0, "desc"], [1, "asc"]],
            columns: columns_setup,
            "drawCallback": function (settings) {
                $(this).removeClass(function(i, c) {
                    return (c.match(/(^|\s)rlevel-\S+/g) || []).join(' ');
                });

                $(this).addClass('depth-0 rlevel-'+(
                    Math.min(self.options.total_expansion_level,
                             self.options.group_columns.length-1) + 1));
                redraw_table.call(this, settings, self);
            }
        });

        function create_child_table(data, depth) {
            self.options.process_child_data.call(self, data, depth);
            var html = $(' \
               <table class="child-table ' + self.options.group_columns[depth]
                         + ' depth-' + depth.toString()
                         + ' rlevel-'
                         + (Math.min(self.options.total_expansion_level,
                                     self.options.group_columns.length-1) - depth + 1).toString() + ' "> \
               </table>', self);
            var tbl = html.DataTable({
                bPaginate: false,
                // bPaginate: true,
                bFilter: false, bInfo: false,
                bDestroy: true,
                bSort: false,
                fixedHeader: true,
                "autoWidth": false,
                /*order: [[0, "asc"], [1, "asc"]], */
                columns: columns_setup,
                data: data,
                "drawCallback": function (settings) {
                    redraw_table.call(this, settings, self);
                }
            })

            columns_setup.forEach(function(p, i) {
                tbl.columns(i).visible(p.visible);
                $(tbl.columns(i).header()).html('');
            });
            // $('thead tr th', tbl.table().container()).html('');
            return html;
        }

        function redraw_table(settings, obj) {
            var api = this.api();

            var key = obj.options['keyfield'];
            var init_expand = obj.options['init_expansion_level'];
            var total_expand = obj.options['total_expansion_level'];

            var rows = api.rows().nodes();
            var last = null;
            api.rows().data().each(function(data, i) {
                if (data.children && data.depth < total_expand) {
                    //var row = self.tbl.row(rows[i]);
                    var childtbl = create_child_table(data.children, data.depth);
                    // row.child(childtbl).show();

                    var childrow = data.depth < init_expand ? $("<tr class=\"child-tbl shown\"></tr>") : $("<tr class=\"child-tbl hidden\"></tr>");
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
                            self.options.update();
                        }
                    );
                }
                if (!rows[i].Processed) {
                    self.options.process_row.call(self, rows[i], data);
                    rows[i].Processed = true;
                }
            });
            obj.options.postProcess(self);
        }
    }

    var updateWithData = function(data, options) {
        var self = this;
        options.processOption(data);

        data = options.preProcess(data, options);

        if (options.groupdata) {
            data = groupdata(
                data, options['group_columns'],
                options['keyfield'], options['aggfun']);
        } else {
            data = apply_attr(data);
        }

        var res = options.sort(data);
        for (var i=0; i<options.start_expansion_level; i++) {
            var n = res.length;
            for(var j=0; j<n; j++) {
                res.unshift.apply(res, res.pop().children);
            }
        }

        if (options.flatten) {
            flatten(data, 'children', options.total_expansion_level);
        }

        options.groupdataProcess(res);
        updateData.call(self, res, options);
    };

    function apply_attr(data, depth=0) {
        data.forEach(function(p) {
            p.depth = depth;
            if ('children' in p) {
                apply_attr(p.children, depth+1);
            }
        });
        return data;
    }

    var updateData = function(data, options) {
        var self = this;

        self.rows().remove().draw();
        data.forEach(function(p) {self.row.add(p)});
        options.columns_setup.forEach(function(p, i) {
            self.columns(i).visible(p.visible);
            $(self.columns(i).header()).html(p.title);
        });
        self.draw();
        if (options['scrollY'] != '') {
            $('div.dataTables_scrollHeadInner', self.table().container()).css('width', '100%');
            $('div.dataTables_scrollHeadInner>table', self.table().container()).css('width', '100%');
        }
    };

    var click_element = function(data) {
        if ((data == null) || (data.length == 0))
            return;
        updateData.call(this.tbl, data);
        (this.options['update'] || function(){})();
    }

    function groupdata(data, grpcols, keyfield, aggfun) {
        var self = this;
        var dtgrp = new function(){
            this.children=[], this[keyfield]='Total';
            this.depth=0;
            return this};
        // var grpname = cols[0];
        data.forEach(function(p) {
            addmember.call(dtgrp, p, grpcols, keyfield);
        });

        aggfun(dtgrp)
        return dtgrp.children;
    }

    function addmember(memb, grpcols, keyfield, depth=1) {
        var self = this;
        var grpname;
        if (grpcols.length == 1) {
            grpname = grpcols[0];
            memb[keyfield] = memb[grpname];
            memb['depth'] = depth;
            self.children.push(memb);
        } else {
            grpname = grpcols[0];
            var dd = contains.call(self.children, memb[grpname], keyfield);
            if (!dd) {
                dd = new function(){
                    this.children=[], this[keyfield]=memb[grpname];
                    this.depth=depth;
                    return this};
                //dd[keyfield] = memb[grpname],
                self.children.push(dd);
            }
            addmember.call(dd, memb, grpcols.slice(1), keyfield, depth+1);
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

    function flatten(data, keyword, lvl=null) {
        if (data == null || data.length == 0) return;
        var dummy = data.slice();
        dummy.forEach(function (x, i) {
            if (x.depth == 1)
                var aa = 1;
            if (x[keyword] != null) {
                if (lvl==null || x.depth <= lvl) {
                    flatten(x[keyword], keyword, lvl);
                    data.splice.apply(data, [data.indexOf(x)+1, 0].concat(x[keyword]));
                }
                delete x[keyword];
            }
        });
    }

})(jQuery);
