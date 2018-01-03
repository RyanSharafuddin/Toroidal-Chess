//Notes: don't call anything "location".
//Use bracket notation if you want to treat object as dictionary
var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

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
      var square = coord(fileNum + fileChange, rankNum + rankChange);
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
      addPiece(color + "Q", square);
      gameLogic.moves[gameLogic.moves.length - 1] += " Queen";
      $(this).dialog( "close" );
    }
  }
  buttons.push(queenButton);

  var knightButton = {
    text: "Knight",
    click: function() {
      addPiece(color + "N", square);
      gameLogic.moves[gameLogic.moves.length - 1] += " Knight";
      $(this).dialog( "close" );
    }
  }
  buttons.push(knightButton);

  var rookButton = {
    text: "Rook",
    click: function() {
      addPiece(color + "R", square);
      gameLogic.moves[gameLogic.moves.length - 1] += " Rook";
      $(this).dialog( "close" );
    }
  }
  buttons.push(rookButton);

  var bishopButton = {
    text: "Bishop",
    click: function() {
      addPiece(color + "B", square);
      gameLogic.moves[gameLogic.moves.length - 1] += " Bishop";
      $(this).dialog( "close" );
    }
  }
  buttons.push(bishopButton);

  return buttons;
}

function addPiece(piece, square) {
  console.log("addPiece called! adding " + piece + " to " + square);
  posObj = board1.position();
  posObj[square] = piece;
  board1.position(posObj);
  check_mate_stale(piece.charAt(0) != "w", posObj); //!= b/c want know if other player threatened
}

/* Returns true if piece at source threatens square in pos */
function threatens(pos, piece, source, square) {
  moves = validMoves(source, piece, pos);
  if($.inArray(square, moves) != -1) {
    //console.log(piece + " at " + source + " threatens " + square);
  }
  return ($.inArray(square, moves) != -1);
}

/*returns true if making this move would not leave the moving player in check */
function wouldNotCheck(oldPos, piece, source, target) {
//  console.log("wouldNotCheck called with args:" + " piece: " + piece + " source: " + source + " target: " + target);
  var color = piece.charAt(0);
  var myKingLoc = (piece.charAt(1) == "K") ? (target) : ((color == "w") ? (gameLogic.wKLoc) : (gameLogic.bKLoc));
  var posCopy = Object.assign({}, oldPos); //okay because oldPos is not a nested object


  //must clone oldPos here
  delete posCopy[source];
  posCopy[target] = piece;

   // console.log("myKingLoc: " + myKingLoc);
   // console.log("posCopy: ");
   // console.log(JSON.stringify(posCopy, null, 4));

  for(var square in posCopy) {
    if(posCopy.hasOwnProperty(square)) {
      if((posCopy[square] != undefined) && (posCopy[square].charAt(0) != color)) {
        if(threatens(posCopy, posCopy[square], square, myKingLoc)) {
          //console.log("Moving " + piece + " from " + source + " to " + target + " would put player in check");
          return false;
        }
      }
    }
  }
  return true;
}

function partial(f) {
  var args = Array.prototype.slice.call(arguments, 1)
  return function() {
    var remainingArgs = Array.prototype.slice.call(arguments)
    return f.apply(null, args.concat(remainingArgs))
  }
}

