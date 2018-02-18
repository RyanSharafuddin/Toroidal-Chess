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
var clearDisconnectTimeout;
var RECONNECT_LIMIT = 30000; //how many milliseconds to wait for reconnection
if(socket === undefined) {
  socket = io();
  socket.inGame = false;  //set to true upon entering game
  socket.inLobby = false; //set to true upon entering lobby
  //ALL socket.on stuff here. Include it in the lobby.ejs
//----------------------- UNIVERSAL EVENTS -------------------------------------
  socket.on('disconnect', function() {  // consider doing this every X seconds until it works or for Y number of times and then inform of failure with finishGame
    if(socket.inGame && !getGameOver()) { //never mind, apparently it 'waits' for the socket reconnection
      if(UIState.timed) {
        pauseTimer(true);
        pauseTimer(false);
      }
      disconnectFlagSet();
      finishGame({winner: "draw", reason: "connectError"});
      var closeStr = prettyAlert("Disconnected", "The server has disconnected. Please wait 30 seconds while the program attempts to reconnect . . .", [], true, "disconnectionDealWith");
      setDisconnectDialog(closeStr);
      reconnectFunction();
      clearDisconnectTimeout = setTimeout(function() {
        if(!getIsConnected()) {
          $(closeStr).dialog("close");
          prettyAlert("Connection Error", "The program was unable to reconnect. "
         + "You should return to the <a href='https://toroidal-chess.herokuapp.com/'> login page</a>"
        + ". This could just be bad luck, but if this keeps happening, it is probably some sort of bug.", [OK_BUTTON], true, "divdmweofiqiodn"); //got lazy here. Just needs to be a unique divID
          console.log("Not connected RECONNECT_LIMIT seconds later");
          //close disconnect dialog and replace it with failure dialog leading back to login page. then done with this branch, and onto timer
        }
      },
      RECONNECT_LIMIT);//wait before declaring failure.
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
