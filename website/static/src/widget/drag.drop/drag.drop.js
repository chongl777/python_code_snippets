var srcTemplate="{domain}/ResearchDocuments/Forms/EditForm.aspx?Mode=Upload&CheckInComment=&ID={id}&RootFolder={fPath}&IsDlg=1"


function WfiDragDropManager(widget, startLoading, endLoading) {
    var ctx;

    function OnItemQueryCompleted(result) {
        var a = 1;
    }

    function OnItemQueryFailed(result) {
        var a = 1;
    }

    //retirveContext();
    function init(div) {
        var self = this;
        d3.select(div).selectAll('div.drop-overlay')
            .data([1]).enter()
            .append('div')
            .attr('class', 'drop-overlay')
            .style('text-align', 'center')
            .style('display', 'none')
            .append('span').text('Drop here...')
            .style('font-size', '1.46em');


        d3.select(div).selectAll('div.drop-overlay')
            .data([1]).enter()
            .append('div')
            .attr('class', 'drop-overlay')
            .style('text-align', 'center')
            .style('display', 'none')
            .append('span').text('Drop here...')
            .style('font-size', '1.46em');

        $('div.drop-overlay', div).on('drop', function (evt) {
            var event = evt.originalEvent;
            event.preventDefault();
            event.stopPropagation();
            $(event.currentTarget).css("display", "none");
            itemDropHandler(event.dataTransfer.files[0]);
        });

        $(div).on('dragenter', function (event) {
            console.log('dragenter');
            event.preventDefault();
            event.stopPropagation();
            //$(div).css('border', 'solid 2px black');

            d3.select(div).selectAll('div.drop-overlay')
                .style('position', 'absolute')
                .style('display', 'block')
                .style('width', $(div).width()+'px')
                .style('height', $(div).height()+'px')
                .style('z-index', 100)
                .style('background-color', 'rgba(236, 236, 236, 0.95)');

            d3.select(div).selectAll('div.drop-overlay span')
                .style('line-height', $(div).height()+'px');

            return false;
        });

        $(div).on('dragover',function(event){
            event.preventDefault();
        })

        $('div.drop-overlay', div).on('dragleave', function (event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('dragleave');
            //$(div).css('border', 'solid 1px black');
            $('div.drop-overlay', div).css('display', 'none');
        });

        return this;
    }

    function fIsNullOrUndefined(a) {
        return typeof a=="undefined" || a==null;
    }


    function itemDropHandler(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            uploadFile(e.target.result, file.name);
        };
        reader.onerror = function(e) {
            alert(e.target.error);
        }
        reader.readAsArrayBuffer(file);
    }

    function uploadFile(arrayBuffer, fileName)
    {
        //Get Client Context,Web and List object.
        // arrayBuffer = new Uint8Array(arrayBuffer);
        var options = dragDropManager.options;
        var fUrl = "/" + options['rLib'] + '/' + options['folderName'];
        var form = new FormData()
        form.append("binary", new Blob([arrayBuffer]), fileName);
        form.append("url", fUrl);
        form.append("cid", options['cid']);
        startLoading();

        $.ajax({
            url: "upload_file_to_research_doc",
            method: "POST",
            contentType: false,
            data: form,
            cache: false,
            processData: false,
            success: function(params) {
                endLoading();
                params = JSON.parse(params);
                params['Title'] = fileName;
                QuerySuccess(params);
            },
            error: function (error) {
                endLoading();
                QueryFailure(error);
            }
        });
    }

    function QuerySuccess(params)
    {
        var editor = new AttrEditor(widget, params);
        editor.openEditor()
    }

    function modifyDocProperties() {
        var overlay = createDlag();
        $('h1#title', overlay).text("Edit");
        var tableContent =
                '<tr> \
                    <td><h3>Title</h3></td> \
                    <td colspan="2"><input data-bind="value: Title"/></td> \
                </tr><tr> \
                    <td><h3>Effective Date</h3></td> \
                    <td colspan="2"><input type="date" data-bind="value: Effective_x0020_Date"/></td> \
                </tr><tr> \
                    <td><h3>Category</h3></td> \
                    <td colspan="2"><select data-bind="selectedOptions: CategoryId, options: available_categories, optionsText: catId2Text"/></td> \
                </tr><tr> \
                    <td><h3>Sentiment</h3></td> \
                    <td colspan="2"><select data-bind="selectedOptions: SentimentId, options: available_categories, optionsText: sentId2Text"/></td> \
                </tr><tr> \
                    <td><h3>Comments</h3></td> \
                    <td colspan="2"><textarea data-bind="value: Comments"></h3></td> \
                </tr>';
        $('table#content', overlay).html(tableContent);
        return overlay;
    }


    function QueryFailure(error)
    {
        alert('Request failed with error message - ' + error.statusText);
    }

    function setOptions(options) {
        var self = this;
        self.options = options;
    }

    var dragDropManager = new init(widget);
    dragDropManager.setOptions = setOptions;

    return dragDropManager;
}


