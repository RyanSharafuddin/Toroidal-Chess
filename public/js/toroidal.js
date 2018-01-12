/*NOTICE: I'm defining a valid move to be a move that the piece can make
           without regards to check while a legal move is a valid move that
           doesn't leave the mover in check                               */
var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
var ALL_SQUARES = [];

for(var rank = 0; rank < 8; rank++) {
  for(var file = 0; file < 8; file++) {
    ALL_SQUARES.push( coord(file, rank) );
  }
}

/* Converts a filenum and rankNum to a string representing the algebraic
   position. For example, coord(2, 3) returns "c4" */
function coord(fileNum, rankNum) {
  var file = FILES[fileNum];
  var rank = RANKS[rankNum];
  return (file + rank);
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

//--------------------------- GAME RULES ---------------------------------------

/* Returns an array of validMoves for the piece at source with position pos
   Does not take check into account */
//DO NOT alter pos or state, and only use state to read enpassants for pawn move
var validMoves = function(source, piece, pos, state) {
  var color = piece.charAt(0);
  var file = source.charAt(0);
  var rank = source.charAt(1);

  var fileNum = $.inArray(file, FILES);
  var rankNum = $.inArray(rank, RANKS);

  switch (piece) {
    case "wR":
    case "bR":
      return rookMoves(color, fileNum, rankNum, pos);
    case "wB":
    case "bB":
      return bishopMoves(color, fileNum, rankNum, pos);
    case "wQ":
    case "bQ":
      return queenMoves(color, fileNum, rankNum, pos);
    case "wK":
    case "bK":
      return kingMoves(color, fileNum, rankNum, pos);
    case "wN":
    case "bN":
      return knightMoves(color, fileNum, rankNum, pos);
    case "wP":
    case "bP":
      return pawnMoves(color, fileNum, rankNum, pos, state);
    default:
      throw ("unrecognized piece name" + piece);
  }
};

var rookMoves = function(color, fileNum, rankNum, pos) {
  var moves = [];
  //down
  var down;
  for(down = 1; down <= 7; down++) {
    var currRankNum = mod(rankNum - down, 8);
    var square = coord(fileNum, currRankNum);
    if(updateMoves(moves, square, pos, color) == -1) {
      break;
    }
  }
  //up
  for(var up = 1; up <= 7 - down; up++) {
    var currRankNum = mod(rankNum + up, 8);
    var square = coord(fileNum, currRankNum);
    if(updateMoves(moves, square, pos, color) == -1) {
      break;
    }
  }
  //left
  var left;
  for(left = 1; left <= 7; left++) {
    var currFileNum = mod(fileNum - left, 8);
    var square = coord(currFileNum, rankNum);
    if(updateMoves(moves, square, pos, color) == -1) {
      break;
    }
  }
  //right
  for(var right = 1; right <= 7 - left; right++) {
    var currFileNum = mod(fileNum + right, 8);
    var square = coord(currFileNum, rankNum);
    if(updateMoves(moves, square, pos, color) == -1) {
      break;
    }
  }
  return moves;
};

var bishopMoves = function(color, fileNum, rankNum, pos) {
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
    if(updateMoves(moves, square, pos, color) == -1) {
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
    if(updateMoves(moves, square, pos, color) == -1) {
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
    if(updateMoves(moves, square, pos, color) == -1) {
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
    if(updateMoves(moves, square, pos, color) == -1) {
      break;
    }
  }
  return moves;
}

var queenMoves = function(color, fileNum, rankNum, pos) {
  //since a queen is a combination of rook and bishop
  return (rookMoves(color, fileNum, rankNum, pos).concat(bishopMoves(color, fileNum, rankNum, pos)))
}

var kingMoves = function(color, fileNum, rankNum, pos) {
  var moves = [];
  for(var fileChange = -1; fileChange <= 1; fileChange++) {
    for(var rankChange = -1; rankChange <= 1; rankChange++) {
      var square = coord(mod(fileNum + fileChange, 8), mod(rankNum + rankChange, 8));
      updateMoves(moves, square, pos, color);
    }
  }
  return moves;
}

var knightMoves = function(color, fileNum, rankNum, pos) {
  var moves = [];
  updateMoves(moves, coord(mod(fileNum + 2, 8), mod(rankNum + 1, 8)), pos, color);
  updateMoves(moves, coord(mod(fileNum + 2, 8), mod(rankNum - 1, 8)), pos, color);

  updateMoves(moves, coord(mod(fileNum + 1, 8), mod(rankNum + 2, 8)), pos, color);
  updateMoves(moves, coord(mod(fileNum + 1, 8), mod(rankNum - 2, 8)), pos, color);

  updateMoves(moves, coord(mod(fileNum - 2, 8), mod(rankNum + 1, 8)), pos, color);
  updateMoves(moves, coord(mod(fileNum - 2, 8), mod(rankNum - 1, 8)), pos, color);

  updateMoves(moves, coord(mod(fileNum - 1, 8), mod(rankNum + 2, 8)), pos, color);
  updateMoves(moves, coord(mod(fileNum - 1, 8), mod(rankNum - 2, 8)), pos, color);
  return moves;
}

var pawnMoves = function(color, fileNum, rankNum, pos, state) {
  var forward = (color == "w") ? 1 : -1;
  var moves = [];
  var oneAhead = coord(fileNum, rankNum + forward); //no need to mod because pawns don't occur on first or last ranks

  if(pos[oneAhead] == undefined) {
    moves.push(oneAhead);
    var upTwo = (color == "w") ? ["a2", "b2", "g2", "h2"] : ["a7", "b7", "g7", "h7"]; //pawns here may be able to move forward 2 spaces
    if($.inArray(coord(fileNum, rankNum), upTwo) != -1) {
      var twoAhead = coord(fileNum, rankNum + (2 * forward));
      if(pos[twoAhead] == undefined) {
        moves.push(twoAhead);
      }
    }
  }
  var forwardLeft = coord(mod(fileNum - 1, 8), rankNum + forward);
  var forwardRight = coord(mod(fileNum + 1, 8), rankNum + forward);

  if(pos[forwardLeft] != undefined && pos[forwardLeft].charAt(0) != color) {
    moves.push(forwardLeft);
  }
  else if(pos[forwardLeft] == undefined && (state["enpassants"][forwardLeft] == true)) {
    moves.push(forwardLeft); //can enpassant by going forwardLeft
  }
  if(pos[forwardRight] != undefined && pos[forwardRight].charAt(0) != color) {
    moves.push(forwardRight);
  }
  else if(pos[forwardRight] == undefined && (state["enpassants"][forwardRight] == true)) {
    moves.push(forwardRight); //can enpassant by going forwardLeft
  }
  return moves;
}

//update moves list and return 0 to keep going, -1 to break
var updateMoves = function(moves, square, pos, color) {
  if(pos[square] == undefined) {
    moves.push(square);
    return 0;
  }
  else {
    if(pos[square].charAt(0) != color) {
      moves.push(square);
    }
    return -1;
  }
}

/* Returns true if piece at source threatens square in pos */
function threatens(pos, piece, source, square, state) {
  moves = validMoves(source, piece, pos, state);
  return ($.inArray(square, moves) != -1);
}

/* Returns true if piece at source would threaten square in pos if
   . . . you get the idea , given king locations */
function wouldThreatenIfOppositeKingWentThere(state, pos, piece, source, square) {
  var posCopy = Object.assign({}, pos); //okay because oldPos is not a nested object
  var stateCopy = Object.assign({}, state); //okay because only writing king locs, not writing to nested objects
  if(piece == "bK") {
    stateCopy.bKLoc = square;
  }
  if(piece == "wK") {
    stateCopy.wKLoc = square;
  }
  var correctKingLoc = (piece.charAt(0) == 'w') ? state.bKLoc : state.wKLoc;
  var correctKing = (piece.charAt(0) == 'w') ?'bK' : 'wK';
  delete posCopy[correctKingLoc];
  posCopy[square] = correctKing;
  return threatens(posCopy, piece, source, square, state);
}

function inCheck(whiteTurn, pos, state) {
  var kingLoc = (whiteTurn) ? state.wKLoc : state.bKLoc;
  var color = (whiteTurn) ? "w" : "b";
  for(var square in pos) {
    if(pos.hasOwnProperty(square)) {
      if((pos[square] != undefined) && (pos[square].charAt(0) != color)) {
        if(threatens(pos, pos[square], square, kingLoc, state)) {
          return true;
        }
      }
    }
  }
  return false;
}

/*returns true if making this move would not leave the moving player in check */
function wouldNotCheck(state, oldPos, piece, source, target) {
  var color = piece.charAt(0);
  var myKingLoc = (piece.charAt(1) == "K") ? (target) : ((color == "w") ? (state.wKLoc) : (state.bKLoc));
  var stateCopy = Object.assign({}, state); //okay because only writing king locs, not writing to nested objects
  if(piece.charAt(1) == "K") {
    (color == "w") ? stateCopy.wKLoc = myKingLoc : stateCopy.bKLoc = myKingLoc;
  }
  var posCopy = Object.assign({}, oldPos); //okay because oldPos is not a nested object

  delete posCopy[source];
  posCopy[target] = piece;
  return !(inCheck((color == "w"), posCopy, stateCopy));
}

var legalSquares = function(square, piece, pos, state) {
  return validMoves(square, piece, pos, state).filter(partial(wouldNotCheck, state, pos, piece, square));
}

//returns a list of squares that piece at square threatens
var threatenedSquares = function(square, piece, pos, state) {
  return ALL_SQUARES.filter(partial(wouldThreatenIfOppositeKingWentThere, state, pos, piece, square));
}

function hasMoves(whiteTurn, pos, state) {
  var color = (whiteTurn) ? "w" : "b";
  for(var square in pos) {
    if(pos.hasOwnProperty(square)) {
      if((pos[square] != undefined) && (pos[square].charAt(0) == color)) {
        var moves = legalSquares(square, pos[square], pos, state);
        if(moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

// returns object:
// {inCheck: "w" or "b" or "" checkmated: "w" or "b" or "" stalemated: true or false}
function check_mate_stale(whiteTurn, pos, state) {
  if(inCheck(whiteTurn, pos, state)) {
    if(hasMoves(whiteTurn, pos, state)) {
      var colorInCheck = whiteTurn ? "w" : "b";
      return {inCheck: colorInCheck, checkmated: "", stalemated: false};
    }
    else {
      var checkmated = (whiteTurn) ? "w" : "b";
      return {inCheck: "", checkmated: checkmated, stalemated: false};
    }
  }
  else if(!hasMoves(whiteTurn, pos, state)) {
    return {inCheck: "", checkmated: "", stalemated: true};
  }
}

function updatePawnPromotionPrelim(pos, state, source, target) {
  //done for both pawn promotion before add piece AND regular moves
  var moveString = source + "-" + target;
  var piece = pos[source];
  delete pos[source];
  pos[target] = piece;
  state.moves.push(moveString);
}

function updatePawnPromotionFinal(pos, state) {
  var source = null;
  state.whiteTurn = !state.whiteTurn;
  //reset enpassants
  for(var square in state.enpassants) {
    if(state.enpassants.hasOwnProperty(square)) {
      state.enpassants[square] = false;
    }
  }
  //set enpassant if this was an enpassant move
  if( (source != null) && piece.charAt(1) == "P" &&
      (parseInt(target.charAt(1)) - parseInt(source.charAt(1)) == (forward * 2))) {
    var enable = source.charAt(0) + (parseInt(source.charAt(1)) + forward);
    state.enpassants[enable] = true;
  }
  checkObj = check_mate_stale(state.whiteTurn, pos, state);
  state.gameOver = ((checkObj.checkmated.length > 0) || checkObj.stalemated)
  state.whiteMated = (checkObj.checkmated == "w");
  state.blackMated = (checkObj.checkmated == "b");
  state.stalemated = checkObj.stalemated;

  if(state.whiteMated || state.blackMated) {
    state.moves[state.moves.length - 1] += "#";
  }
  if(inCheck(state.whiteTurn, pos, state)) {
    state.moves[state.moves.length - 1] += "+";
  }
  if(state.stalemated) {
    state.moves[state.moves.length - 1] += "SM"
  }
}
//modifies pos and state, given that legal move
//if source and target are null, that means pawn was promoted and this is called again
function updatePosAndStateGeneral(pos, state, source, target) {
  if(source == null) {
    updatePawnPromotionFinal(pos, state);
    return;
  }
  var piece = pos[source];
  var promotionRank = (piece.charAt(0) == "w") ? "8" : "1";
  if(piece.charAt(1) == "P" && target.charAt(1) == promotionRank) {
    updatePawnPromotionPrelim(pos, state, source, target);
    return;
  }
  var forward = (piece.charAt(0) == "w") ? 1 : -1;
  updatePawnPromotionPrelim(pos, state, source, target);
  //STUFF
  if(piece.charAt(1) == "K") {
    var kingField = piece.charAt(0) + "KLoc";
    state[kingField] = target;
  }
  //piece is pawn that moved columns to an empty square, so must have en passanted
  if((piece.charAt(1) == "P") && (target.charAt(0) != source.charAt(0)) &&
                                              (pos[target] == undefined)) {
  //  console.log("Made en passant move!")
    var backward = -1 * forward;
    var eliminateSquare = target.charAt(0) + (parseInt(target.charAt(1)) + backward);
    delete pos[eliminateSquare];
  }
  updatePawnPromotionFinal(pos, state);
}
