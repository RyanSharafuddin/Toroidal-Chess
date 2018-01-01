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
  var moves = [];

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
  console.log("piece at a1: '" + posObj.a1 + "'")
  console.log("piece at b1: '" + posObj.b1 + "'")
  var file = "c";
  var rank = "1";
  var coord = file + rank;
  console.log("piece at string " + coord + ": " + posObj[coord]);
};

$('#getPositionBtn').on('click', clickGetPositionBtn);

/*
  3) Can only make moves that that piece can make
  4) Can only make moves that that piece can make AND can't go through pieces
  5) Incorporate checking into account
  6) Incorporate en passant into account
*/
