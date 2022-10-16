var initialize = function(PARAMS) {
    // currency exposure
    // PARAMS['widget']['pf_ccy_expo'] = addTitle(
    //     $('div#pf-ccy-risk').init_pf_ccy_risk(startLoading, endLoading), "CURRENCY RISK");
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    PARAMS['widget']['sensitivity-analysis'] = addTitle(
        $('div#sensitivity-analysis').init_wfi_portfolio_beta({
            title: ko.observable("PORTFOLIO BETA"),
            input_args: {
                t_end: new Date(paramsInput.t_date()),
                t_start: (function() {
                    var t = new Date(paramsInput.t_date());
                    //t.setYear(t.year - 1);
                    //t.setFullYear(t.getFullYear()-1);
                    t.setMonth(t.getMonth()-3);
                    return t;
                })(),
                t_date: new Date(paramsInput.t_date())},
            update_search_bar: function(id, fn) {
                $.ajax({
                    url: "tsearch_securities",
                    method: "GET",
                    dataType: 'json',
                    timeout: 1000*120,
                    data: {id: id},
                    success: function(data) {
                        fn(data);
                        //updateSize();
                    },
                    error: function (error) {
                    }
                });
            },
            onsearch: function(params, callback) {
                $.ajax({
                    url: "api_get_pf_beta",
                    method: "GET",
                    dataType: 'json',
                    timeout: 1000*120,
                    data: {
                        t_start: params.t_start,
                        t_end: params.t_end,
                        t_date: paramsInput.t_date(),
                        pid: paramsInput.pid(),
                        indep_sid: params.indep_sid},
                    success: function(data) {
                        callback(data);
                        //updateSize();
                    },
                    error: function (error) {
                        callback();
                    }
                });
            }
        }),
        false);

    // ----------------------------------------------------

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
                        val1 += p[field] * p[weight]});
                node[field] = Math.abs(node[weight]) < 0.02 ? 0 : val1 / node[weight];
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
}
