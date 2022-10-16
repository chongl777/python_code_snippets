$( function() {
    $.widget( "custom.catcomplete", $.ui.autocomplete, {
        _create: function() {
            this._super();
            this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
        },
        _renderMenu: function( ul, items ) {
            var that = this,
                currentCategory = "";
            $.each( items, function( index, item ) {
                var li;
                if ( item.category != currentCategory ) {
                    ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
                    currentCategory = item.category;
                }
                li = that._renderItemData( ul, item );
                if ( item.category ) {
                    li.attr( "aria-label", item.category + " : " + item.label );
                }
            });
        }
    });
    var data = [
        { label: "anders", category: "" },
        { label: "andreas", category: "" },
        { label: "antal", category: "" },
        { label: "annhhx10", category: "Products" },
        { label: "annk K12", category: "Products" },
        { label: "annttop C13", category: "Products" },
        { label: "anders andersson", category: "People" },
        { label: "andreas andersson", category: "People" },
        { label: "andreas johnson", category: "People" }
    ];

    $( "#search" ).catcomplete({
        delay: 0,
        source: data
    });
} );


function main() {
    var data = {
        "name": "A1AAA",
        "children": [
            {
                "name": "B1",
                "children": [
                    {
                        "name": "C1",
                        "value": 100
                    },
                    {
                        "name": "C2",
                        "value": 300
                    },
                    {
                        "name": "C3",
                        "value": 200
                    }
                ]
            },
            {
                "name": "B2",
                "value": 200
            }
        ]
    }
    var root = d3.hierarchy(data)
    var margin = 100;

    var treeLayout = d3.tree();
    treeLayout.size([$('svg').width() - margin, $('svg').height() - margin]);
    treeLayout(root);

    // Nodes
    var width = 100;
    var height = 50
    d3.select('svg g g.nodes')
        .selectAll('circle.node')
        .data(root.descendants())
        .enter()
        .each( function(d) {
            d3.select(this).append('rect')
                .classed('node', true)
                .attr('x', function(d) {return d.x - width/2;})
                .attr('y', function(d) {return d.y - height/2;})
                .attr('height', height)
                .attr('width', width);
            d3.select(this).append('text').text(
                function(d) {
                    return d.data.name + "aksdkfjeidi kj dfdfde sdfae";})
                .attr('x', function(d) {return d.x-width/2;})
                .attr('dx', 5)
                .attr('y', function(d) {return d.y;})
                .style('font-size', function(d) {
                    return Math.min(width, (width - 8) / this.getComputedTextLength() * 14) + "px"; })
        });

    // Links
    d3.select('svg g g.links')
        .selectAll('line.link')
        .data(root.links())
        .enter()
        .append('line')
        .classed('link', true)
        .attr('x1', function(d) {return d.source.x;})
        .attr('y1', function(d) {return d.source.y;})
        .attr('x2', function(d) {return d.target.x;})
        .attr('y2', function(d) {return d.target.y;});

    function zoom() {
        svgGroup.attr("transform", "translate(" +
                      d3.event.transform.x+","+d3.event.transform.y+
                      ")scale(" + d3.event.transform.k + ")");
    }

    function reset() {
        //d3.select('svg').call(zoomListener);
        zoomListener.transform(d3.select('svg'), d3.zoomIdentity);

        // console.log(d3.event.transform.x, d3.event.transform.y);
        // svgGroup.attr("transform", "translate(0,0)scale(1)");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.zoom().scaleExtent([0.5, 3]).on("zoom", zoom);
    d3.select('svg').call(zoomListener);
    d3.select('svg').on('dblclick.zoom', reset);
    var svgGroup = d3.select('svg #group');
}


$(document).ready(main);
