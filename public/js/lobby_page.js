$( document ).ready(function() {
  var socket = io();
  var myNickname = $("#nickname").text();
  socket.emit('lobby', myNickname);

  function addPlayer(nickname) {
      /* what the button HTML should come out to be in the end
      <li id='playerNICKNAME'><input type='button' id='playerNICKNAMEbutton' class='challengeButton' value='NICKNAME' /></li>
      */
      var buttonHTML = "<li id='player" + nickname + "'><input type='button' id='player" + nickname + "button'";
      buttonHTML += " class='challengeButton' value='" + nickname + "' /></li>";
      $("#playerList").append(buttonHTML);
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
        if(onlinePlayers[player]["inLobby"] && (player != myNickname)) {
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
