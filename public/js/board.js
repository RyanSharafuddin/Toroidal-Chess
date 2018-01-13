/*
PURPOSE:
  HIGH LEVEL: controls the board and display bars and move history

  Disallow dragging enemy pieces or any pieces when it's not your turn (onDrag)
  Disallow illegal moves (onDrop)
  Update display and state when a legal move is made (onDrop)
  Send move when a legal move is made (onDrop)
  Update display and state when a move is received (socket.on("oppMove"))
  Update display and state when a move ends the game (updateDisplay)
  Have a finishGame function that buttons can use to draw/resign/etc. (finishGame)
  end game if the opponent leaves (socket.on("oppLeft"))
  have a mouseover/mouseout function that updates dispay on mousing over stuff

DEPENDENCIES: toroidal.js - uses only the "exposed" functions
*/

//--------------------------- UTILITY STUFF ------------------------------------
function myTurn(state) {
  return ((UIState.isWhite && state.whiteTurn) || (UIState.isBlack && !state.whiteTurn))
}

//only use this after a move has been made
function setUpdatedStateAndPos(data, fromEnemy) {
  var useAnimation = fromEnemy;
  board1.position(data.pos, useAnimation);
  gameLogic = data.state;
}

//from http://chessboardjs.com/examples#5003
// light_color and dark_color are hex RGB strings for CSS use
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
  function buttonFunctionMaker(pieceLetter, square, color) {
    return (function() {
      addPiece(color + pieceLetter, square);
      $(this).dialog( "close" );
    });
  }
  var buttons = [];
  var PIECES_TEXT = ["Queen", "Knight", "Rook", "Bishop"];
  var CORRESPONDING_LETTER = ["Q", "N", "R", "B"];

  for(var i = 0; i < PIECES_TEXT.length; i++) {
    buttons.push({text: PIECES_TEXT[i], click: buttonFunctionMaker(CORRESPONDING_LETTER[i], square, color)});
  }
  return buttons;
}

/* Only call this when promoting a pawn */
function addPiece(piece, square) {
  var data = promotePawnGetUpdatedPosAndState(piece, square, board1.position(), gameLogic);
  setUpdatedStateAndPos(data, false);
  updateDisplay(gameLogic, board1.position());
  sendMove(board1.position(), gameLogic);
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
  var checkString = (state.inCheck) ? (myTurn(state) ? UIState.myName : UIState.enemyName) : "";
  if(state.blackMated || state.whiteMated) {
    finishGame({winner: (state.whiteMated ? "black" : "white"), reason: "checkmate"});
    return;
  }
  if(state.stalemated) {
    finishGame({winner: "draw", reason: "stalemate"});
    return;
  }
  //by default
  $("#myNameDisplay").text(UIState.myName);
  $("#enemyNameDisplay").text(UIState.enemyName);
  if(checkString == UIState.myName) {
    $("#myNameDisplay").text(UIState.myName + " - in check");
  }
  if(checkString == UIState.enemyName) {
    $("#enemyNameDisplay").text(UIState.enemyName + " - in check");
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
     (gameLogic.whiteTurn &&  ((piece.search(/^b/) !== -1) || !UIState.isWhite)) ||
      (!gameLogic.whiteTurn &&  ((piece.search(/^w/) !== -1) || !UIState.isBlack)) ) {
        return false;
      }
};

