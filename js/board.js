var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// var location = function(fileNum, rankNum) {
//   let f = FILES[fileNum];
//   var rank = RANKS[rankNum];
//   return (f + rank);
// };


var onDragStart = function(source, piece, position, orientation) {
  if(gameLogic.gameOver ||
     (gameLogic.whiteTurn &&  piece.search(/^b/) !== -1) ||
      (!gameLogic.whiteTurn &&  piece.search(/^w/) !== -1)) {
        return false;
      }
};

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
  if(source == target || target == "offboard") { //if no move made, do nothing
    return;
  }
  gameLogic.whiteTurn = !gameLogic.whiteTurn;
  var turnString = (gameLogic.whiteTurn) ? "Turn: White" : "Turn: Black"
  $("#Turn").html(turnString)
};

/* Returns an array of validMoves for the piece at source with position oldPos */
var validMoves = function(source, piece, oldPos) {
  var f = source.charAt(0);
  var rank = source.charAt(1);

  var fileNum = $.inArray(f, FILES);
  var rankNum = $.inArray(rank, RANKS);

  switch (piece) {
    case "wR":
    case "bR":
      return rookMoves(fileNum, rankNum, oldPos);
    default:
      return [];
  }
};

var rookMoves = function(fileNum, rankNum, oldPos) {
  var moves = [];
  //down
  for(var i = 1; i <= 7; i++) {

  }
  return moves;
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
};

$('#getPositionBtn').on('click', clickGetPositionBtn);

/*
  3) Can only make moves that that piece can make
  4) Can only make moves that that piece can make AND can't go through pieces
  5) Incorporate checking into account
  6) Incorporate en passant into account
*/
