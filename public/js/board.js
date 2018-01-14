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

/*
Used to highlight valid moves and threats. Given a square and a list
of squares, highlights all those squares in the list, and the original square
only highlights the list if square is null.
*/
function highlightList(square, highlights, lightColor, darkColor) {
  if (highlights.length === 0) {
    return;
  }
  if((square !== null) && (square !== undefined)) {
    color_square(square, lightColor, darkColor);
  }
  for (var i = 0; i < highlights.length; i++) {
    color_square(highlights[i], lightColor, darkColor);
  }
}

function highlightListAndUnhighlightOthers(highlights, lightColor, darkColor) {
  for(var i = 0; i < ALL_SQUARES.length; i++) {
    var square = ALL_SQUARES[i];
    if($.inArray(square, highlights) >= 0) {
      color_square(square, lightColor, darkColor);
    }
    else {
      color_square(square, '', '');
    }
  }
}
var LIGHT_GRAY = '#a9a9a9';
var DARK_GRAY = '#696969';
var LIGHT_RED = '#DB3C3C';
var DARK_RED = '#972B2B';
var LIGHT_BLUE = "#4286f4";
var DARK_BLUE = "#0d50bc";

/*
Return an array of buttons. Each button corresponds to a pawn promotion
*/
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
//--------------------------- END UTILITY STUFF --------------------------------


/* Only call this when promoting a pawn */
function addPiece(piece, square) {
  var fromEnemy = false;
  var data = promotePawnGetUpdatedPosAndState(piece, square, board1.position(), gameLogic);
  setUpdatedStateAndPos(data, false);
  updateDisplay(gameLogic, board1.position(), fromEnemy);
  sendMove(board1.position(), gameLogic);
}

//call when user promotes
function displayPromotionButtons(color, target) {
  prettyAlert("Pawn Promotion", "Promote pawn to:", promotionButtons(color, target), true, "promotions");
}