function inCheck(whiteTurn, pos) {
  console.log("Called in check with these args:");
  console.log("whiteTurn: " + whiteTurn + " pos: " + JSON.stringify(pos, null, 4));
  var kingLoc = (whiteTurn) ? gameLogic.wKLoc : gameLogic.bKLoc;
  console.log("kingLoc: " + kingLoc);
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

//takes care of in check, checkmate, or stalemate
function check_mate_stale(whiteTurn, pos) {
  console.log("check_mate_stale called");
  var turnString = (whiteTurn) ? "Turn: White" : "Turn: Black";
  console.log("Calling inCheck from check_mate_stale");
  if(inCheck(whiteTurn, pos)) {
    if(hasMoves(whiteTurn, pos)) {
      $("#Turn").html(turnString + " - currently in check");
      console.log("IN CHECK");
      gameLogic.moves[gameLogic.moves.length - 1] += "+";
    }
    else {
      var color = (whiteTurn) ? "White" : "Black";
      $("#Turn").html(color + " has been checkmated!");
      gameLogic.moves[gameLogic.moves.length - 1] += "#"
      console.log("checkmate!!");
      gameLogic.gameOver = true;
    }
  }
  else if(!hasMoves(whiteTurn, pos)) {
    $("#Turn").html("Stalemate!");
    gameLogic.moves[gameLogic.moves.length - 1] += "SM"
    console.log("Stalemate");
    gameLogic.gameOver = true;
  }
}

/* Don't allow player to drag wrong color pieces or after game is over */
var onDragStart = function(source, piece, position, orientation) {
  if(gameLogic.gameOver ||
     (gameLogic.whiteTurn &&  piece.search(/^b/) !== -1) ||
      (!gameLogic.whiteTurn &&  piece.search(/^w/) !== -1)) {
        return false;
      }
};



/* Check if move is legal and update state if a legal move has been made */
var onDrop = function(source, target, piece, newPos, oldPos, currentOrientation) {
  console.log("onDrop called");
  console.log("Source is: " + source);
  console.log("Target is: " + target);
  moves = validMoves(source, piece, oldPos);
  console.log("Valid moves (before taking check into account) are " + moves);
  moves = moves.filter(partial(wouldNotCheck, oldPos, piece, source));
  console.log("Valid moves after filtering out moves that leave in check are " + moves);
  if($.inArray(target, moves) === -1) {
    console.log("Target is not a valid move");
    return 'snapback';
  }
  var promotionRank = (piece.charAt(0) == "w") ? "8" : "1";
  var promoted = false;

  if(piece.charAt(1) == "P" && target.charAt(1) == promotionRank) {
    promoted = true;
    //pawn promotion here
    $("#promotionText").html("Promote pawn to:")
    $(function() {
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
    });
  }
  var forward = (piece.charAt(0) == "w") ? 1 : -1;
  //piece is pawn that moved columns to an empty square, so must have en passanted
  if((piece.charAt(1) == "P") && (target.charAt(0) != source.charAt(0)) && (oldPos[target] == undefined)) {
    console.log("Made en passant move!")
    var backward = -1 * forward;
    var eliminateSquare = target.charAt(0) + (parseInt(target.charAt(1)) + backward);
    posObj = board1.position();
    delete posObj[eliminateSquare];
    board1.position(posObj);
  }

  for(var square in gameLogic.enpassants) {
    if(gameLogic.enpassants.hasOwnProperty(square)) {
      //console.log("Un enpassanting square: " + square);
      gameLogic.enpassants[square] = false;
    }
  }

  if(piece.charAt(1) == "P" && (parseInt(target.charAt(1)) - parseInt(source.charAt(1)) == (forward * 2))) {
    var enable = source.charAt(0) + (parseInt(source.charAt(1)) + forward);
    //console.log("Setting en passant on square: " + enable);
    gameLogic.enpassants[enable] = true;
  }

  if(piece.charAt(1) == "K") {
    var kingField = piece.charAt(0) + "KLoc";
    gameLogic[kingField] = target;
  }
  gameLogic.whiteTurn = !gameLogic.whiteTurn;
  var moveString = source + "-" + target;
  var turnString = (gameLogic.whiteTurn) ? "Turn: White" : "Turn: Black";
  $("#Turn").html(turnString);
  var moveString = source + "-" + target;
  //must decide now if current player is checkmated or if game is stalemated
  gameLogic.moves.push(moveString);
  check_mate_stale(gameLogic.whiteTurn, newPos);
  var totalState = { position: newPos, state: gameLogic, moveString: moveString, turnString: $("#Turn").text()};
  console.log("Sending totalState: ");
  console.log(JSON.stringify(totalState, null, 4));
  socket.emit('move', totalState);
};

function resetPosition() {
  if(user_num > 2) {
    return;
  }
  board1.position(TOROIDAL_START);
  gameLogic.whiteTurn = true;
  $("#Turn").html("Turn: White");
  gameLogic.gameOver = false;
  gameLogic.moves = [];
  gameLogic.wKLoc = "e3";
  gameLogic.bKLoc = "e6";
  for(var square in gameLogic.enpassants) {
    if(gameLogic.enpassants.hasOwnProperty(square)) {
    //  console.log("Un enpassanting square: " + square);
      gameLogic.enpassants[square] = false;
    }
  }
};

function clickGetPositionBtn() {
  var posObj = board1.position();
  console.log("Current position as an Object:");
  console.log(posObj);

  console.log("Current position as a FEN string:");
  console.log(board1.fen());

  console.log("gameLogic: ");
  console.log(gameLogic);
};

function promotePosition() {
  board1.position("r1b2b1r/pp4Pp/n1pqk2n/8/8/N1PQK2N/PP4pP/R1B2B1R");
  gameLogic.whiteTurn = true;
  $("#Turn").html("Turn: White");
  gameLogic.gameOver = false;
  gameLogic.wKLoc = "e3";
  gameLogic.bKLoc = "e6";
  gameLogic.enpassants = {
    a3: false,
    b3: false,
    g3: false,
    h3: false,
    a6: false,
    b6: false,
    g6: false,
    h6: false
  };
  gameLogic.moves = ["d4-e5", "d5-e4", "e5-f6", "e4-f3", "f6-g7", "f3-g2"];
}

function checkmatePos() {
  board1.position("8/8/r3k3/1K6/r7/8/3q4/8");
  gameLogic.whiteTurn = false;
  $("#Turn").html("Turn: Black");
  gameLogic.gameOver = false;
  gameLogic.wKLoc = "b5";
  gameLogic.bKLoc = "e6";
  gameLogic.moves = ["Checkmate position button used, so move history no longer valid"];
}

function stalematePos() {
  board1.position("8/8/r3k3/1K6/r7/8/3r4/8");
  gameLogic.whiteTurn = false;
  $("#Turn").html("Turn: Black");
  gameLogic.gameOver = false;
  gameLogic.wKLoc = "b5";
  gameLogic.bKLoc = "e6";
  gameLogic.moves = ["Stalemate position button used, so move history no longer valid"];
}

function showMoves() {
  console.log("\nPrinting move history:");
  gameLogic.moves.forEach(function(move, index) {
    console.log((index + 1) + ": " + move);
  });
  console.log("Done printing move history");
}

function showAvailable() {
  console.log("Showing legal moves: ")
  if(gameLogic.gameOver) {
    return;
  }
  color = gameLogic.whiteTurn ? "w" : "b";
  pos = board1.position();
  for(var square in pos) {
    if(pos.hasOwnProperty(square)) {
      if((pos[square] != undefined) && (pos[square].charAt(0) == color)) {
        var moves = validMoves(square, pos[square], pos).filter(partial(wouldNotCheck, pos, pos[square], square));
        moves.forEach(function(move) {
          console.log(square + "-" + move);
        });
      }
    }
  }
  console.log("All legal moves have been printed");
}



$('#getPositionBtn').on('click', clickGetPositionBtn);
$("#reset").on('click', resetPosition);
$("#prom").on('click', promotePosition);
$("#cm").on('click', checkmatePos);
$("#sm").on('click', stalematePos);
$("#history").on('click', showMoves);
$("#available").on('click', showAvailable);




var TOROIDAL_START = "r1b2b1r/pp4pp/n1pqkp1n/3pp3/3PP3/N1PQKP1N/PP4PP/R1B2B1R";
var cfg = {
  position: TOROIDAL_START,
  draggable: true,
  onDragStart: onDragStart,
  onDrop: onDrop
};
var board1 = ChessBoard('board1', cfg);
var gameLogic = {
  whiteTurn: true,
  gameOver: false,
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
var socket = io();
var user_num = 0;

socket.on('assign', function(num) {
  user_num = num;
  var str = "Your user number: " + user_num;
  if(user_num == 1) {
    str += " (White)";
    board1.orientation('white');
  }
  else if(user_num == 2) {
    str += " (Black)";
    board1.orientation('black');
  }
  else {
    str += " (Spectator)";
  }
  $("#userNum").text(str);
});

socket.on('oppMove', function(totalState) {
  board1.position(totalState.position);
  gameLogic = totalState.state;
  $("#Turn").text(totalState.turnString);
  console.log("Received oppMove! totalState is ");
  console.log(JSON.stringify(totalState, null, 4));
});
