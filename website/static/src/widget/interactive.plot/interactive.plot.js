(function($){
  $.fn.init_interactive_plot = function(options) {
    var self = this;
    self.each(function(i, div) {
      d3.select(div).append('div')
        .style('width', $(div).width() + 'px')
      //.style('height', '100%')
        .style('position', 'relative')
      initialize.call($('div', div)[0], options);
      div.options = options;
      div.open_option_setup = $('div', div)[0].open_option_setup;
    });

    self.updateWithData = function(data, args) {
      self.each(function(i, div) {
        $('div.interactive-plot', div)[0].updateWithData(data, args);
      })
    };

    self.resize = function() {
      self.each(function(i, div) {
        $('div', div)[0].resize();
      })
    };

    self.update = function() {
      var args = arguments;
      self.each(function(i, div) {
        $('div', div)[0].update.apply(
          $('div', div)[0], args);
      })
    };

    this.datasource = options.datasource;
    return self;
  };

  var initialize = function(options) {
    // unique id
    var self = this;
    self.options = options || {};
    $(self).addClass('interactive-plot');
    init_options(self);

    add_top_bar(self);
    add_main_panel(self);
    self.updateWithData = function(data) {
      data = self.options.preProcess(data);
      self.data = data;
      updateWithData.call(self, data, options)
    }
    self.resize = function() {
      resize.call(self);
    }
    self.open_option_setup = function() {
      var html = self.options['options']();
      var overlay = $('<div>');
      var removeDlg = function() {overlay.remove();}
      self.removeDlg = removeDlg;
      overlay.attr('id', 'OVER');
      overlay.html('<div class="tgt-px-dlg" style="width: 400px; height:auto;"></div>');

      var dlg = $('div.tgt-px-dlg', overlay);
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
                          <img src="./static/src/images/fgimg.png?rev=23" alt="Close dialog" \
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
  };

  function resize() {
    var self = this;
    $(self).html("");
    initialize.call(self, self.options);
    updateWithData.call(self, self.data, self.options);
  }

  function updatePlot() {
    var self = this;
    self.removeDlg();
    start_loading.call(self);
    var f = function(data) {
      end_loading.call(self);
      if (data == null)
        return;

      self.updateWithData(data);
    };

    self.options['update'].call(self, f);
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

  function init_options(self) {
    self.options['preProcess'] = self.options['preProcess'] || function (data) {return data;};
    self.options['processOption'] = self.options['processOption'] || function () {};

    self.options['dursec'] = self.options['dursec'] || 2;
    self.options['barheight'] = self.options['barheight'] || 18;
    self.options['margin'] = self.options['margin'] ||
      {top: 10, right: 2, bottom: 15, left: 2};
    self.options['width'] = $(self).width() - self.options.margin.left
      - self.options.margin.right;
    self.options.navigator['gradient'] = self.options.navigator['gradient'] || false;
    self.options.navigator['scale'] = self.options.navigator['scale'] || d3.scaleTime();

    self.options['naviH'] = self.options.naviH || 30;

    self.options['naviMargin'] = self.options['naviMargin'] ||
      {top: 5, bottom: 1};

    self.options['naviHeight'] = self.options['naviH'] - self.options['naviMargin'].top
      - self.options['naviMargin'].bottom;

    self.options['lines'] = self.options['lines'] || {data: []};
    self.options['bars'] = self.options['bars'] || {data: []};
    self.options['scatters'] = self.options['scatters'] || {data: []};
    self.options.scatters.attr = self.options.scatters.attr || function() {};
    self.options['fitcurve'] = self.options['fitcurve'] || {data: []};
    self.options['areas'] = self.options['areas'] || {data: []};

    self.options['options'] = self.options['options'] || function() {};
    self.options['update'] = self.options['update'] || function() {};
    self.options['buffer'] = {}
    self.update = self.options['update']

    self.options['zoombar'] = self.options['zoombar'] == null ? true :  self.options['zoombar'];
    self.options['legendbar'] = self.options['legendbar'] == null ? true : self.options['legendbar'];

    var n = self.options.zoombar + self.options.legendbar;
    self.options['height'] = $(self).height() - self.options.margin.top
      - self.options.margin.bottom - self.options.barheight * n
      - self.options.naviH;
    self.options['height'] -= self.options['heightOffset'] || 0;  // can't explain...

    // self.options['naviTop'] = self.options.height + self.options.margin.top +
    // self.options.margin.bottom + self.options.barheight * n;

    self.options['naviTop'] = 0;

    self.options['input_args'] = self.options['input_args'] || {};
    self.options['input_args']['submit'] = function() {updatePlot.call(self)};


    for (var y_key in self.options.yaxis) {
      var axis = self.options.yaxis[y_key]
      axis.fields = [];
      axis.domain_margin = axis.domain_margin || 0.1;
    }

    self.options.lines.data.forEach(function(p) {
      self.options.yaxis[p.axis].fields.push(p.field);
    });
    self.options.bars.data.forEach(function(p) {
      self.options.yaxis[p.axis].fields.push(p.field);
    });

    self.options.fitcurve.data.forEach(function(p) {
      self.options.yaxis[p.axis].fields.push(p.field);
    });

    self.options.areas.data.forEach(function(p) {
      self.options.yaxis[p.axis].fields.push(p.upper);
      self.options.yaxis[p.axis].fields.push(p.lower);
    });

    self.update_options_lines = update_options_lines;

    self.options.scatters.data.forEach(function(p) {
      self.options.yaxis[p.axis].fields.push(p.field);
    });
  }

  function update_options_lines(data) {
    var self = this;
    for (var y_key in self.options.yaxis) {
      var axis = self.options.yaxis[y_key];
      axis.fields = [];
    }
    self.options.lines.data = data
    self.options.lines.data.forEach(function(p) {
      self.options.yaxis[p.axis].fields.push(p.field);
    });
  }

  function updateWithData(data, options) {
    var self = this;
    remove_graph(self);

    add_legend(self);
    add_main_axis(self, data);
    add_navi_chart(self, data);
    add_tooltip(self, data);

    update_window(self, data);
  };

  function update_window(self, data) {
    var navi = data[self.options.navigator.field];
    if (self.options.navigator.default) {
      var [start, end] = self.options.navigator.default(navi.slice());
      self.drawBrush(start, end, false);
    }
  }

  function update_axis(self, data, start, end) {
    var svg = d3.select(self).select("g.canvas-main");
    var dursec = self.options.dursec;

    // x -- axis
    var navi = data[self.options.navigator.field];
    var index = data[self.options.xaxis.field];
    var xDomain = RangeDomain(index, navi, start, end);
    self.options.xaxis.scale.domain(xDomain);
    self.options.x_axis.scale(self.options.xaxis.scale);

    svg.select('.x.axis').transition()
      .attr('duration', dursec).call(self.options.x_axis);

    // y -axis
    for (var y_key in self.options.yaxis) {
      var axis = self.options.yaxis[y_key]
      var yData = getSubset(axis.fields, data);
      var yDomain = DataTransform(yData, navi, start, end)[1];
      axis.scale.domain(adjDomain(yDomain, axis.domain_margin));
      svg.select('.'+y_key+'.axis').transition()
        .attr('duration', dursec).call(axis.transform);
    }
  }

  function update_scatter(self, data, start, end) {
    if (self.options.scatters.data.length == 0)
      return;

    var svg = d3.select(self).select("g#plot-area")
    var index = data[self.options.xaxis.field];
    var navi = data[self.options.navigator.field]
    var dursec = self.options.dursec;

    var fields = self.options.scatters.data.map((x) => x.field);
    var axis = self.options.scatters.data.map((x) => x.axis);

    var scatterData = getSubset(fields, data);
    if (self.options.buffer.data_scatter == null) {
      var data_scatter = PruneData(scatterData, index, navi, axis)
      self.options.buffer.data_scatter = data_scatter;
      svg.selectAll('.scatter-holder').data(data_scatter)
        .enter()
        .each(function(d, i) {
          d3.select(this).append('g').attr('class', 'scatter-holder');
          d.map(function(p) {
            self.options.scatters.data[i].data_attr(p, data)});
        });
    }

    var dataTransSliced = self.options.buffer.data_scatter.map(function(d) {
      return sliceData2(d, start, end);
    });

    svg.selectAll('.scatter-holder').data(dataTransSliced)
      .transition().attr('duration', dursec)
      .each(function(d, i){
        var circles = d3.select(this).selectAll(".scatter").data(d);
        circles.enter().append("circle").attr("class", "scatter");
        circles.exit().transition().attr('duration', dursec).style('display', 'none');
        //circles.exit().remove();
        //d3.select(this).selectAll(".scatter").data(d)
        circles = d3.select(this).selectAll(".scatter").data(d);
        circles
          .transition().attr('duration', dursec)
          .each(function(d){
            var obj = this;
            // self.options.scatters.attr.call(obj, d, data);
            d3.select(obj)
              .attr("cx", function(d) {return self.options.xaxis.scale(d.index) || 0;})
              .attr("cy", function(d) {return self.options.yaxis[d.axis].scale(d.value) || 0;})
              .attr("r", self.options.scatters.data[d.i].radius || 2)
              .attr('fill', function(p, j) {
                var s = this;
                return self.options.scatters.data[i].color.call(s, j, p)})
              .style('display', 'inline')
              .style('stroke-width', 2)
              .style('stroke', function(d) {
                return "none";
              });
            self.options.scatters.data[i].point_attr.call(obj, d)
          });
      });
  }

  function update_bars(self, data, start, end) {
    var svg = d3.select(self).select("g#plot-area")
    var index = data[self.options.xaxis.field];
    var navi = data[self.options.navigator.field]
    var dursec = self.options.dursec;

    var fields = ((x)=>(x.reduce((a, b)=>[...a, b.field], [])))(self.options.bars.data);
    var axis = self.options.bars.data.map(function(x) {return x.axis});

    var barData = getSubset(fields, data);
    var dataTrans = PruneData(
      DataTransform(barData, navi, start, end)[0], index, navi, axis);

    var index_pos = index.map(function(x) {return self.options.xaxis.scale(x);});
    var bandWith = d3.min(index_pos.map(function(d, i) {return d - index_pos[i-1];}));

    var bars = svg.selectAll('.bar-holder').data(dataTrans);
    bars.enter().append('g').attr('class', 'bar-holder');

    svg.selectAll('.bar-holder').data(dataTrans)
      .transition().attr('duration', dursec)
      .each(function(d, i){
        var bars = d3.select(this).selectAll(".bar").data(d);
        bars.enter().append("rect").attr("class", "bar")
        d3.select(this).selectAll(".bar").data(d)
          .transition().attr('duration', dursec)
          .attr("x", function(d) {return self.options.xaxis.scale(d.index)-bandWith/2;})
          .attr("y", function(d) {return self.options[d.axis].scale(Math.max(0, d.value));})
          .attr("width", bandWith)
          .attr("height", function(d) {
            var scale = self.options[d.axis].scale
            return Math.abs(scale(d.value) - scale(0));
          })
          .attr('fill', self.options.bars.color(i));
        bars.exit().remove();
      });
  }

  function remove_graph(self) {
    d3.select(self).selectAll('.line-wrap').remove();
  }

  function update_lines(self, data, start, end) {
    var svg = d3.select(self).select("g#plot-area")
    var index = data[self.options.xaxis.field];
    var navi = data[self.options.navigator.field]
    var dursec = self.options.dursec;

    var fields = self.options.lines.data.map(function(x) {return x.field});
    var axis = self.options.lines.data.map(function(x) {return x.axis});
    var sort = self.options.lines.data.map(function(x) {return x.sort || false });

    var lineData = getSubset(fields, data);
    var dataTrans = PruneData(
      DataTransform(lineData, navi, start, end)[0], index, navi, axis);
    dataTrans = dataTrans.map(function(d, i) {
      if (sort[i]) {
        return d.sort(function(a, b) {return a.index - b.index;})
      } else {
        return d;
      }
    })

    var line = d3.line()
        .x(function(d, i) {
          return self.options.xaxis.scale(d.index); })
        .y(function(d) {
          return self.options.yaxis[d.axis].scale(d.value); })

    var lines = svg.selectAll('.line-wrap').data(dataTrans);
    lines.each(function(line_data, i) {
      d3.select(this).select('path.line')
        .attr("class", function() {
          return "line " + self.options.lines.data[i].field;})
        .transition().attr('duration', dursec)
        .attr("d", line(line_data));
      var config = self.options.lines.data[i];

      if (config.tag != null) {
        var index2val = {}
        line_data.forEach(function(p, i) {
          index2val[p.index] = p.value});
        var data_tags = (data[config.tag['field']]).filter(function(p, i) {
          if (p == null) {
            return false;
          }
          p.index = index[i];
          p.value = index2val[index[i]];
          return true;
        });
        d3.select(this).select("g.tags").selectAll(".tag").data(data_tags)
          .transition().attr('duration', dursec)
          .attr('transform',
                function(d) {
                  return 'translate('+ (self.options.xaxis.scale(d.index) || 0) + ',' +
                    (self.options.yaxis[self.options.lines.data[i].axis].scale(d.value) || 0) + ")"
                });
      }
    });

    lines.exit().remove();
    lines.enter()
      .each(function(line_data, i) {
        var crr_line_wrap = d3.select(this)
            .append('g').attr("class", "line-wrap");

        crr_line_wrap.append("path")
          .attr("class", function(p, _i) {
            return "line " + self.options.lines.data[i].field;})
          .attr("d", line)
          .style('fill', 'none')
          .style('stroke', function(p, _i) {return self.options.lines.data[i].color()});
        var config = self.options.lines.data[i]

        if (config.tag != null) {
          var index2val = {};
          var arc = function(d, i) {
            const data = config.tag.data(d);
            d3.select(this).append("polygon")
              .attr('class', "tag-"+(d.dir).toString())
              .attr("points",function(d) {
                return data['points'].map(function(d) {
                  return [d.x, d.y].join(",")}).join(" ");
              });
            d3.select(this).append('text')
              .style('font-size', data['text_info']['font_size'])
              .attr('x', data['text_info']['x'])
              .attr('y', data['text_info']['y'])
              .style('text-anchor', 'middle')
              .html(data['text_info']['font_text']);
            d3.select(this).append("polygon")
              .attr('class', "tag-hover")
              .style('opacity', '0')
              .attr("points",function(d) {
                return data['points'].map(function(d) {
                  return [d.x, d.y].join(",")}).join(" ");
              })
              .on('click', function() {
                d3.select(self).selectAll('div.tooltip-tag')
                  .data([1]).enter()
                  .append('div')
                  .attr('class', 'tooltip-tag')
                  .style('display', 'block')
                  .style('position', 'fixed');

                var tooltipTab = d3.select(self).selectAll('div.tooltip-tag');
                tooltipTab.html(data.tooltip());
                show_tooltip.call(self, tooltipTab, d3.event, 3);
              });
          }

          line_data.forEach(function(p, i) {
            index2val[p.index] = p.value});
          var data_tags = (data[config.tag['field']]).filter(function(p, i) {
            if (p == null) {
              return false;
            }
            p.index = index[i];
            p.value = index2val[index[i]];
            return true;
          });
          var tags = crr_line_wrap
              .append('g').attr('class', 'tags').selectAll('.tag').data(data_tags);
          tags.enter().append("g")
            .attr("class", "tag")
            .attr('transform',
                  function(d) {
                    return 'translate('+ (self.options.xaxis.scale(d.index) || 0) + ',' +
                      (self.options.yaxis[self.options.lines.data[i].axis].scale(d.value) || 0) + ")"
                  })
            .each(arc);
          tags.exit().transition().attr('duration', dursec).style('display', 'none');
          tags.attr(
            'transform',
            function(d) {
              return 'translate('+ (self.options.xaxis.scale(d.index) || 0) + ',' +
                (self.options.yaxis[self.options.lines.data[i].axis].scale(d.value) || 0) + ")"
            });

          crr_line_wrap.selectAll('.tag')
            .on('mouseover', function(d) {
              d3.select(this).style('stroke', 'black');
            }).on('mouseleave', function(d) {
              d3.select(this).style('stroke', 'none');
            });
          crr_line_wrap.selectAll('.tag polygon.tag-hover')
            .on('mouseover', function(d) {
              d3.select(this).style("cursor", "pointer");
            }).on('mouseleave', function(d) {
              d3.select(this).style("cursor", "default");
            });
        }
      });
  }

  function update_tags(self, data, start, end) {
    if (self.options.tags == null) {
      return
    }
    var svg = d3.select(self).select("g#plot-area")
    var index = data[self.options.xaxis.field];
    var navi = data[self.options.navigator.field]
    var dursec = self.options.dursec;

    var fields = self.options.tags.data.map(function(x) {return x.field});
    var axis = self.options.tags.data.map(function(x) {return x.axis});

    var tagsData = getSubset(fields, data);
    var dataTrans = PruneData(
      DataTransform(tagsData, navi, start, end)[0], index, navi, axis);


    var tags = svg.selectAll('.tags-holder').data(dataTrans)
    tags.enter().append('g').attr('class', 'tags-holder');
    tags.exit().remove();

    tags.selectAll('.tags-holder').data(dataTrans)
      .transition().attr('duration', dursec)
      .each(function(d, i) {
        var taglets = d3.select(this).selectAll(".tags").data(d);
        taglets.enter().append("circle").attr("class", "tag");
        taglets.exit().transition().attr('duration', dursec).style('display', 'none');
        d3.select(this).selectAll(".tag").data(d)
          .transition().attr('duration', dursec)
          .attr("cx", function(d) {return self.options.xaxis.scale(d.index) || 0;})
          .attr("cy", function(d) {return self.options[d.axis].scale(d.value) || 0;})
          .attr("r", 2);

      });
  }

  function update_areas(self, data, start, end) {
    var svg = d3.select(self).select("g#plot-area")
    var index = data[self.options.xaxis.field];
    var navi = data[self.options.navigator.field]
    var dursec = self.options.dursec;

    var fields = self.options.areas.data.map(function(x) {
      return x.upper}).concat(self.options.areas.data.map(function(x) {
        return x.lower}));

    var areafields = self.options.areas.data.map(function(x) {
      return {"upper": fields.indexOf(x.upper),
              "lower": fields.indexOf(x.lower)}});

    var axis = self.options.areas.data.map(function(x) {return x.axis});
    var sort = self.options.areas.data.map(function(x) {return x.sort || false });

    var areaData = getSubset(fields, data);
    var dataTrans = PruneAreaData(
      DataTransform(areaData, navi, start, end)[0], index, areafields, navi, axis);

    dataTrans = dataTrans.map(function(d, i) {
      if (sort[i]) {
        return d.sort(function(a, b) {return a.index - b.index;})
      } else {
        return d;
      }
    });

    var area = d3.area()
        .x(function(d, i) {
          return self.options.xaxis.scale(d.index);})
        .y0(function(d) {
          return self.options[d.axis].scale(d.upper); })
        .y1(function(d) {
          return self.options[d.axis].scale(d.lower); });

    var areas = svg.selectAll('.area').data(dataTrans)
    areas.transition().attr('duration', dursec).attr(
      "d", area);
    areas.enter().append('g').attr("class", "area-wrap")
      .append("path")
      .attr("class", function(p, i) {
        return "area " + self.options.areas.data[i].name})
      .attr("d", area)
      .style('fill', function(p, i) {
        return self.options.areas.color(i)})
      .style('stroke', 'none');

    areas.exit().remove();
  }

  function update_fitcurve(self, data, start, end) {
    if (self.options.fitcurve.data.length == 0)
      return

    var svg = d3.select(self).select("g#plot-area")
    var index = data[self.options.xaxis.field];
    var navi = data[self.options.navigator.field]
    var dursec = self.options.dursec;

    var fields = self.options.fitcurve.data.map(function(x) {return x.field});
    var axis = self.options.fitcurve.data.map(function(x) {return x.axis});

    var curveData = getSubset(fields, data);
    var dataTrans = PruneData(
      DataTransform(curveData, navi, start, end)[0], index, navi, axis);
    dataTrans = dataTrans.map(function(d) {
      return d.sort(function(a, b) {return a.index - b.index;})
    })

    var curve = d3.line()
        .x(function(d, i) {
          return self.options.xaxis.scale(d.index); })
        .y(function(d) {
          return self.options.yaxis[d.axis].scale(d.value); })

    var curves = svg.selectAll('.curve').data(dataTrans)
    curves.enter().append('g').attr("class", "curve-wrap")
      .append("path")
      .attr("class", function(p, i) {return "curve " + self.options.lines[i]})
    // svg.selectAll('.curve-wrap').data(dataTrans).exit().remove();

    svg.selectAll('g.curve-wrap .curve').data(dataTrans)
      .transition().attr('duration', dursec)
      .attr("d", curve)
      .style('fill', 'none')
      .style('stroke', function(p, i) {return self.options.fitcurve.data[i].color()});
  }

  function add_tooltip(self, data) {
    // add tooltip and guideline
    d3.select(self).selectAll('div.tooltip')
      .data([1]).enter()
      .append('div')
      .attr('class', 'tooltip').style('display', 'none')
      .append('table');
    var tooltipTab = d3.select(self).selectAll('div.tooltip table');
    var dursec = self.options.dursec;
    tooltipTab.selectAll('*').remove();
    tooltipTab.append('thead').append('a')
      .style('margin-left', '2px')
      .style('white-space', 'nowrap')
      .style('font-weight', 'bold');

    // lines
    tooltipTab.append('tbody')
      .attr('class', 'lines-tooltip');

    // bars
    tooltipTab.append('tbody')
      .attr('class', 'bars-tooltip');

    // scatter
    tooltipTab.append('tbody')
      .attr('class', 'scatter-tooltip');

    // fitcurve
    tooltipTab.append('tbody')
      .attr('class', 'fitcurve-tooltip');
    // fitcurve
    tooltipTab.append('tbody')
      .attr('class', 'areas-tooltip');

    var tooltip = d3.select(self).selectAll('div.tooltip');
    tooltip.active = false;
    d3.select(self).select("svg.chart-main g#plot-area")
      .selectAll('g.guideline')
      .data([1]).enter()
      .insert('g', ":first-child").attr('class', 'guideline');
    var pit = d3.select(self).selectAll('g.guideline');

    d3.select(self).select('g.canvas-main').on("mousemove", null).on("mouseleave", null);

    if ((self.options.lines.data.length != 0)) {
      d3.select(self).select('g.canvas-main').on("mousemove", function(d) {
        var index = data[self.options.xaxis.field].slice()
            .sort(function(x,y) {return x-y});
        tooltip.active = true;
        var axis = d3.mouse(this);
        var xax = axis[0];
        var yax = axis[1];
        if (xax < 0) {return false;};
        var pivot = xAxisTrans(index, self.options.xaxis.scale);
        var ref_nd = referenceNode2(pivot, xax);
        xax = pivot[ref_nd];
        // guideline
        pit.selectAll('*').remove();
        pit.append('line').attr('class', 'guideline')
          .attr('x1', xax).attr('y1', self.options.height)
          .attr('x2', xax).attr('y2', 0)
          .attr('opacity', 0.8);

        // lines tooltip
        add_lines_tooltip.call(self, tooltip, pit, data, xax, ref_nd, index[ref_nd]);

        tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
      }).on("mouseleave", function(d) {
        tooltip.active = false;
        pit.selectAll('*').remove();
        tooltip.transition()
          .attr('duration', dursec)
          .style("opacity", 0)
          .style("display", "none")
      });
    }

    if ((self.options.fitcurve.data.length != 0)) {
      d3.select(self).select('g.canvas-main').on("mousemove", function(d) {
        var index = data[self.options.xaxis.field].slice();
        var navi = data[self.options.navigator.field].slice();
        var fields = self.options.fitcurve.data.map(function(x) {return x.field});
        var yaxis = self.options.fitcurve.data.map(function(x) {return x.axis});

        var curveData = getSubset(fields, data);
        var dataTrans = PruneData(curveData, index, navi, yaxis).map(function(d) {
          return d.sort(function(a, b) {return a.index - b.index;})
        });

        var indexSort = dataTrans[0].map(function(p) {return p.index});
        tooltip.active = true;
        var axis = d3.mouse(this);
        var xax = axis[0];
        var yax = axis[1];
        if (xax < 0) {return false;};
        var pivot = xAxisTrans(indexSort, self.options.xaxis.scale);
        var ref_nd = referenceNode2(pivot, xax);
        xax = pivot[ref_nd];
        // guideline
        pit.selectAll('*').remove();
        pit.append('line').attr('class', 'guideline')
          .attr('x1', xax).attr('y1', self.options.height)
          .attr('x2', xax).attr('y2', 0)
          .attr('opacity', 0.8);

        add_fitcurve_tooltip.call(self, tooltip, pit, dataTrans, xax, ref_nd, indexSort[ref_nd]);

        tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
      }).on("mouseleave", function(d) {
        tooltip.active = false;
        pit.selectAll('*').remove();
        tooltip.transition()
          .attr('duration', dursec)
          .style("opacity", 0)
          .style("display", "none")
      });
    }

    if (self.options.bars.data.length != 0) {
      d3.select(self).selectAll('g.canvas-main g.bar-holder .bar')
        .on("mouseover", function(d, evt) {
          tooltip.active = true;
          tooltip.selectAll("thead a")
            .style('width', '100%')
            .html(self.options.xaxis.tooltipfmt(d.navi));

          d3.select(this).style('stroke', 'red');
          add_bars_tooltip.call(self, tooltip, pit, d);
          tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
        }).on("mouseout", function(d) {
          tooltip.active = false;
          d3.select(this).style('stroke', "none");
          tooltip.select('tbody.bars-tooltip').html("");
          tooltip.transition()
            .attr('duration', dursec)
            .style("opacity", 0)
            .style("display", "none")
        });
    }

    if ((self.options.areas.data.length != 0)) {
      d3.select(self).select('g.canvas-main .area-wrap').on("mousemove", function(d) {
        var index = data[self.options.xaxis.field].slice()
            .sort(function(x,y) {return x-y});
        tooltip.active = true;
        var axis = d3.mouse(this);
        var xax = axis[0];
        var yax = axis[1];
        if (xax < 0) {return false;};
        var pivot = xAxisTrans(index, self.options.xaxis.scale);
        var ref_nd = referenceNode2(pivot, xax);
        xax = pivot[ref_nd];

        // area tooltip
        add_areas_tooltip.call(
          self, tooltip, pit, data, xax, ref_nd, index[ref_nd]);

        tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
      }).on("mouseleave", function(d) {
        tooltip.active = false;
        d3.select(this).style('stroke', "none");
        tooltip.select('tbody.areas-tooltip').html("");
        tooltip.transition()
          .attr('duration', dursec)
          .style("opacity", 0)
          .style("display", "none")
      });
    }

    if (self.options.scatters.data.length != 0) {
      d3.select(self).selectAll('g.canvas-main g.scatter-holder .scatter')
        .on("mouseover", function(d, evt) {
          tooltip.active = true;
          tooltip.selectAll("thead a")
            .style('width', '100%')
            .html(self.options.navigator.tooltipfmt(d.navi));

          d3.select(this).style('stroke', d3.select(this).style('fill'));
          d3.select(this).style('stroke-width', (parseFloat(d3.select(this).attr('r')) || 2) * 2);
          add_scatter_tooltip.call(self, tooltip, d);
          tooltip.active && show_tooltip.call(self, tooltip, d3.event, dursec);
        }).on("mouseout", function(d) {
          tooltip.active = false;
          d3.select(this).style('stroke', "none");
          d3.select(this).style('stroke-width', null);

          tooltip.select('tbody.scatter-tooltip').html("");
          tooltip.transition()
            .attr('duration', dursec)
            .style("opacity", 0)
            .style("display", "none")
        }).on("dblclick", function(d) {
          self.options.scatters.data[d.i].dblclick.call(this, d);
        });
    }
  }

  function show_tooltip(tooltip, evt, dursec) {
    // tooltip
    var self = this;
    var w = $(tooltip.node()).width();
    var h = $(tooltip.node()).height();
    var w_total = self.options.width;
    var h_total = $(self).height();
    var x = evt.pageX - $(this).offset().left;
    var y = evt.pageY - $(this).offset().top;
    var right_id = true;
    var down_id = true;

    if ((x + w) > w_total) right_id = false;
    if ((y + h + 20) > h_total) down_id = false;

    tooltip
      .style(
        "left",
        (right_id ? (evt.pageX + 10):
         (evt.pageX - w - 10)) + "px")
      .style("top", (down_id ? (evt.pageY + 30):
                     (evt.pageY - h - 30)) + "px")
      .style("padding-left", "0px")
      .style("padding-right", "5px")
    tooltip.transition()
      .attr('duration', dursec)
      .style('opacity', 0.99)
      .style('display', 'block');
  }

  function add_bars_tooltip(tooltip, pit, data) {
    var self = this;
    tooltip.select('tbody.bars-tooltip').html("");
    tooltip.select('tbody.bars-tooltip')
      .selectAll('tr.datum')
      .data([data]).enter()
      .append('tr').attr('class', 'datum')

    tooltip.select('tbody.bars-tooltip')
      .selectAll('tr.datum').data([data])
      .each(function(d, i) {
        d3.select(this)
          .append('td').attr('class', 'sym')
          .append('svg')
          .style('width', 14)
          .style('height', 14)
          .append('circle')
          .attr('r', 4).attr('cx', 7)
          .attr('cy', 7)
          .style('fill', self.options.bars.color(d.i, d.j));
        d3.select(this)
          .append('td').attr('class', 'val')
          .html(function(d) {
            return self.options[d.axis].tooltipfmt(d.value);
          });
      });
  }

  function add_scatter_tooltip(tooltip, data) {
    var self = this;
    tooltip.select('tbody.scatter-tooltip').html("");
    tooltip.select('tbody.scatter-tooltip')
      .selectAll('tr.datum')
      .data([data]).enter()
      .append('tr').attr('class', 'datum')

    tooltip.select('tbody.scatter-tooltip')
      .selectAll('tr.datum').data([data])
      .each(function(d, i) {
        if (self.options.scatters.data[d.i].tooltipfmt != null) {
          self.options.scatters.data[d.i].tooltipfmt.call(this, self, d, i);
        } else {
          d3.select(this)
            .append('td').attr('class', 'sym')
            .append('svg')
            .style('width', 14)
            .style('height', 14)
            .append('circle')
            .attr('r', 4).attr('cx', 7)
            .attr('cy', 7)
            .style('fill', self.options.scatters.data[d.i].color(d.j, d));
          d3.select(this)
            .append('td').attr('class', 'val')
            .html(function(d) {
              return self.options.xaxis.tooltipfmt(d.index);
            });
          d3.select(this)
            .append('td').attr('class', 'val')
            .html(function(d) {
              return self.options[d.axis].tooltipfmt(d.value);
            });
        }
      });
  }

  function add_lines_tooltip(tooltip, pit, data, xax, ref_nd, indx) {
    var self = this;

    tooltip.selectAll("thead a")
      .style('width', '100%')
      .html(self.options.xaxis.tooltipfmt(indx));

    var data_filtered = self.options.lines.data.filter((x) => (x.show_tooltip))
    var fields = data_filtered.map(function(x) {return x.field});
    var colors = data_filtered.map(function(x) {return x.color()});
    var axis = data_filtered.map(function(x) {return x.axis});
    // data
    var datum = getSubset(fields, data).map(function(p, i) {
      return {'index': indx,
              'value': p[ref_nd],
              'color': colors[i],
              'name': data_filtered[i].field,
              'axis': self.options.yaxis[data_filtered[i].axis]};
    });

    tooltip.select('tbody.lines-tooltip').html("");
    tooltip.select('tbody.lines-tooltip')
      .selectAll('tr.datum')
      .data(datum).enter()
      .append('tr').attr('class', 'datum');

    tooltip.select('tbody.lines-tooltip')
      .selectAll('tr.datum').data(datum)
      .each(function(d, i) {
        d3.select(this)
          .append('td').attr('class', 'sym')
          .append('svg')
          .style('width', 14)
          .style('height', 14)
          .append('circle')
          .attr('r', 4).attr('cx', 7)
          .attr('cy', 7)
          .style('fill', function(p) {
            return d.color});
        d3.select(this)
          .append('td').attr('class', 'val')
          .html(function(p) {
            return d.axis.tooltipfmt(d.value);
          });
      });
    // add circle to guideline
    pit.selectAll("circle").data(datum)
      .enter().append("circle")
      .attr("r", 4)
      .attr("class", function(d) {return d.name})
      .attr("cx", function(d) { return xax})
      .attr("cy", function(d) {
        return d.axis.scale(d.value)})
      .attr("opacity", 0.9)
      .style("fill", function(d, i) {return d.color})
  }

  function add_areas_tooltip(tooltip, pit, data, xax, ref_nd, indx) {
    var self = this;

    tooltip.selectAll("thead a")
      .style('width', '100%')
      .html(self.options.xaxis.tooltipfmt(indx));

    var fields = self.options.areas.data.map(function(x) {
      return x.upper}).concat(self.options.areas.data.map(function(x) {
        return x.lower}));
    var axis = self.options.areas.data.map(function(x) {return x.axis});

    // data
    var areaData = getSubset(fields, data);
    var areafields = self.options.areas.data.map(function(x) {
      return {"upper": fields.indexOf(x.upper),
              "lower": fields.indexOf(x.lower)}});

    var datum = areafields.map(function(p, i) {
      return {'index': indx,
              'upper': areaData[p.upper][ref_nd],
              'lower': areaData[p.lower][ref_nd],
              'name': self.options.areas.data[i].name,
              'axis': self.options[self.options.areas.data[i].axis]};
    });

    tooltip.select('tbody.areas-tooltip').html("");
    tooltip.select('tbody.areas-tooltip')
      .selectAll('tr.datum')
      .data(datum).enter()
      .append('tr').attr('class', 'datum');

    tooltip.select('tbody.areas-tooltip')
      .selectAll('tr.datum').data(datum)
      .each(function(d, i) {
        d3.select(this)
          .append('td').attr('class', 'sym-area')
          .append('svg')
          .style('width', 14)
          .style('height', 14)
          .append('rect')
          .attr('x', 3)
          .attr('y', 3)
          .attr('width', 12)
          .attr('height', 8)
          .style('fill', function(p) {
            return self.options.areas.color(i)});
        d3.select(this)
          .append('td').attr('class', 'val')
          .html(function(p) {
            return "["+d.axis.tooltipfmt(d.lower);
          });
        d3.select(this)
          .append('td').attr('class', 'val')
          .html(function(p) {
            return d.axis.tooltipfmt(d.upper)+"]";
          });
      });
  }

  function add_fitcurve_tooltip(tooltip, pit, data, xax, ref_nd, indx) {
    var self = this;

    var fields = self.options.fitcurve.data.map(function(x) {return x.field});
    var axis = self.options.fitcurve.data.map(function(x) {return x.axis});
    // data
    var datum = data.map(function(p, i) {
      // p = p.sort(function(x, y) {return (x.index - y.index)});
      return {'index': indx,
              'value': p[ref_nd].value,
              'name': self.options.fitcurve.data[i].field,
              'axis': self.options.yaxis[self.options.fitcurve.data[i].axis]};
    });

    tooltip.select('tbody.fitcurve-tooltip').html("");
    tooltip.select('tbody.fitcurve-tooltip')
      .selectAll('tr.datum')
      .data(datum).enter()
      .append('tr').attr('class', 'datum');

    tooltip.select('tbody.fitcurve-tooltip')
      .selectAll('tr.datum').data(datum)
      .each(function(d, i) {
        if (self.options.fitcurve.data[i].tooltipfmt != null) {
          self.options.fitcurve.data[i].tooltipfmt.call(this, self, d, i);
        } else {
          d3.select(this)
            .append('td').attr('class', 'sym')
            .append('svg')
            .style('width', 14)
            .style('height', 14)
            .append('circle')
            .attr('r', 4).attr('cx', 7)
            .attr('cy', 7)
            .style('fill', function(p) {
              return self.options.fitcurve.data[i].color()});
          d3.select(this)
            .append('td').attr('class', 'val')
            .html(function(p) {
              return self.options.xaxis.tooltipfmt(d.index);
            });
          d3.select(this)
            .append('td').attr('class', 'val')
            .html(function(p) {
              return d.axis.tooltipfmt(d.value);
            });
        }
      });
    // add circle to guideline
    pit.selectAll("circle").data(datum)
      .enter().append("circle")
      .attr("r", 4)
      .attr("class", function(d) {return d.name})
      .attr("cx", function(d) { return xax})
      .attr("cy", function(d) {
        return d.axis.scale(d.value)})
      .attr("opacity", 0.9)
      .style("fill", function(d, i) {return self.options.fitcurve.data[i].color()})
  }

  function add_main_axis(self, data) {
    var dursec = self.options.dursec;
    var svg = d3.select(self).select("g.canvas-main");
    // x axis
    self.options.xaxis.scale.range([0, self.options.width])
    self.options.x_axis = d3.axisBottom()
      .scale(self.options.xaxis.scale)
      .ticks(5)
      .tickSizeInner(-self.options.height)
      .tickSizeOuter(0)
      .tickFormat(self.options.xaxis.fmt);

    // add/change x axis
    //svg.selectAll('.x.axis')
    //    .transition().attr('duration', dursec).call(self.options.x_axis);
    svg.selectAll('.x.axis')
      .data([1]).enter().append('g').attr('class', 'x axis')
      .attr('transform', 'translate(0,' + self.options.height + ')')

    // y axis
    for (var y_key in self.options.yaxis) {
      var axis = self.options.yaxis[y_key]
      axis.scale.range([self.options.height, 0])
      var y_axis = d3.axisRight()
          .scale(axis.scale)
          .ticks(8)
          .tickFormat(axis.fmt)
          .tickSizeInner(axis.pos.call(self))
          .tickSizeOuter(0);

      axis.transform = (function(y_axis, y_key, axis) {
        var axis_adj = function(x) {
          y_axis(x);
          x.selectAll('.'+y_key+'.axis.yaxis .tick text')
            .attr('class', axis.anchor+'-yaxis-text')
            .attr('x', axis.pos.call(self)).attr('y', -5)
            .attr("xml:space", "preserve");
          //.attr("textLength", 30);
        }
        axis_adj.scale = function(x) {axis.scale(x)};
        return axis_adj;
      })(y_axis, y_key, axis);
      svg.selectAll('.' + y_key + '.axis.yaxis')
        .data([1]).enter().append('g').attr('class', y_key + ' axis yaxis')
    }
  }

  function add_main_panel(self) {
    // svg main object
    var guid = uuidv4();
    d3.select(self) //.append("div").style("display", "inline-block").style("position", "absolute")
      .selectAll("svg.chart-main")
      .data([1]).enter()
      .append("svg")
      .attr("width", self.options.width + self.options.margin.left + self.options.margin.right)
      .attr("height", self.options.height + self.options.margin.top + self.options.margin.bottom)
      .attr("class", "chart-main")
      .append('g').attr("class", "canvas-main")
      .attr("transform", "translate(" + self.options.margin.left + ", " + self.options.margin.top + ")")
      .append('g').attr('clip-path', 'url(#plotAreaClip-' + guid + ')')
      .attr('id', 'plot-area').on('click', function() {
        d3.select(self).selectAll('div.tooltip-tag').style('display', 'none');
      });
    //.style("top", self.options.barheight)
    // .style("top", self.options.height + self.options.margin.top + self.options.margin.bottom)

    // clip plot area
    d3.select(self).select("g#plot-area")
      .selectAll('clipPath').data([1]).enter()
      .append('clipPath').attr('id', 'plotAreaClip-'+guid)
      .append('rect')
      .attr('width', self.options.width)
      .attr('height', self.options.height)
      .attr('z-index', 10);
    // var plotClip = $(this).find("clippath#plotAreaClip rect");
    var plotClip = d3.select(self).select("g#plot-area")
        .selectAll('rect.plot-area').data([1])
        .enter().append('rect').attr('class', 'plot-area')
        .attr('width', self.options.width)
        .attr('height', self.options.height)
        .attr('opacity', 0);
  }

  function add_top_bar(self) {
    self.options.zoombar && add_zoom_bar(self);
    self.options.legendbar && add_legend_bar(self);
  }

  function add_legend_bar(self) {
    // legend
    var bar = d3.select(self)
        .selectAll("div.top-legend-bar").data([1]).enter()
        .append("div")
        .attr("class", function(p) {
          return "top-bar top-legend-bar";})
        .style("margin-left", self.options.margin.left+'px')
        .style("margin-right", self.options.margin.right+'px')
        .style("margin-bottom", '0px')
        .style('height', self.options.barheight+'px')
        .style('display', 'flex');

    var legend = bar
        .selectAll('div.legend-bar')
        .data([1]).enter()
        .append('div')
        .attr('class', 'legend-bar')
        .style('display', 'flex')
        .style('float', 'left')
        .style('height', '100%')
        .style('width', '100%');
    // self.options['legend'] = legend;
  }

  function add_zoom_bar(self) {
    var top_bar = d3.select(self)
        .selectAll("div.top-zoom-bar").data([1]).enter()
        .append("div")
        .attr("class", function(p) {
          return "top-bar top-zoom-bar";})
        .style("margin-left", '0px')
        .style("margin-right", '0px')
        .style("margin-bottom", '0px')
        .style('height', self.options.barheight+'px')
        .style('display', 'flex');
    var top_bar_left = top_bar.append('div')
        .style('display', 'flex')
        .style('width', '100%')
        .style('flex-direction', 'row')
        .attr('id', 'zoom-bar-holder');

    // zoom section
    var zoom = top_bar_left
        .selectAll('table.zoom')
        .data([1]).enter()
        .append('table').attr('class', 'zoom')
        .style('width', '170px')
        .style('height', '100%')
        .append('tr');
    zoom.append('td').html('zoom:').style('font-weight', 'bold')
      .style('width', '32px');
    zoom.append('td').attr('class', 'zoom-scale').html('1d').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = (function (dates, ref) {
          for (var i=0; i<dates.length; i++) {
            if (dates[i] >= ref) {
              return i>=1 ? dates[i-1] : ref;
            };
          };
        })(self.options.index, end)
        self.drawBrush(start, end)});

    zoom.append('td').attr('class', 'zoom-scale').html('mtd').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = new Date(end);
        start.setDate(0);
        self.drawBrush(start, end)});
    zoom.append('td').attr('class', 'zoom-scale').html('1m').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = new Date(end);
        start.setMonth(end.getMonth()-1);
        self.drawBrush(start, end)});
    zoom.append('td').attr('class', 'zoom-scale').html('3m').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = new Date(end);
        start.setMonth(end.getMonth()-3);
        self.drawBrush(start, end)});
    zoom.append('td').attr('class', 'zoom-scale').html('ytd').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = new Date(end);
        start.setFullYear(end.getFullYear()-1);
        start.setMonth(11);
        start.setDate(31);
        self.drawBrush(start, end)});
    zoom.append('td').attr('class', 'zoom-scale').html('1y').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = new Date(end);
        start.setFullYear(end.getFullYear()-1);
        self.drawBrush(start, end)});
    zoom.append('td').attr('class', 'zoom-scale').html('3y').on(
      'click', function() {
        var end = self.options.index[self.options.index.length-1];
        var start = new Date(end);
        start.setFullYear(end.getFullYear()-3);
        self.drawBrush(start, end)});

    // time frame
    var time_frame = top_bar_left
        .selectAll('div.time-frame')
        .data([1]).enter()
        .append('div')
        .style('display', 'flex')
        .attr('class', 'time-frame')
        .style('height', '100%')
        .style('width', '150px');
    time_frame.append('tr')
      .style('display', 'table')
      .style('vertical-align', 'middle')
      .style('height', '100%')
      .style('width', '100%');
    time_frame.select('tr')
      .append('td')
      .style('height', '80%')
      .style('width', '45%')
      .append('input')
      .attr('id', 'start-date')
      .style('width', '100%')
    //.attr('pattern', "(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d")
      .attr("placeholder", "mm/dd/yyyy");
    time_frame.select('tr')
      .append('td')
      .style('height', '80%')
      .style('width', '10%')
      .style('text-align', 'center')
      .html('-');
    time_frame.select('tr')
      .append('td')
      .style('height', '80%')
      .style('width', '45%')
      .append('input')
      .style('width', '100%')
      .attr('id', 'end-date')
    //.attr('pattern', "(0[1-9]|1[0-9]|2[0-9]|3[01])/(0[1-9]|1[012])/[0-9]{4}")
      .attr("placeholder", "mm/dd/yyyy");
    $(self).find('div.time-frame input')
      .on("keydown keypress", function(event) {
        if (event.which == 13) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }
      })
      .on("keyup", function(event) {
        if (event.which == 13) {
          var tfmt = self.options.navigator.domainfmt;
          var start = $(self).find('div.time-frame input#start-date').val();
          var end = $(self).find('div.time-frame input#end-date').val();
          self.drawBrush(tfmt.parse(start), tfmt.parse(end))};
      });
  }

  function add_navi_chart(self, data) {
    // svg navigative object
    d3.select(self)
      .selectAll("svg.chart-navigator")
      .data([1]).enter()
      .append("svg")
      .attr("class", "chart-navigator")
      .style("top", self.options.naviTop+"px")
      .attr("width", self.options.width  + self.options.margin.left + self.options.margin.right)
      .attr("height", self.options.naviH)
      .append('g').attr("class", "canvas-navigator")
      .attr("transform", "translate(" + self.options.margin.left +
            ", " + self.options.naviMargin.top + ")");
    self.options.navigator.gradient && add_gradient_background(self, data);

    var svg = d3.select(self).select("g.canvas-navigator");
    var navi = data[self.options.navigator.field];
    var x_range = d3.extent(navi);

    var navXScale = self.options.navigator.scale
        .range([0, self.options.width])
        .domain(d3.extent(x_range));

    var navXAxis = d3.axisBottom()
        .scale(navXScale)
        .ticks(5)
        .tickSizeInner(-self.options.naviHeight)
        .tickSizeOuter(-self.options.naviHeight)
        .tickFormat(self.options.navigator.fmt);

    var navXAxisAdj = function(x) {
      navXAxis(x);
      x.selectAll('.x.axis .tick text')
        .attr('x', 20).attr('y', -10);
    }

    // x axis draw or adjust
    svg.selectAll('g.x.axis').data([1]).enter()
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + self.options.naviHeight + ')');
    svg.selectAll('g.x.axis').call(navXAxisAdj);

    svg.selectAll('g.axis')
      .selectAll('line.upper-line')
      .data([data[0]]).enter()
      .append("line").attr("class", "upper-line")
      .attr("x2", self.options.width)
      .attr("y2", 0).attr('transform', 'translate(0,'+ -self.options.naviHeight +')');

    // plot area if possible
    if (self.options.navigator.plotarea != null) {
      var field = self.options.navigator.plotarea;
      var lineData = data[self.options.navigator.field].map(function(p, i) {
        return {index: p,
                value: data[field][i]}
      });

      var y_range = d3.extent(data[self.options.navigator.plotarea]);
      var navYScale = d3.scaleLinear()
          .range([self.options.naviHeight, 0])
          .domain(d3.extent(y_range));
      var navArea = d3.area()
          .x(function(d) {
            return navXScale(d.index); })
          .y0(self.options.naviHeight)
          .y1(function(d) {
            return navYScale(d.value); });
      var dursec = self.options.dursec;
      var navAreas = svg.selectAll('.area').data([lineData]);
      navAreas.transition().attr('duration', dursec).attr("d", navArea);
      navAreas.enter().append('g').attr("class", "area-wrap")
        .append("path")
        .attr("class", function(p, i) {return 'area port'})
        .attr("d", navArea);
    }

    var dataTrans = [];

    var brush = d3.brushX()
        .extent([[0, 0], [self.options.width, self.options.naviHeight]])
        .on("brush end", function() {brushed.call(self, data, brush, true)});

    svg.selectAll('g.brush').data([1]).enter().append("g")
      .attr("class", "x brush");
    var view_brush = svg.selectAll('g.brush').call(brush);
    // update brush

    view_brush.call(brush.move, null);

    self.drawBrush = drawBrush;
    function drawBrush(start, end) {
      view_brush.call(brush.move, [
        self.options.navigator.scale(start),
        self.options.navigator.scale(end)]).transition().delay(50);
    }
  }

  function add_gradient_background(self, data) {
    var svg = d3.select(self).select("g.canvas-navigator");
    var uuid = uuidv4();
    var svgDefs = svg.append('defs');
    var naviGradient = svgDefs.append('linearGradient')
        .attr('id', uuid);
    var navi = data[self.options.navigator.field];
    naviGradient.selectAll('stop').data(navi)
      .enter()
      .append('stop')
      .attr('stop-color', function(d, i) {
        return self.options.navigator.gradient.color(i/navi.length);})
      .attr('offset', function(d, i) {return (i / navi.length);});

    // naviGradient.append('stop')
    //     .attr('stop-color', 'yellow')
    //     .attr('offset', '0');
    // naviGradient.append('stop')
    //     .attr('stop-color', 'red')
    //     .attr('offset', '1');
    svg.selectAll('rect.background')
      .data([1]).enter()
      .append('rect')
      .attr('class', 'background')
      .attr('width',
            self.options.width)
      .attr('height', self.options.naviHeight)
      .attr('fill', 'url(#'+uuid+')');
  }

  function brushed(data, brush) {
    var self = this;
    var s = d3.event.selection;

    self.options.index = data[self.options.navigator.field];
    var [start, end] = s == null ? self.options.navigator.scale.domain(): d3.extent(
      s.map(self.options.navigator.scale.invert));
    //brush.empty()? self.options.navigator.scale.domain() : brush.extent();
    // adjust start, end
    var pos_i, pos_j;
    [start, end, pos_i, pos_j] = adjustedDomain(self.options.index, start, end);

    updateDomainFrame.call(self, start, end, self.options.navigator.domainfmt);
    update_axis(self, data, start, end);
    update_lines(self, data, start, end);
    update_fitcurve(self, data, start, end);
    update_bars(self, data, start, end);
    update_scatter(self, data, start, end);
    update_areas(self, data, start, end);
  }

  function PruneData(
    data, index, navi, axis, trim=true) {
    var res = []
    data.forEach(function(p, i) {
      var r2 = [];
      res.push(r2);
      p.forEach(function(q, j) {
        if (q || !trim) {
          r2.push(
            {value: q,
             index: index[j],
             navi: navi[j],
             axis: axis[i],
             n: p.length,
             j: j,
             i: i});
        }
      })
    })
    return res;
  }

  function PruneAreaData(
    data, index, areafields, navi, axis, trim=true) {
    var res = []
    var upper, lower;

    areafields.forEach(function(p, i) {
      var r2 = [];
      res.push(r2);
      index.forEach(function(q, j) {
        upper = data[p['upper']][j];
        lower = data[p['lower']][j];
        if ((upper && lower) || !trim) {
          r2.push(
            {upper: upper,
             lower: lower,
             index: q,
             navi: navi[j],
             axis: axis[i],
             n: index.length,
             j: j,
             i: i});
        }
      })
    })
    return res;
  }

  function sliceData(data, index, start, end) {
    var d = 0, f = data.length - 1;
    for (var i=0; i<data.length; i++) {
      if (index[i] <= start) {
        d = i;
      }
      if (index[i] <= end) {
        f = i + 1;
      }
    }
    return data.slice(d, f)
  }

  function sliceData2(data, start, end) {
    var d = 0, f = data.length - 1;
    for (var i=0; i<data.length; i++) {
      if (data[i].navi <= start) {
        d = i;
      }
      if (data[i].navi <= end) {
        f = i + 1;
      }
    }
    return data.slice(d, f)
  }

  function RangeDomain(data, index, start, end) {
    return d3.extent(sliceData(data, index, start, end));
  }

  function DataTransform(data, index, start, end, norm=false) {
    var data_adj = [];
    var yDomain = [];
    $.each(data, function(p, i) {
      var d = normData(data[p], index, start, end, norm);
      yDomain = yDomain.concat(d.domain);
      data_adj.push(d.data);
    });
    return [data_adj, d3.extent(yDomain)];
  }

  var normData = function(data, index, start, end, norm=false) {
    var refValue = 1;
    // get the reference node
    for (var i=0; i<index.length; i++) {
      if (index[i] >= start) {
        if (norm) {
          refValue = data[i];
        }
        break;
      }
    };
    // get domain
    var dataAdj = [];
    for (var j=0; j<index.length; j++) {
      dataAdj.push(data[j] && data[j] / refValue);
    }
    j = referenceNode(index, end) + 1;
    return {'data': dataAdj, 'domain': d3.extent(dataAdj.slice(i, j))};
  }

  var referenceNode = function(vec, v) {
    var n = vec.length;
    if (vec[0] >= v)
      return 0;
    if (vec[n-1] <= v)
      return n-1;
    var d1 = 0, d2= n-1, m = Math.floor((d2+d1)/2);
    do {
      if (v <= vec[m])
        d2 = m;
      else
        d1 = m;
      m = Math.floor((d2+d1)/2);
    } while ((d2-d1)>1);
    return d1;
  }

  var referenceNode2 = function(vec, v) {
    var n = vec.length;
    if (vec[0] >= v)
      return 0;
    if (vec[n-1] <= v)
      return n-1;
    var d1 = 0, d2= n-1, m = Math.floor((d2+d1)/2);
    do {
      if (v <= vec[m])
        d2 = m;
      else
        d1 = m;
      m = Math.floor((d2+d1)/2);
    } while ((d2-d1)>1);
    return (v - vec[d1])/(vec[d2] - vec[d1]) > 0.5 ? d2 : d1;
  }

  function add_legend(self) {
    self.options.lines.data && self.options.lines.data.forEach(function(p, i) {
      p.color = p.color || self.options.lines.color;
      p.show_legend = p.show_legend == null ? true : p.show_legend;
      p.show_tooltip = p.show_tooltip == null? true : p.show_tooltip;
    })
    self.options.bars.data && self.options.bars.data.forEach(function(p, i) {
      p.color = p.color || self.options.bars.color;
      p.show_legend = p.show_legend == null ? true: p.show_legend;
    })

    // var category = [
    //     self.options.lines, self.options.bars, self.options.scatters];
    var category = [self.options.lines, self.options.bars];
    d3.select(self).select('div.legend-bar').selectAll('*').remove();

    category.forEach(function(grp, i) {
      var data = grp.data.filter(x=>x.show_legend);
      d3.select(self).select('div.legend-bar')
        .selectAll('p.category'+i).data(data).enter()
        .append('p').attr('class', 'category'+i)
        .style('height', '100%')
        .style('width', 90+'px')
        .style('margin', '0px')
        .style('display', 'flex');

      d3.select(self).select('div.legend-bar')
        .selectAll('p.category'+i)
        .data(data).each(function(d, j) {
          d3.select(this)
            .append('svg')
            .style('width', '20%')
            .style('height', '100%')
            .append('circle')
            .attr('r', 4).attr('cx', 7)
            .attr('cy', 10)
            .style('fill', function(p, i) {return d.color(i)});
          d3.select(this)
            .append('td').style('padding', 0)
            .style('width', '80%')
            .append('div').attr('class', 'legend-text')
            .style('height', '100%')
            .html(function(p) {return p.legend || p.field;})
            .style('display', 'block');
        });
    });
  }

  var adjustedDomain = function(index, start, end) {
    for (var i=0; i<index.length; i++) {
      if (index[i] >= start) {
        break;
      }
    };

    // get domain
    var domain = [];
    for (var j=i; j<index.length; j++) {
      if (index[j] > end)
        break;
    }

    return [index[i],
            index[j-1],
            i,
            j-1];
  }

  var updateDomainFrame = function(start, end, fmt) {
    var self = this;
    $(self).find('input#start-date').val(fmt(start));
    $(self).find('input#end-date').val(fmt(end));
  }

  function adjDomain(domain, pct) {
    domain = d3.extent(domain);
    var band = domain[1] - domain[0];
    domain[0] -= band*pct/2;
    domain[1] += band*pct/2;
    return domain;
  }

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      })}

  function xAxisTrans(index, x) {
    var pivot = [];
    index.forEach(function(p, i) {
      pivot.push(x(index[i]));
    })
    return pivot;
  }

  function getSubset(keys, obj) {
    return keys.reduce(
      (a, c) => ([...a, obj[c]]), []);
  }

  /*
    function getSubset(keys, obj) {
    return keys.reduce(
    (a, c) => ({...a, [c]: obj[c]}), {});
    } */

})(jQuery);
