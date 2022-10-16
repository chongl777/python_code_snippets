var initialize = function(PARAMS, add_title, baseUrl='.') {
    var t_date = d3.timeFormat('%Y-%m-%d')(new Date());
    PARAMS['widget']['emc-hy'] = add_title(
        $('div#emc-hy'),
        function() {this.init_emc(
            {title: ko.observable("EMC-HY"),
             update_url: 'emc_details_hy',
             t_date: t_date
            })},
        false, false, false, true);

    PARAMS['widget']['emc-ig'] = add_title(
        $('div#emc-ig'),
        function() {this.init_emc(
            {title: ko.observable("EMC-IG"),
             update_url: 'emc_details_ig',
             t_date: t_date
            })},
        false, false, false, true);

    PARAMS['widget']['rvs-hy'] = add_title(
        $('div#rvs-hy'),
        function() {this.init_rvs(
            {title: ko.observable("RVS-HY"),
             url_update: 'rvs_details_hy',
             url_override_params: 'rvs_overrides_params',
             t_date: t_date
            })},
        false, false, false, true);

    PARAMS['widget']['rvs-ig'] = add_title(
        $('div#rvs-ig'),
        function() {this.init_rvs(
            {title: ko.observable("RVS-IG"),
             url_update: 'rvs_details_ig',
             url_override_params: 'rvs_overrides_params',
             t_date: t_date
            })},
        false, false, false, true);
}
