// zoomable datamaps implementation

function Zoom(args) {
    $.extend(this, {
        $buttons:   $(".zoom-button"),
        $info:      $("#zoom-info"),
        scale:      { max: 50, currentShift: 0 },
        $container: args.$container,
        datamap:    args.datamap
    });

    this.init();
}

Zoom.prototype.init = function() {
    var paths = this.datamap.svg.selectAll("path"),
        subunits = this.datamap.svg.selectAll(".datamaps-subunit");

    // preserve stroke thickness
    // paths.style("vector-effect", "non-scaling-stroke");

    // disable click on drag end
    subunits.call(
        d3.behavior.drag().on("dragend", function() {
            d3.event.sourceEvent.stopPropagation();
        })
    );

    this.scale.set = this._getScalesArray();
    this.d3Zoom = d3.behavior.zoom().scaleExtent([ 1, this.scale.max ]);

    this._displayPercentage(1);
    this.listen();
};

Zoom.prototype.listen = function() {
    this.$buttons.off("click").on("click", this._handleClick.bind(this));

    this.datamap.svg
        .call(this.d3Zoom.on("zoom", this._handleScroll.bind(this)))
        .on("dblclick.zoom", null); // disable zoom on double-click
};

Zoom.prototype.reset = function() {
    this._shift("reset");
};

Zoom.prototype._handleScroll = function() {
    var translate = d3.event.translate,
        scale = d3.event.scale,
        limited = this._bound(translate, scale);

    this.scrolled = true;

    this._update(limited.translate, limited.scale);
};

Zoom.prototype._handleClick = function(event) {
    var direction = $(event.target).data("zoom");

    this._shift(direction);
};

Zoom.prototype._shift = function(direction) {
    var center = [ this.$container.width() / 2, this.$container.height() / 2 ],
        translate = this.d3Zoom.translate(), translate0 = [], l = [],
        view = {
            x: translate[0],
            y: translate[1],
            k: this.d3Zoom.scale()
        }, bounded;

    translate0 = [
        (center[0] - view.x) / view.k,
        (center[1] - view.y) / view.k
    ];

  	if (direction == "reset") {
    	  view.k = 1;
        this.scrolled = true;
    } else {
    	  view.k = this._getNextScale(direction);
    }

    l = [ translate0[0] * view.k + view.x, translate0[1] * view.k + view.y ];

    view.x += center[0] - l[0];
    view.y += center[1] - l[1];

    bounded = this._bound([ view.x, view.y ], view.k);

    this._animate(bounded.translate, bounded.scale);
};

Zoom.prototype._bound = function(translate, scale) {
    var width = this.$container.width(),
        height = this.$container.height();
    if (this.bound) {
        translate[0] = Math.min(
            (width / height)  * (scale - 1),
            Math.max( width * (1 - scale), translate[0] )
        );

        translate[1] = Math.min(0, Math.max(height * (1 - scale), translate[1]));
    }
    return { translate: translate, scale: scale };
};

Zoom.prototype._update = function(translate, scale) {
    this.d3Zoom
        .translate(translate)
        .scale(scale);

    this.datamap.svg.selectAll("svg > g")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

    this.datamap.svg.select("g.circles").selectAll('circle.non-zoomable-circle')
        .attr('r', function(data) {
            return data.radius/scale * (1 + 0.001 * (scale - 1));
        })
        .style('stroke-width', function(data) {
            return data.borderWidth/scale + 'px';});

    this.datamap.svg.select("g.arrow").selectAll('path.non-zoomable-line')
        .style('stroke-width', 1/scale + 'px');

    this.datamap.svg.select("g.arrow").selectAll('path.nonzoomable-object')
        .attr('', function(data) {
            var self =this;
            var svg = d3.select(self);
            var transform = svg.attr("transform");
            var pattern = /scale\(.*?\)/;
            if (transform == null) {
                svg.attr('transform', "scale("+1/scale+")");
                return
            }
            transform = transform.match(pattern) == null ? transform + "scale("+1/scale+")" : transform.replace(pattern, "scale("+1/scale+")");
            svg.attr("transform", transform);
        });
       // .attr('transform', "scale(" + 1/scale + ")");

    this._displayPercentage(scale);
};

Zoom.prototype._animate = function(translate, scale) {
    var _this = this,
        d3Zoom = this.d3Zoom;

    d3.transition().duration(350).tween("zoom", function() {
        var iTranslate = d3.interpolate(d3Zoom.translate(), translate),
            iScale = d3.interpolate(d3Zoom.scale(), scale);

  		  return function(t) {
            _this._update(iTranslate(t), iScale(t));
        };
    });
};