//--------------------------- USER INTERACTION ---------------------------------
//only to be used when a move happens
function updateDisplay(state, pos, fromEnemy) {
  if(state.moves == undefined) {
    console.log("state.moves is undefined!!");
    console.trace();
    throw "ERR";
  }
  if(!fromEnemy) {
    $("#draw").removeClass("disabled");
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

//only use this after a move has been made and gotten updated move and state
function setUpdatedStateAndPos(data, fromEnemy) {
  var useAnimation = fromEnemy;
  board1.position(data.pos, useAnimation);
  gameLogic = data.state;
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
  setUpdatedStateAndPos(data, false);
  if (isPromotion(piece, source, target)) {
    var color = piece.charAt(0);
    displayPromotionButtons(color, target)
  }
  else {
    var fromEnemy = false;
    updateDisplay(gameLogic, oldPos, fromEnemy);
    sendMove(data.pos, gameLogic);
  }
};

function gameOverMouseOver(square, piece, pos) {
  if(!(gameLogic.whiteMated || gameLogic.blackMated)) {
    return;
  }
  var materObj = necessaryToMate(pos, gameLogic);
  var direct = materObj.direct;
  var pinners = materObj.pinners;
  //highlight direct in red always
  highlightList(null, direct, LIGHT_RED, DARK_RED);
  //highlight pinners in blue always
  highlightList(null, pinners, LIGHT_BLUE, DARK_BLUE);

  var highlights = [];
  //if going over a mater or pinner piece, highlight their threatens.
  if($.inArray(square, direct) >= 0) {
    highlights = threatenedSquares(square, piece, pos, gameLogic);
    var lightColor = LIGHT_RED;
    var darkColor = DARK_RED;
  }
  if($.inArray(square, pinners) >= 0) {
    highlights = threatenedSquares(square, piece, pos, gameLogic);
    var lightColor = LIGHT_BLUE;
    var darkColor = DARK_BLUE;
  }
  function noneOrMineOrKing(square) {
    return((pos[square] == undefined) || (pos[square].charAt(0) == piece.charAt(0)) || (pos[square].charAt(1) == "K"));
  }
  highlights = highlights.filter(noneOrMineOrKing);
  if(highlights.length > 0) {
    highlightListAndUnhighlightOthers(highlights, lightColor, darkColor);
  }
}
/*On your turn, highlight in grey the places you can move to,
  and highlight in red the squares enemy pieces threaten*/
  //on game over by mate or stalemate, see threats of winning side
var onMouseoverSquare = function(square, piece, pos) {
  if(gameLogic.gameOver) {
    gameOverMouseOver(square, piece, pos);
    return;
  }
  if(!piece) {
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

//--------------------------- END FINISH GAME PRETTIFYING ----------------------
//--------------------------- GLOBALS AND SETUP CONSTRUCTORS -------------------
var numTimes = (numTimes === undefined) ? 1 : numTimes + 1;
var board1;
var gameLogic;
var UIState
function initEverything() {
  console.log("This is visit number: " + numTimes + " from you");
  var cfg = {
    position: TOROIDAL_START,
    draggable: true,
    onDragStart: onDragStart,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onDrop: onDrop
  };
  board1 = ChessBoard('board1', cfg);
  gameLogic = new InitGameState();
  UIState = new InitUIState(); //will be inited in socket.on("start")
  console.log("UIState is " + JSON.stringify(UIState));
}

function TotalState(pos, state) {
  this.position = pos;
  this.state = state;
}
//TODO: consider creating and documenting a User Interface state update (only needs to update canProposeDraw, as of now)
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
//color is either "white" or "black"
function InitUIDisplay(color) {
  (color == "white") ? ($("#enemyNameDisplay").addClass("unHighlightedPlayerName")) : ($("#myNameDisplay").addClass("unHighlightedPlayerName"));
  board1.orientation(color);
}
//----------------------- END GLOBALS AND SETUP CONSTRUCTORS -------------------

//to be used by addPiece and onDrop
function sendMove(pos, state) {
  socket.emit('move', new TotalState(pos, state));
}
//------------------------------------------------------------------------------
// Connection stuff
//------------------------------------------------------------------------------
var socket;
if(socket === undefined) {
  //this should never happen, because the socket from the lobby is stil there
  socket = io();
}
socket.inGame = true;
//so only define this stuff if you haven't before.
if(numTimes < 2) {
  socket.on('start', function(data) {
    UIState = new InitUIState(data); //TODO for below 2 lines: make init display function
    InitUIDisplay(data.color);
    console.log("receieved start");
    console.log(JSON.stringify(UIState));
  });

  socket.on('oppMove', function(totalState) {
    var fromEnemy = true;
    setUpdatedStateAndPos({pos: totalState.position, state: totalState.state}, fromEnemy);
    updateDisplay(gameLogic, totalState.position, fromEnemy);
  });

  socket.on("oppLeft", function() {
    if(gameLogic.gameOver) { //don't do anything if game already over
      return;
    }
    finishGame({winner: ((UIState.isWhite) ? "white" : "black"), reason: "oppLeft"});
  });
}
initEverything();
socket.emit('startGame', {myName: UIState.myName, enemyName: UIState.enemyName, roomName: UIState.roomName});


//------------------------------ FUNCTIONS TO EXPOSE TO OUTSIDE-----------------
function getGameOver() {
  return gameLogic.gameOver;
}

function getIsWhite() {
  return UIState.isWhite;
}

function getCanProposeDraw() {
  return UIState.canProposeDraw;
}

function setCanProposeDraw(can) {
  UIState.canProposeDraw = can;
}

function getMyName() {
  return UIState.myName;
}

function getEnemyName() {
  return UIState.enemyName;
}
//This function sets the state and display after it has been determined that a game is over MUST set gameOver to true
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
    case "connectError":
      setGameEndDisplay({winner: "", nonwinners: [UIState.myName, UIState.enemyName], nonwinnerDisplayString: " - connection error"});
      break;
  }
}
