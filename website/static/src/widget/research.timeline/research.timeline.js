/* a sample data
 var group = [
 {id: 'research', content: 'research', className: 'subgrp'},
 {id: 'news', content: 'news', className: 'subgrp'},
 {id: 'restructure', content: 'restructure', className: 'subgrp'},
 {id: 'security 1', content: 'security 1', className: 'subgrp'},
 {id: 'security 2', content: 'security 2', className: 'subgrp'},
 {id: 'document', content: 'document', nestedGroups: ['research', 'news', 'restructure'], className: 'subgrp'},
 {id: 'security', content: 'security', nestedGroups: ['security 1', 'security 2'], className: 'subgrp'}
 ];

 var data = [
 {id: 0, content: 'item 5', start: '2014-03-25', group: 'research', subgroup: 'research'},
 {id: 1, content: 'item 1', start: '2014-04-20', group: 'news', subgroup: 'news'},
 {id: 'as', content: 'item 2', start: '2014-04-14', group: 'restructure', subgroup: 'restructure'},
 {id: 3, content: 'item 3', start: '2014-04-18', group: 'restructure', subgroup: 'restructure'},
 {id: 6, content: 'item 34kdkdfn', start: '2014-04-17', group: 'restructure', subgroup: 'restructure'},
 {id: 4, content: 'item 4', start: '2014-04-16', end: '2014-04-19',
 group: 'security 1', subgroup: '1', title: function() {
 var a = 1;
 }},
 {id: 5, content: 'item 6', start: '2014-05-16', end: '2014-06-19',
 group: 'security 1', subgroup: '2'}
 ];*/

//self.updateWithData(data, group, options);

function getCurrentUser() {
    return $('#current-user-name').attr('username');
}