Zoom.prototype._displayPercentage = function(scale) {
    var value;

    value = Math.round(Math.log(scale) / Math.log(this.scale.max) * 100);
    this.$info.text(value + "%");
};

Zoom.prototype._getScalesArray = function() {
    var array = [],
        scaleMaxLog = Math.log(this.scale.max);

    for (var i = 0; i <= 10; i++) {
        array.push(Math.pow(Math.E, 0.1 * i * scaleMaxLog));
    }

    return array;
};

Zoom.prototype._getNextScale = function(direction) {
    var scaleSet = this.scale.set,
        currentScale = this.d3Zoom.scale(),
        lastShift = scaleSet.length - 1,
        shift, temp = [];

    if (this.scrolled) {

        for (shift = 0; shift <= lastShift; shift++) {
            temp.push(Math.abs(scaleSet[shift] - currentScale));
        }

        shift = temp.indexOf(Math.min.apply(null, temp));

        if (currentScale >= scaleSet[shift] && shift < lastShift) {
            shift++;
        }

        if (direction == "out" && shift > 0) {
            shift--;
        }

        this.scrolled = false;

    } else {

        shift = this.scale.currentShift;

        if (direction == "out") {
            shift > 0 && shift--;
        } else {
            shift < lastShift && shift++;
        }
    }

    this.scale.currentShift = shift;

    return scaleSet[shift];
};

function Datamap(options) {
    var self = this;
  	this.$container = $(options.element);
    this.bound = options.bound || false;
  	this.instance = new Datamaps({

        scope: options.scope,
        element: this.$container.get(0),
        projection: options.projection || 'mercator',
        done: this._handleMapReady.bind(this),
        fills: options.fills || {defaultFill: '#ABDDA4'},
        data: options.data || {},
        geographyConfig:  options.geographyConfig,
        setProjection: options.setProjection || function() {}
  	});
    this.instance.wrapper = this;
    this.bubbles = function(bubbles, options) {
        self.instance.bubbles(bubbles, options);
    }

    this.arc = function(arcs, options) {
        self.instance.arc(arcs, options);
    }

    self.add_legend = function() {
        self.instance.legend();
    }

    self.addPlugin = function(a, b) {
        self.instance.addPlugin(a, b);
        self[a] = self.instance[a].bind(self.instance);
    }

    self.addPlugin('arrow', handleArrow);

    self.addPlugin('circles', handleCircle);

    // self.bubbles = self.instance.bubbles;
    //self.arc = self.instance.arc;
    this.legend = this.instance.legend;
}

Datamap.prototype._handleMapReady = function(datamap) {
    var self = this;
  	this.zoom = new Zoom({
    	  $container: this.$container,
    	  datamap: datamap
    });
    $('.datamaps-legend', self.$container).css('top', '5px');
}


function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
        context = optionsValue;
        optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
        return  null;
    }

    if ( typeof value === 'function' ) {
        var fnContext = [context];
        if ( context.geography ) {
            fnContext = [context.geography, context.data];
        }
        return value.apply(null, fnContext);
    }
    else {
        return value;
    }
};


function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
        if (source) {
            for (var prop in source) {
                if (obj[prop] == null) obj[prop] = source[prop];
            }
        }
    });
    return obj;
}


