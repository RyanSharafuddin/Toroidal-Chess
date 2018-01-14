//------------------------------Chat Stuff--------------------------------------
/* PURPOSE
    controls the chat at the right column of the screen
  DEPENDENCIES:
      board.js
  GLOBALS FROM DEPENDENCIES USED:
    getIsWhite() - whether that browser is the white player or not
    getMyName()  - nickname of that browser
//TODO: modularize this file so that it can be used for lobby chat with no changes                                                                            */
var WHITE_CHAT_COLOR = "#7a04ef"; //the color in which white's name appears in chat
var BLACK_CHAT_COLOR = "#ef8904";
$('#messageForm').submit(function(){
  console.log("SUBMITTING MESSAGE?!?!?");
  var color = (getIsWhite()) ? WHITE_CHAT_COLOR : BLACK_CHAT_COLOR;
  socket.emit('chatMessage', {message: $('#m').val(), sender: getMyName(), color: color});
  $('#m').val('');
  return false;
});

function hasWhiteSpace(s) {
  return /\s/g.test(s);
}

function appendMessage(data) {
  var LIMIT = 38;
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

initSocketEvents("chat.js", initChatEvents);
