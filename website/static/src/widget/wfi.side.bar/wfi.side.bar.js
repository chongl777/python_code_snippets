(function($){
    $.fn.init_wfi_side_bar = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        });

        self.show = function(element) {
            self.each(function(i, div) {
                show.call(div, element);
            });
        };

        self.hide_side_bar = function(element) {
            self.each(function(i, div) {
                hide.call(div, element);
            });
        };

        self.add_preclose_fn = function(fn) {
            self.each(function(i, div) {
                add_preclose_fn.call(div, fn);
            })
        };
        return self;
    }

    var initialize = function(options) {
        // unique id
        var self = this;
        self.options = options;
        init_options(self);
        $(self).addClass('wfi-side-nav');
        $(self).css('width', '0px');
        if (self.options.position == 'right')
            $(self).css('right', 0);

        $(self).html(
            '<a href="javascript:void(0)" class="closebtn">&times;</a><div class="side-bar-content"></div>');
        $('.closebtn', self).click(function() {
            hide.call(self);
        })
    };

    function add_preclose_fn(fn) {
        var self = this;
        self.preclose = fn.bind(self);
    };

    function show(element) {
        var self = this;
        $('.side-bar-content', self).html('');
        $('.side-bar-content', self).append(element);
        $(self).css('width', self.options.width + 'px');
    };

    function hide() {
        var self = this;
        self.preclose && self.preclose();
        $('.side-bar-content', self).html('');
        $(self).css('width', '0px');
    };

    function init_options(self) {
        self.options['width'] = self.options['width'] || 250;
    }

})(jQuery);
