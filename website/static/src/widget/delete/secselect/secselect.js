(function($){
    $.fn.init_sec_select = function() {
        this.each(function(i, div) {
            initialize(div);
        })
        return this;
    }
    var initialize = function(self) {
        // unique id
        $(self).addClass('wfi-sec-select');
        $(self).append(
            '<div id="title" class="widget-title">'+
                '<div>Security List</div>'+
                '</div>' +
                '<a>23&#8199&#8199&#8199ADB</a><br/>' +
                '<a>23   ADB</a><br/>' +
                '<a>23222ADB</a><br/>' +
                '<select multiple>' +
                '<optgroup label="Equity">' +
                '<option><span>23&#8199&#8199&#8199ADB</span></option>' +
                '<option><tr><td>23&#8199&#8199&#8199</td><td>ADB</td></tr></option>' +
                '</optgroup>' +
                '<optgroup label="Corporate Bond">' +
                '<option><tr><td>25&#8199&#8199&#8199</td><td>ADBcs</td></tr></option>' +
                '</optgroup>' +
                '</select>');

        var height = $(self).height();
        var titleH = $(self).find('#title').height();

        var widget = $(self).find("select");
        widget.css('height', height-titleH);
        widget.css('width', '100%');

        self.update = update;
        self.updateWithData = function(data, clickfn) {
            /*
            updateWithData.call(self, data)
            $(self).on('click', 'tr', function () {
                if ( $(this).hasClass('selected') ) {
                    $(this).removeClass('selected');
                }
                else {
                    self.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
                clickfn.apply(this);
            });
             */
        };
        return this;
    };

    var updateWithData = function(data) {
        var widget = this;
        widget.rows().each(function(p) {widget.row(0).remove();});
        data.forEach(function(p) {widget.row.add(p).draw()});
    };

    // update elements
    var update = function(server_url, pid, clickfn) {
        var widget = this;
        $.ajax({
            "url": "/services/get",
            "method": "GET",
            dataType: 'json',
            "data": {
                url: server_url + "/get_parent_securities",
                data: JSON.stringify(
                    {"pid": parseInt(pid)})},
            "success": function(data) {
                data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                widget.updateWithData(data, clickfn);
            },
            error: function () {
            }
        })
    };
})(jQuery);
