(function($) {

    $.ui.autocomplete.prototype._renderMenu = function(ul, items) {
        var self = this;
        //table definitions
        var group_by;
        var currentCategory;

        if (items.length > 0)
            group_by = JSON.parse(items[0]['value'])['groupby'];
        else
            group_by = null;

        if (group_by) {
            currentCategory = "";
        }

        if (items.length == 1) {
            console.log("hi");
        }

        $.each(items, function(index, item) {
            var li
            item = JSON.parse(item['value']);

            if (group_by) {
                if (item.data[group_by] != currentCategory) {
                    ul.append("<li class='ui-autocomplete-category'>" + item.data[group_by] + "</li>");
                    currentCategory = item.data[group_by];
                }
            }
            self._renderItemData(ul, ul, item);
        });
    };

    var clickfn;

    $.ui.autocomplete.prototype._renderItemData = function(ul, table, item) {
        return this._renderItem(table, item).data(
            "ui-autocomplete-item",
            {value: item['display'],
             data: item['data']});
    };

    $.ui.autocomplete.prototype._renderItem = function(table, item) {
        return $('<li class="ui-menu-item"><tr role="presentation"></tr></li>')
        //.data( "item.autocomplete", item )
            .append(item['html'])
            .appendTo(table);
    };

    var selected = function(p, item) {
        item = item['item'];
        $(this).val(item['value']);
        $(this).attr('pid', item['id']);
    }

    function update_selectoptions(items, input, options={}) {
        var self = this;
        self.option_setup = false;
        var item_rows = []
        items.forEach(function(p, i) {
            item_rows.push(
                JSON.stringify(
                    {display: p['value'],
                     data: p,
                     groupby: options.groupby,
                     html: options.selection_structure(p)}
                ));
        });
        input.autocomplete('option', 'source', item_rows);

        // $.ui.autocomplete.filter(item_rows, 'jpm')
        // input.autocomplete("option", "items", "> :not(.ui-autocomplete-category)");
    }

    function show_config_options(items, input) {
        var self = this;
        self.option_setup = true;
        var item_rows = []
        items.forEach(function(p, i) {
            var checked = self.selected_option == p ? " checked" : ""
            item_rows.push(
                {value: JSON.stringify(
                    {display: p,
                     _is_config: true,
                     data: null,
                     groupby: null,
                     html: '<td><input type="radio" value="' + p + '"' +
                     checked + '></td><td>' + p + '</td>'}
                )});
        });
        input.autocomplete('option', 'source', item_rows);
        //var instance = ;
        input.autocomplete("instance")._suggest(item_rows);
    }

    var onkeydown = function(event, ul, input, update_fn=null) {
        var self = this;
        //input.autocomplete('option', 'source', ['asd</div>']);

        if (event.which == 13) {
            clickfn.call(input, self.selected_item);
            return;
        }
        var inputtext = $(input).val();
        if (inputtext.length <= 0) {
            return;
        }

        if (update_fn == null) {
            return;
        }

        if ([27, 37, 38, 39, 40, 16].includes(event.which)) {
            return;
        }
        update_fn.call(self, inputtext, function(result) {
            update_selectoptions.call(self, result, input, self.options)})
    }

    $.fn.wfi_autocomplete = function(options={}) {
        var item_list = [];
        var self = this;
        self.addClass("wfi-autocomplete");
        self.options = options;
        self.option_setup = false;
        self.options.groupby = self.options.groupby || null;
        var update_fn = self.options['update_fn'];
        self.options['search_options'] = self.options['search_options'] || [];
        self.options['show_config'] = self.options['show_config'] || false;
        self.options['placeholder'] = ko.observable(self.options['placeholder'] || '');
        self.options['selection_structure'] = self.options['selection_structure'] || function(item) {
            return '<td class="parent-id">'+item['id']+"</td>"+
                '<td class="parent-name" nowrap>'+item['value']+"</td>"
        }
        self.options['search_list'] = self.options['search_list'] || [];
        self.selected_option = null;

        $(self).append(
            '<a id="config" href="#"><img src="./static/src/images/settings.png"></a> \
             <input id="search_text" type="text" data-bind="attr: {placeholder: placeholder}"> \
             <button id="search_button" type="button" style="">');
        ko.applyBindings(self.options, $(self)[0]);

        if (!self.options['show_config']) {
            $('#config', self).css('display', 'none');
        } else {
            if (self.options['search_options'].length) {
                var option = self.options['search_options'][0];
                self.options.placeholder(option + ' ......');
                self.selected_option = option
            }
        }

        clickfn = self.options['onsearch'];
        self.selected_item = null;

        self.each(function(i, div) {
            var input = $(div).find('input#search_text');
            var input_auto = input.autocomplete(
                {source: item_list,
                 select: function(p, item) {
                     var func = options.selected || selected;
                     self.selected_item = item['item'];
                     if (!self.option_setup) {
                         func.call(input, p, item['item']);
                     } else {
                         self.options.placeholder(item['item']['value'] + ' ......');
                         self.selected_option = item['item']['value'];
                         item['item']['value'] = '';
                     }
                 }
                });
            input.autocomplete("instance").widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );

            input.on("change keyup", function(event, ui) {
                onkeydown.call(self, event, ui, input, update_fn);
            });

            $(input).on("keydown keypress", function(event) {
                if (event.which == 13) {
                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }
            });

            $(div).find('button').on(
                "click", function() {
                    clickfn.call(input, self.selected_item)});

            var config = $('#config', self);
            config.on('click', function(event) {
                show_config_options.call(self, self.options.search_options, input);
            });
            // update_selectoptions.call(self, self.options.search_list, input, self.options)
        });
    };
})(jQuery);
