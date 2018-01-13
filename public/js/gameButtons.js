/*
PURPOSE: controls the 3 buttons below the board. Resign, Propose Draw, Return To Lobby
DEPENDENCIES: board.js
*/

function resign() {
  if(getGameOver()) { //resign button shouldn't do anything if already gameover
    return;
  }
  var yesButton = {
    text: "Yes",
    click: function() {
      var winnerColor = getIsWhite() ? "black" : "white";
      finishGame({winner: winnerColor, reason: "resign"});
      socket.emit('resignation', {winnerColor: winnerColor});
      $(this).dialog( "close" );
    }
  };
  var noButton = {
    text: "No",
    click: function() {
      $(this).dialog( "close" );
    }
  };
  prettyAlert("Resign?", "Are you sure you want to resign?", [yesButton, noButton], true)
}

function proposeDraw() {
  console.log("proposeDraw() called!")
  if(!getCanProposeDraw() || getGameOver()) {
    console.log("can't propose draw because of variable or gameOver");
    return;
  }
  $("#draw").addClass("disabled");
  setCanProposeDraw(false);
  prettyAlert("Draw Proposal Sent", "You have proposed a draw. To prevent people from "
                        + "spamming draw offers, you may not propose another "
                        + "draw until you make a move.", [OK_BUTTON], false)
  socket.emit('drawProposal');
}

function lobbyButton() {
  if(!getGameOver()) {
    var yesButton = {
      text: "Yes",
      click: function() {
        $(this).dialog( "close" );
        lobbyReturn();
      }
    };
    var noButton = {
      text: "No",
      click: function() {
        $(this).dialog( "close" );
      }
    };
    var lobbyText = "Are you sure you want to return to the lobby?"
    lobbyText += " If you return before the game is over, you will not be able"
    lobbyText += " to come back to this game, and you will lose."
    prettyAlert("Return To Lobby?", lobbyText, [yesButton, noButton], true)
  }
  else {
    lobbyReturn();
  }
}

function lobbyReturn() {
  socket.emit("lobbyReturn", {
    gameOver: getGameOver()
  });
  $.ajax({
    url: "lobbyReturn",
    type: 'POST',
    data: {myName: getMyName()},
    success: function(page) {
      console.log("within success function");
      document.open();
      document.write(page);
    }
  });
}

$("#resign").on('click', resign);
$("#draw").on('click', proposeDraw);
$("#return").on('click', lobbyButton);

socket.on('resigned', function(resignData) {
  finishGame({winner: resignData.winnerColor, reason: "resign"});
});

socket.on('drawOffer', function() {
  var acceptButton = {
    text: "Accept",
    click: function() {
      socket.emit("drawResponse", "yes");
      finishGame({winner: "draw", reason: "drawAgreement"});
      $(this).dialog("close");
    }
  };
  var declineButton = {
    text: "Decline",
    click: function() {
      socket.emit("drawResponse", "no");
      $(this).dialog("close");
    }
  }
  prettyAlert("Draw Proposal", "'" + getEnemyName() + "' has proposed a draw.", [acceptButton, declineButton], true)
});

socket.on('drawReply', function(reply) {
  if(reply == "yes") {
    prettyAlert("Draw Proposal Accepted", "'" + getEnemyName() + "' has accepted your draw proposal.", [OK_BUTTON], false)
    finishGame({winner: "draw", reason: "drawAgreement"});
  }
  else if(reply == "no") {
    prettyAlert("Draw Proposal Rejected", "'" + getEnemyName() + "' has rejected your draw proposal.", [OK_BUTTON], false)
  }
});
