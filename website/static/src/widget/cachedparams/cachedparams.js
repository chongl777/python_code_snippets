function CachedParams(cookie_name) {
    // set up cookie if not available
    ($.cookie(cookie_name) == null) &&  $.cookie(cookie_name, "{}", {expires: 360});

    function parameter(key, default_val) {
        // if key is not in the cookie; save it to cookie
        var params;
        try {
            params = JSON.parse($.cookie(cookie_name));
        } catch(err) {
            params = {};
        }

        if (!params[key]) {
            params[key] = default_val;
            $.cookie(cookie_name, JSON.stringify(params), {expires: 360});
        }

        var _value = ko.observable(params[key]);
        var output = ko.computed({
            read: function() {
                return _value();
            },
            write:function(value) {
                var params;
                try {
                    params = JSON.parse($.cookie(cookie_name));
                } catch (err) {
                    params = {};
                }
                _value(value);
                params[key] = value;
                $.cookie(cookie_name, JSON.stringify(params), {expires: 360});
            }
        });

        return output;
    }
    return parameter;
}