/* Check if move is legal and update state if a legal move has been made */
var onDrop = function(source, target, piece, newPos, oldPos, currentOrientation) {
  uncolor_squares();
  if(!isLegalMove(oldPos, gameLogic, source, target)) {
    return 'snapback';
  }
  var data = getUpdatedPosAndState(oldPos, gameLogic, source, target);
  UIState.canProposeDraw = true; //TODO: set UI state
  $("#draw").removeClass("disabled"); //TODO: put in update display, which includes whether move came from you or enemy
  setUpdatedStateAndPos(data, false);
  if (isPromotion(piece, source, target)) {
    var color = piece.charAt(0);
    displayPromotionButtons(color, target)
  }
  else {
    updateDisplay(gameLogic, oldPos);
    sendMove(data.pos, gameLogic);
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
  if((gameLogic.whiteMated && UIState.isBlack) || (gameLogic.blackMated && UIState.isWhite)) {
    console.log("I am the mater; highlight my threats in red");
    var myPieceHighlights = threatenedSquares; //from toroidal.js
    var myLightHighCol = LIGHT_RED;
    var myDarkHighCol = DARK_RED;
    var enemyHighlights = legalSquares //from toroidal.js
    var enemyLightHighCol = LIGHT_GRAY;
    var enemyDarkHighCol = DARK_GRAY;
  }
  //I'm the matee -- default action
  else if((gameLogic.whiteMated && UIState.isWhite) || (gameLogic.blackMated && UIState.isBlack)) {
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
    var myPiece = ((piece.charAt(0) == 'w') && UIState.isWhite) || ((piece.charAt(0) == 'b') && UIState.isBlack);
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
  if(!myTurn(gameLogic) || (!UIState.showValid && !UIState.showThreat) ) {
    return;
  }
  var myPieceHighlights = legalSquares;
  var myLightHighCol = LIGHT_GRAY;
  var myDarkHighCol = DARK_GRAY;
  var enemyHighlights = threatenedSquares;
  var enemyLightHighCol = LIGHT_RED;
  var enemyDarkHighCol = DARK_RED;

  var myPiece = ((piece.charAt(0) == 'w') && UIState.isWhite) || ((piece.charAt(0) == 'b') && UIState.isBlack);
  var lightColor = (myPiece) ? myLightHighCol : enemyLightHighCol;
  var darkColor = (myPiece) ? myDarkHighCol : enemyDarkHighCol;
  var highlights = (myPiece) ? myPieceHighlights(square, piece, pos, gameLogic) : enemyHighlights(square, piece, pos, gameLogic);
  console.log(highlights);

  if(((!UIState.showValid && myPiece) || (!UIState.showThreat && !myPiece))) {
    return;
  }
  highlightList(square, highlights, lightColor, darkColor);
};

var onMouseoutSquare = function(square, piece) {
  uncolor_squares();
};

//--------------------------- END USER INTERACTION -----------------------------

//--------------------------- FINISH GAME PRETTIFYING --------------------------

function setGameEndDisplay(data) {
  //data in form of {winner: nickname or "", in case of draw. nonwinners: [], nonwinnerDisplayString: "resigned" or "left" etc.}
  var winnerDisplayID = (data.winner == UIState.myName) ? "#myNameDisplay" : "#enemyNameDisplay";
  var nonwinnerDisplayIDs = (data.winner.length == 0) ? ["#myNameDisplay", "#enemyNameDisplay"] : ((data.winner == UIState.enemyName) ? ["#myNameDisplay"] : ["#enemyNameDisplay"]);
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
      if(((winner == "white") && UIState.isWhite) || ((winner == "black") && UIState.isBlack)) {
        setGameEndDisplay({winner: UIState.myName, nonwinners: [UIState.enemyName], nonwinnerDisplayString: " was checkmated!"});
      }
      else {
        setGameEndDisplay({winner: UIState.enemyName, nonwinners: [UIState.myName], nonwinnerDisplayString: " was checkmated!"});
      }
      break;
    case "stalemate":
      setGameEndDisplay({winner: "", nonwinners: [UIState.myName, UIState.enemyName], nonwinnerDisplayString: " stalemated!"});
      break;
    case "resign":
      if((UIState.isWhite && winner == "white") || (UIState.isBlack && winner == "black")) {
        setGameEndDisplay({winner: UIState.myName, nonwinners: [UIState.enemyName], nonwinnerDisplayString: " resigned!"});
      }
      else {
        setGameEndDisplay({winner: UIState.enemyName, nonwinners: [UIState.myName], nonwinnerDisplayString: " resigned!"});
      }
      break;
    case "oppLeft":
      setGameEndDisplay({winner: UIState.myName, nonwinners: [UIState.enemyName], nonwinnerDisplayString: " left!"});
      break;
    case "drawAgreement":
      setGameEndDisplay({winner: "", nonwinners: [UIState.myName, UIState.enemyName], nonwinnerDisplayString: " - Draw by agreement."});
      break;
  }
}
//--------------------------- END FINISH GAME PRETTIFYING ----------------------
//--------------------------- GLOBALS AND SETUP CONSTRUCTORS -------------------
var cfg = {
  position: TOROIDAL_START,
  draggable: true,
  onDragStart: onDragStart,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onDrop: onDrop
};
var board1 = ChessBoard('board1', cfg);
var gameLogic = new InitGameState();
var UIState = new InitUIState(); //will be inited in socket.on("start")
console.log("UIState is " + JSON.stringify(UIState));
console.log("myName gotten directly from the page" + $("#myName").text());
function TotalState(pos, state) {
  this.position = pos;
  this.state = state;
}
//TODO: consider creating and documenting a User Interface state update (only needs to update canProposeDraw, as of now)
//TODO: TEST to see if you messed up with InitUIState
function InitUIState(data) {
  this.isBlack = false;
  this.isWhite = false;
  if(data !== undefined) {
    (data.color == "white") ? (this.isWhite = true) : (this.isBlack = true);
  }
  this.canProposeDraw = true;
  this.myName = ($("#myName").text()) ? $("#myName").text() : this.myName;
  this.enemyName = ($("#enemyName").text()) ? $("#enemyName").text() : this.enemyName;
  this.roomName = "X" + (($("#1").length > 0) ? this.myName : this.enemyName);
  $("#vs").hide(); //needed to get info; don't want to display
  this.showValid = (($("#showValidY").length > 0) ? true : false);
  this.showThreat = (($("#showThreatY").length > 0) ? true : false);
}
//----------------------- END GLOBALS AND SETUP CONSTRUCTORS -------------------


//------------------------------------------------------------------------------
// Connection stuff
//------------------------------------------------------------------------------
var socket = io();
socket.emit('startGame', {myName: UIState.myName, enemyName: UIState.enemyName, roomName: UIState.roomName});

socket.on('start', function(data) {
  UIState = new InitUIState(data); //TODO for below 2 lines: make init display function
  UIState.isWhite ? ($("#enemyNameDisplay").addClass("unHighlightedPlayerName")) : ($("#myNameDisplay").addClass("unHighlightedPlayerName"));
  board1.orientation(data.color);
  console.log(JSON.stringify(board1.position()));
});

//to be used by addPiece and onDrop
function sendMove(pos, state) {
  socket.emit('move', new TotalState(pos, state));
}

socket.on('oppMove', function(totalState) {
  setUpdatedStateAndPos({pos: totalState.position, state: totalState.state}, true);
  updateDisplay(gameLogic, totalState.position);
});

socket.on("oppLeft", function() {
  if(gameLogic.gameOver) { //don't do anything if game already over
    return;
  }
  finishGame({winner: ((UIState.isWhite) ? "white" : "black"), reason: "oppLeft"});
});
