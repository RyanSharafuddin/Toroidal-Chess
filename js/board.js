//Notes: don't call anything "location".
//Use bracket notation if you want to treat object as dictionary
var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

/* Converts a filenum and rankNum to a string representing the algebraic
   position. For example, coord(2, 3) returns "c4" */
var coord = function(fileNum, rankNum) {
  let f = FILES[fileNum];
  var rank = RANKS[rankNum];
  return (f + rank);
};

function mod(n, m) {
  return ((n % m) + m) % m;
}

/* Returns an array of validMoves for the piece at source with position oldPos */
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
  if(oldPos[forwardRight] != undefined && oldPos[forwardRight].charAt(0) != color) {
    moves.push(forwardRight);
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
  console.log("Valid moves are " + moves);
  if($.inArray(target, moves) === -1) {
    console.log("Target is not a valid move");
    return 'snapback';
  }
  var promotionRank = (piece.charAt(0) == "w") ? "8" : "1";
  if(piece.charAt(1) == "P" && target.charAt(1) == promotionRank) {
    //pawn promotion here
  //   $("#promotionText").html("Promote pawn to:")
  //   $("#promotionBox").dialog({
  //     modal: true,
  //     title: "Pawn Promotion",
  //     buttons:
  //   });
  }
  gameLogic.whiteTurn = !gameLogic.whiteTurn;
  var turnString = (gameLogic.whiteTurn) ? "Turn: White" : "Turn: Black"
  $("#Turn").html(turnString)
};



var TOROIDAL_START = "r1b2b1r/pp4pp/n1pqkp1n/3pp3/3PP3/N1PQKP1N/PP4PP/R1B2B1R";
var cfg = {
  position: TOROIDAL_START,
  draggable: true,
  onDragStart: onDragStart,
  onDrop: onDrop
};
var board1 = ChessBoard('board1', cfg);
var promotionButtons = [];
var queenButton = {
  text: "Queen"

};

var gameLogic = {
  whiteTurn: true,
  gameOver: false
};



function clickGetPositionBtn() {
  var posObj = board1.position();
  console.log("Current position as an Object:");
  console.log(posObj);

  console.log("Current position as a FEN string:");
  console.log(board1.fen());
};

function resetPosition() {
  board1.position(TOROIDAL_START);
  gameLogic.whiteTurn = true;
  $("#Turn").html("Turn: White");
  gameLogic.gameOver = false;
};

function addPiece() {
  posObj = board1.position();
  posObj["d8"] = "wQ";
  board1.position(posObj);
}

$('#getPositionBtn').on('click', clickGetPositionBtn);
$("#reset").on('click', resetPosition);
$("#addPiece").on('click', addPiece);

/*
  2) promotion
  3) enPassant
  4) Incorporate checking, checkmate, and stalemate into account
  5) Show valid moves??? (Make sure can easily turn on/off)
*/
