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
    var a = 1;
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



function getLastItemID(){
  var queryBuffer = [];
  queryBuffer.push(
    '<Where>'+
			'<Eq>'+
			'<FieldRef Name="Security_x003a__x0020_security_id"/>'+
			'<Value Type="Number">118</Value>'+
			'</Eq>'+
			'</Where>');
  // queryBuffer.push("<OrderBy><FieldRef Name='ID' Ascending='FALSE' /></OrderBy>");
  /*
  var res = spjs_QueryItems(
    {listName: "{2A44B710-4B6D-4229-89D5-54A9D341994B}",
     query: queryBuffer.join(''),
     viewFields:['ID'],
     rowLimit:10});
   */
  var res = spjs_QueryItems(
    {listName: "{2A44B710-4B6D-4229-89D5-54A9D341994B}",
     query: queryBuffer.join(''),
     viewFields:['ID', 'LinkFilenameNoMenu', 'Security_x003a__x0020_security_id'],
     rowLimit:10});
  if(res.count<0){
    alert("An error occurred. Most likely the parameter \"thisListGuid\" is wrong.");
  }
  else if(res.count>0){
    return res.items[0].ID;
  }else{
    return '';
  }
}


var main = function () {
  // draggable
  //$('.widget').draggable({disabled: true});
  //$('#pages').tabs();
  //$('select.combo-box').combify();
  //$('select#text-select').combify();
  // var url = new URL(document.URL);
  // var sid = url.searchParams.get("sid")|| "";
  // $('input[name=WPQ3T1]').val(sid);
  getLastItemID();

  /*__doPostBack('ctl00$ctl26$g_1bd36566_0970_4f5d_a6ee_6fe942f544b6','true');

  if ($('div#MSOZoneCell_WebPartWPQ2 iframe').attr("filterlink") == '?')
  {
    $('input#searchBtn').trigger('click');
  }
  */
}

$(document).ready(main)
