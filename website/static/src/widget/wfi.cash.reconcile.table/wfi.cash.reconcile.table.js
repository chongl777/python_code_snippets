(function($){
    $.fn.init_wfi_cash_reconcile_table = function(options) {
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

    var svg = '<svg> \
                 <g transform="translate(2,2)scale(0.02)"> \
                    <polygon style="stroke-width:100; stroke:black;" points="11.387,490 245,255.832 478.613,490 489.439,479.174 255.809,244.996 489.439,10.811 478.613,0 245,234.161   11.387,0 0.561,10.811 234.191,244.996 0.561,479.174 "/> \
                 </g> \
               </svg>';

    var initialize = function(options) {
        // unique id
        var self = this;
        self.options = options;
        self.need_update = false;

        $(self).addClass('wfi-cash-reconcile-table');
        init_options(self);
        add_table(self);
        // self.update = updateWithLoadingIcon.call(self);

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
            overlay.html('<div class="wfi-cash-reconcile-table args-dlg 1tgt-px-dlg" style="width: 400px; height:auto;"></div>');

            var dlg = $('div.args-dlg', overlay);
            dlg.css("top", $(window).height()/2-210)
                .css('left', $(window).width()/2-315);
            dlg.draggable();
            dlg.html(
                '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                 <h1 style="float: left; margin-top: 0px; margin-button: 0px">Setup Parameters</h1> \
                   <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px; width:16px; height:16px"> \
                   <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C" style="display:inline-block"> \
                          ' + svg + '\
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
        // self.options['preProcess'] = self.options['preProcess'] || function (data) {return data;};
        self.options['group_row'] = (self.options['group_row'] == null) ? true: self.options['group_row'];
        self.options['keyfield'] = self.options['keyfield'] || 'key';
        self.options['aggfun'] = self.options['aggfun'] || function(d) {return d};
        self.options['sort'] = self.options['sort'] || function(d) {return d};
        self.options['options'] = self.options['options'] || function() {};
        self.options['acct'] = self.options['acct'] || 'Default';

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
        };
    }

    function add_table(self) {
        var html = $(' \
             <table class="depth-0"> \
               <thead> \
                 <tr> \
                 </tr> \
               </thead> \
             </table>');
        var header = ['Currency', 'Net_Amount_Custodian', 'Net_Amount_WFI', 'Diff'];
        header.forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        });

        $(self).append(html);

        var height = $(self).height();
        var widget = $(self).find("table");
        var columns_setup = [
            {data: "group",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value, type, row) {
                 return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>'}},
            {data: "net_amount_gs",
             sortable: false,
             visible: true,
             width: '30%',
             render: function(value) {
                 try {
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                 } catch(err) {
                     return '<div class="value">-</div>';
                 }
             }},
            {data: "net_amount_wfi",
             sortable: false,
             visible: true,
             width: '30%',
             render: function(value) {
                 try {
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'
                 } catch(err) {
                     return '<div class="value">-</div>';}
             }},
            {data: "diff",
             sortable: false,
             visible: true,
             width: '30%',
             render: function(value) {
                 try {
                 if (value == "" | value == null) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                 } catch(err) {
                     return '<div class="value">-</div>';}
             }}
        ];

        self.tbl = $(widget).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            "autoWidth": false,
            order: [[0, "desc"], [1, "asc"]],
            columns: columns_setup,
            "drawCallback": function (settings) {
                redraw_table.call(this, settings, self);
            }
        });

        function add_child_table_open_end(data, depth) {
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
               </table>');
            data = data[0].by_account || [];

            var columns_setup = [
                {data: "accountnumber",
                 sortable: false,
                 visible: true,
                 width: '5%',
                 render: function(value, type, row) {
                     return '<div style="margin-left:' + (depth)*4 + 'px">Account:' + value + '</div>'}},
                {data: "net_amount",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     return '<div class="value">-</div>';
                 }},
                {sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     return '<div class="value">-</div>';
                 }}];

            html.DataTable({
                bPaginate: false, bFilter: false, bInfo: false,
                bDestroy: true,
                bSort: false,
                fixedHeader: true,
                autoWidth: false,
                /*order: [[0, "asc"], [1, "asc"]], */
                columns: columns_setup,
                data: data
            });
            return html;
        }

        function add_child_table(data, depth) {
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
               </table>');

            html.DataTable({
                bPaginate: false, bFilter: false, bInfo: false,
                bDestroy: true,
                bSort: false,
                fixedHeader: true,
                autoWidth: false,
                /*order: [[0, "asc"], [1, "asc"]], */
                columns: columns_setup,
                data: data,
                drawCallback: function (settings) {
                    redraw_table.call(this, settings, self);
                }
            });
            return html;
        }

        function add_child_table_trades(data, depth) {
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
            var header = [
                'Trade Date', 'SecurityID', 'Description', 'SecType',
                'Quantity(Custodian)', 'Quantity(WFI)', 'Quantity Diff',
                'Net Amount(Custodian)', 'Net Amount(WFI)', 'Net Amount Diff', ''];
            header.forEach(function(p, i) {
                var tr = $("<th>" + p + "</th>");
                $("tr", html).append(tr);
            });

            var columns_setup = [
                // {data: "reference_num",
                //  sortable: false,
                //  visible: true,
                //  width: '5%',
                //  render: function(value, type, row) {
                //      return '<div style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>'}},
                {data: "trade_dt",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "security_id",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},

                {sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         return '<div class="value">' + row['security']['description'] + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},

                {sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         return '<div class="value">' + row['security']['secTypName'] + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},

                {data: "quantity_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "quantity_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value"></div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},

                {sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     var diff = (row['quantity_wfi'] || 0) - (row['quantity_gs'] || 0);
                     if (diff == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(diff) + '</div>'}},

                {data: "net_amount_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "net_amount_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value"></div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                {data: "diff",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                {sortable: false,
                 visible: true,
                 width: '5%',
                 render: function(value, type, row) {
                     return '<div  class="clickable details value">details</div>'}}
            ];

            html.DataTable({
                bPaginate: false, bFilter: false, bInfo: false,
                bDestroy: true,
                bSort: false,
                fixedHeader: true,
                "autoWidth": false,
                /*order: [[0, "asc"], [1, "asc"]], */
                columns: columns_setup,
                data: data,
                drawCallback: function (settings) {
                    var api = this.api();
                    var rows = api.rows().nodes();
                    var last = null;
                    api.rows().data().each(function(data, i) {
                        if (!rows[i].Processed) {
                            self.options.process_row.call(self, rows[i], data);
                            rows[i].Processed = true;
                        }

                        $('.clickable.details', rows[i]).click(
                            function() {
                                var data_wfi = data['original_records_wfi'];
                                var tbl_gs = create_table_gs_trades(data['original_records_gs']);
                                var tbl_wfi = create_table_wfi_trades(data['original_records_wfi']);
                                show_detailed_records.call(self, tbl_gs, tbl_wfi);
                            });
                    });
                }
            });
            return html;
        }

        function add_child_table_coupon(data, depth) {
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
            var header = [
                'Trade Date', 'SecurityID', 'Description', 'SecType',
                'Net Amount(Custodian)', 'Net Amount(WFI)', 'Net Amount Diff', ''];
            header.forEach(function(p, i) {
                var tr = $("<th>" + p + "</th>");
                $("tr", html).append(tr);
            });

            var columns_setup = [
                {data: "trade_dt",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "security_id",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},

                {data: "description",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         return '<div class="value">' + row['security']['description'] + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},

                {sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         return '<div class="value">' + row['security']['secTypName'] + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},

                {data: "net_amount_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "net_amount_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value"></div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                {data: "diff",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
                {sortable: false,
                 visible: true,
                 width: '5%',
                 render: function(value, type, row) {
                     return '<div  class="clickable details value">details</div>'}}
            ];

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
                var api = this.api();
                var rows = api.rows().nodes();
                var last = null;
                api.rows().data().each(function(data, i) {
                  $('.clickable.details', rows[i]).click(
                    function() {
                      var data_wfi = data['original_records_wfi'];
                      var tbl_gs = create_table_gs_trades(data['original_records_gs']);
                      var tbl_wfi = create_table_wfi_coupon(data['original_records_wfi']);
                      show_detailed_records.call(self, tbl_gs, tbl_wfi);
                    });
                  if (!rows[i].Processed) {
                      self.options.process_row.call(self, rows[i], data);
                      rows[i].Processed = true;
                  }
                });
              }
            });
            return html;
        }

        function add_child_table_other_cash(data, depth, create_table_gs, create_table_wfi) {
            var self = this;
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
            var header = [
                'Settl Date', 'SecurityID', 'Net Amount(Custodian)', 'Net Amount(WFI)', 'Net Amount Diff', ''];
            header.forEach(function(p, i) {
                var tr = $("<th>" + p + "</th>");
                $("tr", html).append(tr);
            });

            var columns_setup = [
                {data: "trade_dt",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "security_id",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "net_amount_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "net_amount_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "diff",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {sortable: false,
                 visible: true,
                 width: '5%',
                 render: function(value, type, row) {
                     return '<div  class="clickable details value">details</div>'}}
            ];

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
                    var api = this.api();
                    var rows = api.rows().nodes();
                    var last = null;
                    api.rows().data().each(function(data, i) {
                        if (!rows[i].Processed) {
                            self.options.process_row.call(self, rows[i], data);
                            rows[i].Processed = true;
                        }

                        $('.clickable.details', rows[i]).click(
                            function() {
                                function update_main_table() {
                                    self.need_update = true;
                                };

                                var callback = new (function() {
                                    var self = this;
                                    this.call_stack = [update_main_table];
                                    this.callback = function(data) {
                                        self.call_stack.forEach(function(x) {
                                            x(data);
                                        })
                                    };
                                    return this;
                                })();

                                var data_wfi = data['original_records_wfi'];
                                var tbl_gs = create_table_gs.call(self, data['original_records_gs'], callback);
                                var tbl_wfi = create_table_wfi.call(self, data['original_records_wfi'], callback);

                                show_detailed_records.call(self, tbl_gs, tbl_wfi);
                            });
                    });
                }
            });
            return html;
        }

        function add_child_table_fut(data, depth, create_table_gs, create_table_wfi) {
            var self = this;
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
            var header = [
                'Settl Date', 'SecurityID',
                'Quantity(Custodain)', 'Quantity(WFI)',
                'Price(Custodain)', 'Price(WFI)',
                'Net Amount(Custodian)', 'Net Amount(WFI)', 'Net Amount Diff', ''];
            header.forEach(function(p, i) {
                var tr = $("<th>" + p + "</th>");
                $("tr", html).append(tr);
            });

            var columns_setup = [
                {data: "trade_dt",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "security_id",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value, type, row) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                {data: "trade_quantity_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "trade_quantity_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "trade_price_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "trade_price_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "net_amount_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "net_amount_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "diff",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {sortable: false,
                 visible: true,
                 width: '5%',
                 render: function(value, type, row) {
                     return '<div  class="clickable details value">details</div>'}}
            ];

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
                    var api = this.api();
                    var rows = api.rows().nodes();
                    var last = null;
                    api.rows().data().each(function(data, i) {
                        if (!rows[i].Processed) {
                            self.options.process_row.call(self, rows[i], data);
                            rows[i].Processed = true;
                        }

                        $('.clickable.details', rows[i]).click(
                            function() {
                                function update_main_table() {
                                    self.need_update = true;
                                };

                                var callback = new (function() {
                                    var self = this;
                                    this.call_stack = [update_main_table];
                                    this.callback = function(data) {
                                        self.call_stack.forEach(function(x) {
                                            x(data);
                                        })
                                    };
                                    return this;
                                })();

                                var data_wfi = data['original_records_wfi'];
                                var tbl_gs = create_table_gs.call(self, data['original_records_gs'], callback);
                                var tbl_wfi = create_table_wfi.call(self, data['original_records_wfi'], callback);

                                show_detailed_records.call(self, tbl_gs, tbl_wfi);
                            });
                    });
                }
            });
            return html;
        }

        function add_child_table_unclassified(data, depth) {
            var self = this;
            var html = $(' \
               <table class="child-table depth-' + depth + ' "> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
            var header = [
                'Trade Date', 'Category', 'Net Amount(Custodian)', 'Net Amount(WFI)', 'Net Amount Diff', ''];
            header.forEach(function(p, i) {
                var tr = $("<th>" + p + "</th>");
                $("tr", html).append(tr);
            });

            var columns_setup = [
                {data: "trade_dt",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value"></div>';
                         return '<div class="value">' + d3.timeFormat("%Y-%m-%d")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value"></div>'
                     }
                 }},
                 {data: "category",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>';
                 }},
                {data: "net_amount_gs",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "net_amount_wfi",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {data: "diff",
                 sortable: false,
                 visible: true,
                 width: '10%',
                 render: function(value) {
                     try {
                         if (value == "" | value == null) return '<div class="value">-</div>';
                         return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                     } catch(err) {
                         return '<div class="value">-</div>';
                     }
                 }},
                {sortable: false,
                 visible: true,
                 width: '5%',
                 render: function(value, type, row) {
                     return '<div  class="clickable details value">details</div>'}}
            ];

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
                    var api = this.api();
                    var rows = api.rows().nodes();
                    var last = null;
                    api.rows().data().each(function(data, i) {
                        $('.clickable.details', rows[i]).click(
                            function() {
                                function update_main_table() {
                                    self.need_update = true;
                                };

                                var callback = new (function() {
                                    var self = this;
                                    this.call_stack = [update_main_table];
                                    this.callback = function(data) {
                                        self.call_stack.forEach(function(x) {
                                            x(data);
                                        })
                                    };
                                    return this;
                                })();

                                var data_wfi = data['original_records_wfi'];
                                var tbl_gs = create_table_gs_trades.call(self, data['original_records_gs'], callback);
                                var tbl_wfi = create_table_wfi_other_cash.call(self, data['original_records_wfi'], callback);

                                show_detailed_records.call(self, tbl_gs, tbl_wfi);
                            });
                    });
                }
            });
            return html;
        }

        // general table
        function redraw_table(settings, obj) {
            var key=obj.options.keyfield;
            var init_expand= obj.options.init_expand;

            var api = this.api();
            var rows = api.rows().nodes();
            var last = null;

            api.rows().data().each(function(data, i) {
                if (data.children) {
                    var childtbl;
                    //var row = self.tbl.row(rows[i]);
                    if (data.depth == 1) {
                        childtbl = add_child_table.call(obj, data.children, data.depth);
                    } else if (["Open Cash", "End Cash"].indexOf(data["group"]) != -1) {
                        childtbl = add_child_table_open_end.call(obj, data.children, data.depth);
                    } else if (["Trades", "CFD Trades", "OTC Derivative Trades"].indexOf(data["group"]) != -1) {
                        childtbl = add_child_table_trades.call(obj, data.children, data.depth);
                    } else if (data["group"] == "Coupon/Dividend") {
                        childtbl = add_child_table_coupon.call(obj, data.children, data.depth);
                    } else if (data["group"] == "Futures Trade") {
                        childtbl = add_child_table_fut.call(
                            obj, data.children, data.depth
                            ,create_table_gs_trades , create_table_wfi_trades);
                    } else if (data["group"] == "Other Cash") {
                        childtbl = add_child_table_other_cash.call(
                            obj, data.children, data.depth,
                            create_table_gs_other_cash, create_table_wfi_other_cash);
                    } else if (data["group"] == "Unclassified") {
                        childtbl = add_child_table_unclassified.call(obj, data.children, data.depth);
                    } else {
                        childtbl = add_child_table.call(obj, data.children, data.depth);
                    }

                    var childrow = data.depth < init_expand ? $("<tr class=\"child-tbl shown\"></tr>") : $("<tr class=\"child-tbl hidden\"></tr>");
                    childrow.insertAfter($(rows[i]));

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
                            (self.options['updateSize'] || function(){})();
                        }
                    );
                }
            });
        }
    }

    function preProcess(data) {
        var dataClone = []
        data.forEach(function(p) {
            try {
                p['trade_dt'] = d3.timeParse('%Y-%m-%dT%H:%M:%S')(p['trade_dt']);
            } catch(err) {
            };
            dataClone.push(p);});

        dataClone.sort(function(x, y) {
            if (x.ccy == y.ccy) {
                if (x.rank == y.rank) {
                    if ('security' in x) {
                        if (x.security.secTypName != y.security.secTypName)
                            return x.security.secTypName.localeCompare(y.security.secTypName);
                    }
                    return x.trade_dt - y.trade_dt;
                }
                return x.rank - y.rank;
            }
            return x.ccy.localeCompare(y.ccy);
        });
        return dataClone;
    }

    var updateWithData = function(data, options) {
        var self = this;
        options.processOption();

        data = preProcess(data, options);

        data = groupdata(
            data, options['group_columns'],
            options['keyfield'], options['aggfun']);

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
                         <img src="./static/src/images/loadingAnimation.gif" style=" \
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
        });
        return newdata;
    }

    function show_detailed_records(tbl_gs, tbl_wfi) {
        var self = this;
        var overlay = $('<div>');
        var removeDlg = function() {
            if (self.need_update) {
                start_loading.call(self)
                var f = function(data) {
                    end_loading.call(self);
                    if (data == null)
                        return;
                    self.updateWithData(data);
                };

                self.options['updateData'].call(self, f);
                self.need_update = false;
            }
            overlay.remove();
        }
        // self.removeDlg = removeDlg;
        overlay.attr('id', 'OVER');
        overlay.addClass('wfi-cash-reconcile-table-details');
        overlay.html('<div class="wfi-cash-reconcile-table args-dlg 1tgt-px-dlg" style="width: 1200px; height:auto;"></div>');

        var dlg = $('div.args-dlg', overlay);
        dlg.css("top", $(window).height()/2-300)
            .css('left', $(window).width()/2-600);
        dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 7px"> \
               <h1 style="float: left; margin-top: 0px; margin-button: 0px">Detailed Records</h1> \
                   <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px; width:16px; height:16px"> \
                   <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C" style="display:inline-block"> \
                          ' + svg + '\
                   </a> \
                   </span> \
             </div> \
             <div id="holder" style="margin: 10px"> \
                  <h>Custodian records</h> \
                  <div id="report-holder" style="overflow-x: scroll;"> \
                      <div id="gs_table" align="center"> \
                      </div> \
                  </div> \
                  <br/> \
                  <br/> \
                  <h>Westfield records</h> \
                  <div id="report-holder" style="overflow-x: scroll;"> \
                      <div id="wfi_table" align="center"> \
                      </div> \
                   </div> \
             </div>');
        dlg.draggable({ handle:'div.dlgTitle'});
        $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
        $('#gs_table', dlg).append(tbl_gs);
        $('#wfi_table', dlg).append(tbl_wfi);
        $('body').append(overlay);
    }

    function create_table_gs_trades(data) {
        var html = $(' \
               <table class="original-records" style="width: 1400px"> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
        var header = [
            'Report Date', 'AccountNumber', 'Currency', 'Opening Balance', 'Current Or Prev Month',
            'SECURITY DESCRIPTION', 'Report Product ID', 'TRADE DT', 'SETTLE DT',
            'ACTIVITY',	'TRADE QUANTITY',
	          'TRADE PRICE', 'NET AMOUNT', 'RUNNING TOTAL', 'REFERENCE #',
	          'BROKER / DESCRIPTION'];

        header.forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        });

        var columns_setup = [
            {data: "t_date",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 if (value == null) return "<div>-</div>"
                 return value.slice(0, 10);
             }},
            {data: "accountnumber",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "currency",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "opening_balance",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 try {
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                 } catch(err) {
                     return '<div class="value"></div>'
                 }}},
            {data: "current_or_prev_month",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "security_description",
             sortable: false,
             visible: true,
             width: '20%'},
            {data: "report_product_id",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "trade_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return value.slice(0, 10);
             }},
            {data: "settle_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return value.slice(0, 10);
             }},
            {data: "activity",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "trade_quantity",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.0f")(value);
             }},
            {data: "trade_price",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "net_amount",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "running_total",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "reference_num",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "broker_description",
             sortable: false,
             visible: true,
             width: '20%'}
        ];

        var tbl = $(html).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            autoWidth: false,
            columns: columns_setup,
            data: data
        });
        return html;
    };

    function create_table_gs_other_cash(data, callback) {
        var self = this;
        var html = $(' \
               <table class="original-records" style="width: 1400px"> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
        var header = [
            '', 'Report Date', 'AccountNumber', 'Currency', 'Opening Balance', 'Current Or Prev Month',
            'SECURITY DESCRIPTION', 'Report Product ID', 'TRADE DT', 'SETTLE DT',
            'ACTIVITY',	'TRADE QUANTITY',
	          'TRADE PRICE', 'NET AMOUNT', 'RUNNING TOTAL',
	          'BROKER / DESCRIPTION'];

        header.forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        });

        var columns_setup = [
            {
             sortable: false,
             visible: true,
             width: '5%',
             render: function(value) {
                 return '<div class="clickable add">add</div>';
             }},
            {data: "t_date",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 if (value == null) return "<div>-</div>"
                 return value.slice(0, 10);
             }},
            {data: "accountnumber",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "currency",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "opening_balance",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 try {
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>';
                 } catch(err) {
                     return '<div class="value"></div>'
                 }}},
            {data: "current_or_prev_month",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "security_description",
             sortable: false,
             visible: true,
             width: '20%'},
            {data: "report_product_id",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "trade_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return value.slice(0, 10);
             }},
            {data: "settle_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return value.slice(0, 10);
             }},
            {data: "activity",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "trade_quantity",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.0f")(value);
             }},
            {data: "trade_price",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "net_amount",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "running_total",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "broker_description",
             sortable: false,
             visible: true,
             width: '20%'}
        ];

        var tbl = $(html).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            autoWidth: false,
            columns: columns_setup,
            data: data,
            drawCallback: function (settings) {
                var api = this.api();
                var rows = api.rows().nodes();
                var last = null;
                api.rows().data().each(function(data, i) {
                    $('.clickable.add', rows[i]).click(
                        function() {
                            add_record_other_cash.call(self, data, callback);
                        });
                });
            }
        });

        return html;
    };

    function create_table_wfi_coupon(data) {
        var html = $(' \
               <table class="original-records" style="width: 1178px"> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
        var header = [
            'Trade Dt', 'Currency', 'Security ID', 'Security Name',
            'Total', 'Comments'];
        header.forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        });

        var columns_setup = [
            {data: "trade_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return value.slice(0, 10);
             }},
            {data: "ccy",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "security_id",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "security_name",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "total",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "comments",
             sortable: false,
             visible: true,
             width: '10%'}
        ];

        var tbl = $(html).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            autoWidth: false,
            columns: columns_setup,
            data: data
        });
        return html;
    }

    function create_table_wfi_trades(data) {
        var html = $(' \
               <table class="original-records" style="width: 1178px"> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
        var header = [
            'Trade ID', 'Trade Dt', 'Currency', 'Security ID', 'Security Name',
            'Quantity', 'Trade Price', 'Clean Amount', 'Accrued Amount', 'Commission', 'Total'];
        header.forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        });

        var columns_setup = [
            {data: "trade_id",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "trade_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return value.slice(0, 10);
             }},
            {data: "ccy",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "security_id",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "security_name",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "position",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.0f")(value);
             }},
            {data: "price",
             sortable: false,
             visible: true,
             width: '10%'},
            {data: "clean_trades",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.0f")(value);
             }},
            {data: "accrued",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.0f")(value);
             }},
            {data: "commission",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "total",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }}
        ];

        var tbl = $(html).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            autoWidth: false,
            columns: columns_setup,
            data: data
        });
        return html;
    };

    function create_table_wfi_other_cash(data, callback) {
        var html = $(' \
               <table class="original-records" style="width: 1178px"> \
                 <thead> \
                   <tr> \
                   </tr> \
                 </thead> \
               </table>');
        var header = [
            'Trade ID', 'Trade Dt', 'Settle Dt', 'Currency', 'Account', 'Comments', 'Net Amount', 'FX Rate'];
        header.forEach(function(p, i) {
            var tr = $("<th>" + p + "</th>");
            $("tr", html).append(tr);
        });

        var columns_setup = [
            {data: "trade_id",
             sortable: false,
             visible: true,
             width: '20%'},
            {data: "trade_dt",
             sortable: false,
             visible: true,
             width: '20%',
             render: function(value) {
                 if (value == null) return "<div>-</div>"
                 return value.slice(0, 10);
             }},
            {data: "set_dt",
             sortable: false,
             visible: true,
             width: '10%',
             render: function(value) {
                 if (value == null) return "<div>-</div>"
                 return value.slice(0, 10);
             }},
            {data: "ccy",
             sortable: false,
             visible: true,
             width: '20%'},
            {data: "account",
             sortable: false,
             visible: true,
             width: '20%'},
            {data: "comments",
             sortable: false,
             visible: true,
             width: '20%'},
            {data: "total",
             sortable: false,
             visible: true,
             width: '20%',
             render: function(value) {
                 return d3.format(",.2f")(value);
             }},
            {data: "fx_rate",
             sortable: false,
             visible: true,
             width: '20%',
             render: function(value) {
                 return value;
             }}
        ];

        var tbl = $(html).DataTable({
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            fixedHeader: true,
            autoWidth: false,
            columns: columns_setup,
            data: data
        });

        callback.call_stack.push(function(data) {
            tbl.rows().remove().draw();
            data.forEach(function(p) {tbl.row.add(p)});
            tbl.draw();
        })

        return html;
    };

    function add_record_other_cash(data, callback) {
        var overlay = $('<div>');
        var removeDlg = function() {overlay.remove();}
        var self = this;
        self.removeDlg = removeDlg;
        overlay.attr('id', 'OVER');
        overlay.addClass('data-upload');
        overlay.html('<div class="wfi-cash-reconcile-table args-dlg 1tgt-px-dlg" style="width: 400px; height:auto;"></div>');

        var dlg = $('div.args-dlg', overlay);
        dlg.css("top", $(window).height()/2-210)
            .css('left', $(window).width()/2-315);
        dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                 <h1 style="float: left; margin-top: 0px; margin-button: 0px">Upload to DataBase</h1> \
                   <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px; width:16px; height:16px"> \
                   <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C" style="display:inline-block"> \
                          ' + svg + '\
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

        var fields = $(' \
             <table style="width:300px"> \
               <col width="30%"> \
               <col width="50%"> \
               <tbody> \
                 <tr> \
                    <td colspan=1>Trade Dt</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: trade_dt"/> \
                    </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1>Settle Dt</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: set_dt"/> \
                    </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1>Currency</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: ccy"/> \
                    </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1>Net Amount</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: amount"/> \
                    </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1>Account</td> \
                    <td colspan=1 class="value"> \
                        <input data-bind="value: set_acct"/> \
                    </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1>Is PnL</td> \
                    <td colspan=1 class="value"> \
                        <select data-bind="value: is_pnl"> \
                          <option>true</option> \
                          <option>false</option> \
                        </select> \
                    </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1>Comment</td> \
                    <td colspan=1 class="value"> \
                        <input style="width:100%" data-bind="value: comment"/> \
                    </td> \
                 </tr> \
               </tbody> \
             </table>');

        var vm = new (function() {
            this.fund_id = self.options.input_args.fund_id();
            this.trade_dt = data['trade_dt'].slice(0, 10);
            this.set_dt = data['trade_dt'].slice(0, 10);
            this.ccy = data['ccy'];
            this.amount = data['net_amount'];
            this.is_pnl = 'true';
            this.set_acct = data['set_acct'];
            this.comment = data['broker_description'];
            this.submit = function() {
                self.options.add_other_cash_record(this, callback.callback);
                removeDlg();
            };
            return this;
        })();

        dlg.draggable({ handle:'div.dlgTitle'});
        $('#content tbody', dlg).append(fields);
        $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);

        overlay.removeDlg = removeDlg;
        // overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
        // overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
        $('body').append(overlay);
        ko.applyBindings(vm, overlay[0]);
    }

})(jQuery);
