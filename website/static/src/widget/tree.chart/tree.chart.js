(function($){
    $.fn.init_tree_chart = function(options) {
        var self = this;
        self.each(function(i, div) {
            d3.select(div).classed('tree-chart-div', true)
                .append('svg')
                .style('width', '100%')
                .style('height', '100%')
                .style('position', 'relative')
                .classed('tree-chart', true)
                .html(options.html || '');
            initialize.call(div, options);
            // div.open_option_setup = $('div', div)[0].open_option_setup;
        });

        self.updateWithData = function(data, args) {
            self.each(function(i, div) {
                div.updateWithData(data, args);
            })
        };

        self.resize = function() {
            self.each(function(i, div) {
                $('div', div)[0].resize();
            })
        };
        this.datasource = options.datasource;
        return self;
    };

    var initialize = function(options) {
        var self = this;
        self.options = options;
        init_options(self);

        self.updateWithData = function(data) {
            self.data = data;
            updateWithData.call(self, data, options)
        }

        d3.select(self).select('svg.tree-chart')
            .append('g')
            .attr('transform',
                  'translate('+self.options.margins.left+','+self.options.margins.top+')')
            .append('g').attr('id', 'nodes-group')
            .each(function() {
                d3.select(this).append('g').classed('links', true);
                d3.select(this).append('g').classed('nodes', true);
            });

    };

    function init_options(self) {
        self.options.margins = self.options.margins || {};
        self.options.margins.left = self.options.margins.left || 50;
        self.options.margins.right = self.options.margins.right || 50;
        self.options.margins.top = (self.options.margins.top + self.options.node_height/2) || 50;
        self.options.margins.bottom = (self.options.margins.bottom + self.options.node_height/2) || 50;
        self.options.node_width = self.options.node_width || 100;
        self.options.node_height = self.options.node_height || 50;
        self.options.click_nodes = self.options.click_nodes || function() {};
        self.options.dursec = self.options.dursec || 2;
        self.options.tooltip_display = self.options.tooltip_display || function() {return ""};
        self.options.max_font = self.options.max_font || 11;
    }

    function add_tooltip(data) {
        var self = this;
        var evt = d3.event;
        // add tooltip and guideline
        d3.select(self).selectAll('div.tooltip')
            .data([1]).enter()
            .append('div')
            .classed('tooltip', true).style('display', 'none')
            .append('table')
        var tooltip = d3.select(self).selectAll('div.tooltip');
        var tooltipTab = d3.select(self).selectAll('div.tooltip table');
        var dursec = self.options.dursec;
        tooltipTab.selectAll('*').remove();
        // data
        tooltipTab.append('tbody')
            .html(self.options.tooltip_display(data));

        var w = $(tooltip.node()).width();
        var h = $(tooltip.node()).height();
        var w_total = self.options.width;
        var h_total = $(self).height();
        var x = evt.pageX + 5;
        var y = evt.pageY - self.options.margins.top*2;
        var right_id = true;
        var down_id = true;

        tooltip
            .style("left", (x + 0) + "px")
            .style("top", (y + 0) + "px")
        tooltip
            .style('display', 'block')
            .transition()
            .style('opacity', 0.99);

    }

    function updateWithData(data) {
        var self = this;

        var treeLayout = d3.tree();
        var width = $(self).width() - self.options.margins.right - self.options.margins.left;
        var height = $(self).height() - self.options.margins.top - self.options.margins.bottom;
        var root = d3.hierarchy(data);
        treeLayout.size([width, height]);
        treeLayout(root);

        // Nodes
        var node_width = self.options.node_width;
        var node_height = self.options.node_height;
        var svg = d3.select(self).select('svg.tree-chart');
        svg.select('g.nodes').empty();
        svg.select('g.nodes')
            .selectAll('rect.node')
            .data(root.descendants())
            .enter()
            .each( function(d) {
                var grp = d3.select(this).append(
                    'g').classed('node nonscalable company-'+d.data.id, true)
                        .on('click', function(){
                            self.options.click_nodes.call(this, self, d)})
                        .on('mouseover mousemove', function(d) {
                            add_tooltip.call(self, d);
                        })
                        .on('mouseout', function(d) {
                            d3.select(self).select('div.tooltip')
                                .style('opacity', 0)
                                .style('display', 'none');
                        });
                grp.append('rect')
                    .attr('x', function(d) {return d.x - node_width/2;})
                    .attr('y', function(d) {return d.y - node_height/2;})
                    .attr('height', node_height)
                    .attr('width', node_width);
                grp.append('text').text(
                    function(d) {
                        return d.data.name;})
                    .attr('x', function(d) {return d.x-node_width/2;})
                    .attr('y', function(d) {return d.y;})
                    .style('font-size', function(d) {
                        d.textlength = this.getComputedTextLength();
                        return Math.min(node_width, (node_width - 8) / d.textlength * 14,
                                        self.options.max_font) + "px"; })
                    .attr('dx', function(d) {
                        var text_width = this.getComputedTextLength();
                        return (node_width - text_width) / 2;
                    })

            });
        self.options.rect_stroke_width = parseFloat($('g.node rect', self).css('stroke-width'));

        // Links
        svg.select('g.links').html('');
        svg.select('g.links')
            .selectAll('line.link')
            .data(root.links())
            .enter()
            .append('line')
            .classed('link', true)
            .attr('x1', function(d) {return d.source.x;})
            .attr('y1', function(d) {return d.source.y;})
            .attr('x2', function(d) {return d.target.x;})
            .attr('y2', function(d) {return d.target.y;});

        var zoomListener = d3.zoom().scaleExtent([0.5, 5]).on("zoom", zoom);
        svg.call(zoomListener);
        svg.on('dblclick.zoom', reset);

        var svgGroup = svg.select('svg #nodes-group');

        function zoom() {
            svgGroup.attr("transform", "translate(" +
                          d3.event.transform.x+","+d3.event.transform.y+
                          ")scale(" + d3.event.transform.k + ")");
            svg.selectAll('g.nonscalable')
                .data(root.descendants())
                .each( function(d) {
                    var scale = Math.max(d3.event.transform.k / (1.5 - 0.5 / d3.event.transform.k), 1);
                    d3.select(this).select('rect')
                        .attr('x', function(d) {return d.x - node_width/2/scale;})
                        .attr('y', function(d) {return d.y - node_height/2/scale;})
                        .attr('height', node_height/scale)
                        .attr('width', node_width/scale)
                        .style('stroke-width', self.options.rect_stroke_width / scale);
                    d3.select(this).select('text')
                        .attr('x', function(d) {return d.x-node_width/2/scale;})
                        .attr('y', function(d) {return d.y;})
                        .style('font-size', function(d) {
                            return Math.min(
                                node_width,
                                (node_width - 8) / d.textlength * 14, self.options.max_font)/scale + "px"; })
                        .attr('dx', function(d) {
                            var text_width = this.getComputedTextLength();
                            return (node_width/scale - text_width) / 2;
                        });
                });
        }

        function reset() {
            //zoomListener.transform(d3.select(self), d3.zoomIdentity);
            zoomListener.transform(svg, d3.zoomIdentity);
        }

        // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    };

})(jQuery);
