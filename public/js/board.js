//--------------------------- UTILITY STUFF ------------------------------------
//Notes: don't call anything "location".
//Use bracket notation if you want to treat object as dictionary
var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
var ALL_SQUARES = [];
for(var rank = 0; rank < 8; rank++) {
  for(var file = 0; file < 8; file++) {
    ALL_SQUARES.push(FILES[file] + RANKS[rank]);
  }
}

/* Converts a filenum and rankNum to a string representing the algebraic
   position. For example, coord(2, 3) returns "c4" */
var coord = function(fileNum, rankNum) {
  var f = FILES[fileNum];
  var rank = RANKS[rankNum];
  return (f + rank);
};

function mod(n, m) {
  return ((n % m) + m) % m;
}

function partial(f) {
  var args = Array.prototype.slice.call(arguments, 1)
  return function() {
    var remainingArgs = Array.prototype.slice.call(arguments)
    return f.apply(null, args.concat(remainingArgs))
  }
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
//--------------------------- GAME RULES ---------------------------------------

/* Returns an array of validMoves for the piece at source with position oldPos
   Does not take check into account */
var validMoves = function(source, piece, oldPos) {
  var file = source.charAt(0);
  var rank = source.charAt(1);

  var fileNum = $.inArray(file, FILES);
  var rankNum = $.inArray(rank, RANKS);

  switch (piece) {
    case "wR":
    case "bR":
      return rookMoves(piece.charAt(0), fileNum, rankNum, oldPos);
    case "wB":
    case "bB":
      return bishopMoves(piece.charAt(0), fileNum, rankNum, oldPos);
    case "wQ":
    case "bQ":
      return queenMoves(piece.charAt(0), fileNum, rankNum, oldPos);
    case "wK":
    case "bK":
      return kingMoves(piece.charAt(0), fileNum, rankNum, oldPos);
    case "wN":
    case "bN":
      return knightMoves(piece.charAt(0), fileNum, rankNum, oldPos);
    case "wP":
    case "bP":
      return pawnMoves(piece.charAt(0), fileNum, rankNum, oldPos);
    default:
      return [];
  }
};

var rookMoves = function(color, fileNum, rankNum, oldPos) {
  var moves = [];
  //down
  var down;
  for(down = 1; down <= 7; down++) {
    var currRankNum = mod(rankNum - down, 8);
    var square = coord(fileNum, currRankNum);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  //up
  for(var up = 1; up <= 7 - down; up++) {
    var currRankNum = mod(rankNum + up, 8);
    var square = coord(fileNum, currRankNum);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  //left
  var left;
  for(left = 1; left <= 7; left++) {
    var currFileNum = mod(fileNum - left, 8);
    var square = coord(currFileNum, rankNum);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  //right
  for(var right = 1; right <= 7 - left; right++) {
    var currFileNum = mod(fileNum + right, 8);
    var square = coord(currFileNum, rankNum);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  return moves;
};

var bishopMoves = function(color, fileNum, rankNum, oldPos) {
  //console.log("Bishop moves called with color: " + color + " fileNum: " + fileNum + " rankNum: " + rankNum);
  var moves = [];
  //upleft
  var upLeft;
  for(upLeft = 1; upLeft <= 7; upLeft++) {
    //console.log("Going upleft");
    var currFileNum = mod(fileNum - upLeft, 8);
    var currRankNum = mod(rankNum + upLeft, 8);
    var square = coord(currFileNum, currRankNum);
    //console.log("Testing square " + square);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  //downright
  for(var downRight = 1; downRight <= 7 - upLeft; downRight++) {
  //  console.log("Going downright");
    var currFileNum = mod(fileNum + downRight, 8);
    var currRankNum = mod(rankNum - downRight, 8);
    var square = coord(currFileNum, currRankNum);
  //  console.log("Testing square " + square);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  var upRight;
  for(upRight = 1; upRight <= 7; upRight++) {
  //  console.log("Going upright");
    var currFileNum = mod(fileNum + upRight, 8);
    var currRankNum = mod(rankNum + upRight, 8);
    var square = coord(currFileNum, currRankNum);
  //  console.log("Testing square " + square);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  //downleft
  for(var downLeft = 1; downLeft <= 7 - upRight; downLeft++) {
  //  console.log("Going downleft");
    var currFileNum = mod(fileNum - downLeft, 8);
    var currRankNum = mod(rankNum - downLeft, 8);
    var square = coord(currFileNum, currRankNum);
  //  console.log("Testing square " + square);
    if(updateMoves(moves, square, oldPos, color) == -1) {
      break;
    }
  }
  return moves;
}

var queenMoves = function(color, fileNum, rankNum, oldPos) {
  //since a queen is a combination of rook and bishop
  return (rookMoves(color, fileNum, rankNum, oldPos).concat(bishopMoves(color, fileNum, rankNum, oldPos)))
}

var kingMoves = function(color, fileNum, rankNum, oldPos) {
  var moves = [];
  for(var fileChange = -1; fileChange <= 1; fileChange++) {
    for(var rankChange = -1; rankChange <= 1; rankChange++) {
      var square = coord(mod(fileNum + fileChange, 8), mod(rankNum + rankChange, 8));
      updateMoves(moves, square, oldPos, color);
    }
  }
  return moves;
}

var knightMoves = function(color, fileNum, rankNum, oldPos) {
  var moves = [];
  updateMoves(moves, coord(mod(fileNum + 2, 8), mod(rankNum + 1, 8)), oldPos, color);
  updateMoves(moves, coord(mod(fileNum + 2, 8), mod(rankNum - 1, 8)), oldPos, color);

  updateMoves(moves, coord(mod(fileNum + 1, 8), mod(rankNum + 2, 8)), oldPos, color);
  updateMoves(moves, coord(mod(fileNum + 1, 8), mod(rankNum - 2, 8)), oldPos, color);

  updateMoves(moves, coord(mod(fileNum - 2, 8), mod(rankNum + 1, 8)), oldPos, color);
  updateMoves(moves, coord(mod(fileNum - 2, 8), mod(rankNum - 1, 8)), oldPos, color);

  updateMoves(moves, coord(mod(fileNum - 1, 8), mod(rankNum + 2, 8)), oldPos, color);
  updateMoves(moves, coord(mod(fileNum - 1, 8), mod(rankNum - 2, 8)), oldPos, color);
  return moves;
}

var pawnMoves = function(color, fileNum, rankNum, oldPos) {
  var forward = (color == "w") ? 1 : -1;
  var moves = [];
  var oneAhead = coord(fileNum, rankNum + forward); //no need to mod because pawns don't occur on first or last ranks

  if(oldPos[oneAhead] == undefined) {
    moves.push(oneAhead);
    var upTwo = (color == "w") ? ["a2", "b2", "g2", "h2"] : ["a7", "b7", "g7", "h7"]; //pawns here may be able to move forward 2 spaces
    if($.inArray(coord(fileNum, rankNum), upTwo) != -1) {
      var twoAhead = coord(fileNum, rankNum + (2 * forward));
      if(oldPos[twoAhead] == undefined) {
        moves.push(twoAhead);
      }
    }
  }
  var forwardLeft = coord(mod(fileNum - 1, 8), rankNum + forward);
  var forwardRight = coord(mod(fileNum + 1, 8), rankNum + forward);

  if(oldPos[forwardLeft] != undefined && oldPos[forwardLeft].charAt(0) != color) {
    moves.push(forwardLeft);
  }
  else if(oldPos[forwardLeft] == undefined && (gameLogic["enpassants"][forwardLeft] == true)) {
    moves.push(forwardLeft); //can enpassant by going forwardLeft
  }
  if(oldPos[forwardRight] != undefined && oldPos[forwardRight].charAt(0) != color) {
    moves.push(forwardRight);
  }
  else if(oldPos[forwardRight] == undefined && (gameLogic["enpassants"][forwardRight] == true)) {
    moves.push(forwardRight); //can enpassant by going forwardLeft
  }
  return moves;
}

//update moves list and return 0 to keep going, -1 to break
var updateMoves = function(moves, square, oldPos, color) {
  if(oldPos[square] == undefined) {
    moves.push(square);
    return 0;
  }
  else {
    if(oldPos[square].charAt(0) != color) {
      moves.push(square);
    }
    return -1;
  }
}

var promotionButtons = function(color, square) {
  var buttons = [];
  var queenButton = {
    text: "Queen",
    icon: "img/chesspieces/wikipedia/" + color + "Q.png", //Not working??
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

/* Only call this when promoting a pawn */
function addPiece(piece, square) {
  posObj = board1.position();
  posObj[square] = piece;
  board1.position(posObj);
  sendMove(posObj, gameLogic);
}

/* Returns true if piece at source threatens square in pos */
function threatens(pos, piece, source, square) {
  if(piece == "bQ" && source == "d6" && square == "d2") {
    console.log("threatens()");
    console.log("Checking if the " + piece + " at " + source + " threatens " + square);
    console.log(JSON.stringify(pos));
  }
  moves = validMoves(source, piece, pos);
  if(piece == "bQ" && source == "d6" && square == "d2") {
    console.log("moves are " + moves);
  }
  return ($.inArray(square, moves) != -1);
}

/* Returns true if piece at source threatens would threaten square in pos if
   . . . you get the idea , given king locations */
function wouldThreatenIfOppositeKingWentThere(pos, piece, source, whiteKingLoc, blackKingLoc, square) {
  var posCopy = Object.assign({}, pos); //okay because oldPos is not a nested object
  var correctKingLoc = (piece.charAt(0) == 'w') ? blackKingLoc : whiteKingLoc;
  var correctKing = (piece.charAt(0) == 'w') ?'bK' : 'wK';
  console.log("Checking if the " + piece + " at " + source + " would threaten the " + correctKing + " if it moved from "
    + correctKingLoc + " to " + square);
  delete posCopy[correctKingLoc];
  posCopy[square] = correctKing;
  threatens(posCopy, piece, source, square) ? console.log("Yes it would.") : console.log("No, it wouldn't.");
  return threatens(posCopy, piece, source, square);
}


/*returns true if making this move would not leave the moving player in check */
function wouldNotCheck(oldPos, piece, source, target) {
  var color = piece.charAt(0);
  var myKingLoc = (piece.charAt(1) == "K") ? (target) : ((color == "w") ? (gameLogic.wKLoc) : (gameLogic.bKLoc));
  var posCopy = Object.assign({}, oldPos); //okay because oldPos is not a nested object

  delete posCopy[source];
  posCopy[target] = piece;

  for(var square in posCopy) {
    if(posCopy.hasOwnProperty(square)) {
      if((posCopy[square] != undefined) && (posCopy[square].charAt(0) != color)) {
        if(threatens(posCopy, posCopy[square], square, myKingLoc)) {
          return false;
        }
      }
    }
  }
  return true;
}

function inCheck(whiteTurn, pos) {
  var kingLoc = (whiteTurn) ? gameLogic.wKLoc : gameLogic.bKLoc;
  var color = (whiteTurn) ? "w" : "b";
  for(var square in pos) {
    if(pos.hasOwnProperty(square)) {
      if((pos[square] != undefined) && (pos[square].charAt(0) != color)) {
        if(threatens(pos, pos[square], square, kingLoc)) {
          return true;
        }
      }
    }
  }
  return false;
}

function hasMoves(whiteTurn, pos) {
  var color = (whiteTurn) ? "w" : "b";
  for(var square in pos) {
    if(pos.hasOwnProperty(square)) {
      if((pos[square] != undefined) && (pos[square].charAt(0) == color)) {
        var moves = validMoves(square, pos[square], pos).filter(partial(wouldNotCheck, pos, pos[square], square));
        if(moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

//takes care of in check, checkmate, or stalemate, returns name of player in check
//or "" if no one is in check. (Note: just check, not checkmate)
function check_mate_stale(whiteTurn, pos) {
  var turnString = (whiteTurn) ? "Turn: White" : "Turn: Black";
  var checkString = "";
  if(inCheck(whiteTurn, pos)) {
    if(hasMoves(whiteTurn, pos)) {
      gameLogic.moves[gameLogic.moves.length - 1] += "+";
      //white turn is in check
      if((whiteTurn && isWhite) || (!whiteTurn && isBlack)) {
        checkString = myName;
      }
      else {
        checkString = enemyName;
      }
    }
    else {
      var color = (whiteTurn) ? "White" : "Black";
      (whiteTurn) ? gameLogic.whiteMated = true :   gameLogic.blackMated = true;
      gameLogic.moves[gameLogic.moves.length - 1] += "#"
      gameLogic.gameOver = true;
      finishGame({winner: (gameLogic.whiteMated ? "black" : "white"), reason: "checkmate"});
    }
  }
  else if(!hasMoves(whiteTurn, pos)) {
    gameLogic.stalemated = true;
    gameLogic.moves[gameLogic.moves.length - 1] += "SM"
    gameLogic.gameOver = true;
    finishGame({winner: "draw", reason: "stalemate"});
  }
  $('#moveHistory').append('<li>' + gameLogic.moves[gameLogic.moves.length - 1] + '</li>');
  $("#historyContainer").scrollTop($("#historyContainer")[0].scrollHeight);
  return checkString;
}
//--------------------------- END GAME RULES -----------------------------------
//--------------------------- USER INTERACTION ---------------------------------

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
  var moves = validMoves(source, piece, oldPos).filter(partial(wouldNotCheck, oldPos, piece, source));
  if($.inArray(target, moves) === -1) {
    return 'snapback';
  }
  var promotionRank = (piece.charAt(0) == "w") ? "8" : "1";
  var promoted = false;

  if(piece.charAt(1) == "P" && target.charAt(1) == promotionRank) {
    //pawn promotion here
    promoted = true;
    $("#promotionText").html("Promote pawn to:")
    /* Note: To figure out how to hide the x button, see this site:
    https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
    $("#promotionBox").dialog({
      closeOnEscape: false,
      open: function(event, ui) {
        $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
      },
      modal: true,
      buttons: promotionButtons(piece.charAt(0), target),
      title: "Pawn Promotion"
    });
  }
  var forward = (piece.charAt(0) == "w") ? 1 : -1;
  //piece is pawn that moved columns to an empty square, so must have en passanted
  if((piece.charAt(1) == "P") && (target.charAt(0) != source.charAt(0)) && (oldPos[target] == undefined)) {
  //  console.log("Made en passant move!")
    var backward = -1 * forward;
    var eliminateSquare = target.charAt(0) + (parseInt(target.charAt(1)) + backward);
    posObj = board1.position();
    delete posObj[eliminateSquare];
    board1.position(posObj);
  }
  //reset enpassants
  for(var square in gameLogic.enpassants) {
    if(gameLogic.enpassants.hasOwnProperty(square)) {
      gameLogic.enpassants[square] = false;
    }
  }
  //set enpassant if this was an enpassant move
  if(piece.charAt(1) == "P" && (parseInt(target.charAt(1)) - parseInt(source.charAt(1)) == (forward * 2))) {
    var enable = source.charAt(0) + (parseInt(source.charAt(1)) + forward);
    gameLogic.enpassants[enable] = true;
  }

  if(piece.charAt(1) == "K") {
    var kingField = piece.charAt(0) + "KLoc";
    gameLogic[kingField] = target;
  }
  gameLogic.whiteTurn = !gameLogic.whiteTurn;
  var moveString = source + "-" + target;
  var turnString = (gameLogic.whiteTurn) ? "Turn: White" : "Turn: Black";
  var moveString = source + "-" + target;
  gameLogic.moves.push(moveString);
  if(!promoted) {
    sendMove(newPos, gameLogic);
  }
};

/*On your turn, highlight in grey the places you can move to,
  and highlight in red the squares enemy pieces threaten*/
var onMouseoverSquare = function(square, piece, pos) {
  if(!piece || gameLogic.gameOver || (gameLogic.whiteTurn && !isWhite) ||
    (!gameLogic.whiteTurn && !isBlack)
    || (!showValid && !showThreat) ) {
    return;
  }

  var myPiece = (piece.charAt(0) == 'w' && isWhite) || (piece.charAt(0) == 'b' && isBlack);
  var lightColor = (myPiece) ? LIGHT_GRAY : LIGHT_RED;
  var darkColor = (myPiece) ? DARK_GRAY : DARK_RED;
  var highlights = (myPiece) ? validMoves(square, piece, pos).filter(
    partial(wouldNotCheck, pos, piece, square)) : ALL_SQUARES.filter(partial(
      wouldThreatenIfOppositeKingWentThere, pos, piece, square, gameLogic.wKLoc, gameLogic.bKLoc));
  //Get all squares. Filter by: for each square: if opposite king moved there, would piece at source in pos threaten it?
  //TODO
  if((!showValid && myPiece) || (!showThreat && !myPiece)) {
    return;
  }
  // exit if nothing to highlight
  if (highlights.length === 0) return;

  // highlight the square they moused over
  color_square(square, lightColor, darkColor);

  // highlight the possible squares for this piece
  for (var i = 0; i < highlights.length; i++) {
    color_square(highlights[i], lightColor, darkColor);
  }
};

var onMouseoutSquare = function(square, piece) {
  uncolor_squares();
};

//--------------------------- END USER INTERACTION -----------------------------
//--------------------------- BUTTON SETUP -------------------------------------

function resetPosition() { //this function is not to be used in production //deprecated
  if(!isBlack && !isWhite) { //spectator?
    return;
  }
  board1.position(TOROIDAL_START);
  gameLogic.whiteTurn = true;
  gameLogic.gameOver = false;
  gameLogic.blackMated = false;
  gameLogic.whiteMated = false;
  gameLogic.stalemated = false;
  gameLogic.moves = [];
  gameLogic.wKLoc = "e3";
  gameLogic.bKLoc = "e6";
  for(var square in gameLogic.enpassants) { //rest enpassants
    if(gameLogic.enpassants.hasOwnProperty(square)) {
      gameLogic.enpassants[square] = false;
    }
  }
  sendMove(board1.position(), gameLogic);
};

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
  if(!canProposeDraw || gameLogic.gameOver) {
    return;
  }
  canProposeDraw = false;
  $("#draw").addClass("disabled");
  $("#drawText").html("You have proposed a draw.");
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
function finishGame(data) {
  /* data in form of {winner: "white" or "black" or "draw",
                    reason: "checkmate", "stalemate", "resign", "oppLeft", "drawAgreement"} */
  console.log("finishGame called with reason: " + data.reason + " and winner: " + data.winner);
  console.log((isWhite) ? "white" : "black");
  gameLogic.gameOver = true;
  var reason = data.reason;
  var winner = data.winner;
  switch(reason) {
    case "checkmate":
      if(((winner == "white") && isWhite) || ((winner == "black") && isBlack)) {
        console.log("Setting myself as winner");
        $("#myNameDisplay").html("WINNER *" + myName + "* WINNER!");
        $("#myNameDisplay").removeClass("unHighlightedPlayerName");

        $("#enemyNameDisplay").text(enemyName + " was checkmated!");
        $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
      }
      else {
        $("#enemyNameDisplay").text("WINNER *" + enemyName + "* WINNER!");
        $("#enemyNameDisplay").removeClass("unHighlightedPlayerName");

        $("#myNameDisplay").text(myName + " was checkmated!");
        $("#myNameDisplay").addClass("unHighlightedPlayerName");
      }
      break;
    case "stalemate":
      $("#myNameDisplay").text(myName + " - Stalemate!");
      $("#enemyNameDisplay").text(enemyName + " - Stalemate!");
      $("#myNameDisplay").addClass("unHighlightedPlayerName");
      $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
      break;
    case "resign":
      if((isWhite && winner == "white") || (isBlack && winner == "black")) {
        $("#myNameDisplay").text("WINNER *" + myName + "* WINNER!");
        $("#myNameDisplay").removeClass("unHighlightedPlayerName");

        $("#enemyNameDisplay").text(enemyName + " resigned!");
        $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
      }
      else {
        $("#enemyNameDisplay").text("WINNER *" + enemyName + "* WINNER!");
        $("#enemyNameDisplay").removeClass("unHighlightedPlayerName");

        $("#myNameDisplay").text(myName + " resigned!");
        $("#myNameDisplay").addClass("unHighlightedPlayerName");
      }
      break;
    case "oppLeft":
      $("#myNameDisplay").text("WINNER *" + myName + "* WINNER!");
      $("#myNameDisplay").removeClass("unHighlightedPlayerName");

      $("#enemyNameDisplay").text(enemyName + " left!");
      $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
      break;
    case "drawAgreement":
      $("#myNameDisplay").text(myName + " - Draw by agreement.");
      $("#enemyNameDisplay").text(enemyName + " - Draw by agreement.");
      $("#myNameDisplay").addClass("unHighlightedPlayerName");
      $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
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
function TotalState(pos, state, inCheck) {
  this.position = pos;
  this.state = state;
  this.inCheck = inCheck; //either the nickname of the player who's in check, or ""
}
$("#resign").on('click', resign);
$("#draw").on('click', proposeDraw);
$("#return").on('click', lobbyButton);
var isBlack = false;
var isWhite = false;
var canProposeDraw = true; //renew ability to propose draw everytime you move
var myName = $("#myName").text();
var enemyName = $("#enemyName").text();
var roomName = "X" + (($("#1").length > 0) ? myName : enemyName);
var whiteChat = "#7a04ef";
var blackChat = "#ef8904";
$("#vs").remove(); //needed to get info; don't want to display

var showValid = (($("#showValidY").length > 0) ? true : false)
var showThreat = (($("#showThreatY").length > 0) ? true : false)
console.log("sv: " + showValid);
console.log("st: " + showThreat);
//----------------------- END GLOBALS AND SETUP varRUCTORS -------------------


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
  var inCheck = check_mate_stale(state.whiteTurn, pos);
  if(!gameLogic.gameOver) { //if gameover, my display was already handled
    if(inCheck == myName) {
      $("#myNameDisplay").text(myName + " - in check");
    }
    if(inCheck == enemyName) {
      $("#enemyNameDisplay").text(enemyName + " - in check");
    }
    if(inCheck == "") {
      $("#myNameDisplay").text(myName);
      $("#enemyNameDisplay").text(enemyName);
    }
    canProposeDraw = true;
    $("#draw").removeClass("disabled");
    $("#myNameDisplay").addClass("unHighlightedPlayerName");
    $("#enemyNameDisplay").removeClass("unHighlightedPlayerName");
  }
  socket.emit('move', new TotalState(pos, state, inCheck));
}

socket.on('oppMove', function(totalState) {
  board1.position(totalState.position);
  gameLogic = totalState.state;
  $("#myNameDisplay").removeClass("unHighlightedPlayerName");
  $("#enemyNameDisplay").addClass("unHighlightedPlayerName");
  var inCheck = totalState.inCheck;
  if(inCheck == myName) {
    $("#myNameDisplay").text(myName + " - in check");
  }
  if(inCheck == enemyName) {
    $("#enemyNameDisplay").text(enemyName + " - in check");
  }
  if(inCheck == "") {
    $("#myNameDisplay").text(myName);
    $("#enemyNameDisplay").text(enemyName);
  }
  $('#moveHistory').append('<li>' + gameLogic.moves[gameLogic.moves.length - 1] + '</li>');
  $("#historyContainer").scrollTop($("#historyContainer")[0].scrollHeight);
  if(gameLogic.gameOver) {
    if(gameLogic.whiteMated) {
      finishGame({winner: "black", reason: "checkmate"});
    }
    else if (gameLogic.blackMated) {
      finishGame({winner: "white", reason: "checkmate"});
    }
    else if (gameLogic.stalemated) {
      finishGame({winner: "draw", reason: "stalemate"});
    }
  }
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
