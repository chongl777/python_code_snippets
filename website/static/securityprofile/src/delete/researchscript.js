// (function () {

// //   Initialize the variables for overrides objects
// 	var overrideCtx = {};
// 	overrideCtx.Templates = {};

// //	alert("Override call worked");

// //  Use BaseViewID and ListTemplateType to narrow focus/scope on
// //	which web parts on the page are affected
// //	overrideCtx.BaseViewID = 1;
// //	overrideCtx.ListTemplateType = 100;

//     /*
//      * Using the Fields override leaves the rest of the rendering intact, but
//      * allows control over one or more specific fields in the existing view
//      */
// 	overrideCtx.Templates.Fields = {
// 		'Title': { 'View' : 'Animal' }
// 	};

//     /*
//      * Register the template overrides.
//      */
// 	SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrideCtx);
// })();


/*

 // hide rows
(function () {

   //var excludeRows = [0,2,3];

  function renderListItemTemplate(renderCtx) {
    if (renderCtx.CurrentItem.Security_x003a__x0020_security_id == 118)
    {
      return RenderItemTemplate(renderCtx);
    }
      return ""
    }


    function registerListRenderer()
    {
       var context = {};
       context.Templates = {};
       context.Templates.Item = renderListItemTemplate;

       SPClientTemplates.TemplateManager.RegisterTemplateOverrides(context);
    }
    ExecuteOrDelayUntilScriptLoaded(registerListRenderer, 'clienttemplates.js');

})();
*/

// delete rows
(function () {
  var url = new URL(document.URL);
  var sid = url.searchParams.get("sid")? url.searchParams.get("sid"): "";
  if (sid == "")
  {
    return;
  }
  else
  {
    sid = Number.parseInt(sid);
  }

  function listPreRender(renderCtx) {
    if (renderCtx.wpq != 'WPQ2')
    {
      return;
    }

    var rows = renderCtx.ListData.Row; //get current rows
    for(var i = rows.length - 1; i >= 0; i--) {
      if (rows[i].Security_x003a__x0020_security_id != sid)
      {
        console.log(i + " deleting:" + rows[i].FileLeafRef);
        rows.splice(i, 1);  //delete List View Row
        renderCtx.ListData.LastRow = rows.length;  //update ListData.LastRow property
      }
      else
      {
        console.log(i + " keeping:" +rows[i].FileRef);
      }
    }
    console.log("finished");
  }


  function registerListRenderer()
  {
    var context = {};
    context.Templates = {};
    context.OnPreRender = listPreRender;

    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(context);
  }

  ExecuteOrDelayUntilScriptLoaded(registerListRenderer, 'clienttemplates.js');

})();
