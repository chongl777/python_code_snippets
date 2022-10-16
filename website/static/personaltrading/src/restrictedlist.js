(function($){
    $.fn.init_restricted_list = function(
        startLoading=function(){},
        endLoading=function(){}, options) {
        this.each(function(i, div) {
            initialize(
                div,
                startLoading,
                endLoading, options);
        })
        return this;
    }

    var initialize = function(self, startLoading, endLoading, options) {
        // unique id
        $(self).addClass('wfi-restricted-list');
        $(self).append(
            '<div id="title" class="widget-title" style="height:30px;"> \
                <div>Restricted List</div> \
             </div> \
             <table cellspacing="0" class="row-border" style="width:100%"> \
                 <caption></caption> \
                 <thead> \
                     <tr> \
                     <th>Security ID</th> \
                     <th>Company ID</th> \
                     <th>Description</th> \
                     </tr> \
                 </thead>\
              </table>');

        var height = $(self).height();
        var titleH = $(self).find('#title').height();
        //$(self).find('table').css('height', (height-titleH+0.5));
        //d3.select(self).select('table').style('height', (height-titleH+0.5)+'px');

        var widget = $(self).find("table");
        widget.css('height', height-titleH-120);
        var columns_config = {
            "Security ID": {
                "data": "security_id",
                "visible": true,
                "render": function(data) {
                    return '<font class="sid">' + data + "</font>"},
                "width": "60px"},
            "Company ID": {
                "data": "company_id",
                "visible": true,
                "render": function(data) {
                    return '<font class="cid">' + data + "</font>"},
                "width": "60px"},
            "Description": {
                "data": "description",
                "visible": true,
                "width": "200px"}};

        var columns_setup = [];
        $(self).find("table tr th").each(function(i, p) {
            columns_setup.push(columns_config[p.textContent]);
        })

        // get columns config
        var tbl = $(widget).DataTable( {
            fixedHeader: {header:false, footer: false},
            bPaginate: false, bFilter: false, bInfo: false,
            bDestroy: true,
            bSort: false,
            // scrollY: height-titleH-120+"px",
            scrollCollapse: true,
            order: [[0, "asc"], [1, "asc"]],
            columns: columns_setup
        });

        self.update = updateWithLoadingIcon.call(options, startLoading, endLoading);
        self.updateWithData = function(data, clickfn) {
            updateWithData.call(tbl, data)
        };
        self.getData = function() {return getData.call(tbl)};
        return this;
    };

    var getData = function() {
        var self = this;
        var ret = []
        self.rows().data().each(function(p) {
            ret.push(p);
        });
        return ret;
    }

    var updateWithData = function(data) {
        var widget = this;
        //widget.rows().each(function(p) {widget.row(0).remove();});
        widget.rows().remove().draw();
        data.forEach(function(p) {widget.row.add(p)});
        widget.draw();
    };

    // update elements
    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(server_url) {
            var self = this;
            startLoading();
            $.ajax({
                "url": server_url,
                "method": "GET",
                dataType: 'json',
                "data": {},
                "success": function(data) {
                    endLoading();
                    self.updateWithData(data);
                },
                error: function (err) {
                    endLoading();
                    window.alert("restrictedlist:"+JSON.stringify(err))
                }
            })
        };
        return update;
    }
})(jQuery);
