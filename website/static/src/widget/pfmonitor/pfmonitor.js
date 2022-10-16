(function($){
    $.fn.init_pf_expo_monitor = function(options) {
        var self = this;
        self.each(function(i, div) {
            initialize.call(div, options);
        })
        self.updateWithData = function(data, args) {
            self.each(function(i, div) {
                div.updateWithData(data, args);
            })
        }
        this.datasource = options.datasource;
        return self;
    }

    var initialize = function(options) {
        // unique id
        var self = this;
        self.options = options;
        $(self).addClass('wfi-pf-expo-monitor');
        var html = $(' \
             <table style="width:100%"> \
               <col width="40%"> \
               <col width="30%"> \
               <col width="30%"> \
               <tbody> \
                 <tr  class="group"> \
                    <td colspan=2> Position Exposure Exemption (total<5%)</td> \
                    <td colspan=1 class="value" data-bind="text: expo_test, style: {color: expo_test_color}"> Pass </td> \
                 </tr> \
                  <tr> \
                    <td colspan=1> Future Agg. Margin </td> \
                    <td colspan=1 class="value" data-bind="text: fut_agg_margin">  </td> \
                    <td colspan=1 class="value" data-bind="text: fut_agg_margin_pct">  </td> \
                 </tr> \
                  <tr> \
                    <td colspan=1> Option NPV </td> \
                    <td colspan=1 class="value" data-bind="text: opt_npv">  </td> \
                    <td colspan=1 class="value" data-bind="text: opt_npv_pct">  </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1> Derivative NPV </td> \
                    <td colspan=1 class="value" data-bind="text: derv_npv">  </td> \
                    <td colspan=1 class="value" data-bind="text: derv_npv_pct">  </td> \
                 </tr> \
                  <tr> \
                    <td colspan=1> Total </td> \
                    <td colspan=1 class="value" data-bind="text: total_expo">  </td> \
                    <td colspan=1 class="value" data-bind="text: total_expo_pct, style: {color: expo_test_color}">  </td> \
                 </tr> \
                 <tr  class="group"> \
                    <td colspan=2> Notional Value Exemption (total<100%)</td> \
                    <td colspan=1 class="value" data-bind="text: notl_test, style: {color: notl_test_color}"> Failed </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1> Futures Exp. </td> \
                    <td colspan=1 class="value" data-bind="text: fut_exp">  </td> \
                    <td colspan=1 class="value" data-bind="text: fut_exp_pct">  </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1> Option Delta Adj. Exp. </td> \
                    <td colspan=1 class="value" data-bind="text: opt_delta_exp">  </td> \
                    <td colspan=1 class="value" data-bind="text: opt_delta_exp_pct">  </td> \
                 </tr> \
                 <tr> \
                    <td colspan=1> Derivative Notional </td> \
                    <td colspan=1 class="value" data-bind="text: derv_notion">  </td> \
                    <td colspan=1 class="value" data-bind="text: derv_notion_pct">  </td> \
                 </tr> \
                  <tr> \
                    <td colspan=1> Total </td> \
                    <td colspan=1 class="value" data-bind="text: total_notl">  </td> \
                    <td colspan=1 class="value" data-bind="text: total_notl_pct, style: {color: notl_test_color}">  </td> \
                 </tr> \
               </tbody> \
             </table>');

        $(self).append(html);

        options['expo_test_threshold'] = 0.05;
        options['notional_test_threshold'] = 1;

        var vm = new function() {
            var pctfmt = d3.format(".2%");
            var dollarfmt = d3.format(",.0f");
            this.expo_test = ko.observable();
            this.expo_test_color = ko.observable();

            this.fut_agg_margin = ko.observable();
            this.fut_agg_margin_pct = ko.observable();
            this.opt_npv = ko.observable();
            this.opt_npv_pct = ko.observable();
            this.derv_npv = ko.observable()
            this.derv_npv_pct = ko.observable()

            this.total_expo = ko.observable();
            this.total_expo_pct = ko.observable();

            this.notl_test = ko.observable();

            this.notl_test_color = ko.observable();

            this.fut_exp = ko.observable();
            this.fut_exp_pct = ko.observable();
            this.opt_delta_exp = ko.observable();
            this.opt_delta_exp_pct = ko.observable();
            this.derv_notion = ko.observable()
            this.derv_notion_pct = ko.observable()

            this.total_notl = ko.observable();
            this.total_notl_pct = ko.observable();
        }

        self.viewModel = vm;
        ko.applyBindings(self.viewModel, self);

        self.updateWithData = function(data) {
            updateWithData.call(self, data, self.options);
        };
        return this;
    };

    var updateWithData = function(data, options) {
        options['expo_test_threshold'] = 0.05;
        options['notional_test_threshold'] = 1;
        var self = this;
        var pctfmt = d3.format(".2%");
        var dollarfmt = d3.format(",.0f");
        self.viewModel.expo_test((function() {
            var total = (data['fut_agg_margin']+data['opt_npv'])/data['pf_aum'];
            if (total >= options['expo_test_threshold'])
                return "Failed";
            else
                return "Pass";
        })());

        self.viewModel.expo_test_color((function() {
            if (self.viewModel.expo_test() == "Pass")
                return "green";
            else
                return "red";
        })())

        self.viewModel.fut_agg_margin(dollarfmt(data['fut_agg_margin']));
        self.viewModel.fut_agg_margin_pct(pctfmt(data['fut_agg_margin']/data['pf_aum']));
        self.viewModel.opt_npv(dollarfmt(data['opt_npv']));
        self.viewModel.opt_npv_pct(pctfmt(data['opt_npv']/data['pf_aum']));

        self.viewModel.derv_npv(dollarfmt(data['derv_npv']));
        self.viewModel.derv_npv_pct(pctfmt(data['derv_npv']/data['pf_aum']));

        self.viewModel.total_expo(dollarfmt(data['fut_agg_margin']+data['opt_npv']+data['derv_npv']));
        self.viewModel.total_expo_pct(
            pctfmt((data['fut_agg_margin']+data['opt_npv']+data['derv_npv'])/data['pf_aum']));

        self.viewModel.notl_test((function() {
            var total = (data['opt_delta_exp']+data['fut_exp']+data['derv_notion'])/data['pf_aum'];
            if (total >= options['notional_test_threshold'])
                return "Failed";
            else
                return "Pass";
        })());

        self.viewModel.notl_test_color((function() {
            if (self.viewModel.notl_test() == "Pass")
                return "green";
            else
                return "red";
        })());

        self.viewModel.fut_exp(dollarfmt(data['fut_exp']));
        self.viewModel.fut_exp_pct(pctfmt(data['fut_exp']/data['pf_aum']));
        self.viewModel.opt_delta_exp(dollarfmt(data['opt_delta_exp']));
        self.viewModel.opt_delta_exp_pct(pctfmt(data['opt_delta_exp']/data['pf_aum']));

        self.viewModel.derv_notion(dollarfmt(data['derv_notion']));
        self.viewModel.derv_notion_pct(pctfmt(data['derv_notion']/data['pf_aum']));

        self.viewModel.total_notl(dollarfmt(data['opt_delta_exp']+data['fut_exp']+data['derv_notion']));
        self.viewModel.total_notl_pct(
            pctfmt((data['opt_delta_exp']+data['fut_exp']+data['derv_notion'])/data['pf_aum']));
    };

})(jQuery);
