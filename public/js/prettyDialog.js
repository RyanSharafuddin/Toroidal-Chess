/*
This is just a function that takes in a string and makes a pretty
modal alert appear. It looks nicer than the standard window.alert() function,
though it serves the same purpose.
It assumes the line
<div id="prettyAlertBox"><div id="prettyAlertText"></div></div>
is somewhere on the page.
*/
var OK_BUTTON = {text: "OK", click: function() {$(this).dialog( "close" );}} //text OK, closes the dialogue
function prettyAlert(title, message, buttons, modal) {
  $("#prettyAlertText").html(message);
  $("#prettyAlertBox").dialog({
    closeOnEscape: false,
    open: function(event, ui) {
      $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
    },
    modal: modal,
    buttons: buttons,
    title: title
  });
}
