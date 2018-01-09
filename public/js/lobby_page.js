$( document ).ready(function() {
  var socket = io();
  var myNickname = $("#nickname").text();
  socket.emit('lobby', myNickname);

  function addPlayer(nickname) {
      $("#playerList").append("<li id=player" + nickname + ">" + nickname + "</li>");
  }

  socket.on('lobby_enter', function(nickname) { //upon other people entering lobby
    addPlayer(nickname);
    console.log(nickname + " entered");
  });

  socket.on('currentNicks', function(onlinePlayers) {
    console.log("Players already here: ")
    console.log(JSON.stringify(onlinePlayers, null, 4));
    for(var player in onlinePlayers) {
      if(onlinePlayers.hasOwnProperty(player)) {
        if(onlinePlayers[player]["inLobby"]) {
          addPlayer(player);
        }
      }
    }
  });

  socket.on('lobby_leave', function(nickname) {
    console.log(nickname + " left");
    $("#player" + nickname).remove();
  });
});
