(function($) {
    $.ui.autocomplete.prototype._renderMenu = function(ul, items) {
        var self = this;
        //table definitions
        $.each( items, function( index, item ) {
            self._renderItemData(ul, ul, item );
        });
    };

    var clickfn = function(input) {
        var pid = parseInt(input.attr("pid"));
        var url = new URL(window.location.href);
        url.searchParams.set("pid", pid);
        window.open(url.href, "_self");
    }

    $.ui.autocomplete.prototype._renderItemData = function(ul,table, item) {
        item = JSON.parse(item['value']);
        // item['value'] = item['value'];
        return this._renderItem( table, item ).data( "ui-autocomplete-item", item );
    };

    $.ui.autocomplete.prototype._renderItem = function(table, item) {
        return $( "<tr class='ui-menu-item' role='presentation'></tr>" )
        //.data( "item.autocomplete", item )
            .append('<td class="parent-id">'+item['id']+"</td>"+
                    '<td class="parent-name" nowrap>'+item['value']+"</td>")
            .appendTo( table );
    };

    var selected = function(p, item) {
        item = item['item'];
        $(this).val(item['value']);
        $(this).attr('pid', item['id']);
    }

    var onkeydown = function(event, ul, input) {
        //input.autocomplete('option', 'source', ['asd</div>']);
        if (event.which == 13) {
            clickfn(input);
        }
        var inputtext = $(this).val();
        if (inputtext.length <= 1) {
            return;
        }
        $.ajax({
            url: "tsearch_companies",
            method: "GET",
            dataType: 'json',
            data: {
                "text": inputtext},
            success: function(result) {
                input.autocomplete('option', 'source', result);
                if (result.length > 0) {
                    $(input).attr('pid', JSON.parse(result[0])['id']);
                }
            },
            error: function () { }
        });
    }

    $.fn.wfi_autocomplete = function() {
        var company_list = [];
        var self = this;
        self.addClass("wfi-autocomplete");
        self.each(function(i, div) {
            var input = $(div).find('input#search_text');
            input.autocomplete(
                {source: company_list,
                 select: selected
                });

            input.on("change keyup", function(event, ui) {
                onkeydown.call(input, event, ui, input);
            });

            $(input).on("keydown keypress", function(event) {
                if (event.which == 13) {
                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }
            });

            $(div).find('button').on(
                "click",
                function() {
                    clickfn(input)});
        });
    };
})(jQuery);
