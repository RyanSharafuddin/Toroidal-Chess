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
  prettyAlert("Resign?", "Are you sure you want to resign?", [yesButton, noButton], true, "resign")
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
                        + "draw until you make a move.", [OK_BUTTON], false, "proposeDraw")
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
    prettyAlert("Return To Lobby?", lobbyText, [yesButton, noButton], true, "lobbyReturn")
  }
  else {
    lobbyReturn();
  }
}

function lobbyReturn() {
  socket.inGame = false;
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

function moveUp() {
  moveBoard("up", 7); //perhaps the opposite of regular scroll is more intuitive?
}

function moveRight() {
  moveBoard("right", 7);
}

function moveLeft() {
  moveBoard("right", 1);
}

function moveDown() {
  moveBoard("up", 1);
}

$(document).keydown(function(e) {
  var tag = e.target.tagName.toLowerCase();
  if (tag == 'input' || tag == 'textarea') {
    return;
  }
  switch(e.which) {
      case 37: // left
      case 65: // a
      moveLeft();
      break;

      case 38: // up
      case 87: // w
      moveUp();
      break;

      case 39: // right
      case 68: //d
      moveRight();
      break;

      case 40: // dow n
      case 83: //s
      moveDown();
      break;

      default: return; // exit this handler for other keys
  }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

$("#resign").on('click', resign);
$("#draw").on('click', proposeDraw);
$("#return").on('click', lobbyButton);
$(".arrow.up").on('click', moveUp);
$(".arrow.right").on('click', moveRight);
$(".arrow.left").on('click', moveLeft);
$(".arrow.down").on('click', moveDown);
//------------------------- CONNECTIONS ----------------------------------------
function receivedDrawReply(reply) {
  if(reply == "yes") {
    prettyAlert("Draw Proposal Accepted", "'" + getEnemyName() + "' has accepted your draw proposal.", [OK_BUTTON], false, "drawReply")
    finishGame({winner: "draw", reason: "drawAgreement"});
  }
  else if(reply == "no") {
    prettyAlert("Draw Proposal Rejected", "'" + getEnemyName() + "' has rejected your draw proposal.", [OK_BUTTON], false, "drawReply")
  }
}

function receivedDrawOffer() {
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
  prettyAlert("Draw Proposal", "'" + getEnemyName() + "' has proposed a draw.", [acceptButton, declineButton], true, "drawOffered")
}

function receivedResignation(resignData) {
  finishGame({winner: resignData.winnerColor, reason: "resign"});
}

initSocketEvents("gameButtons.js", initGameButtonsEvents);
