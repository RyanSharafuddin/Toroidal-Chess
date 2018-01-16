//------------------------------Chat Stuff--------------------------------------
/* PURPOSE
    controls the chat at the right column of the screen
  DEPENDENCIES:
      board.js
  GLOBALS FROM DEPENDENCIES USED:
    getIsWhite() - whether that browser is the white player or not
    getMyName()  - nickname of that browser
TODO: modularize this file so that it can be used for lobby chat with no changes
this file assumes the existence of a variable called CHAT_COLOR and CHAT_NAME and
assumes the divs are in a container called chatContainer
uses those.
*/

var LIMIT = 45;
$('#messageForm').submit(function(){
  socket.emit('chatMessage', {message: $('#m').val(), sender: CHAT_NAME, color: CHAT_COLOR});
  $('#m').val('');
  return false;
});

function hasWhiteSpace(s) {
  return /\s/g.test(s);
}

function appendMessage(data) {
  if ((data.message.length > LIMIT) && !hasWhiteSpace(data.message)) {
    var a = data.message.slice(0, LIMIT);
    $('#messages').append(messageMaker(data.color, data.sender, a));
    appendMessage({color: data.color, sender: data.sender, message: data.message.slice(LIMIT)});
  }
  else {
    $('#messages').append(messageMaker(data.color, data.sender, data.message));
    $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
  }
}
function messageMaker(color, name, message) {
  var HTMLstr = '<li><div class="messageContainer"><div class="nameTile" style="color: ' + color + ';"><strong>' + name;
  HTMLstr += ': </strong></div><div class="messageTile"> ' + message + '</div></div></li>';
  return HTMLstr;
}
