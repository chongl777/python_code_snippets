(function($){
    $.fn.init_wfi_control_panel = function(options={}) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })
        return self;
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            })
    }
    var uuid = uuidv4();

    function gcolor(startc, endc) {
        var func_color = function(d) {
            var color =d3.scaleLinear().domain([0, 1])
                .interpolate(d3.interpolateHcl)
                .range([d3.rgb(startc), d3.rgb(endc)]);
            return color(d);}
        return func_color;
    }

    var initialize = function(options) {
        // unique id
        var self = this;
        self.options = options;
        $('table tbody', self).append(
            '<tr><td style="display: none"><input type="submit" id="submit_control_panel"></td></tr>')
        var svg = '<svg id="arrow_button" x="0px" y="0px" width="37" height="6" preserveAspectRatio="none" stroke="grey"> \
                     <g transform="translate(37, 0)rotate(90)"> \
                         <rect x="0" y="0" width="6" height="37" fill="url(#{uuid}-2)"/> \
                      </g>\
                     <g id="arrow-svg" transform="translate(16.0, 0.2)rotate(0)scale(0.02,0.02)"> \
                         <path d="M286.935,69.377c-3.614-3.617-7.898-5.424-12.848-5.424H18.274c-4.952,0-9.233,1.807-12.85,5.424   C1.807,72.998,0,77.279,0,82.228c0,4.948,1.807,9.229,5.424,12.847l127.907,127.907c3.621,3.617,7.902,5.428,12.85,5.428   s9.233-1.811,12.847-5.428L286.935,95.074c3.613-3.617,5.427-7.898,5.427-12.847C292.362,77.279,290.548,72.998,286.935,69.377z"/> \
                     </g> \
                  </svg>'.replace('{uuid}', uuid);

        $(self).html(function() {
            var html =
              ' \
                   <table class="wfi-control-panel-table" style="width:100%"> \
                     <tbody> \
                       <tr id="setting-bar"> \
                          <td align="right"><div id="site-settings" style="width: 70px">Site Settings</div></td> \
                       </tr> \
                       <tr> \
                         <td> \
                           <div id="drop-down-parms"> \
                             <table style="width:100%" id="table_params"> \
                               <tbody> \
                                 <tr> \
                                   <td id="params-holder" style="width:100%; height:100%"> \
                                     <form>' + $(self).html() + ' </form> \
                                   </td> \
                                   <td class="SubmitButtonCell"><table> \
                                     <tbody><tr> \
                                       <td><input type="submit" data-bind="value: buttonText" id="submit_rpt"></td> \
                                     </tr> \
                                     </tbody></table> \
                                   </td> \
                                 </tr> \
                               </tbody> \
                             </table> \
                           </div> \
                         </td> \
                       </tr> \
                       <tr style="height:6px;font-size:2pt;"> \
                         <td colspan="3" class="SplitterNormal" \
                           style="padding: 0px; margin: 0px; text-align: center; cursor: default;"> \
                           <div style="font-size: 0px"> \
                            ' + svg +
                           '</div> \
                         </td> \
                       </tr> \
                     </tbody> \
                   </table> '
            return html;
        });

        var color_gradient_down = gcolor('steelblue', 'lightsteelblue');
        var color_gradient_up = gcolor('whitesmoke', 'grey');
        var svg_obj = d3.select('#arrow_button', self);
        var svgDefs = svg_obj.append('defs');
        var naviGradient = svgDefs.append('linearGradient')
            .attr('id', uuid+'-1');
        var data = [0,0.5,1];
        naviGradient.selectAll('stop').data(data)
            .enter()
            .append('stop')
            .attr('stop-color', function(d, i) {
                return color_gradient_down(i/data.length);})
            .attr('offset', function(d, i) {return (i / data.length);});

        naviGradient = svgDefs.append('linearGradient')
            .attr('id', uuid+'-2');
        naviGradient.selectAll('stop').data(data)
            .enter()
            .append('stop')
            .attr('stop-color', function(d, i) {
                return color_gradient_up(i/data.length);})
            .attr('offset', function(d, i) {return (i / data.length);});

        //$(self).addClass('wfi-control-panel');
        init_options(self);
        return this;
    };

    function changeImg(self) {
        if ($(self).hasClass('up')) {
            //$(self).attr('src', './static/src/widget/wfi.control.panel/img/DDPanelDownActive.png')
            d3.select('g#arrow-svg', self).attr('transform', 'translate(16.0, 0.2)rotate(0)scale(0.02,0.02)');
            d3.select('g rect', self).attr('fill', "url(#"+uuid+"-1)")
        } else {
            d3.select('g#arrow-svg', self).attr('transform', 'translate(21.5, 6)rotate(180)scale(0.02,0.02)');
            d3.select('g rect', self).attr('fill', "url(#"+uuid+"-2)")
            //$(self).attr('src', './static/src/widget/wfi.control.panel/img/DDPanelUpInActive.png')
        }
    }

    function init_options(self) {
        self.options['showSettingPages'] = self.options['showSettingPages'] || false;
        self.options['hidePanel'] = self.options['hidePanel'] || false;

        self.options['preProcess'] = self.options['preProcess'] || function (data) {return data;};

        self.options['siteSetting'] = self.options['siteSetting'] || function () {};

        self.options['input_args'] = self.options['input_args'] || {};
        self.options['inputs']['buttonText'] = self.options['inputs']['buttonText'] || 'View Report';

        self.options['input_args']['submit'] = function() {
            self.removeDlg();
            var f = self.options['input_args']['submit_func'] ||
                    function() {};
            f.call(self);
        };

        if (self.options['update'] == null) {
            $('td.SubmitButtonCell' , self).css('display', 'none');
        }

        self.options['input_args']['cancel'] = function() {
            self.removeDlg();
            var f = self.options['input_args']['cancel_func'] ||
                    function() {};
            f.call(self);
        };

        ko.applyBindings(self.options['inputs'], self);

        $("#arrow_button", self).click(function(e){
            $("#drop-down-parms", self).slideToggle("fast");
            $(this).toggleClass('up');
            changeImg(this);
            e.preventDefault();
        });

        if (self.options['hidePanel']) {
            $('div#drop-down-parms', self).css('display', 'none');
            var div = $("#arrow_button", self);
            $(div).addClass('up');
            changeImg(div);
        } else {
            $(div).removeClass('up');
            changeImg($("#arrow_button", self));
        }

        if (self.options['showSettingPages']) {
            $("#setting-bar", self).css('display', 'table-row');
        } else {
            $("#setting-bar", self).css('display', 'none');
        }

        $(".boost-multiselect", self).multiselect({
            includeSelectAllOption: true
        });

        $("#submit_rpt", self).click(function(e) {
            self.options['update']();
            e.preventDefault();
        });

        if (self.options['submit']) {
            $("form", self).submit(function(e) {
                e.preventDefault();
                self.options['submit']();
            })
        }

        $("#site-settings", self).click(function(e) {
            open_option_setup.call(self);
            //self.options['siteSetting']();
            e.preventDefault();
        });
    }

    function open_option_setup() {
        var self = this;
        var html = self.options['options']();
        var overlay = $('<div>');
        var removeDlg = function() {overlay.remove();}
        self.removeDlg = removeDlg;
        overlay.attr('id', 'OVER');
        overlay.html('<div class="wfi-control-panel-table args-dlg 1tgt-px-dlg" style="width: 400px; height:auto;"></div>');

        var dlg = $('div.args-dlg', overlay);
        dlg.css("top", $(window).height()/2-210)
            .css('left', $(window).width()/2-315);
        dlg.draggable();
        dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative; clear:both; padding: 10px"> \
                 <h1 style="float: left; margin-top: 0px; margin-button: 0px">Site Setting</h1> \
                 <span id="TitleBtns" class="dlgTitleBtns" style="float: right; margin:0px;"> \
                   <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C"> \
                     <span style="padding:0px;height:16px;width:16px;display:inline-block"> \
                       <span style="height:16px;width:16px; position:relative; \
                          display:inline-block; overflow:hidden;" class="s4-clust"> \
                          <img src="/_layouts/15/images/fgimg.png?rev=23" alt="Close dialog" \
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
                          <input type="button" value="Cancel" data-bind="click: cancel"/> \
                        </td> \
                     </tr> \
                  </table> \
             </div>');

        $('#content tbody', dlg).append(html);
        overlay.removeDlg = removeDlg;

        $('body').append(overlay);
        ko.applyBindings(self.options['input_args'], overlay[0]);

        $(".boost-multiselect", dlg).multiselect({
            includeSelectAllOption: true
        });
    }

})(jQuery);