function handleArrow (layer, data, options) {
    var self = this,
        svg = this.svg;
    options.delay = options.animationSpeed || 100;
    options.group_class = options.group_class || 'datamaps-arrow';

    if ( !data || (data && !data.slice) ) {
        throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
        data[i] = defaults(data[i], data[i].options);
        delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
        options = {};
    }

    var arrow = layer.selectAll('g.'+options.group_class).data(data, JSON.stringify);

    var path = d3.geo.path()
            .projection(self.projection);

    function lineData(datum){        // i'm assuming here that supplied datum
        // is a link between 'source' and 'target'
        var originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum))
        var destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
        var line = d3.line()
                .x( function(point) { return point.lx; })
                .y( function(point) { return point.ly; });

        var points = [
            {lx: originXY[0], ly: originXY[1]},
            {lx: destXY[0], ly: destXY[1]}
        ];

        return line(points);
    }

    function drawArrow(datum) {
        var svg = this;
        // line
        var path = d3.select(svg).append('svg:path')
                .attr('class', 'datamaps-arrow-line non-zoomable-line')
                .style('stroke-linecap', 'round')
                .style('stroke', self.options.fills[datum.fillKey])
                .style('fill', 'none')
                .style('stroke-width', datum.strokeWidth)
                .attr('d', lineData)
                .style('fill', function(datum) {
                    var length = this.getTotalLength();
                    this.style.transition = this.style.WebkitTransition = 'none';
                    return 'none';
                });

        // triangle
        // var triangle_svg = d3.svg.symbol().type("triangle-down")();
        var triangle_svg = 'M0,-0L4,-14 -4,-14Z';
        var arrow = d3.select(svg).append('svg:path')
                .attr('class', 'datamaps-arrow-triangle nonzoomable-object')
                .attr("d", triangle_svg)
                .style('fill', self.options.fills[datum.fillKey]);

        arrow.transition()
            .duration(options.delay)
            .ease("linear")
            .attrTween("transform", translateAlong(path.node()))

        var totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(options.delay)
            .ease("linear")
            .attr("stroke-dashoffset", 0);

        function translateAlong(path) {
            var l = path.getTotalLength();
            var ps = path.getPointAtLength(0);
            var pe = path.getPointAtLength(l);

            var angl = Math.atan2(pe.y - ps.y, pe.x - ps.x) * (180 / Math.PI) - 90;
            var rot_tran = "rotate(" + angl + ")";
            return function(d, i, a) {
                // console.log(d);

                return function(t) {
                    var p = path.getPointAtLength(t * l);
                    return "translate(" + p.x + "," + p.y + ") " + rot_tran;
                };
            };
        }
    }

    arrow
        .enter()
        .append('g')
        .attr('class', options.group_class)
        .style('', drawArrow);

    arrow.exit()
        .transition()
        .style('opacity', 0)
        .remove();
}


function handleCircle (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;
    options.onclick = options.onclick || function() {}
    options.group_class = options.group_class || 'datamaps-bubble';

    if ( !data || (data && !data.slice) ) {
        throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.'+options.group_class).data( data, options.key );

    bubbles
        .enter()
        .append('svg:circle')
        .attr('class', options.group_class+' non-zoomable-circle')
        .attr('cx', function ( datum ) {
            var latLng;
            if ( datumHasCoords(datum) ) {
                latLng = self.latLngToXY(datum.latitude, datum.longitude);
            }
            else if ( datum.centered ) {
                latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
            if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
            var latLng;
            if ( datumHasCoords(datum) ) {
                latLng = self.latLngToXY(datum.latitude, datum.longitude);
            }
            else if ( datum.centered ) {
                latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
            if ( latLng ) return latLng[1];
        })
        .attr('r', function(datum) {
            // If animation enabled start with radius 0, otherwise use full size.
            return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(datum) {
            return JSON.stringify(datum);
        })
        .attr('filter', function (datum) {
            var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

            if (filterKey) {
                return filterKey;
            }
        })
        .style('stroke', function ( datum ) {
            return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
            return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('stroke-opacity', function ( datum ) {
            return val(datum.borderOpacity, options.borderOpacity, datum);
        })
        .style('fill-opacity', function ( datum ) {
            return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
            var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
            return fillColor || fillData.defaultFill;
        })
        .on('click', function ( datum ) {
            var $this = this;
            var object = self.wrapper
            options.onclick(object, $this, datum)
        })
        .on('mouseover', function ( datum ) {
            var $this = d3.select(this);

            if (options.highlightOnHover) {
                // Save all previous attributes for mouseout
                var previousAttributes = {
                    'fill':  $this.style('fill'),
                    'stroke': $this.style('stroke'),
                    'stroke-width': $this.style('stroke-width'),
                    'fill-opacity': $this.style('fill-opacity')
                };

                $this
                    .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
                    .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
                    .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum) / self.wrapper.zoom.d3Zoom.scale())
                    .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
                    .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
                    .attr('data-previousAttributes', JSON.stringify(previousAttributes));
            }

            if (options.popupOnHover) {
                self.updatePopup($this, datum, options, svg);
            }
        })
        .on('mouseout', function ( datum ) {
            var $this = d3.select(this);

            if (options.highlightOnHover) {
                //reapply previous attributes
                var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
                for ( var attr in previousAttributes ) {
                    $this.style(attr, previousAttributes[attr]);
                }
            }

            d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })

    bubbles.transition()
        .duration(400)
        .attr('r', function ( datum ) {
            return val(datum.radius, options.radius, datum);
        })
        .transition()
        .duration(0)
        .attr('data-info', function(d) {
            return JSON.stringify(d);
        });

    bubbles.exit()
        .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
        return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }
}