function AttrEditor(widget, params) {
    function openEditor() {
        var overlay = modifyDocProperties();

        var vm = function() {
            this.CategoryId = ko.observable([params['CategoryId']]);
            this.SentimentId = ko.observable([params['SentimentId']]);
            this.available_categories = [0, 1, 2, 3];
            this.Comments = ko.observable("");
            this.Title = ko.observable(params['Title']);
            this.Effective_x0020_Date = ko.observable(d3.timeFormat("%Y-%m-%d")(new Date()));
            this.catId2Text = function(id) {
                var id2text = {
                    0: "(None)",
                    1: "Fundamental",
                    2: "News",
                    3: "Restructure"};
                return id2text[id];};

            this.sentId2Text = function(id) {
                var id2text = {
                    0: "(None)",
                    1: "Positive",
                    2: "Neutral",
                    3: "Negative"};
                return id2text[id];};

            this.submit = function() {
                var self = this;
                var attrs = {
                    CategoryId: self.CategoryId()[0],
                    SentimentId: self.SentimentId()[0],
                    Comments: self.Comments(),
                    Title: self.Title(),
                    Effective_x0020_Date: self.Effective_x0020_Date()
                }
                updateItemAttrs.call(overlay, params['Id'], attrs);
            }

            this.cancel = function() {
                overlay.removeDlg();
                widget.reupdate();
            }

            this.deleteRc = function() {
                var self = this;
                deleteItem.call(overlay, params['Id']);
            }
            return this;
        };

        ko.applyBindings(new vm(), overlay[0]);
        $("body").append(overlay);
    }

    function modifyDocProperties() {
        var overlay = createDlag();
        $('h1#title', overlay).text("Edit");
        var tableContent =
                '<tr> \
                    <td><h3>Title</h3></td> \
                    <td colspan="2"><input data-bind="value: Title"/></td> \
                </tr><tr> \
                    <td><h3>Effective Date</h3></td> \
                    <td colspan="2"><input type="date" data-bind="value: Effective_x0020_Date"/></td> \
                </tr><tr> \
                    <td><h3>Category</h3></td> \
                    <td colspan="2"><select data-bind="selectedOptions: CategoryId, options: available_categories, optionsText: catId2Text"/></td> \
                </tr><tr> \
                    <td><h3>Sentiment</h3></td> \
                    <td colspan="2"><select data-bind="selectedOptions: SentimentId, options: available_categories, optionsText: sentId2Text"/></td> \
                </tr><tr> \
                    <td><h3>Comments</h3></td> \
                    <td colspan="2"><textarea data-bind="value: Comments"></h3></td> \
                </tr>';
        $('table#content', overlay).html(tableContent);
        return overlay;
    }

    function createDlag() {
        var overlay = $('<div>');
        var removeDlg = function() {overlay.remove();}
        overlay.attr('id', 'OVER-file-attrs');
        overlay.html('<div class="tgt-px-dlg" style="width: 630px; height:430px;"></div>');

        var dlg = $('div.tgt-px-dlg', overlay);
        dlg.css("top", $(window).height()/2-210)
            .css('left', $(window).width()/2-315);
        dlg.draggable({
            handle: "div.dlgTitle"
        });
        dlg.html(
            '<div class="dlgTitle" style="cursor: move; position:relative;clear:both"> \
               <h1 id="title" style="float: left;">Update price target</h1> <span id="TitleBtns" class="dlgTitleBtns" style="float: right"> \
                 <a class="dlgCloseBtn" title="Close dialog" href="javascript:;" accesskey="C" data-bind="click: cancel"> \
                   <span style="padding:8px; height:16px; width:16px; display:inline-block"> \
                     <span style="height:16px; width:16px; position:relative; display:inline-block; overflow:hidden;" class="s4-clust"> \
                        <img src="./static/src/images/fgimg.png?rev=23" alt="Close dialog" style="left:-0px !important;top:-645px !important;position:absolute;" class="ms-dlgCloseBtnImg"> \
                     </span> \
                   </span> \
                 </a> </span> </div> \
                 <div class ="dlgFrameContainer"> \
                   <table id="content"> \
                     <tbody> </tbody> \
                   </table> \
                   <table id="submit-button"> \
                       <tr> \
                           <td><img src="./static/src/images/loadingcirclests16.gif?rev=23" id="ImageProgress" style="display:none;"/> \
                           <input type="button" value="Okay" data-bind="click: submit"/> \
                           <input type="button" value="Delete" data-bind="click: deleteRc"/> \
                           <input type="button" value="Cancel" data-bind="click: cancel"/> \
                       </tr> \
                    </table> \
                  </div>');

        //$('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
        overlay.removeDlg = removeDlg;
        overlay.start_loading = function() {$('#ImageProgress', overlay).css('display', 'inline-block')};
        overlay.end_loading = function() {$('#ImageProgress', overlay).css('display', 'none')};
        return overlay;
    }

    function updateItemAttrs(id, attrs) {
        var self = this;
        self.start_loading();

        $.ajax({
            "url": "update_item_attrs",
            "method": "POST",
            "type": "json",
            "data": {
                'id': id,
                'attrs': JSON.stringify(attrs)},
            success: function(ret) {
                // format each data point
                self.end_loading();
                self.removeDlg();
                widget.reupdate();
            },
            error: function (error) {
                self.end_loading();
                self.removeDlg();
                alert(error.responseText);
                widget.reupdate();
            }
        });
        return true;
    }

    function deleteItem(id) {
        var self = this;
        self.start_loading();

        $.ajax({
            "url": "delete_item",
            "method": "POST",
            "type": "json",
            "data": {'id': id},
            success: function(ret) {
                // format each data point
                self.end_loading();
                self.removeDlg();
                widget.reupdate();
            },
            error: function (error) {
                self.end_loading();
                // self.removeDlg();
                alert(error.responseText);
                widget.reupdate();
            }
        });
        return true;
    }

    this.openEditor = openEditor;
    return this
}
