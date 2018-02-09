/*
Properties of socket - socket.inLobby, socket.inGame
 2 ways to leave lobby: accept a challenge, or have one of your challenges accepted
*/
var RECONNECT_BUTTON = {text: "Reconnect",
                        click: function() {
                          console.log("attempting to reconnect . . .")
                          //socket = io();
                          socket.emit("reconnect", {name: getMyName(), roomName: getRoomName(), color: (getIsWhite() ? "white" : "black")});
                          socket.emit("test");
                          initBoardEvents();
                          $(this).dialog( "close" );
                        }};
var socket;
if(socket === undefined) {
  socket = io();
  socket.inGame = false;  //set to true upon entering game
  socket.inLobby = false; //set to true upon entering lobby
  //ALL socket.on stuff here. Include it in the lobby.ejs
//----------------------- UNIVERSAL EVENTS -------------------------------------
  socket.on('disconnect', function() {
    if(socket.inGame && !getGameOver()) {
      finishGame({winner: "draw", reason: "connectError"});
    }
    prettyAlert("Connection Lost", "The connection has been lost. "
        + "This might be a bug, or it could just be bad luck. "
        + "Click the button below to attempt to resume the game.", [RECONNECT_BUTTON], true, "disconnect");
  });

  socket.on('nameNotFound', function() {
    if(socket.inGame && !getGameOver()) {
      finishGame({winner: "draw", reason: "connectError"});
    }
    prettyAlert("Error", "There has been some sort of error. The server does not recognize this nickname "
   + "as being logged in. You should return to the <a href='https://toroidal-chess.herokuapp.com/'> login page</a>"
  + ". This could just be bad luck, but if this keeps happening, it is probably some sort of bug.", [OK_BUTTON], true, "nameNotFound");
  });
}

function initLobbyEvents() {
  socket.on('lobby_enter', addPlayer);

  //when first enter lobby, find out who's here
  socket.on('currentNicks', displayOnlinePlayers);
  //when other people leave the lobby
  socket.on('lobby_leave', otherPlayerLeft);

  socket.on('challenged', receivedChallenge);

  socket.on('challengeDeclined', myChallengeDeclined);

  socket.on('challengeAccepted', myChallengeAccepted);

  socket.on('chatting', appendMessage);
}

function initBoardEvents() {
  socket.on('start', gameReady);

  socket.on('oppMove', receivedOpponentMove);

  socket.on("oppLeft", opponentLeft);

  socket.on("reconnectBoard", reconnectBoard);
}

function initGameButtonsEvents() {
  socket.on('resigned', receivedResignation);

  socket.on('drawOffer', receivedDrawOffer);

  socket.on('drawReply', receivedDrawReply);
}
