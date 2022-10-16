//var pid;
//var folderName = null;
//var server_url = "http://192.168.168.6:9999";
//var widget = {};

var gridster = {};
var PARAMS = {}
PARAMS['cid'] = null;
PARAMS['cid_bcd'] = null;
PARAMS['folderName'] = null;
PARAMS['widget'] = {};
PARAMS['rLib'] = "ResearchDocuments";
PARAMS['heightIncrement'] = 13;
PARAMS['widthIncrement'] = 125;
PARAMS['vMargin'] = 20;
var startLoading, endLoading;


var main = function() {
    function addTitle(obj) {
        var source = '<header class="title"> \
                    <h data-bind="text: title"></h> \
                    <img class="config" src="./static/src/images/settings.png"> \
                  </header>';
        obj.each(function(i, div) {
            // var $html = $(Handlebars.compile(source)({title: div.options.title()}));
            var $html = $(source);

            $('img', $html).on('click', function(p) {
                var widget = div;
                widget.open_option_setup(widget);
            })
            $(this).prepend($html);

            ko.applyBindings(div.options, $html[0]);
        });
        return obj;
    }

    function update(data) {
        updateMapsData(data);
        updateTable(data);
    }

    function updateTable(data) {
        datatable.updateWithData(data);
    }

    function updateMapsData(data) {
        //maps.$instance
        $("g.datamaps-arrow", maps.$container).remove();
        $("circle.datamaps-bubble", maps.$container).remove();

        var bubbles = [];
        var arcs = [];
        data.forEach(function(p, i) {
            var shipinfo = {};
            var ship;
            shipinfo.imo = p.imo;
            shipinfo.class = p.class || p.class_prev;
            shipinfo.type = p.type || p.type_prev;
            shipinfo.name = p.name || p.name_prev;
            shipinfo.destination = p.destination || p.destination_prev;
            shipinfo.final_country = p.destination_country || p.destination_country_prev;
            shipinfo.poc_ctry = p.poc_ctry || p.poc_ctry_prev;
            shipinfo.final_country = shipinfo.final_country || shipinfo.poc_ctry;
            shipinfo.poc_port = p.poc_port || p.poc_port_prev;
            shipinfo.poc_port_detail = p.poc_port_detail || p.poc_port_detail_prev;
            shipinfo.ben_owner = p.ben_owner || p.ben_owner_prev;
            var timeFormat = d3.time.format('%Y-%m-%d');
            var timeParse = d3.time.format('%Y-%m-%dT%H:%M:%S.%LZ').parse;
            if (p.last_seen_latitude != null) {
                ship = {};
                ship.radius = 7;
                ship.last_seen = p.last_seen == null ? "" : timeFormat(timeParse(p.last_seen));
                ship.eta = p.eta == null ? "" : timeFormat(timeParse(p.eta));
                ship.yield = 15000;
                ship.fillKey = colormap[shipinfo.final_country] || 'OTHER';
                ship.fillOpacity = 1;
                ship.borderWidth = 1;
                ship.latitude = p.last_seen_latitude;
                ship.longitude = p.last_seen_longitude;
                ship.data = p
                $.each(shipinfo, function(k, v) {
                    ship[k] = v;
                });
                bubbles.push(ship);
            }

            if (p.last_seen_latitude_prev != null) {
                ship = {};
                ship.radius = 4;
                ship.last_seen = p.last_seen_prev == null ? "" : timeFormat(timeParse(p.last_seen_prev));
                ship.eta = p.eta_prev == null ? "" : timeFormat(timeParse(p.eta_prev));
                ship.yield = 15000;
                ship.fillKey = colormap[shipinfo.final_country] || 'OTHER';
                ship.latitude = p.last_seen_latitude_prev;
                ship.longitude = p.last_seen_longitude_prev;
                ship.borderWidth = 1;
                ship.data = p
                $.each(shipinfo, function(k, v) {
                    ship[k] = v;
                });
                bubbles.push(ship);
            }
            if ((p.last_seen_latitude_prev != null) & (p.last_seen_latitude != null)) {
                arcs.push({
                    'origin': {
                        latitude: p.last_seen_latitude_prev,
                        longitude: p.last_seen_longitude_prev
                    },
                    destination: {
                        latitude: p.last_seen_latitude,
                        longitude: p.last_seen_longitude
                    },
                    options: {
                        greatArc: true,
                        fillKey: colormap[shipinfo.final_country] || 'OTHER'
                    }
                });
            };
        })

        maps.arrow(arcs, {arcSharpness: 0, animationSpeed: 500})
        maps.circles(bubbles, {
            borderWidth: 1,
            borderColor: '#000000',
            highlightFillColor: '#FC8D59',
            highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
            highlightBorderWidth: 2,
            popupOnHover: true,
            highlightOnHover: true,
            onclick: function(map, circle, datum) {
              var tmpt = '\
                <div>\
                  <table id="ship-side-bar" style="width: 100%; margin: 10px"> \
                    <thead><th style="width: 50%"></th><th style="width: 50%"></th</thead> \
                    <tbody> \
                        <tr> \
                          <td>IMO:</td>\
                          <td><a href="https://www.marinetraffic.com/en/ais/details/ships/imo:{{imo}}" target="vesselship">{{imo}}</a></td>\
                        </tr> \
                        <tr> \
                          <td>Name:</td>\
                          <td>{{name}}</td>\
                        </tr> \
                        <tr> \
                          <td>Beneficial Owner:</td>\
                          <td>{{ben_owner}}</td>\
                        </tr> \
                        <tr> \
                          <td>Class:</td>\
                          <td>{{class}}</td>\
                        </tr> \
                        <tr><td> &nbsp </td></tr> \
                        <tr><td colspan="2" style="text-align: center">Current Info</td></tr> \
                        <tr> \
                          <td>Last Seen:</td>\
                          <td> {{ last_seen_tm }}</td>\
                        </tr> \
                        <tr> \
                          <td>Speed Knots:</td>\
                          <td>{{speed_knots}}</td>\
                        </tr> \
                        <tr> \
                          <td>Destination:</td>\
                          <td>{{destination}}</td>\
                        </tr> \
                        <tr> \
                          <td>Destination Country:</td>\
                          <td>{{destination_country}}</td>\
                        </tr> \
                        <tr> \
                          <td>POC Port:</td>\
                          <td>{{poc_port_detail}}</td>\
                        </tr> \
                        <tr> \
                          <td>POC Country:</td>\
                          <td>{{poc_ctry}}</td>\
                        </tr> \
                        <tr><td> &nbsp </td></tr> \
                        <tr><td colspan="2" style="text-align: center">Previous Info</td></tr> \
                        <tr> \
                          <td>Last Seen:</td>\
                          <td> {{ last_seen_tm_prev }}</td>\
                        </tr> \
                        <tr> \
                          <td>Speed Knots:</td>\
                          <td>{{speed_knots_prev}}</td>\
                        </tr> \
                        <tr> \
                          <td>Destination:</td>\
                          <td>{{destination_prev}}</td>\
                        </tr> \
                        <tr> \
                          <td>Destination Country:</td>\
                          <td>{{destination_country_prev}}</td>\
                        </tr> \
                        <tr> \
                          <td>POC Port:</td>\
                          <td>{{poc_port_detail_prev}}</td>\
                        </tr> \
                        <tr> \
                          <td>POC Country:</td>\
                          <td>{{poc_ctry_prev}}</td>\
                        </tr> \
                    </tbody>\
                  </table> \
                  <div style="width:100%; text-align:center"><button flag="true" id="past-track" style="height:35px; width:160px" class="button">Show Past Track</button></div>\
                 </div>';
                var timeFormat = d3.time.format("%Y-%m-%d %H:%M");
                var timeParse = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ").parse;

                datum.data['last_seen_tm'] = datum.data.last_seen && timeFormat(
                    timeParse(datum.data.last_seen));
                datum.data['last_seen_tm_prev'] = datum.data.last_seen_prev && timeFormat(
                    timeParse(datum.data.last_seen_prev));
                datum.data['name'] = datum.data['name'] || datum.data['name_prev'];
                datum.data['ben_owner'] = datum.data['ben_owner'] || datum.data['ben_owner_prev'];
                datum.data['class'] = datum.data['clas'] || datum.data['class_prev'];
                var content = $(Handlebars.compile(tmpt)(datum.data));
                $('button#past-track', content).click(function() {
                    var self = this;
                    if ($(self).attr('flag') == 'true') {
                        set_display('none');
                        $(self).attr('flag', 'false');
                        $(self).text('Hide Past Track');
                        streamContent(
                            'past_track',
                            {imo: datum['imo'],
                             lookback: 30,
                             t_date: datum.data.last_seen || timeFormat(new Date())},
                            show_past_track)
                    } else {
                        set_display('inline');
                        $(self).attr('flag', 'true');
                        $(self).text('Show Past Track')
                        map.instance.svg.selectAll('circle.datamaps-hist-track').remove();
                        map.instance.svg.selectAll('g.datamaps-past-track-arrow').remove();
                    }
                });
                sidebar.add_preclose_fn(function() {
                    set_display('inline');
                    map.instance.svg.selectAll('circle.datamaps-hist-track').remove();
                    map.instance.svg.selectAll('g.datamaps-past-track-arrow').remove();
                })
                sidebar.show(content);

                function set_display(property) {
                    map.instance.svg.selectAll('circle.datamaps-bubble').style('display', property);
                    map.instance.svg.selectAll('g.datamaps-arrow').style('display', property);
                }
            },
            popupTemplate: function (geo, data) {
                var tmpt = '\
                <div class="hoverinfo" style="width: 250px">\
                    <table style="width: 100%"> \
                    <thead><th style="width: 50%"></th><th style="width: 50%"></th></thead> \
                    <tbody> \
                        <tr> \
                          <td>IMO:</td>\
                          <td>{{imo}}</td>\
                        </tr> \
                        <tr> \
                          <td>last seen:</td>\
                          <td>{{last_seen}}</td>\
                        </tr> \
                        <tr> \
                          <td>ETA:</td>\
                          <td>{{eta}}</td>\
                        </tr> \
                        <tr> \
                          <td>class:</td>\
                          <td>{{class}}</td>\
                        </tr> \
                        <tr> \
                          <td>destination:</td>\
                          <td>{{destination}}</td>\
                        </tr> \
                        <tr> \
                          <td>final country:</td>\
                          <td>{{final_country}}</td>\
                        </tr> \
                    </tbody> \
                    </table> \
                </div>';
                data.destination_country = data.destination_country || data.poc_ctry;
                return Handlebars.compile(tmpt)(data);
            }
        });

        maps.zoom.reset();
    }


    function show_past_track(data) {
        var bubbles = [];
        var arcs = [];
        var prevship;
        data = data.sort(function(a, b) {return a.last_seen < b.last_seen});
        data.forEach(function(p, i) {
            var shipinfo = {};
            var ship;
            var timeFormat = d3.time.format("%Y-%m-%d %H:%M");
            var timeParse = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ").parse;

            p.final_country = p.destination_country;
            ship = {};
            // ship.radius = 7 / maps.zoom.d3Zoom.scale();
            ship.radius = 7;
            ship.last_seen = p.last_seen == null ? "" : timeFormat(timeParse(p.last_seen));
            ship.eta = p.eta == null ? "" : timeFormat(timeParse(p.eta));
            ship.yield = 15000;
            ship.fillKey = colormap[p.final_country] || 'OTHER';
            ship.fillOpacity = 1;
            ship.borderWidth = 1;
            ship.latitude = p.last_seen_latitude;
            ship.longitude = p.last_seen_longitude;
            ship.destination = p.destination;

            bubbles.push(ship);
            if (i > 0) {
                arcs.push({
                    'origin': {
                        latitude: prevship.latitude,
                        longitude: prevship.longitude
                    },
                    destination: {
                        latitude: ship.latitude,
                        longitude: ship.longitude
                    },
                    options: {
                        greatArc: true,
                        fillKey: colormap[p.final_country] || 'OTHER'
                    }
                });
            };
            prevship = ship;
        });

        maps.arrow(arcs, {
            arcSharpness: 0,
            animationSpeed: 500,
            group_class: 'datamaps-past-track-arrow'
        });
        maps.circles(bubbles, {
            borderWidth: 1,
            borderColor: '#000000',
            highlightFillColor: '#FC8D59',
            highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
            highlightBorderWidth: 2,
            popupOnHover: true,
            highlightOnHover: true,
            group_class: 'datamaps-hist-track',
            popupTemplate: function (geo, data) {
                var tmpt = '\
                <div class="hoverinfo" style="width: 250px">\
                    <table style="width: 100%"> \
                    <thead><th style="width: 50%"></th><th style="width: 50%"></th></thead> \
                    <tbody> \
                        <tr> \
                          <td>IMO:</td>\
                          <td>{{imo}}</td>\
                        </tr> \
                        <tr> \
                          <td>last seen:</td>\
                          <td>{{last_seen}}</td>\
                        </tr> \
                        <tr> \
                          <td>ETA:</td>\
                          <td>{{eta}}</td>\
                        </tr> \
                        <tr> \
                          <td>destination:</td>\
                          <td>{{destination}}</td>\
                        </tr> \
                        <tr> \
                          <td>final country:</td>\
                          <td>{{final_country}}</td>\
                        </tr> \
                    </tbody> \
                    </table> \
                </div>';
                data.destination_country = data.destination_country || data.poc_ctry;
                return Handlebars.compile(tmpt)(data);
            }
        });
        maps.zoom.reset();
    };


    function streamContent(url, args, fn) {
        var lastResponseLength = false;

        var pos;
        var delimiter = '|%$|'

        startLoading();
        $.ajax({
            url: url,
            method: "GET",
            dataType: 'text',
            timeout: 1000*120,
            data: args,
            xhrFields: {
                // Getting on progress streaming response
                onprogress: function(e)
                {
                    var progressResponse;
                    var response = e.currentTarget.response;
                    if(lastResponseLength === false)
                    {
                        progressResponse = response;
                    }
                    else
                    {
                        progressResponse = response.substring(lastResponseLength);
                    }

                    pos = progressResponse.indexOf(delimiter)
                    // console.log(progressResponse);
                    while (pos != -1) {
                        var data = JSON.parse(progressResponse.substring(0, pos));
                        fn(data);
                        lastResponseLength += pos + delimiter.length;
                        progressResponse = response.substring(lastResponseLength);
                        pos = progressResponse.indexOf(delimiter)
                    }
                }
            },
            success: function(data) {
                endLoading();
                // currency risk
                //updateSize();
            },
            error: function (error) {
                endLoading();
                alert("script:updateContent:"+error.responseText);
            }
        })
    }


    var paramsInput = new (function () {
        var t_date = new Date();
        var s_date = new Date();
        var self = this;
        var timeFormat = d3.time.format("%Y-%m-%dT%H:%M");
        t_date.setHours(23)
        t_date.setMinutes(59)
        s_date.setDate(t_date.getDate()-3);
        s_date.setHours(23);
        s_date.setMinutes(59);

        this.t_date = ko.observable(timeFormat(t_date));
        this.s_date = ko.observable(timeFormat(s_date));
        this.lookback = 3;
        this.query_filter = ko.observable('');
        return this;
    })();


    function initialize(PARAMS) {
        var bubble_map = new Datamap({
            element: '#maps',
            scope: 'world',
            geographyConfig: {
                popupOnHover: true,
                highlightOnHover: true,
                borderColor: '#444',
                borderWidth: 0.1,
                dataUrl: './static/src/datamaps/data/world.hires.topo.json'
                //dataJson: topoJsonData
            },
            fills: {
                'CHINA': '#CC4731',
                'IRAN': '#A9C0DE',
                'INDIA': '#008000',
                'OTHER': '#EDDC4E',
                'SAUDI': '#FF8F0F',
                defaultFill: '#dddddd'
            },
            setProjection: function (element) {
                var projection = d3.geo.mercator()
                        .center([50, 24]) // always in [East Latitude, North Longitude]
                        .scale(500);
                var path = d3.geo.path().projection(projection);
                // var path = null;
                return { path: path, projection: projection };
            },
            data: {
                'SAU': {fillKey: 'SAUDI'},
                'CHN': {
                    fillKey: 'CHINA'},
                'IRN': {
                    fillKey: 'IRAN'},
                'IND': {
                    fillKey: 'INDIA'},
                'TWN': {fillKey: 'CHINA'}
            }
        });

        bubble_map.add_legend();
        maps = bubble_map;
        datatable = addTitle($('#data-table').init_wfi_table({
            title: "Data-Table",
            columns_setup: [
                {data: "index",
                 sortable: false,
                 visible: true,
                 title: 'index',
                 width: '5%',
                 render: function(name) {
                     return '<div class="value">' + name + '</div>'}},
                {data: "imo",
                 sortable: false,
                 visible: true,
                 title: 'imo',
                 width: '20%',
                 render: function(name) {
                     return '<div class="value">' + name + '</div>'}},
                {data: "name",
                 sortable: false,
                 visible: true,
                 title: 'name',
                 width: '20%',
                 render: function(name) {
                     return '<div class="value">' + name + '</div>'}},
                {data: "name_prev",
                 sortable: false,
                 visible: true,
                 title: 'name_prev',
                 width: '20%',
                 render: function(name) {
                     return '<div class="value">' + name + '</div>'}},
                {data: "last_seen",
                 sortable: false,
                 visible: true,
                 title: 'last_seen',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>'}},
                {data: "ben_owner",
                 sortable: false,
                 visible: true,
                 title: 'ben_owner',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>'}},
                {data: "destination",
                 sortable: false,
                 visible: true,
                 title: 'destination',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>'}},
                {data: "destination_country",
                 sortable: false,
                 visible: true,
                 title: 'destination_country',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>'}},

                {data: "max_last_seen",
                 sortable: false,
                 visible: true,
                 title: 'max_last_seen',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>'}},
                {data: "max_last_seen_prev",
                 sortable: false,
                 visible: true,
                 title: 'max_last_seen_prev',
                 width: '20%',
                 render: function(value) {
                     return '<div class="value">' + value + '</div>'}},
            ],
            init_level: 0,
            groupdata: false
        }));
    }

    // ---------------------------------------------------
    var maps, sidebar, datatable;
    [startLoading, endLoading] = loadingIcon();
    $('#tabs').tabs();
    sidebar = $('#mySidenav').init_wfi_side_bar({
        'width': 300,
        'position': 'right'});

    var colormap = {
            'Iran': 'IRAN',
            'China': 'CHINA',
            'India': 'INDIA'
    };

    $('div#search-bar').wfi_autocomplete({
        placeholder: "Search Ship ...",
        onsearch: function(input) {
            var imo = input[0].value.toString();
            var imo2;
            $('g.circles circle.datamaps-bubble').each(function(i, p) {
                imo2 = JSON.parse($(p).attr("data-info"))['imo'];
                if (imo==imo2) {
                    d3.select(p).transition()
                        .style('stroke-width', '10px')
                        .style('stroke', 'rgba(250, 15, 160, 0.2)');
                }
            });
        },
        update_fn: function(imo, fn) {
            var result = [];
            var shipinfo;
            var item;
            $('g.circles circle.datamaps-bubble').each(function(i, p) {
                shipinfo = JSON.parse($(p).attr("data-info"));
                if (shipinfo['imo'].toString().match(new RegExp(imo)) != null) {
                    item = JSON.stringify({value: shipinfo['imo'], id: shipinfo['name']});
                    if (result.indexOf(item) == -1) {
                        result.push(item);
                    }
                }
            });
            fn(result);
        }
    });

    $("#control-panel").init_wfi_control_panel({
        inputs: paramsInput,
        update: function() {
            var timeParse = d3.time.format('%Y-%m-%dT%H:%M').parse;
            var t_date = timeParse(paramsInput.t_date());
            var s_date = timeParse(paramsInput.s_date());
            var query_filter = paramsInput.query_filter();
			      var lookback = paramsInput.lookback;
			      streamContent(
                'shipping_data',
                {
                    t_date: t_date.toLocaleString(),
                    s_date: s_date.toLocaleString(),
                    lookback: lookback,
                    query_filter: query_filter
                }, update)},
        showSettingPages: false,
        input_args: {
            submit_func: function() {
                var self = this;
            },
            cancel_func: function() {
                var self = this;
            }
        }
    });
    // ko.applyBindings(paramsInput);
    // ko.applyBindings(paramsInput, $("#control-panel")[0]);
    ko.applyBindings(paramsInput, $('#PageTitle')[0]);
    initialize(PARAMS);
}

$(document).ready(main);
