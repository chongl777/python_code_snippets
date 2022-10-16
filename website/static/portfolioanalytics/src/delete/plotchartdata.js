
var main = function() {
  var plot = $('div.wfi-plot').init_plot(1);
  plot.each(function(i, p) {
    p.updateData($(p).attr("sid").split(':'), '9/1/2017', 360, $(p).attr("risk_type"));
  })
}

$(document).ready(main)
