/*
PURPOSE: controls the 3 buttons below the board. Resign, Propose Draw, Return To Lobby
DEPENDENCIES: board.js
GLOBALS USED: gameLogic.gameOver,
              isWhite,
              canProposeDraw
              enemyName

              finishGame({winner: "black" or "white" or "", reason: "resign" or "checkmate" or etc. . .})
*/

function resign() {
  if(gameLogic.gameOver) { //resign button shouldn't do anything if already gameover
    return;
  }
  var yesButton = {
    text: "Yes",
    click: function() {
      gameLogic.gameOver = true;
      var winnerColor = isWhite ? "black" : "white";
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
  $("#resignText").html("Are you sure you want to resign?")

  /* Note: To figure out how to hide the x button, see this site:
  https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
  $("#resignBox").dialog({
    closeOnEscape: false,
    open: function(event, ui) {
      $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
    },
    modal: true,
    buttons: [yesButton, noButton],
    title: "Resign?"
  });
}

function proposeDraw() {
  console.log("proposeDraw() called!")
  if(!canProposeDraw || gameLogic.gameOver) {
    console.log("can't propose draw because of variable or gameOver");
    return;
  }

  canProposeDraw = false;
  $("#draw").addClass("disabled");
  $("#drawText").html("You have proposed a draw. To prevent people from "
                        + "spamming draw offers, you may not propose another "
                        + "draw until you make a move.");
  $("#drawBox").dialog({
    modal: false,
    buttons: [{text: "OK", click: function() {$(this).dialog( "close" );}}],
    title: "Draw Proposal Sent"
  });
  socket.emit('drawProposal');
}

function lobbyButton() {
  if(!gameLogic.gameOver) {
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
    $("#resignText").html(lobbyText);
    /* Note: To figure out how to hide the x button, see this site:
    https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
    $("#resignBox").dialog({
      closeOnEscape: false,
      open: function(event, ui) {
        $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
      },
      modal: true,
      buttons: [yesButton, noButton],
      title: "Return To Lobby?"
    });
  }
  else {
    lobbyReturn();
  }
}

function lobbyReturn() {
  socket.emit("lobbyReturn", {
    gameOver: gameLogic.gameOver
  });
  $.ajax({
    url: "lobbyReturn",
    type: 'POST',
    data: {myName: myName},
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
  $("#drawText").html("'" + enemyName + "' has proposed a draw.");
  $("#drawBox").dialog({
    closeOnEscape: false,
    open: function(event, ui) {
      $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
    },
    modal: true,
    buttons: [acceptButton, declineButton],
    title: "Draw Proposal"
  });
});

socket.on('drawReply', function(reply) {
  if(reply == "yes") {
    $("#drawText").html("'" + enemyName + "' has accepted your draw proposal.");
    $("#drawBox").dialog({
      modal: false,
      buttons: [{text: "OK", click: function() {$(this).dialog( "close" );}}],
      title: "Draw Proposal Accepted"
    });
    finishGame({winner: "draw", reason: "drawAgreement"});
  }
  else if(reply == "no") {
    $("#drawText").html("'" + enemyName + "' has rejected your draw proposal.");
    $("#drawBox").dialog({
      modal: false,
      buttons: [{text: "OK", click: function() {$(this).dialog( "close" );}}],
      title: "Draw Proposal Rejected"
    });
  }
});
