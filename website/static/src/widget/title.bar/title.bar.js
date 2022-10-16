function addTitle(obj, config=true, download=false, edit=false, projection=false) {
    var source = '<header class="title widget-title-bar"> \
                    <h data-bind="text: title"></h> \
                    <div id="buttons"> \
                        <svg id="download" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                        <svg id="edit" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                        <svg id="config" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                        <svg id="projection" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                    </div> \
                  </header>';
    obj.each(function(i, widget) {
        // var $html = $(Handlebars.compile(source)({title: div.options.title()}));
        var $html = $(source);
        (!config) && $('#config', $html).css('display', 'none');
        (!download) && $('#download', $html).css('display', 'none');
        (!edit) && $('#edit', $html).css('display', 'none');
        (!projection) && $('#projection', $html).css('display', 'none');

        $('#config g', $html).html(svgicon.icon_config());
        $('#edit>g', $html).html(svgicon.icon_edit());
        $('#download g', $html).html(svgicon.icon_download());
        $('#projection g', $html).html(svgicon.icon_full_screen());

        $('#config', $html).on('click', function(p) {
            widget.open_option_setup(widget);
        });
        $('#download', $html).on('click', function(p) {
            widget.open_download_setup(widget);
        });
        $('#edit', $html).on('click', function(p) {
            widget.options.edit_mode_enable(!widget.options.edit_mode_enable());
            widget.options.edit_mode(widget);
        });

        $(this).prepend($html);

        ko.applyBindings(widget.options, $html[0]);
    });
    return obj;
}


function add_background_canvas() {
    var loadingtimes = 0;
    var widget = this;
    var widget_original_pos = widget.getBoundingClientRect()
    var widget_original_size = {
        height: $(widget).height(),
        width: $(widget).width()}

    self = 'body';
    var canvas = d3.select(self).selectAll('div#OVERLAY-CANVAS').data([1])
        .enter()
        .append('div')
        .attr('id', 'OVERLAY-CANVAS')
        .style('width', '100%')
        .style('height', '100%')
        .style('left', 0)
        .style('top', 0)
        .style('position', 'absolute')
        .style('background-color', 'rgba(153, 153, 153, 0.8)')
        .style('z-index', 100);
    canvas = d3.select(self).selectAll('div#OVERLAY-CANVAS')
    canvas.style('display', 'flex');
    canvas.style('justify-content', 'center');
    canvas.style('align-items', 'center');
    var height_canvas = $('div#OVERLAY-CANVAS', self).height();
    var width_canvas = $('div#OVERLAY-CANVAS', self).width();
    var t = d3.transition().duration(300).ease(d3.easeLinear);

    var div = canvas.append('div')
        .attr('class', 'projected-div')
        .style('display', 'table')
        .style('position', 'absolute')
        .style('z-index', '500')
        .style('top', '0px')
        .style('left', '0px');
    div.html('\
        <header id="OVERLAY-CANVAS-HEADER" style="cursor: move"><div id="header-container"> \
          <h id="title"></h>\
          <div id="close" style="position: relative; right:0px">\
            <svg style="width: 30px; height: 30px"><g transform="scale(0.06)rotate(45)translate(100, -200)"></g></svg>\
          <div>\
        </div></header>\
        <div id="canvas"><div id="inner-canvas"> \
        </div></div>');
    $('div#close>svg>g', div[0]).html(svgicon.icon_plus());
    $('h#title', div[0]).text(widget.options.title());

    var dis = $(widget).css('display');
    $('#close', canvas[0]).click(function() {
        $('div#canvas', canvas[0]).html("");
        div.transition(t)
            .style("height", widget_original_size.height+"px")
            .style("width", widget_original_size.width+"px")
            .style("top", widget_original_pos.top+"px")
            .style("left", widget_original_pos.left+"px").on('end', function() {
                canvas.style('display', 'none');
                canvas.remove("");
                $(widget).css('display', dis);
            });
    });

    var heigth_div = height_canvas*0.7;
    var width_div = width_canvas*0.7;
    if (widget.options.keep_ratio != null) {
        width_div = Math.min(width_div, heigth_div * widget.options.keep_ratio);
        heigth_div = width_div / widget.options.keep_ratio;
    }

    div.style("position", "relative");
    var position = $("div.projected-div", canvas[0])
        .css("height", heigth_div+"px")
        .css("width", width_div+"px").position();
    div.style("position", "absolute");
    div.style("height", widget_original_size.height+"px");
    div.style("width", widget_original_size.width+"px");
    div.style("top", widget_original_pos.top+"px");
    div.style("left", widget_original_pos.left+"px");
    $(widget).css('display', 'none');

    div.transition(t)
        .style("height", heigth_div+"px")
        .style("width", width_div+"px")
        .style("top", position.top+"px")
        .style("left", position.left+"px")
        .on('end', function() {
            var height = $('div.projected-div', canvas[0]).height();
            var width = $('div.projected-div', canvas[0]).width();
            var position = $('div.projected-div', canvas[0]).position();
            $('div.projected-div', canvas[0]).css('position', 'absolute')

            var resizeTimer;
            var div_projected = widget.project_to($('#canvas>#inner-canvas', canvas[0])[0]);
            $('div.projected-div', canvas[0]).resizable().on(
                'resize', function() {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function() {
                        // Run code here, resizing has "stopped"
                        div_projected.resize();
                    }, 50);

                }).draggable({handle: 'header#OVERLAY-CANVAS-HEADER'});
        });
    return div;
}


function add_title(obj, init, config=true, download=false, edit=false, projection=false) {
    var source = '<header class="title widget-title-bar"> \
                    <div class="title-container"> \
                    <h data-bind="text: title"></h> \
                    <div id="buttons"> \
                        <svg id="download" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                        <svg id="edit" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                        <svg id="config" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                        <svg id="projection" class="config tab-icon"><g transform="scale(1)"></g></svg> \
                    </div> \
                  </header>';

    obj.append(source);
    init.call(obj);
    obj.each(function(i, widget) {
        var $html = $('header.title', widget);
                (!config) && $('#config', $html).css('display', 'none');

        (!download) && $('#download', $html).css('display', 'none');
        (!edit) && $('#edit', $html).css('display', 'none');
        (!config) && $('#config', $html).css('display', 'none');
        (!projection) && $('#projection', $html).css('display', 'none');

        $('#config g', $html).html(svgicon.icon_config());
        $('#edit>g', $html).html(svgicon.icon_edit());
        $('#download g', $html).html(svgicon.icon_download());
        $('#projection g', $html).html(svgicon.icon_full_screen());

        $('#config', $html).on('click', function(p) {
            widget.open_option_setup(widget);
        });
        $('#download', $html).on('click', function(p) {
            widget.open_download_setup(widget);
        });
        $('#edit', $html).on('click', function(p) {
            widget.options.edit_mode_enable(!widget.options.edit_mode_enable());
            widget.options.edit_mode(widget);
        });
        $('#projection', $html).on('click', function(p) {
            add_background_canvas.call(widget);
        });
        // $(this).prepend($html);

        ko.applyBindings(widget.options, $html[0]);
    });
    return obj;
}
