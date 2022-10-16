var src="http://wfdb01:7777/sites/Research/ResearchDocuments/Forms/EditForm.aspx?Mode=Upload&CheckInComment=&ID=165&RootFolder=%2Fsites%2FResearch%2FResearchDocuments%2FGENON&IsDlg=1"
var srcTemplate="http://wfdb01:7777/sites/Research/ResearchDocuments/Forms/EditForm.aspx?Mode=Upload&CheckInComment=&ID={id}&RootFolder={fPath}&IsDlg=1"


function WfiDragDropManager(widget) {
    var ctx;
    function retrieveContentInfo(dir) {
        $.ajax({
            url: "../_api/contextinfo/",
            method: "PUT",
            data: "",
            header: {
                "accept": "application/json; odata=verbose",
                "content-type":"application/json;odata=verbose"},
            success: function(result) {
                var a = result;
            },
            error: function(msg) {
                window.alert(msg);
            }
        });
    }
    //retrieveContentInfo();
    function retirveContext(dir) {
        var ctx = SP.ClientContext.get_current();
        var listItem = ctx.get_web().get_lists().getByTitle("ResearchDocuments")
        ctx.load(listItem, 'EffectiveBasePermissions', 'ID', 'Title', 'Owner', 'Active', 'Modified', 'Editor');
        ctx.executeQueryAsync(
            Function.createDelegate(this, OnItemQueryCompleted),
            Function.createDelegate(this, OnItemQueryFailed));

    }

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

    function UserHasPermission() {
        var b = false;
        if (typeof g_currentControl.checkPermissionFunc == "function")
            b = g_currentControl.checkPermissionFunc();
        else {
            var a = fIsNullOrUndefined(g_currentCtx) ? ctx : g_currentCtx;
            if (!fIsNullOrUndefined(a))
                if (fIsNullOrUndefined(a.ListSchema)) {
                    if (!fIsNullOrUndefined(a.FolderRight_AddListItems)
                        && a.FolderRight_AddListItems == "1"
                        || fIsNullOrUndefined(a.FolderRight_AddListItems)
                        && a.ListRight_AddListItems != null)
                        b = true
                } else if (
                    !fIsNullOrUndefined(a.ListSchema.FolderRight_AddListItems)
                        && a.ListSchema.FolderRight_AddListItems == "1"
                        || fIsNullOrUndefined(a.ListSchema.FolderRight_AddListItems)
                        && a.ListSchema.ListRight_AddListItems != null)
                    b = true
        }
        !b && ShowErrorDialog(Strings.STS.L_NoUploadPermission, null);
        return b
    }

    function ShowErrorDialogCore(e, b, f, g){
        var a;
        if(Boolean(g)) a = b;
        else
            a="<div>"+b+"</div>";
        a=a+"<div class='ms-core-form-bottomButtonBox'>"+
            "<button id='js-dnd-OKBtnDismissDlg' onclick='DismissErrDlg(this)'>"+
            Strings.STS.L_CloseButtonCaption+"</button></div>";
        var d = document.createElement("DIV");
        d.innerHTML = a;
        var h={html:d,title:e,dialogReturnValueCallback:f},
            i=new SP.UI.ModalDialog.showModalDialog(h),
            c=document.getElementById("js-dnd-OKBtnDismissDlg");
        Boolean(c) && c.focus()}

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
        var options = dragDropManager.options;
        var clientContext = new SP.ClientContext();
        var oWeb = clientContext.get_web();
        var url = clientContext.get_url();
        //var oList = oWeb.get_lists().getByTitle('ResearchDocuments');
        var fUrl = url + "/" + options['rLib'] + '/' + options['folderName'];
        var oFolder = oWeb.getFolderByServerRelativeUrl(fUrl);
        //Convert the file contents into base64 data
        var bytes = new Uint8Array(arrayBuffer);
        var i, length, out = '';
        for (i = 0, length = bytes.length; i < length; i += 1)
        {
            out += String.fromCharCode(bytes[i]);
        }
        var base64 = btoa(out);
        //Create FileCreationInformation object using the read file data
        var createInfo = new SP.FileCreationInformation();
        createInfo.set_content(base64);
        createInfo.set_url(fileName);
        //Add the file to the library
        var uploadedDocument = oFolder.get_files().add(createInfo);

        // file MetaData
        var oListItem = uploadedDocument.get_listItemAllFields();
        var coValue = new SP.FieldLookupValue();

        oListItem.set_item('CompanyInfo_ID', options['cid_bcd']);
        oListItem.set_item('Company', options['cid']);

        //oListItem.set_item('Sentiment', coValue);
        oListItem.update();
        var params = {'url': url, 'fUrl': fUrl, 'item': oListItem};

        //Load client context and execcute the batch
        clientContext.load(uploadedDocument, 'ListItemAllFields');
        clientContext.executeQueryAsync(
            Function.createDelegate(params, QuerySuccess),
            Function.createDelegate(this, QueryFailure));
    }

    function QuerySuccess(sender, args)
    {
        var id = this['item'].get_id();
        var src = srcTemplate.replace('{id}', id)
                .replace('{fPath}', this['fUrl'])
                .replace(' ', '%20');
        var dlag = createDlag(src);
        $("body").append(dlag);

        window[1].frameElement.commitPopup = function(retVal) {
            dlag.removeDlg();
            widget.reupdate();
        };

        window[1].frameElement.cancelPopUp = function(retVal) {
            dlag.removeDlg();
            widget.reupdate();
        };
    }

    function createDlag(srclink) {
        var overlay = $('<div>');
        var removeDlg = function() {overlay.remove();}
        overlay.attr('id', 'OVER');
        overlay.html('<div class="attr-dlg" style="width: 600px;"></div>');
        var dlg = $('div.attr-dlg', overlay);

        dlg.css('overflow-y', 'scroll');

        dlg.css("top", 0)
            .css('left', ($(window).width()-$(dlg).width())/2)
            .css('height', '100%');
        dlg.draggable();

        dlg.html(
            '<iframe scrolling="no" src={src}/>'.replace('{src}', srclink));
        $('iframe', dlg).css('height', '2300px').css('width', '100%');

        $('a.dlgCloseBtn, input[value="Cancel"]', dlg).on("click", removeDlg);
        overlay.removeDlg = removeDlg;

        return overlay;
    }


    function QueryFailure(sender, args)
    {
        alert('Request failed with error message - ' +
              args.get_message() + ' . Stack Trace - ' + args.get_stackTrace());
    }

    function setOptions(options) {
        var self = this;
        self.options = options;
    }

    var dragDropManager = new init(widget);
    dragDropManager.setOptions = setOptions;

    return dragDropManager;
}
