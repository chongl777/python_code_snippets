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


(function($){
    $.fn.init_time_line = function(
        dursec=2,
        startLoading=function(){},
        endLoading=function(){}) {
        this.each(function(i, div) {
            init_time_line(
                div, dursec,
                startLoading, endLoading);
        })
        return this;
    };

    var init_time_line = function(self, dursec, startLoading, endLoading) {
        $(self).addClass('wfi-time-line');
        $(self).css('display', 'flex').css('flex-direction', 'column');

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
        var dragDropManager = WfiDragDropManager(self);

        // tooltip
        d3.select(self)
            .selectAll("div.tooltip")
            .data([1]).enter()
            .append("div")
            .attr("class", "tooltip")
            .style("display", "none")
            .style("position", "fixed");

        self.update = updateWithLoadingIcon(dragDropManager, startLoading, endLoading);
        self.updateWithData = updateWithData;

        return this;
    };

    var updateWithData = function(data, grps, options) {
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
        var xaxis = d3.svg.axis()
                .scale(x)
                .orient("bottom").ticks(5)
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

        // brush
        var brush = d3.brush()
                .x(x)
                .on("brush", brushed);

        var view = svg.selectAll('g.brush').data([1]);
        brush.clear();
        view.enter().append("g")
            .attr("class", "x brush")
            .call(brush).selectAll("rect")
            .attr("height", naviH);
        view.call(brush);
        //brush.event(svg.select('g.x.brush'));

        /* --------------------------------
         inner function
         --------------------------------*/
        // brushed
        function brushed() {
            var range = brush.empty()? x.domain() : brush.extent();
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
                source = "<table>" +
                    "<tbody>" +
                    '<tr><td>File</td><td><a target="_blank" href="{{ServerRelativeUrl}}">{{Name}}</a></td></tr>' +
                    "<tr><td>Effective Date</td><td>{{start}}</td></tr>" +
                    "<tr><td>Created</td><td>{{Created}}</td></tr>" +
                    "<tr><td>Last Update</td><td>{{Modified}}</td></tr>" +
                    "<tr><td>Sentiment</td><td>{{Sentiment}}</td></tr>" +
                    '<tr><td>Comments</td><td><textarea readonly="readonly">{{{Comments}}}</textarea></td></tr>' +
                    "</tbody>" +
                    "</table>";
                attrs['Modified'] = new Date(attrs['Modified']);
                attrs['start'] = new Date(attrs['start']);
                attrs['Created'] = new Date(attrs['Created']);
                html = Handlebars.compile(source)(attrs);
                tooltip.html(html);
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
                        template = Handlebars.compile("<td>{{t_date}}</td><td>{{Size position_size}}</td><td>{{price}}</td>")
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
                    var ViewModel = function() {
                        this.id = attrs['rid'];
                        this.security_id = ko.observable(attrs['security_id']);
                        this.target_px = ko.observable(attrs['target_px']);
                        this.best_scenario_px = ko.observable(attrs['best_scenario_px']);
                        this.worst_scenario_px = ko.observable(attrs['worst_scenario_px']);
                        this.target_prob = ko.observable(attrs['target_prob']);
                        this.best_scenario_prob = ko.observable(attrs['best_scenario_prob']);
                        this.worst_scenario_prob = ko.observable(attrs['worst_scenario_prob']);
                        this.description = ko.observable(attrs['description']);
                        this.t_date = ko.observable(attrs['t_date']);
                        this.good_til_date = ko.observable(attrs['good_til_date']);
                        this.analyst = ko.observable(attrs['analyst']);
                        this.statusText = ko.observable("");
                        this.title = null;
                        this.comments = ko.observable(attrs['comments']);
                        this.submit = function() {updateTarget.call(this, self, self.url, overlay);};
                        this.deleteRc = function() {deleteTarget.call(this, self, self.url, overlay);};
                        this.displayDel = true;
                        //this.valid = ko.pureComputed(valid_record, this);
                        this.valid = ko.pureComputed(valid_record, this);
                    }
                    $("body").append(overlay);
                    // ko.applyBindings(record, overlay[0]);
                    ko.applyBindings(new ViewModel(), overlay[0]);
                });
                return tooltip;
            }
            return tooltip;
        }

        function onSelect(properties) {
            var tooltip = d3.select(self).selectAll('div.tooltip');
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

    var updateWithLoadingIcon = function(dragDropManager, startLoading, endLoading) {
        var update = function(server_url, cid, options) {
            var self = this;
            dragDropManager.setOptions(options);
            self.url = server_url;
            self.reupdate = function() {self.update(server_url, cid, options)};
            startLoading();
            $.ajax({
                url: server_url + "/timeline_data",
                method: "GET",
                data: {
                    "url": "http://wfdb01:7777/sites/Research/",
                    "cid": cid},
                success: function(ret) {
                    // format each data point
                    endLoading();
                    var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                    self.secInfo = data['secinfo']
                    // data['data'] = JSON.parse(data['data'].replace(/\bNaN\b/g, "null"));
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
                            timelineDrawBack.call(self, {'server_url': server_url});
                        }};
                    // data['datagrp'].forEach(function(p){
                    //     p['subgroupStack'] = {'trading_records': true, 'Chong Liu': false, 'Jimmy Shi': true};
                    // });
                    self.updateWithData(data['data'], data['datagrp'], options);
                },
                error: function (error) {
                    endLoading();
                    alert("error!");
                }
            });
        };
        return update;
    }

    function getUserName() {
        var userid= _spPageContextInfo.userId;
        var requestUri = _spPageContextInfo.webAbsoluteUrl + "/_api/web/getuserbyid(" + userid + ")";
        var requestHeaders = { "accept" : "application/json;odata=verbose" };
        var userName = {};
        $.ajax({
            url : requestUri,
            contentType : "application/json;odata=verbose",
            headers : requestHeaders,
            success : function(data) {userName['value'] = data.d.Title;},
            error : function() {}
        });
        return userName
    };

    function createDlag() {
        var overlay = $('<div>');
        var removeDlg = function() {overlay.remove();}
        overlay.attr('id', 'OVER');
        overlay.html('<div class="tgt-px-dlg" style="width: 630px; height:500px;"></div>');

        var dlg = $('div.tgt-px-dlg', overlay);
        dlg.css("top", $(window).height()/2-210)
            .css('left', $(window).width()/2-315);
        dlg.draggable();
        dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative;clear:both"> \
               <h1 style="float: left;">Update price target</h1> <span id="TitleBtns" class="dlgTitleBtns" style="float: right"> \
                 <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                   <span style="padding:8px;height:16px;width:16px;display:inline-block"> \
                     <span style="height:16px;width:16px; position:relative; display:inline-block; overflow:hidden;" class="s4-clust"> \
                        <img src="/_layouts/15/images/fgimg.png?rev=23" alt="Close dialog" style="left:-0px !important;top:-645px !important;position:absolute;" class="ms-dlgCloseBtnImg"> \
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
                           <td><img src="/_layouts/15/images/loadingcirclests16.gif?rev=23" id="ImageProgress" style="display:none;"/> \
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
                    <td><h3>Security ID*</h3></td> \
                    <td colspan="2"><input class="sid" type="Text" data-bind="value: security_id, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Target Price*</h3></td> \
                    <td><input type="Text" data-bind="value: target_px, valueUpdate: \'afterkeydown\'"/></td> \
                    <td><input type="Text" data-bind="value: target_prob, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Best Price*</h3></td> \
                    <td><input type="Text" data-bind="value: best_scenario_px, valueUpdate: \'afterkeydown\'"/></td> \
                    <td><input type="Text" data-bind="value: best_scenario_prob, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Worst Price*</h3></td> \
                    <td><input type="Text" data-bind="value: worst_scenario_px, valueUpdate: \'afterkeydown\'"/></td> \
                    <td><input type="Text" data-bind="value: worst_scenario_prob, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Effective Date*</h3></td> \
                    <td colspan="2"><input type="date" data-bind="value: t_date, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Good Til Date*</h3></td> \
                    <td colspan="2"><input type="date" data-bind="value: good_til_date, valueUpdate: \'afterkeydown\'"/></td> \
                </tr><tr> \
                    <td><h3>Analyst*</h3></td> \
                    <td colspan="2"><input type="Text" data-bind="value: analyst, valueUpdate: \'afterkeydown\'"/></td> \
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
        // var userName = getUserName();
        var userName = "Chong"

        var self = this;
        $('div.vis-labelset div.grp1.Security', self).on('click', function(e) {
            e.preventDefault();
            var sid = $(this).text().split(":")[1];
            var overlay = createTgtPxDlag("Update price target");

            var ViewModel = function() {
                this.security_id = ko.observable(sid);
                this.description = ko.observable(self.secInfo[this.security_id()]);
                this.target_px = ko.observable(null);
                this.best_scenario_px = ko.observable(null);
                this.worst_scenario_px = ko.observable(null);
                this.target_prob = ko.observable(null);
                this.best_scenario_prob = ko.observable(null);
                this.worst_scenario_prob = ko.observable(null);
                this.t_date = ko.observable(d3.timeFormat('%Y-%m-%d')(new Date()));
                this.good_til_date = ko.observable(null);
                this.analyst = ko.observable(userName["value"]);
                this.title = null;
                this.comments = null;
                this.showDelete = false;
                this.statusText = ko.observable("");
                this.deleteRc = function() {deleteTarget.call(this, self, data['server_url'], overlay);};
                this.displayDel = false;
                this.submit = function() {submitNewTarget.call(this, self, data['server_url'], overlay);};
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
        if (!((parseFloat(self['target_prob']())+
               parseFloat(self['best_scenario_prob']())+
               parseFloat(self['worst_scenario_prob']())) == 1)) {
            self['statusText']("probability need to sum to 1");
            return false;
        } else {
            self['statusText']("");
        }

        var checkFields = [
            'security_id', 'target_px', 'best_scenario_px',
            'worst_scenario_px', 't_date', 'good_til_date', 'analyst']
        for (var i = 0, len = checkFields.length; i < len; i++) {
            if ((self[checkFields[i]]() == null) ||
                (self[checkFields[i]]() == ''))
                return false;
        }
        return true;
    }

    function submitNewTarget(tl, url, parent) {
        var data = this;
        var closeFn = parent.removeDlg;
        parent.start_loading()
        $.ajax({
            "url": "/services/post",
            "method": "POST",
            "type": "json",
            "data": {
                url: url + "/create_new_target_px",
                data: ko.toJSON(
                    {"data": data})},
            success: function(ret) {
                // format each data point
                parent.end_loading();
                var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                if (data['success']) {
                    parent.removeDlg();
                    tl.reupdate();
                } else {
                    alert(data['message']);
                }
            },
            error: function (error) {
                parent.end_loading();
                alert(error.statusText);
            }
        });
    }

    function updateTarget(tl, url, parent) {
        var data = this;
        var closeFn = parent.removeDlg;
        parent.start_loading()
        $.ajax({
            "url": "/services/post",
            "method": "POST",
            "type": "json",
            "data": {
                url: url + "/update_target_px",
                data: ko.toJSON(
                    {"data": data})},
            success: function(ret) {
                // format each data point
                parent.end_loading();
                var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                if (data['success']) {
                    d3.select(tl).selectAll('div.tooltip').style('display', 'none');
                    parent.removeDlg();
                    tl.reupdate();
                } else {
                    alert(data['message']);
                }
            },
            error: function (error) {
                parent.end_loading();
                alert(error.statusText);
            }
        });
    }

    function deleteTarget(tl, url, parent) {
        var data = this;
        var closeFn = parent.removeDlg;
        parent.start_loading()
        $.ajax({
            "url": "/services/post",
            "method": "POST",
            "type": "json",
            "data": {
                url: url + "/delete_target_px",
                data: ko.toJSON(
                    {"data": {'id': data['id']}})},
            success: function(ret) {
                // format each data point
                parent.end_loading();
                var data = JSON.parse(ret.replace(/\bNaN\b/g, "null"));
                if (data['success']) {
                    d3.select(tl).selectAll('div.tooltip').style('display', 'none');
                    parent.removeDlg();
                    tl.reupdate();
                } else {
                    alert(data['message']);
                }
            },
            error: function (error) {
                parent.end_loading();
                alert(error.statusText);
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

})(jQuery);
