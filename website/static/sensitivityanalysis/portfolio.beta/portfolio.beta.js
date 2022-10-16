(function($){
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    $.fn.init_wfi_portfolio_beta = function(options) {
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

    function updateWithData(pf, data) {
        var self = this;
        pf.updateWithData(data);
    };

    function initialize(options) {
        var self = this;
        var group_columns = [];
        self.options = options;
        $(self).addClass('wfi-pf-beta');
        var input_args = new (function() {
            this.t_start = ko.observable(d3.timeFormat('%Y-%m-%d')(options.input_args.t_start));
            this.t_end = ko.observable(d3.timeFormat('%Y-%m-%d')(options.input_args.t_end));
            this._var_level = 1;
            this.var_level = ko.pureComputed({
                read: function () {
                    return this._var_level;
                },
                write: function (value) {
                    this._var_level = parseFloat(value);
                    pf.refresh();
                },
                owner: this
            });
            this.calculateBeta = function() {
                startloading();
                self.options.onsearch(
                    {indep_sid: $('input#search_text', self).val(),
                     t_start: input_args.t_start(),
                     t_end: input_args.t_end()},
                    self.updateWithData);
            }
            return this;
        })();
        var innerhtml = '\
                <table id="content-table" style="width: 100%"> \
                    <colgroup> \
                        <col width="40%"> \
                        <col width="30%"> \
                        <col width="30%"> \
                    </colgroup> \
                    <tbody> \
                        <tr><td height="30" colspan="3"> \
                            <div  id="input-params" style="display:flex"> \
                                <table><tbody>\
                                   <tr>\
                                    <td>Indept Variable</td><td><div id="search-bar"></div> </td> \
                                    <td>Index Level</td><td><input type="number" \
                                        data-bind="value: var_level" id="index-level"/></td> \
                                  </tr>\
                                  <tr>\
                                    <td>Start Date</td><td><input type="date" id="start-date" \
                                        data-bind="date: t_start, textInput: t_start, attr: {value: t_start}" /> </td> \
                                    <td>End Date</td><td><input type="date" id="end-date" \
                                        data-bind="date: t_end, textInput: t_end, attr: {value: t_end}" /> </td> \
                                  </tr>\
                                </tbody></table>\
                                <button id="calculate-button" data-bind="click: calculateBeta" \
                                    style="padding: 0px; font-size: 10px; width: 70px; height: 50px">Calculate</button>\
                            </div> \
                        </tr> \
                        <tr> \
                            <td height="600"> <div id="pf-alloc" class="sub-unit" style="position: relative;"/> </td> \
                            <td height="600"> <div id="plot-cell" height="30" class="sub-unit" style="position: relative; height: 80%"/> </td> \
                            <td height="600"> <div id="result-cell" class="sub-unit" style="position: relative"/> </td> \
                        </tr> \
                    </tbody> \
                </table>'
        $(self).html(innerhtml);
        ko.applyBindings(input_args, $('#input-params', self)[0]);
        var [startloading, endloading] = loadingIcon('#'+$(self).attr('id'));

        // search bar
        $('#search-bar', self).wfi_autocomplete({
            placeholder: "Search Security ...",
            onsearch: function(input) {
                // startloading();
                // self.options.onsearch(
                //     {indep_sid: input.val(),
                //      t_start: input_args.t_start(),
                //      t_end: input_args.t_end()},
                //     self.updateWithData);
            },
            update_fn: function(id, fn) {
                self.options.update_search_bar(id, fn)
            },
            selected: function(p, item) {
                item = item['item'];
                var id = item['id'];
                item['id'] = item['value'];
                item['value'] = id;
                $(this).val(item['id']);
                //$(this).attr('pid', item['id']);
            }
        });

        // regression stats
        var stats = addTitle(
            (function() {
                var obj = $('div#result-cell', self);
                obj.each(function(i, div) {
                    div.options = {title: "REGRESSION STATS"}});
                return obj;
            })(), false);
        $(stats).append('\
              <div style="width: 100%; height: 100%">\
                <div id="table1" class="regress-table" style="width: 100%; height: 40%"></div>\
                <div id="table2" class="regress-table" style="width: 100%; height: 20%"></div>\
              </div>')

        // plot
        var plot = addTitle($('div#plot-cell', self).init_wfi_plot(
            {datasource: "regression_plot",
             title: ko.observable("REGRESSION PLOT"),
             fitcurve: {
                data: [{field: 'fit-line', axis: 'yaxis1', sort: true}],
                color: function(i){
                    return colors(i);}},
             scatters: {
                 data: {field: 'y', axis: 'yaxis1'},
                 color: function(j, d){
                     var color =d3.scaleLinear().domain([0, 1])
                             .interpolate(d3.interpolateHcl)
                             .range([d3.rgb("yellow"), d3.rgb('red')]);
                     return color(d.j/d.n);}},
             xaxis: {field: 'x',
                     fmt: function(x) {return d3.format('.2f')(x*100)+'%'},
                     tooltipfmt: function(x) {return d3.format('.2f')(x*100)+'%'},
                     scale:d3.scaleLinear()},
             yaxis1: {fmt: function(x) {return d3.format('.2f')(x*100)+'%'},
                      tooltipfmt: function(x) {return d3.format('.2f')(x*100)+'%'},
                      scale:d3.scaleLinear()},
             navigator: {
                 field: 'date',
                 fmt: d3.timeFormat('%b %y'),
                 tooltipfmt: d3.timeFormat('%Y-%m-%d'),
                 domainfmt: d3.timeFormat('%m/%d/%Y'),
                 scale: d3.scaleTime(),
                 gradient: {color: function(d) {
                     var color =d3.scaleLinear().domain([0, 1])
                             .interpolate(d3.interpolateHcl)
                             .range([d3.rgb("yellow"), d3.rgb('red')]);
                     return color(d);
                 }},
                 default: function(navi) {
					           var end = d3.timeFormat("%Y-%m-%d").parse(input_args.t_end());
					           var start = d3.timeFormat("%Y-%m-%d").parse(input_args.t_start());
					           return [start, end];
                }
             },
             zoombar: true,
             legendbar: false,
             preProcess: function(data) {
                 var dataClone = {}
                 $.each(data, function(p) {
                     dataClone[p] = data[p].slice();});
                 dataClone['date'] = dataClone['date'].map(
                     function(p) {return d3.timeParse('%Y-%m-%d')(p.slice(0,10));})
                 return dataClone;
             }}), false);

        // on click update regression result
        function update_regression_result(data) {
            if (data != null && 'plot' in data) {
                plot.updateWithData(data['plot']);
                $('#table1', stats).html(data['table1']);
                $('#table2', stats).html(data['table2']);
            }
        }

        // portfolio allocation
        var pf = addTitle($('#pf-alloc', self).init_wfi_table({
            datasource: 'pf_position_pnl',
            title: ko.observable("PORTFOLIO POSITIONS"),
            input_args: {
                'group_level_0': ko.observable('total'),
                'group_level_1': ko.observable('sec_typ'),
                'group_level_2': ko.observable('None'),
                'level_1_options': ['sec_typ', 'industry_level_1', 'book', 'None'],
                'level_2_options': ['industry_level_1', 'industry_level_2', 'book', 'sec_typ', 'None'],
                'sort_by': [{'field': 'rank', ascend: true, field_options: ['rank', 'deal', 'description', 'mktval', 'mkt_exposure']},
                            {field: 'mktval', ascend: false, field_options: ['rank', 'deal', 'description', 'mktval', 'mkt_exposure']},
                            {field: 'mktval', ascend: false, field_options: ['rank', 'deal', 'description', 'mktval', 'mkt_exposure']}],
                'init_expansion_level': 3,
                'display': 'summary'
            },
            sort_by: [],
            //scrollY: '540px',
            //scrollCollapse: false,
            process_row: function(row, rowdata) {
                $(row).addClass('row-clickable').click(function() {
                    $('.row-clicked', pf).removeClass('row-clicked');
                    $(row).addClass('row-clicked');
                    update_regression_result(rowdata['data']);
                });
            },
            processOption: function() {
                var self = this;
                self.title("PORTFOLIO POSITIONS");
                self.sort_by = self.input_args.sort_by;

                self.init_expansion_level = self.input_args.init_expansion_level;
                self.start_expansion_level = 0;
                self.total_expansion_level = self.input_args.total_expansion_level || Number.MAX_VALUE;

                // group columns
                var group = [self.input_args.group_level_0()];
                if (self.input_args.group_level_1() != 'None') {
                    group.push(self.input_args.group_level_1());
                }
                if (self.input_args.group_level_2() != 'None') {
                    group.push(self.input_args.group_level_2());
                }
                self.group_columns = group.concat(['description']);

                // copy self.group_colums to group_columns
                while(group_columns.length>0) group_columns.pop();
                group_columns.push.apply(group_columns, self.group_columns);
            },
            process_child_data: function(data, depth) {
                var self = this;
                var n = self.options.sort_by.length;
                data.sort(sort_by(self.options.sort_by.slice(depth-1, n)));
            },
            columns_setup: [
                {data: "security",
                 sortable: false,
                 visible: true,
                 title: '',
                 width: '20%',
                 render: function(value, type, row) {
                     var self = this;
                     var level = group_columns[row.depth];
                     if (level == null) {
                         return '<div class="first-column" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                     }
                     return '<div class="clickable" style="margin-left:' + (row.depth-1)*4 + 'px">' + value + '</div>';
                 }},
                {data: 'security_id',
                 sortable: false,
                 visible: true,
                 title: '',
                 width: '5%',
                 render: function(value, type, row) {

                     if (value == "") return '';
                     var level = group_columns[row.depth-1];
                     if (level == 'lot_id') {
                         return '<div class="value">' + row.account + '</div>';
                     } else if (level == 'description') {
                         return '<div class="value sid-clickable">' + d3.format(".0f")(value) + '</div>';
                     }
                     return '<div class="value"></div>';
                 }},
                {data: "quantity",
                 sortable: false,
                 visible: true,
                 title: 'Quantity',
                 width: '15%',
                 render: function(value) {
                     if (value == "") return '';
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>';}},
                {data: "last_price",
                 sortable: false,
                 visible: true,
                 title: 'Current Price (Loc)',
                 width: '15%',
                 render: function(value, type, row) {
                     if (value == "") return '';
                     var criteria = row.period_unrealized_pnl || 0;
                     return addSignClass(
                         '<div class="value">' + '$' + d3.format("7,.2f")(value) + '</div>', criteria);

                 }},
                {data: "mktval",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 title: 'Market Value',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     if (value == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
                {data: "mkt_exposure",
                 sortable: false,
                 visible: true,
                 width: '20%',
                 title: 'Exposure',
                 render: function(value) {
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     if (value == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.1f")(value/1000) + 'K</div>'}},
                {sortable: false,
                 visible: true,
                 width: '15%',
                 title: '% Exposures',
                 render: function(val, type, row) {
                     var value = row['mkt_exposure'] / row['total_mktval'];
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     if (value == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2%")(value) + '</div>'}},
                {sortable: false,
                 visible: true,
                 width: '15%',
                 title: 'beta',
                 render: function(val, type, row) {
                     var value = row['beta'];
                     if (value == "" | value == null) return '<div class="value beta">n/a</div>';
                     if (value == 0) return '<div class="value beta">-</div>';
                     return '<div class="value beta">' + d3.format(",.2f")(value) + '</div>'}},
                {sortable: false,
                 visible: true,
                 width: '15%',
                 title: 'Beta Contr',
                 render: function(val, type, row) {
                     var value = row['beta_contr'];
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     if (value == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>'}},
                {sortable: false,
                 visible: true,
                 width: '15%',
                 title: 'HedgeRatio',
                 render: function(val, type, row) {
                     var value = row['beta_contr'] / input_args._var_level;
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     if (value == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.0f")(value) + '</div>'}},
                {sortable: false,
                 visible: true,
                 width: '15%',
                 title: 'RSquared',
                 render: function(val, type, row) {
                     var value = row['rsquared']
                     if (value == "" | value == null) return '<div class="value">-</div>';
                     if (value == 0) return '<div class="value">-</div>';
                     return '<div class="value">' + d3.format(",.2f")(value) + '</div>'}},
            ],
            group_columns: ['sec_typ'],
            init_level: 0,
            init_expand: 3,
            keyfield: 'security',
            preProcess: function(data, options) {
                var dataClone = []
                data.forEach(function(p) {
                    p['book'] = p.security.secTypName == 'Currency' ? 'Cash' : (p['direction'] ? 'Long' : 'Short');
                    p['total'] = 'Total';
                    p['description'] = p['security'].description;
                    p['security_id'] = p['security'].sid;
                    p['beta_contr'] = p['mkt_exposure'] * (p['beta'] || 0);
                    dataClone.push(p);
                });

                dataClone.sort(sort_by(options.sort_by));
                return dataClone;
            },
            aggfun: function(node) {
                sum(node, 'quantity', 2);
                first(node, 'security_id', 1);
                // first(node, 'rank', 1);

                sum(node, 'mktval', 0);
                set_attr(node, node.mktval, 'total_mktval');

                sum(node, 'mkt_exposure', 1);
                sum(node, 'beta_contr', 1);
                weightedAvg(node, 'beta', 'delta_adj_exposure', 1);

            },
            options: function(data) {
                var self = this;
                var html = $(' \
                    <table style="width:300px"> \
                      <col width="40%"> \
                      <col width="30%"> \
                      <tbody> \
                        <tr> \
                           <td colspan=1>Group Level 1</td> \
                           <td colspan=1 class="value"> \
                               <select data-bind="value: group_level_1, options: level_1_options"/> \
                           </td> \
                        </tr> \
                        <tr> \
                           <td colspan=1>Group Level 2</td> \
                           <td colspan=1 class="value"> \
                               <select data-bind="value: group_level_2, options: level_2_options"/> \
                           </td> \
                        </tr> \
                        <tr> \
                           <td colspan=1>Initial Expansion Level</td> \
                           <td colspan=1 class="value"> \
                               <input data-bind="value:init_expansion_level"/> \
                           </td> \
                        </tr> \
                        <tr><td colspan=2> \
                          <table style="width:100%"> \
                              <caption style="font-weight: bold">Sorting By</caption> \
                              <thead><tr> \
                                  <th>Field</th><th>Ascending</th><th></th> \
                              </tr></thead> \
                              <tbody data-bind="foreach: sort_by"> \
                                  <tr> \
                                      <td >\
                                        <select data-bind="value: field, options: field_options"/> \
                                      </td>\
                                      <td >\
                                        <select data-bind="value: ascend, options: [true, false]"/> \
                                      </td>\
                                  </tr>   \
                              </tbody> \
                          </table> \
                        </td></tr>\
                      </tbody> \
                    </table>');
                return html
            },
            update: function() {}}));

        self.updateWithData = function(data) {
            endloading();
            self.rawdata = clone(data);
            updateWithData.call(self, pf, data)
        };
    }

    function clone(data) {
        var newdata = [];
        data.forEach(function(p) {
            newdata.push(jQuery.extend({}, p));
        })
        return newdata;
    };

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

    function first(node, field, depth) {
        if (field in node) {
            return;
        } else {
            node.children.forEach(function(p) {
                first(p, field, depth);
            });
            if (node.depth<depth) {
                node[field] = "";
            } else {
                node[field] = node.children[0][field];
            };
        }
    };

    function sum(node, field, depth) {
        if (field in node) {
            return;
        } else {
            node.children.forEach(function(p) {
                sum(p, field, depth);
            });
            if (node.depth<depth) {
                node[field] = "";
            } else {
                var val = 0;
                node.children.forEach(
                    function(p) {
                        val += p[field]});
                node[field] = val;
            };
        }
    };

    function prodsum(node, field, prod, depth) {
        if (field in node) {
            return;
        } else {
            if (node.children) {
                node.children.forEach(function(p) {
                    prodsum(p, field, prod, depth);
                });
                var val1 = 0;
                node.children.forEach(
                    function(p) {
                        val1 += p[field]});
                node[field] = val1;
            } else {
                var val2 = 1;
                prod.forEach(function(p) {
                    val2 *= node[p];
                })
                node[field] = val2;
            }
            if (node.depth<depth) {
                node[field] = "";
            }
        }
    };

    function weightedAvg(node, field, weight, depth) {
        if (field in node) {
            return;
        } else {
            if (node.children) {
                node.children.forEach(function(p) {
                    weightedAvg(p, field, weight, depth);
                });
                var val1 = 0;
                node.children.forEach(
                    function(p) {
                        val1 += (p[field] || 0) * (p[weight] || 0)});
                node[field] = Math.abs(node[weight]) < 0.000001 ? 0 : val1 / node[weight];
            }
            if (node.depth<depth) {
                node[field] = "";
            }
        }
    };

    function set_attr(node, attr_val, attr_name) {
        node[attr_name] = attr_val;
        if (node.children) {
            node.children.forEach(function(p) {
                set_attr(p, attr_val, attr_name);
            });

        }
    }

    function addSignClass(html, value) {
        if (value > 0) {
            html = $(html).addClass('positive');
        } else if (value < 0) {
            html = $(html).addClass('negative');
        } else {
            html = $(html);
        }
        return html[0].outerHTML;
    };

})(jQuery);