(function($){
    var timeline_obj;
    var target_px_obj;
    $.fn.init_time_line = function(
        dursec=2,
        startLoading=function(){},
        endLoading=function(){}) {
        timeline_obj = this;
        this.each(function(i, div) {
            init_time_line(
                div, dursec,
                startLoading, endLoading);
        })
        return this;
    };

    $.fn.init_analyst_px_target = function(
        startLoading=function(){},
        endLoading=function(){}) {
        target_px_obj = this;
        this.each(function(i, div) {
            init_px_target(
                div, startLoading, endLoading);
        })
        return this;
    };

    function refreshing_obj(sid) {
        timeline_obj.each(function(i, div) {
            div.reupdate();
        });
        target_px_obj.each(function(i, div) {
            div.update(sid);
        });
    };

    function init_px_target(self, startLoading, endLoading) {
        self.update = updatePxTargetWithLoadingIcon(startLoading, endLoading);
        self.updateWithData = updatePxTarget;
        self.reupdate = self.update;
    };

    function updatePxTarget(data, sec_info) {
        var self = this;
        var html_template =
            '<div style="float: left; display: flex; flex-direction: row; \
              justify-content: space-around;"> \
                <div id="target-px-hist" class="analyst-rating" style="width:70%;"> \
                </div> \
                <div id="comment" class="analyst-rating" style="width:25%;"> \
                    <textarea id="text-area" style="width:100%; height:340px; resize: none;"> </textarea> \
                </div> \
            </div>';
        $(self).html(html_template);

        var commentArea = addTitle(
            (function() {
                var comment = $('#comment', self);
                comment.each(function(i, widget) {
                    widget.options = {
                        title: 'COMMENT'};
                })
                return comment;
            })(),
            false, false);

        addTitle($('#target-px-hist', self).init_wfi_table({
            title: 'PRICE TARGET HISTORY',
            groupdata: false,
            bPaginate: true,
            iDisplayLength: 20,
            columns_setup: [
                {data: "t_date",
                 sortable: false,
                 visible: true,
                 title: 'Entry date',
                 width: '40%',
                 render: function(value, type, row) {
                     var self = this;
                     var t_date = d3.timeFormat('%Y-%m-%d')(
                         d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                     return '<div style="margin-left:5px">' + t_date + '</div>';
                 }},
                {data: "analyst",
                 sortable: false,
                 visible: true,
                 title: 'Analyst',
                 width: '30%',
                 render: function(value, type, row) {
                     var self = this;
                     return '<div class="value" style="margin-left:5px">' + value + '</div>';
                 }},
                {data: "entry_px",
                 sortable: false,
                 visible: true,
                 title: 'EntryPx',
                 width: '30%',
                 render: function(value, type, row) {
                     var self = this;

                     if (row['hold_position']) {
                         return '<div class="value" style="margin-left:5px">-</div>';
                     }

                     return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value) + '</div>';
                 }},
                {data: "exit_px",
                 sortable: false,
                 visible: true,
                 title: 'ExitPx',
                 width: '30%',
                 render: function(value, type, row) {
                     var self = this;

                     if (row['hold_position']) {
                         return '<div class="value" style="margin-left:5px">-</div>';
                     }

                     return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value) + '</div>';
                 }},
                {data: "best_scenario_px",
                 sortable: false,
                 visible: true,
                 title: 'BestPx',
                 width: '30%',
                 render: function(value, type, row) {
                     var self = this;

                     if (!row['hold_position']) {
                         return '<div class="value" style="margin-left:5px">-</div>';
                     }

                     return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value) + '</div>';
                 }},
                {data: "target_px",
                 sortable: false,
                 visible: true,
                 title: 'TargetPx',
                 width: '30%',
                 render: function(value, type, row) {
                     var self = this;

                     if (!row['hold_position']) {
                         return '<div class="value" style="margin-left:5px">-</div>';
                     }

                     return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value) + '</div>';
                 }},
                {data: "worst_scenario_px",
                 sortable: false,
                 visible: true,
                 title: 'WorstPx',
                 width: '30%',
                 render: function(value, type, row) {
                     var self = this;

                     if (!row['hold_position']) {
                         return '<div class="value" style="margin-left:5px">-</div>';
                     }

                     return '<div class="value" style="margin-left:5px">' + d3.format('.2f')(value) + '</div>';
                 }},
                {data: "good_til_date",
                 sortable: false,
                 visible: true,
                 title: 'GoodTilDate',
                 width: '30%',
                 render: function(value, type, row) {
                     try {

                         if (!row['hold_position']) {
                             return '<div class="value" style="margin-left:5px">-</div>';
                         }

                         var t_date = d3.timeFormat('%Y-%m-%d')(
                             d3.timeParse('%Y-%m-%dT%H:%M:%S')(value));
                         return '<div style="margin-left:5px">' + t_date + '</div>';
                     } catch (e) {
                         return '<div style="margin-left:5px">-</div>';
                     }
                 }},
                {data: "monitoring",
                 sortable: false,
                 visible: true,
                 title: 'Monitoring',
                 width: '20%',
                 render: function(value, type, row) {
                     return '<div style="margin-left:5px">' + value + '</div>';
                 }},
                {data: "hold_position",
                 sortable: false,
                 visible: true,
                 title: 'Hold Pos',
                 width: '20%',
                 render: function(value, type, row) {
                     return '<div style="margin-left:5px">' + value + '</div>';
                 }},
                {data: "ls_flag",
                 sortable: false,
                 visible: true,
                 title: 'L/S Flag',
                 width: '20%',
                 render: function(value, type, row) {
                     return '<div style="margin-left:5px">' + value.toString() + '</div>';
                 }},
                {data: "",
                 sortable: false,
                 visible: true,
                 title: '',
                 width: '10%',
                 render: function(value, type, row) {
                     return '<div class="clickable edit" style="margin-left:5px"><a>edit</a></div>';
                 }}],
            process_row: function(row, data) {
                var attrs = data;
                var rowobj = this;

                $(row).click(function() {
                    $('tr[role="row"]', rowobj).removeClass("selected");
                    $(row).addClass('selected');
                    $('#text-area', commentArea).val(data['comments'])
                });
                $('td div.edit a', row).click(function() {
                    var overlay = createTgtPxDlag("Edit price target");
                    var vm = EditAnalystTgtVm(attrs, overlay)
                    $("body").append(overlay);
                    // ko.applyBindings(record, overlay[0]);
                    ko.applyBindings(vm, overlay[0]);
                })
            },
            call_function_n1: function(data) {
                var overlay = createTgtPxDlag("Create price target");
                $("body").append(overlay);

                ko.applyBindings(CreateAnalystTgtVm(sec_info, overlay), overlay[0]);
         }
        }), false, true).updateWithData(data);
    }

    function updatePxTargetWithLoadingIcon(startLoading, endLoading) {
        var update = function(sid) {
            if (sid == null) {
                return;
            }
            var widget = this;
            startLoading();
            $.ajax({
                url: "get_security_price_target",
                method: "GET",
                dataType: 'text',
                data: {
                    "sid": sid},
                success: function(data) {
                    data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                    endLoading();
                    widget.updateWithData(data['px-tgt'], data['sec-info']);
                },
                error: function (msg) {
                    endLoading();
                    window.alert("research.timeline.js:"+msg.statusText+":"+msg.responseText);
                }
            })
        };
        return update;
    }

    function init_time_line(self, dursec, startLoading, endLoading) {
        $(self).addClass('wfi-time-line');
        $(self).css('display', 'flex')
            .css('position', 'relative')
            .css('flex-direction', 'column');

        // create naviagtion bar
        d3.select(self)
            .selectAll("svg.chart-navigator")
            .data([1]).enter()
            .append("svg")
            .attr("class", "chart-navigator")
            .attr("width", $(self).width())
            .attr("height", '40px')
            .append('g').attr("class", "canvas-navigator")
            .attr("transform", "translate(0, 0)");

        // DOM element where the Timeline will be attached
        $(self).append('<div id="div-time-line"></div>');
        //var container = $("sec-time-line", self);
        var container = $("#div-time-line", self).css(
            'width', '100%')[0];
        var dragDropManager = WfiDragDropManager(self, startLoading, endLoading);

        // tooltip
        d3.select(self)
            .selectAll("div.wfi-tooltip")
            .data([1]).enter()
            .append("div")
            .attr("class", "wfi-tooltip")
            .style("display", "none")
            .style("position", "fixed");

        self.update = updateWithLoadingIcon(dragDropManager, startLoading, endLoading);
        self.updateWithData = updateWithData;

        return this;
    };

    var updateWithData = function(data, grps, options, sp_url) {
        self = this;
        var container = $("#div-time-line", self);
        container.empty();
        var items = new vis.DataSet(data);
        var groups = new vis.DataSet(grps);
        var timeline = new vis.Timeline(container[0], items, groups, options);
        var profile = {};
        data.forEach(function(p) {
            profile[p['id']] = p;
        });

        $('.vis-timeline', container).css('visibility', 'visible');
        timeline.fit();

        // change background
        var clrs = d3.scaleOrdinal(d3.schemeCategory10);
        d3.select(container[0]).selectAll('.bg.subgrp')
            .style('background-color', function(p, i) {
                return hexToRgb(clrs(i), 0.2);});

        var x_range = [timeline.getDataRange().min, timeline.getDataRange().max];
        // var [minDt, maxDt] = max_range(x_range);
        var [minDt, maxDt] =  max_range(x_range);
        //minDt.setDate(minDt);
        //maxDt.setDate(maxDt);
        timeline.setOptions({min: minDt, max: maxDt});
        timeline.on('select', onSelect);

        //timeline.on('rangechanged', rangechange);

        /* -------------------------------
         navigation chart
         -------------------------------*/
        var svg = d3.select(self).select('svg.chart-navigator');
        var x = d3.scaleTime()
                .range([0, $(self).width()])
                .domain(d3.extent(x_range));

        var naviH = parseInt(svg.attr("height"));
        var xaxis = d3.axisBottom()
                .scale(x)
                .tickSizeInner(-naviH)
                .tickSizeOuter(-naviH)
                .tickFormat(d3.timeFormat("%b '%y"));
        var xaxisAdj = function(x) {
            xaxis(x);
            x.selectAll('.x.axis .tick text')
                .attr('x', 20).attr('y', -10);
        }
        svg.selectAll('g.x.axis').data([1]).enter()
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + naviH + ')');
        svg.selectAll('g.x.axis').call(xaxisAdj);

        var brush = d3.brushX()
                .extent([[0, 0], [$(self).width(), naviH]])
                .on("end", brushed);

        var view = svg.selectAll('g.brush').data([1]);
        view.enter().append("g")
            .attr("class", "x brush")
            .call(brush).selectAll("rect")
            .attr("height", naviH);
        view = svg.selectAll('g.brush').call(brush);
        view.call(brush.move, null);
        //brush.event(svg.select('g.x.brush'));

        /* --------------------------------
         inner function
         --------------------------------*/
        // brushed
        function brushed() {
            var s = d3.event.selection;
            var range = s == null ? x.domain(): d3.extent(s.map(x.invert))
            var [start, end] = range;
            timeline.setWindow(start, end);
            timeline.redraw();
        };

        function rangechange(prop) {
            brush.extent(prop.start, prop.end);
            //brush(d3.select(self).select(".brush").transition());
            brush(d3.select(self).select("g.x.brush"));
            //brush.event(d3.select(".brush").transition().delay(50));
        };

        function tooltipTemplate(attrs, tooltip) {
            var source;
            var html;
            var template;
            if (~attrs['className'].search("doc")) {
                source =
                    '<a id="edit">Edit</a> \
                    <table> \
                    <tbody> \
                    <tr><td>File</td><td><a target="_blank" href="{{LinkingUri}}">{{Name}}</a></td></tr> \
                    <tr><td>Effective Date</td><td>{{start}}</td></tr> \
                    <tr><td>Created</td><td>{{Created}}</td></tr> \
                    <tr><td>Last Update</td><td>{{Modified}}</td></tr> \
                    <tr><td>Sentiment</td><td>{{Sentiment}}</td></tr> \
                    <tr><td>Comments</td><td><textarea readonly="readonly">{{{Comments}}}</textarea></td></tr> \
                    </tbody> \
                    </table>';
                attrs['SpUrl'] = sp_url;
                attrs['Modified'] = new Date(attrs['Modified']);
                attrs['start'] = new Date(attrs['start']);
                attrs['Created'] = new Date(attrs['Created']);
                attrs['Effective_x0020_Date'] = attrs['Effective_x0020_Date'] || d3.timeFormat("%Y-%m-%d")(attrs['Created']);
                html = Handlebars.compile(source)(attrs);
                tooltip.html(html);
                tooltip.select('#edit').on('click', function(e) {
                    var editor = new AttrEditor(self, attrs);
                    editor.openEditor()
                    tooltip.style("display", "none");
                });
                return tooltip;
            } else if (~attrs['className'].search("trd-rc")) {
                html = "<table>" +
                    "<caption>Trading Records</caption>" +
                    "<tbody>" +
                    "</tbody>" +
                    "</table>";
                tooltip.html(html);
                Handlebars.registerHelper('Size', function(pos) {
                    return d3.format(",.0f")(pos)
                });

                tooltip.select('tbody').selectAll('tr').data(attrs['trading_records'])
                    .enter().append('tr').html(function(p) {
                        template = Handlebars.compile(
                            "<td>{{t_date}}</td><td>{{fund_id}}</td><td>{{position_size}}</td><td>{{price}}</td><td>{{counterparty}}</td>")
                        return template(p);
                    });
                return tooltip;
            } else if (~attrs['className'].search("px-tgt")) {
                source =
                    '<a id="edit">Edit</a> \
                    <table> \
                    <tbody> \
                    <tr><td>Security</td><td colspan="2">{{description}}</td></tr> \
                    <tr><td>Target Price</td><td>{{target_px}}</td><td>{{target_prob}}</td></tr> \
                    <tr><td>Upside</td><td>{{best_scenario_px}}</td><td>{{best_scenario_prob}}</td></tr> \
                    <tr><td>Downside</td><td>{{worst_scenario_px}}</td><td>{{worst_scenario_prob}}</td></tr> \
                    <tr><td>Effective Date</td><td  colspan="2">{{t_date}}</td></tr> \
                    <tr><td>GTD</td><td  colspan="2">{{good_til_date}}</td></tr> \
                    <tr><td>Analyst</td><td  colspan="2">{{analyst}}</td></tr> \
                    <tr><td>Comments</td><td  colspan="2"><textarea readonly="readonly">{{{comments}}}</textarea></td></tr> \
                    </tbody> \
                    </table>';
                attrs['t_date'] = d3.timeFormat('%Y-%m-%d')(new Date(attrs['t_date']));
                attrs['good_til_date'] = d3.timeFormat('%Y-%m-%d')(new Date(attrs['good_til_date']));
                html = Handlebars.compile(source)(attrs);
                tooltip.html(html);
                tooltip.select('#edit').on('click', function(e) {
                    var overlay = createTgtPxDlag("Edit price target");
                    var vm = EditAnalystTgtVm(attrs, overlay);
                    $("body").append(overlay);
                    // ko.applyBindings(record, overlay[0]);
                    ko.applyBindings(vm, overlay[0]);
                });
                return tooltip;
            }
            return tooltip;
        }

        function onSelect(properties) {
            var tooltip = d3.select(self).selectAll('div.wfi-tooltip');
            if (properties.items[0] != null) {
                var attrs = {};
                $.each(profile[properties.items[0]], function(key, val) {
                    attrs[key] = val;
                });

                tooltip = tooltipTemplate(attrs, tooltip)
                var x = properties.event.center.x;
                var y = properties.event.center.y;
                tooltip
                    .style("left", x + "px")
                    .style("top", y + "px")
                    .style("display", "flex");
                tooltip.transition()
                    .attr('duration', 2)
                    .style('display', 'block');
                /*
                 $('div.tooltip a.file', self).on("click", function(event) {
                 return editDocumentWithProgID2(
                 attrs['FullUrl'].replace("http", 'file'),
                 '','SharePoint.OpenDocuments',
                 '0', '/', '1');
                 });
                 */
            } else {
                tooltip.style("display", "none")
            }
        }
    };

    function updateWithLoadingIcon(dragDropManager, startLoading, endLoading) {
        var update = function(cid, options) {
            var self = this;
            var sp_url = options['sp_url'];

            dragDropManager.setOptions(options);
            self.reupdate = function() {self.update(cid, options)};
            startLoading();
            $.ajax({
                url: "timeline_data",
                method: "GET",
                data: {
                    "cid": cid},
                success: function(ret) {
                    // format each data point
                    endLoading();
                    var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                    self.secInfo = data['secinfo']
                    var options = {
                        clickToUse: true,
                        stack: true,
                        stackSubgroups: true,
                        showTooltips: true,
                        margin: {
                            item : {
                                horizontal : 0
                            }
                        },
                        onInitialDrawComplete: function() {
                            timelineDrawBack.call(self);
                        }};
                    self.username = data['username']
                    self.updateWithData(data['data'], data['datagrp'], options, sp_url);
                },
                error: function (error) {
                    endLoading();
                    alert("timeline_data:"+ error.statusText + ":" + error.responseText);
                }
            });
        };
        return update;
    }

    function createDlag() {
        var overlay = $('<div>');
        var removeDlg = function() {overlay.remove();}
        overlay.attr('id', 'OVER');
        overlay.html('<div class="tgt-px-dlg" style="width: 630px; height: auto;"></div>');

        var dlg = $('div.tgt-px-dlg', overlay);
        dlg.css("top", $(window).height()/2-210)
            .css('left', $(window).width()/2-315);
        dlg.draggable();
        dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative;clear:both"> \
               <h1 id="title" style="float: left;">Update price target</h1> <span id="TitleBtns" class="dlgTitleBtns" style="float: right"> \
                 <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                   <span style="padding:0px;height:16px;width:16px;display:inline-block"> \
                     <span style="height:16px;width:16px; position:relative; display:inline-block; overflow:hidden;" class="s4-clust"> \
                        <img src="./static/src/images/fgimg.png?rev=23" alt="Close dialog" style="left:-0px !important;top:-645px !important;position:absolute;" class="ms-dlgCloseBtnImg"> \
                     </span> \
                   </span> \
                 </a> </span> </div> \
                 <div class ="dlgFrameContainer"> \
                   <table id="content"> \
                     <tbody> </tbody> \
                   </table> \
                   <table id="submit-button"> \
                       <tr> \
                           <td id="sumbit-status-text" data-bind="text: statusText" style="color:red"></td> \
                           <td><img src="./static/src/images/loadingcirclests16.gif?rev=23" id="ImageProgress" style="display:none;"/> \
                           <input type="button" value="Okay" data-bind="click: submit, enable: valid"/> \
                           <input type="button" value="Delete" data-bind="click: deleteRc, visible: displayDel"/> \
                           <input type="button" value="Cancel"/> \
                       </tr> \
                    </table> \
                  </div>');

        $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
        overlay.removeDlg = removeDlg;
        overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
        overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
        return overlay;
    }

    function createTgtPxDlag(title) {
        var overlay = createDlag();
        $('h1#title', overlay).text(title);
        var tableContent =
                '<tr> \
                    <td><h3>Security Name</h3></td> \
                    <td colspan="2"><h3 data-bind="text: description"></h3></td> \
                </tr><tr> \
                    <td>Monitoring</td> \
                    <td> \
                        <select data-bind="value: monitoring, options: [true, false]"/> \
                    </td> \
                 </tr><tr> \
                    <td>Long/Short Flag</td> \
                    <td> \
                        <select data-bind="value: ls_flag, options: [\'long\', \'short\']"/> \
                    </td> \
                </tr><tr> \
                    <td>Hold Position</td> \
                    <td> \
                        <select data-bind="value: hold_position, options: [true, false]"/> \
                    </td> \
                </tr><tr> \
                    <td><h3>Security ID*</h3></td> \
                    <td colspan="2"><input class="sid" type="Text" data-bind="value: security_id, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr data-bind="style: {display: hold_position() ? \'table-row\' : \'none\'}"> \
                    <td><h3>Target Price*</h3></td> \
                    <td><input type="Text" data-bind="value: target_px, valueUpdate: \'afterkeydown\'"/></td> \
                    <td><input type="Text" data-bind="value: target_prob, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr data-bind="style: {display: hold_position() ? \'table-row\' : \'none\'}"> \
                    <td><h3>Best Price*</h3></td> \
                    <td><input type="Text" data-bind="value: best_scenario_px, valueUpdate: \'afterkeydown\'"/></td> \
                    <td><input type="Text" data-bind="value: best_scenario_prob, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr data-bind="style: {display: hold_position() ? \'table-row\' : \'none\'}"> \
                    <td><h3>Worst Price*</h3></td> \
                    <td><input type="Text" data-bind="value: worst_scenario_px, valueUpdate: \'afterkeydown\'"/></td> \
                    <td><input type="Text" data-bind="value: worst_scenario_prob, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr data-bind="style: {display: hold_position() ? \'none\' : \'table-row\'}"> \
                    <td><h3>Entry Price</h3></td> \
                    <td><input type="Text" data-bind="value: entry_px, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr data-bind="style: {display: hold_position() ? \'none\' : \'table-row\'}"> \
                    <td><h3>Exit Price</h3></td> \
                    <td><input type="Text" data-bind="value: exit_px, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Effective Date*</h3></td> \
                    <td colspan="2"><input type="datetime-local" data-bind="value: t_date, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr data-bind="style: {display: hold_position() ? \'table-row\' : \'none\'}"> \
                    <td><h3>Good Til Date*</h3></td> \
                    <td colspan="2"><input type="date" data-bind="value: good_til_date, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Analyst*</h3></td> \
                    <td colspan="2"><input type="Text" data-bind="value: analyst, valueUpdate: \'afterkeydown\'" disabled/></td> \
                </tr><tr> \
                    <td><h3>Title</h3></td> \
                    <td colspan="2"><input type="Text" data-bind="value: title"/></td> \
                </tr><tr> \
                    <td><h3>Comments</h3></td> \
                    <td colspan="2"><textarea data-bind="value: comments"/></td> \
                </tr>';
        $('table#content', overlay).html(tableContent);
        return overlay;
    }

    function timelineDrawBack(data) {
        var self = this;
        $('div.vis-labelset div.grp1.Security', self).on('click', function(e) {
            e.preventDefault();
            var sid = $(this).text().split(":")[1];
            var overlay = createTgtPxDlag("Update price target");

            var ViewModel = function() {
                this.security_id = ko.observable(sid);
                this.monitoring = ko.observable(true);
                this.description = ko.observable(self.secInfo[this.security_id()]);
                this.target_px = ko.observable(null);
                this.best_scenario_px = ko.observable(null);
                this.worst_scenario_px = ko.observable(null);
                this.target_prob = ko.observable(null);
                this.best_scenario_prob = ko.observable(null);
                this.worst_scenario_prob = ko.observable(null);
                this.t_date = ko.observable(d3.timeFormat('%Y-%m-%dT%H:%M:%S')(new Date()));
                this.good_til_date = ko.observable(null);
                this.analyst = ko.observable(self.username);
                this.title = null;
                this.comments = null;
                this.showDelete = false;
                this.statusText = ko.observable("");
                this.deleteRc = function() {deleteTarget.call(
                    this, function() {
                        d3.select(self).selectAll('div.wfi-tooltip').style('display', 'none');
                        refreshing_obj(sid);
                    }, overlay);};
                this.displayDel = false;
                this.submit = function() {submitNewTarget.call(
                    this, function() {
                        refreshing_obj(sid);
                    }, overlay);};
                //this.valid = ko.pureComputed(valid_record, this);
                this.valid = ko.pureComputed(valid_record, this);
            }
            $("body").append(overlay);
            // ko.applyBindings(record, overlay[0]);
            ko.applyBindings(new ViewModel(), overlay[0]);
        });
    }

    function valid_record() {
        var self = this;
        var checkFields;
        var i;
        var len;
        if (self.hold_position()) {
            if (!(Math.abs(
                (parseFloat(self['target_prob']())+
                 parseFloat(self['best_scenario_prob']())+
                 parseFloat(self['worst_scenario_prob']()) - 1)) < 0.00000001)) {
                self['statusText']("probability need to sum to 1");
                return false;
            }

            checkFields = [
                'security_id', 'target_px', 'best_scenario_px',
                'worst_scenario_px', 't_date', 'good_til_date', 'analyst']
            for (i = 0, len = checkFields.length; i < len; i++) {
                if ((self[checkFields[i]]() == null) ||
                    (self[checkFields[i]]() == '')) {
                    self['statusText'](checkFields[i] + " cannot be " + self[checkFields[i]]());
                    return false;
                }
            }
        } else {
            checkFields = [
                'security_id', 'entry_px', 'exit_px',
                't_date', 'analyst']
            for (i = 0, len = checkFields.length; i < len; i++) {
                if ((self[checkFields[i]]() == null) ||
                    (self[checkFields[i]]() == '')) {
                    self['statusText'](checkFields[i] + " cannot be " + self[checkFields[i]]());
                    return false;
                }
            }
        }

        self['statusText']("");
        return true;
    }

    function submitNewTarget(callback, parent) {
        var data = this;
        var closeFn = parent.removeDlg;
        parent.start_loading()
        $.ajax({
            "url": "create_new_target_px",
            "method": "POST",
            "type": "json",
            "data": JSON.parse(ko.toJSON(data)),
            success: function(ret) {
                // format each data point
                parent.end_loading();
                var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                parent.removeDlg();
                callback();
            },
            error: function (error) {
                parent.end_loading();
                alert("create_new_target_px:"+ error.statusText + ":" + error.responseText)
            }
        });
    }

    function updateTarget(callback, parent) {
        var data = this;
        var closeFn = parent.removeDlg;
        parent.start_loading()
        $.ajax({
            "url": "update_target_px",
            "method": "POST",
            "type": "json",
            "data": JSON.parse(ko.toJSON(data)),
            success: function(ret) {
                // format each data point
                parent.end_loading();
                var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                if (data['success']) {

                    parent.removeDlg();
                    callback();
                } else {
                    alert(data['message']);
                }
            },
            error: function (error) {
                parent.end_loading();
                alert("update_target_px:"+ error.statusText + ":" + error.responseText)
            }
        });
    }

    function deleteTarget(callback, parent) {
        var data = this;
        var closeFn = parent.removeDlg;
        parent.start_loading()
        $.ajax({
            "url": "delete_target_px",
            "method": "POST",
            "type": "json",
            "data": JSON.parse(ko.toJSON(data)),
            success: function(ret) {
                // format each data point
                parent.end_loading();
                var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                if (data['success']) {
                    // d3.select(tl).selectAll('div.wfi-tooltip').style('display', 'none');
                    parent.removeDlg();
                    callback();
                } else {
                    alert(data['message']);
                }
            },
            error: function (error) {
                parent.end_loading();
                alert("delete_target_px:"+ error.statusText + ":" + error.responseText)
            }
        });
    }

    function processClose(result, returnValue) {
        if (result == SP.UI.DialogResult.OK) {
            if (returnValue == null) {
                SP.UI.Notify.addNotification('Operation successful');
                SP.UI.ModalDialog.RefreshPage(SP.UI.DialogResult.OK);
            }
        }
    }

    function hexToRgb(hex, opacity) {
        var c = d3.rgb(hex);
        return "rgba("+c.r+","+c.g+","+c.b+","+opacity+")";
    }

    function max_range(x_range) {
        var [mindt, maxdt] = x_range;
        var margin = (maxdt - mindt) * 0.1;
        mindt.setMilliseconds(-margin);
        maxdt.setMilliseconds(margin);
        return [new Date(mindt), new Date(maxdt)];
    }

    function createSubgrpBg(data) {
        var grps = {};
        var dates = [];
        data.forEach(function(p, i) {
            if (('subgroup' in p) && ('group' in p)) {
                if (!(p['group'] in grps)) {
                    grps[p['group']] = {};
                }
                grps[p['group']][p['subgroup']] = 1;
            };
            dates = dates.concat([new Date(p['start']), new Date(p['end'])]);
        });
        var [mindt, maxdt] = max_range(d3.extent(dates));
        var grpbg = [];
        var i = 0;
        $.each(grps, function(p) {
            $.each(grps[p], function(p1) {
                grpbg.push({
                    id: 'GG'+(i++),
                    content: p1,
                    start: mindt,
                    end: maxdt,
                    type: 'background',
                    group: p,
                    subgroup: p1,
                    className: 'bg subgrp'});
            });
        });
        return grpbg;
    }

    function addTitle(obj, config=true, add=false) {
        var source = '<header class="title"> \
                    <h data-bind="text: title"></h> \
                    <div id="buttons"> \
                        <span id="add" \
                         class="config tab-icon-download"></span> \
                        <img id="config" class="config" src="./static/src/images/settings.png"> \
                    </div> \
                  </header>';
        obj.each(function(i, widget) {
            // var $html = $(Handlebars.compile(source)({title: div.options.title()}));
            var $html = $(source);
            (!config) && $('#config', $html).css('display', 'none');
            (!add) && $('#add', $html).css('display', 'none');

            $('#config', $html).on('click', function(p) {
                widget.open_option_setup(widget);
            });
            $('#add', $html).on('click', function(p) {
                widget.call_function_n1(widget);
            });
            $(this).prepend($html);

            ko.applyBindings(widget.options, $html[0]);
        });
        return obj;
    }

    function EditAnalystTgtVm(attrs, overlay) {
        attrs['t_date'] = d3.timeFormat('%Y-%m-%dT%H:%M:%S')(new Date(attrs['t_date']));
        attrs['good_til_date'] = d3.timeFormat('%Y-%m-%d')(new Date(attrs['good_til_date']))

        var vm =  {
            id: attrs['rid'] || attrs['id'],
            monitoring: ko.observable(attrs['monitoring']),
            security_id: ko.observable(attrs['security_id']),
            _ls_flag : ko.observable(1),
            ls_flag: ko.pureComputed({
                read: function() {
                    return vm._ls_flag()},
                write: function(value) {
                    if (value == 'long') {
                        vm._ls_flag(1);
                    } else {
                        vm._ls_flag(-1);
                    }
                }
            }),
            hold_position: ko.observable(attrs['hold_position']),
            target_px: ko.observable(attrs['target_px']),
            best_scenario_px: ko.observable(attrs['best_scenario_px']),
            worst_scenario_px: ko.observable(attrs['worst_scenario_px']),
            entry_px: ko.observable(attrs['entry_px']),
            exit_px: ko.observable(attrs['exit_px']),
            target_prob: ko.observable(attrs['target_prob']),
            best_scenario_prob: ko.observable(attrs['best_scenario_prob']),
            worst_scenario_prob: ko.observable(attrs['worst_scenario_prob']),
            description: ko.observable(attrs['description']),
            t_date: ko.observable(attrs['t_date']),
            good_til_date: ko.observable(attrs['good_til_date']),
            analyst: ko.observable(attrs['analyst']),
            statusText: ko.observable(""),
            title: null,
            comments: ko.observable(attrs['comments']),
            submit: function() {updateTarget.call(
                this, function() {
                    refreshing_obj(attrs['security_id']);
                }, overlay);},
            deleteRc: function() {deleteTarget.call(
                this, function() {
                    refreshing_obj(attrs['security_id']);
                }, overlay);},
            displayDel: true,
            //this.valid = ko.pureComputed(valid_record, this);
            valid: ko.pureComputed(function() {return valid_record.call(vm);})
        };
        return vm;
    }

    function CreateAnalystTgtVm(sec_info, overlay) {
        var vm = function() {
            var self = this;
            this.security_id = ko.observable(sec_info['security_id']);
            this.monitoring = ko.observable(true);
            this.description = ko.observable(sec_info['description']);
            this.target_px = ko.observable(null);
            this._ls_flag = ko.observable(1)
            this.ls_flag = ko.pureComputed({
                read: function() {
                    return self._ls_flag()},
                write: function(value) {
                    if (value == 'long') {
                        self._ls_flag(1);
                    } else {
                        self._ls_flag(-1);
                    }
                }
            });

            this.hold_position = ko.observable(false);

            this.best_scenario_px = ko.observable(null);
            this.worst_scenario_px = ko.observable(null);
            this.target_prob = ko.observable(null);
            this.entry_px = ko.observable(null),
            this.exit_px = ko.observable(null),
            this.best_scenario_prob = ko.observable(null);
            this.worst_scenario_prob = ko.observable(null);
            this.t_date = ko.observable(d3.timeFormat('%Y-%m-%dT%H:%M:%S')(new Date()));
            this.good_til_date = ko.observable(null);
            this.analyst = ko.observable(getCurrentUser());
            this.title = null;
            this.comments = null;
            this.showDelete = false;
            this.statusText = ko.observable("");
            this.deleteRc = function() {};
            this.displayDel = false;
            this.submit = function() {submitNewTarget.call(
                this, function() {
                    refreshing_obj(sec_info['security_id']);
                }, overlay);};
            //this.valid = ko.pureComputed(valid_record, this);
            this.valid = ko.pureComputed(valid_record, this);
        }
        return new vm();
    }

})(jQuery);
