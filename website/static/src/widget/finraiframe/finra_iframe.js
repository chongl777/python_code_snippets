(function($){
    $.fn.init_finra_trace = function(
        startLoading=function(){},
        endLoading=function(){}) {
        this.each(function(i, div) {
            initialize(
                div,
                startLoading,
                endLoading);
        })
        return this;
    }
    var initialize = function(
        self, startLoading, endLoading) {
        // unique id
        $(self).addClass('wfi-finra-trace');
        $(self).css('overflow', 'scroll');

        d3.select(self).selectAll('iframe').data([1])
            .enter().append('iframe')
            .attr("id", "wfi-main-frame")
            .attr("scrolling", "no")
            .style("position", "relative")
            .style("top", "-360px")
            .style("left", "-240px")
            .style("width", "1300px")
            .style("height", "1000px");

        self.update = updateWithLoadingIcon(startLoading, endLoading);
        self.updateWithData = updateWithData;
        return this;
    };

    var updateWithData = function(data) {
        var self = this;
        d3.select(self).select('iframe#wfi-main-frame')
            .attr('src',
                  "https://finra-markets.morningstar.com/BondCenter/BondTradeActivitySearchResult.jsp?ticker="+data);
    };

    var updateWithLoadingIcon = function(startLoading, endLoading) {
        var update = function(sid) {
            if (sid==null) {return;};
            var widget = this;
            startLoading();
            $.ajax({
                url: "get_security_attr",
                "method": "GET",
                dataType: 'json',
                "data": {
                    "sid": sid, "attr": 'finra_ticker'},
                "success": function(data) {
                    endLoading();
                    widget.updateWithData(data);
                },
                error: function (msg) {
                    endLoading();
                    window.alert("Error:finra_iframe.js:"+msg.statusText);
                }
            })
        };
        return update;
    }
})(jQuery);
