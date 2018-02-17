/*
Properties of socket - socket.inLobby, socket.inGame
 2 ways to leave lobby: accept a challenge, or have one of your challenges accepted
*/
var RECONNECT_BUTTON = {text: "Reconnect",
                        click: function() {
                          reconnectFunction();
                          $(this).dialog( "close" );
                        }};
var socket;
if(socket === undefined) {
  socket = io();
  socket.inGame = false;  //set to true upon entering game
  socket.inLobby = false; //set to true upon entering lobby
  //ALL socket.on stuff here. Include it in the lobby.ejs
//----------------------- UNIVERSAL EVENTS -------------------------------------
  socket.on('disconnect', function() {  //TODO: consider doing this every X seconds until it works or for Y number of times and then inform of failure with finishGame
    if(socket.inGame && !getGameOver()) {
      reconnectFunction();
      console.log(JSON.stringify(reconObj));
    }
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
