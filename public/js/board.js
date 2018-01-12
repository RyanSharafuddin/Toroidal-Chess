//--------------------------- UTILITY STUFF ------------------------------------

function myTurn(state) {
  return ((isWhite && state.whiteTurn) || (isBlack && !state.whiteTurn))
}

//from http://chessboardjs.com/examples#5003
/*colors square in light_color if it's a white square, or
  dark_color if it's a black sqaure.
  light_color and dark_color must be hex strings in format
  "#a9a9a9" */
var color_square = function(square, light_color, dark_color) {
  var squareEl = $('#board1 .square-' + square);
  var background = light_color;
  if (squareEl.hasClass('black-3c85d') === true) {
    background = dark_color;
  }
  squareEl.css('background', background);
}

var uncolor_squares = function() {
  $('#board1 .square-55d63').css('background', '');
}
var LIGHT_GRAY = '#a9a9a9';
var DARK_GRAY = '#696969';
var LIGHT_RED = '#DB3C3C';
var DARK_RED = '#972B2B';
//--------------------------- END UTILITY STUFF --------------------------------

var promotionButtons = function(color, square) {
  var buttons = [];
  var queenButton = {
    text: "Queen",
    click: function() {
      gameLogic.moves[gameLogic.moves.length - 1] += " Queen";
      addPiece(color + "Q", square);
      $(this).dialog( "close" );
    }
  }
  buttons.push(queenButton);

  var knightButton = {
    text: "Knight",
    click: function() {
      gameLogic.moves[gameLogic.moves.length - 1] += " Knight";
      addPiece(color + "N", square);
      $(this).dialog( "close" );
    }
  }
  buttons.push(knightButton);

  var rookButton = {
    text: "Rook",
    click: function() {
      gameLogic.moves[gameLogic.moves.length - 1] += " Rook";
      addPiece(color + "R", square);
      $(this).dialog( "close" );
    }
  }
  buttons.push(rookButton);

  var bishopButton = {
    text: "Bishop",
    click: function() {
      gameLogic.moves[gameLogic.moves.length - 1] += " Bishop";
      addPiece(color + "B", square);
      $(this).dialog( "close" );
    }
  }
  buttons.push(bishopButton);
  return buttons;
}
//call when user promotes
function displayPromotionButtons(color, target) {
  $("#promotionText").html("Promote pawn to:")
  /* Note: To figure out how to hide the x button, see this site:
  https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
  $("#promotionBox").dialog({
    closeOnEscape: false,
    open: function(event, ui) {
      $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
    },
    modal: true,
    buttons: promotionButtons(color, target),
    title: "Pawn Promotion"
  });
}

/* Only call this when promoting a pawn */
function addPiece(piece, square) {
  posObj = board1.position();
  posObj[square] = piece;
  board1.position(posObj);
  updatePosAndStateGeneral(posObj, gameLogic, null, null);
  updateDisplay(gameLogic, posObj);
  sendMove(posObj, gameLogic);
}


//--------------------------- END GAME RULES -----------------------------------
//--------------------------- USER INTERACTION ---------------------------------
//only to be used when a move happens
function updateDisplay(state, pos) {
  if(state.moves == undefined) {
    console.log("state.moves is undefined!!");
    console.trace();
    throw "ERR";
  }
  $('#moveHistory').append('<li>' + state.moves[state.moves.length - 1] + '</li>');
  $("#historyContainer").scrollTop($("#historyContainer")[0].scrollHeight);
  var checkString = (state.inCheck) ? (myTurn(state) ? myName : enemyName) : "";
  if(state.blackMated || state.whiteMated) {
    finishGame({winner: (state.whiteMated ? "black" : "white"), reason: "checkmate"});
    return;
  }
  if(state.stalemated) {
    finishGame({winner: "draw", reason: "stalemate"});
    return;
  }
  //by default
  $("#myNameDisplay").text(myName);
  $("#enemyNameDisplay").text(enemyName);
  if(checkString == myName) {
    $("#myNameDisplay").text(myName + " - in check");
  }
  if(checkString == enemyName) {
    $("#enemyNameDisplay").text(enemyName + " - in check");
  }
  if(myTurn(state)) {
    console.log("MY TURN!");
    $("#myNameDisplay").removeClass("unHighlightedPlayerName");
    $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
  }
  else {
    $("#myNameDisplay").addClass("unHighlightedPlayerName");
    $("#enemyNameDisplay").removeClass("unHighlightedPlayerName");
  }
}

/* Don't allow player to drag wrong color pieces or after game is over
   Also, only player 1 can move white pieces; only player 2 can
   move black*/
var onDragStart = function(source, piece, position, orientation) {
  if(gameLogic.gameOver ||
     (gameLogic.whiteTurn &&  ((piece.search(/^b/) !== -1) || !isWhite)) ||
      (!gameLogic.whiteTurn &&  ((piece.search(/^w/) !== -1) || !isBlack)) ) {
        return false;
      }
};

/* Check if move is legal and update state if a legal move has been made */
var onDrop = function(source, target, piece, newPos, oldPos, currentOrientation) {
  uncolor_squares();
  var color = piece.charAt(0);
  var moves = legalSquares(source, piece, oldPos, gameLogic);
  if($.inArray(target, moves) === -1) {
    return 'snapback';
  }
  updatePosAndStateGeneral(oldPos, gameLogic, source, target);
  canProposeDraw = true; //renew ability to propose draw everytime you move
  $("#draw").removeClass("disabled");
  board1.position(oldPos);
  var promoted = false;
  var promotionRank = (piece.charAt(0) == "w") ? "8" : "1";
  if(piece.charAt(1) == "P" && target.charAt(1) == promotionRank) {
    promoted = true;
    displayPromotionButtons(color, target)
  }
  if(!promoted) {
    updateDisplay(gameLogic, oldPos);
    sendMove(oldPos, gameLogic);
  }
};

function highlightList(square, highlights, lightColor, darkColor) {
  // exit if nothing to highlight
  if (highlights.length === 0) return;

  // highlight the square they moused over
  color_square(square, lightColor, darkColor);

  // highlight the possible squares for this piece
  for (var i = 0; i < highlights.length; i++) {
    color_square(highlights[i], lightColor, darkColor);
  }
}

function gameOverMouseOver(square, piece, pos) {
  if((gameLogic.whiteMated && isBlack) || (gameLogic.blackMated && isWhite)) {
    console.log("I am the mater; highlight my threats in red");
    var myPieceHighlights = threatenedSquares; //from toroidal.js
    var myLightHighCol = LIGHT_RED;
    var myDarkHighCol = DARK_RED;
    var enemyHighlights = legalSquares //from toroidal.js
    var enemyLightHighCol = LIGHT_GRAY;
    var enemyDarkHighCol = DARK_GRAY;
  }
  //I'm the matee -- default action
  else if((gameLogic.whiteMated && isWhite) || (gameLogic.blackMated && isBlack)) {
    var myPieceHighlights = legalSquares;
    var enemyHighlights = threatenedSquares;
    var myLightHighCol = LIGHT_GRAY;
    var myDarkHighCol = DARK_GRAY;
    var enemyLightHighCol = LIGHT_RED;
    var enemyDarkHighCol = DARK_RED;
  }
  else if(gameLogic.stalemated) {
    var myLightHighCol = LIGHT_RED;
    var myDarkHighCol = DARK_RED;
    var enemyLightHighCol = LIGHT_RED;
    var enemyDarkHighCol = DARK_RED;
    var enemyHighlights = threatenedSquares;
    var myPieceHighlights = threatenedSquares;
  }
  else {
    return; //game end by draw agreement or leaving or resign
  }
  try {
    var myPiece = ((piece.charAt(0) == 'w') && isWhite) || ((piece.charAt(0) == 'b') && isBlack);
  }
  catch (e) {
    console.log("piece is " + piece);
    console.log(e);
    console.trace();
  }
  var lightColor = (myPiece) ? myLightHighCol : enemyLightHighCol;
  var darkColor = (myPiece) ? myDarkHighCol : enemyDarkHighCol;
  var highlights = (myPiece) ? myPieceHighlights(square, piece, pos, gameLogic) : enemyHighlights(square, piece, pos, gameLogic);
  console.log("game over highlights: " + highlights);
  highlightList(square, highlights, lightColor, darkColor);
}
/*On your turn, highlight in grey the places you can move to,
  and highlight in red the squares enemy pieces threaten*/
  //on game over by mate or stalemate, see threats of winning side
var onMouseoverSquare = function(square, piece, pos) {
  if(!piece) {
    return;
  }
  if(gameLogic.gameOver) {
    gameOverMouseOver(square, piece, pos);
    return;
  }
  if(!myTurn(gameLogic) || (!showValid && !showThreat) ) {
    return;
  }
  var myPieceHighlights = legalSquares;
  var myLightHighCol = LIGHT_GRAY;
  var myDarkHighCol = DARK_GRAY;
  var enemyHighlights = threatenedSquares;
  var enemyLightHighCol = LIGHT_RED;
  var enemyDarkHighCol = DARK_RED;

  var myPiece = ((piece.charAt(0) == 'w') && isWhite) || ((piece.charAt(0) == 'b') && isBlack);
  var lightColor = (myPiece) ? myLightHighCol : enemyLightHighCol;
  var darkColor = (myPiece) ? myDarkHighCol : enemyDarkHighCol;
  var highlights = (myPiece) ? myPieceHighlights(square, piece, pos, gameLogic) : enemyHighlights(square, piece, pos, gameLogic);
  console.log(highlights);

  if(((!showValid && myPiece) || (!showThreat && !myPiece))) {
    return;
  }
  highlightList(square, highlights, lightColor, darkColor);
};

var onMouseoutSquare = function(square, piece) {
  uncolor_squares();
};

//--------------------------- END USER INTERACTION -----------------------------
//--------------------------- BUTTON SETUP -------------------------------------

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

//--------------------------- END BUTTON SETUP ---------------------------------
//--------------------------- FINISH GAME PRETTIFYING --------------------------

function setGameEndDisplay(data) {
  //data in form of {winner: nickname or "", in case of draw. nonwinners: [], nonwinnerDisplayString: "resigned" or "left" etc.}
  var winnerDisplayID = (data.winner == myName) ? "#myNameDisplay" : "#enemyNameDisplay";
  var nonwinnerDisplayIDs = (data.winner.length == 0) ? ["#myNameDisplay", "#enemyNameDisplay"] : ((data.winner == enemyName) ? ["#myNameDisplay"] : ["#enemyNameDisplay"]);
  $(winnerDisplayID).html("WINNER *" + data.winner + "* WINNER!");
  $(winnerDisplayID).removeClass("unHighlightedPlayerName");
  console.log("SET END GAME DISPLAY!");
  console.log("nonwinnerDisplayIDs: " + nonwinnerDisplayIDs);
  console.log("data: " + JSON.stringify(data));
  for (var i = 0; i < data.nonwinners.length; i++) {

    $(nonwinnerDisplayIDs[i]).html(data.nonwinners[i] + data.nonwinnerDisplayString);
    $(nonwinnerDisplayIDs[i]).addClass("unHighlightedPlayerName");
  }
}
function finishGame(data) {
  /* data in form of {winner: "white" or "black" or "draw",
                    reason: "checkmate", "stalemate", "resign", "oppLeft", "drawAgreement"} */
  gameLogic.gameOver = true;
  var reason = data.reason;
  var winner = data.winner;
  console.log("finishGame!! " + reason);
  switch(reason) {
    case "checkmate":
      if(((winner == "white") && isWhite) || ((winner == "black") && isBlack)) {
        setGameEndDisplay({winner: myName, nonwinners: [enemyName], nonwinnerDisplayString: " was checkmated!"});
      }
      else {
        setGameEndDisplay({winner: enemyName, nonwinners: [myName], nonwinnerDisplayString: " was checkmated!"});
      }
      break;
    case "stalemate":
      setGameEndDisplay({winner: "", nonwinners: [myName, enemyName], nonwinnerDisplayString: " stalemated!"});
      break;
    case "resign":
      if((isWhite && winner == "white") || (isBlack && winner == "black")) {
        setGameEndDisplay({winner: myName, nonwinners: [enemyName], nonwinnerDisplayString: " resigned!"});
      }
      else {
        setGameEndDisplay({winner: enemyName, nonwinners: [myName], nonwinnerDisplayString: " resigned!"});
      }
      break;
    case "oppLeft":
      setGameEndDisplay({winner: myName, nonwinners: [enemyName], nonwinnerDisplayString: " left!"});
      break;
    case "drawAgreement":
      setGameEndDisplay({winner: "", nonwinners: [myName, enemyName], nonwinnerDisplayString: " - Draw by agreement."});
      break;
  }
}
//--------------------------- END FINISH GAME PRETTIFYING ----------------------
//--------------------------- GLOBALS AND SETUP CONSTRUCTORS -------------------
var TOROIDAL_START = "r1b2b1r/pp4pp/n1pqkp1n/3pp3/3PP3/N1PQKP1N/PP4PP/R1B2B1R";
var cfg = {
  position: TOROIDAL_START,
  draggable: true,
  onDragStart: onDragStart,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onDrop: onDrop
};
var board1 = ChessBoard('board1', cfg);
var gameLogic = {
  whiteTurn: true,
  inCheck: false, //only set to true if inCheck and not in mate. Applies to side of whiteTurn
  gameOver: false,
  blackMated: false,
  whiteMated: false,
  stalemated: false,
  wKLoc: "e3",
  bKLoc: "e6",
  moves: [],
  enpassants: {
    a3: false,
    b3: false,
    g3: false,
    h3: false,
    a6: false,
    b6: false,
    g6: false,
    h6: false
  }
};
function TotalState(pos, state) {
  this.position = pos;
  this.state = state;
}
$("#resign").on('click', resign);
$("#draw").on('click', proposeDraw);
$("#return").on('click', lobbyButton);
var isBlack = false;
var isWhite = false;
var canProposeDraw = true;
var myName = $("#myName").text();
var enemyName = $("#enemyName").text();
var roomName = "X" + (($("#1").length > 0) ? myName : enemyName);
var whiteChat = "#7a04ef";
var blackChat = "#ef8904";
$("#vs").remove(); //needed to get info; don't want to display

var showValid = (($("#showValidY").length > 0) ? true : false)
var showThreat = (($("#showThreatY").length > 0) ? true : false)
//----------------------- END GLOBALS AND SETUP CONSTRUCTORS -------------------


//------------------------------------------------------------------------------
// Connection stuff
//------------------------------------------------------------------------------
var socket = io();
socket.emit('startGame', {myName: myName, enemyName: enemyName, roomName: roomName});

socket.on('start', function(data) {
  (data.color == "white") ? (isWhite = true) : (isBlack = true);
  isWhite ? ($("#enemyNameDisplay").addClass("unHighlightedPlayerName")) : ($("#myNameDisplay").addClass("unHighlightedPlayerName"));
  board1.orientation(data.color);
});

//to be used by addPiece and onDrop
function sendMove(pos, state) {
  socket.emit('move', new TotalState(pos, state));
}

socket.on('oppMove', function(totalState) {
  board1.position(totalState.position);
  gameLogic = totalState.state;
  updateDisplay(gameLogic, totalState.position);
});

socket.on("oppLeft", function() {
  if(gameLogic.gameOver) { //don't do anything if game already over
    return;
  }
  finishGame({winner: ((isWhite) ? "white" : "black"), reason: "oppLeft"});
});

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
//------------------------------Chat Stuff--------------------------------------
$('#messageForm').submit(function(){
  var color = (isWhite) ? whiteChat : blackChat;
  socket.emit('chatMessage', {message: $('#m').val(), sender: myName, color: color});
  $('#m').val('');
  return false;
});

socket.on('chatting', appendMessage);

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
