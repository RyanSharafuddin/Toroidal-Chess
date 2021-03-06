/*PURPOSE:
    construct an initial pos obj and state
    put in pos, state, and source, get all legal moves
    put in pos, state, and source, get all threats,
    put in pos, state, and legal move, get back updated pos and state
    put in pos, state, and legal move, get back whether it's a promotion or not
    put in pos, state, square, and promotion piece desire, get back updated pos and state
//DEPENDENCIES: NONE
NOTICE: I'm defining a valid move to be a move that the piece can make
           without regards to check while a legal move is a valid move that
           doesn't leave the mover in check
*/
var CHECKMATE_SYMBOL = "#";
var STALEMATE_SYMBOL = "SM";
var CHECK_SYMBOL = "+";

var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
var ALL_SQUARES = [];

for(var rank = 0; rank < 8; rank++) {
  for(var file = 0; file < 8; file++) {
    ALL_SQUARES.push( coord(file, rank) );
  }
}

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data)); //horribly inefficient, I know
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

function arrayIntersect(arrOne, arrTwo) {
  return $.map(arrOne,function(a){return $.inArray(a, arrTwo) < 0 ? null : a;})
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
      throw ("unrecognized piece name " + piece);
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
   . . . you get the idea  */
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
      try {
        if(pos[square] == 'e4-d5+') {
          throw "WTF?"
        }
        if((pos[square] != undefined) && ((pos[square]).charAt(0) != color)) {
          if(threatens(pos, pos[square], square, kingLoc, state)) {
            return true;
          }
        }
      }
      catch(e) {
        console.log("Square is " + square);
        console.log(("pos[square] is " + pos[square]));
        console.log(e);
        console.trace();
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

function getAllLegalMoves(whiteTurn, pos, state) {
  var legalMoves = [];
  var color = (whiteTurn) ? "w" : "b";
  for(var square in pos) {
    if(pos.hasOwnProperty(square)) {
      if((pos[square] != undefined) && (pos[square].charAt(0) == color)) {
        var moves = legalSquares(square, pos[square], pos, state);
        if(moves.length > 0) {
          legalMoves.push({source: square, moves: legalSquares(square, pos[square], pos, state)});
        }
      }
    }
  }
  return legalMoves; //in form of [{source: a4, moves: [a1, a2, a3]}, {source: d4, moves:[...]}]
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
  return {inCheck: "", checkmated: "", stalemated: false};
}

/*
returns an array of squares that are the locations of enemy pieces that piece at potentialPinnerLoc is
pinning to the enemy king, or [] if there are none
*/
function piecesPinnedBy(potentialPinnerLoc, pos, state) {
  var pinnedPieceLocs = [];
  var pieceColor = pos[potentialPinnerLoc].charAt(0);
  var enemyColor = (pieceColor == "w") ? "b" : "w";
  var enemyKingLoc = (enemyColor == "w") ? state.wKLoc : state.bKLoc;
  var allEnemyPieceLocs = allPieces(enemyColor, pos);
  for(var x = 0; x < allEnemyPieceLocs.length; x++) {
    var enemyPieceLoc = allEnemyPieceLocs[x];
    if(isPinnedBy(potentialPinnerLoc, enemyPieceLoc, pos, state, enemyKingLoc)) {
      pinnedPieceLocs.push(enemyPieceLoc);
    }
  }
  return pinnedPieceLocs;
}

//returns true if all legal moves for the owner of the piece at source involve
//moving that piece
function mustMovePiece(source, pos, state) {
  var color = (pos[source]).charAt(0);
  var movArray = getAllLegalMoves((color == "w"), pos, state);
  return ((movArray.length == 1) && (movArray[0]["source"] == source));
}

//returns whether the piece at pineeSquare is pinned to king by the piece at potentialPinnerLoc
function isPinnedBy(potentialPinnerLoc, pineeSquare, pos, state, enemyKingLoc) {
  if(pineeSquare == enemyKingLoc) {
    return false; //doesn't make sense to say king is pinned
  }
  var potentialPinnerPiece = pos[potentialPinnerLoc];
  var couldAttackBefore = ($.inArray(enemyKingLoc, validMoves(potentialPinnerLoc, potentialPinnerPiece, pos, state)) >= 0);
  var posCopy = deepCopy(pos);
  delete posCopy[pineeSquare];
  var canAttackIfPineeVanished = ($.inArray(enemyKingLoc, validMoves(potentialPinnerLoc, potentialPinnerPiece, posCopy, state)) >= 0);
  return(!couldAttackBefore && canAttackIfPineeVanished);
}
function allPieces(color, pos) { //works
  var letter = ((color == "white") || (color == "w") || (color === true)) ? "w" : "b";
  return ALL_SQUARES.filter(function(square) {
    return ((pos[square] !== undefined) && (pos[square].charAt(0) == letter));
  });
}

function setEnpassants(piece, source, target, state) {
  var forward = (piece.charAt(0) == "w") ? 1 : -1;
  //reset them all to false
  for(var square in state.enpassants) {
    if(state.enpassants.hasOwnProperty(square)) {
      state.enpassants[square] = false;
    }
  }
  //set enpassant if this was a pawn moving up 2
  if(piece.charAt(1) == "P" &&
      (parseInt(target.charAt(1)) - parseInt(source.charAt(1)) == (forward * 2))) {
    var enable = source.charAt(0) + (parseInt(source.charAt(1)) + forward);
    state.enpassants[enable] = true;
  }
}

function getUpdatedPosAndStatePrelim(pos, state, source, target) {
  //done for both pawn promotion before add piece AND regular moves
  var posCopy = deepCopy(pos);
  var stateCopy = deepCopy(state);
  var moveString = source + "-" + target;
  var piece = posCopy[source];
  var targetPiece = posCopy[target];
  var forward = (piece.charAt(0) == "w") ? 1 : -1;
  delete posCopy[source];
  posCopy[target] = piece;
  stateCopy.moves.push(moveString);
  //piece is pawn that moved columns to an empty square, so must have en passanted
  if((piece.charAt(1) == "P") && (target.charAt(0) != source.charAt(0)) &&
                                              (targetPiece === undefined)) {
    console.log("Made en passant move!");
    var backward = -1 * forward;
    var eliminateSquare = target.charAt(0) + (parseInt(target.charAt(1)) + backward);
    console.log("eliminateSquare: " + eliminateSquare);
    delete posCopy[eliminateSquare];
  }
  setEnpassants(piece, source, target, stateCopy);
  console.log("en passants set. They are: " + JSON.stringify(stateCopy.enpassants));
  if(piece.charAt(1) == "K") {
    var kingField = piece.charAt(0) + "KLoc";
    stateCopy[kingField] = target;
  }
  return {pos: posCopy, state: stateCopy};
}

function getUpdatedPosAndStateFinal(pos, state) {
  var posCopy = deepCopy(pos);
  var stateCopy = deepCopy(state);
  stateCopy.whiteTurn = !stateCopy.whiteTurn;
  checkObj = check_mate_stale(stateCopy.whiteTurn, posCopy, stateCopy);
  stateCopy.inCheck = checkObj.inCheck.length > 0;
  stateCopy.gameOver = ((checkObj.checkmated.length > 0) || checkObj.stalemated)
  stateCopy.whiteMated = (checkObj.checkmated == "w");
  stateCopy.blackMated = (checkObj.checkmated == "b");
  stateCopy.stalemated = checkObj.stalemated;

  if(stateCopy.whiteMated || stateCopy.blackMated) {
    stateCopy.moves[stateCopy.moves.length - 1] += CHECKMATE_SYMBOL;
  }
  if(stateCopy.inCheck) {
    stateCopy.moves[stateCopy.moves.length - 1] += CHECK_SYMBOL;
  }
  if(stateCopy.stalemated) {
    stateCopy.moves[stateCopy.moves.length - 1] += STALEMATE_SYMBOL;
  }
  return {pos: posCopy, state: stateCopy};
}

//------------------------- FUNCTIONS TO EXPOSE TO OUTSIDE ---------------------
//other javascript files should ONLY call these functions/use these globals, not any of the above functions

var TOROIDAL_START_FEN = "r1b2b1r/pp4pp/n1pqkp1n/3pp3/3PP3/N1PQKP1N/PP4PP/R1B2B1R";
var TOROIDAL_START = {"a8":"bR",
                      "c8":"bB",
                      "f8":"bB",
                      "h8":"bR",
                      "a7":"bP",
                      "b7":"bP",
                      "g7":"bP",
                      "h7":"bP",
                      "a6":"bN",
                      "c6":"bP",
                      "d6":"bQ",
                      "e6":"bK",
                      "f6":"bP",
                      "h6":"bN",
                      "d5":"bP",
                      "e5":"bP",
                      "d4":"wP",
                      "e4":"wP",
                      "a3":"wN",
                      "c3":"wP",
                      "d3":"wQ",
                      "e3":"wK",
                      "f3":"wP",
                      "h3":"wN",
                      "a2":"wP",
                      "b2":"wP",
                      "g2":"wP",
                      "h2":"wP",
                      "a1":"wR",
                      "c1":"wB",
                      "f1":"wB",
                      "h1":"wR"};

function InitGameState() {
  this.whiteTurn = true,
  this.inCheck = false, //only set to true if inCheck and not in mate. Applies to side of whiteTurn
  this.gameOver = false,
  this.blackMated = false,
  this.whiteMated = false,
  this.stalemated = false,
  this.wKLoc = "e3",
  this.bKLoc = "e6",
  this.moves = [],
  this.enpassants = {
    a3: false,
    b3: false,
    g3: false,
    h3: false,
    a6: false,
    b6: false,
    g6: false,
    h6: false
  }
}

function promotePawnGetUpdatedPosAndState(promoteTo, square, oldPos, oldState) {
  var posCopy = deepCopy(oldPos);
  var stateCopy = deepCopy(oldState);
  switch(promoteTo.charAt(1)) {
    case "Q":
      stateCopy.moves[stateCopy.moves.length - 1] += "=Q";
      break;
    case "N":
      stateCopy.moves[stateCopy.moves.length - 1] += "=N";
      break;
    case "B":
      stateCopy.moves[stateCopy.moves.length - 1] += "=B";
      break;
    case "R":
      stateCopy.moves[stateCopy.moves.length - 1] += "=R";
      break;
  }
  posCopy[square] = promoteTo;
  return  getUpdatedPosAndStateFinal(posCopy, stateCopy);
}
//returns whether or not this qualifies for pawn promotion
function isPromotion(piece, source, target) {
  var promotionRank = (piece.charAt(0) == "w") ? "8" : "1";
  return (piece.charAt(1) == "P" && target.charAt(1) == promotionRank)
}
var legalSquares = function(square, piece, pos, state) {
  return validMoves(square, piece, pos, state).filter(partial(wouldNotCheck, state, pos, piece, square));
}

function isLegalMove(pos, state, source, target) {
  var moves = legalSquares(source, pos[source], pos, state);
  return (!($.inArray(target, moves) === -1));
}

//returns a list of squares that piece at square threatens
var threatenedSquares = function(square, piece, pos, state) {
  return ALL_SQUARES.filter(partial(wouldThreatenIfOppositeKingWentThere, state, pos, piece, square));
}

function getUpdatedPosAndState(pos, state, source, target) {
  data = getUpdatedPosAndStatePrelim(pos, state, source, target);
  if(isPromotion(pos[source], source, target)) {
    return data;
  }
  return getUpdatedPosAndStateFinal(data.pos, data.state);
}

function necessaryToMate(pos, state) {
  if(!(state.whiteMated || state.blackMated)) {
    throw("Error. Can only call necessaryToMate on a checkmated position");
  }
  var matingColor = (state.blackMated) ? "w" : "b";
  var matedColor = (state.whiteMated) ? "w" : "b";
  var matedKingLoc = (state.blackMated) ? state.bKLoc : state.wKLoc;
  var matedKingEscapeSquares = validMoves(matedKingLoc, matedColor + "K", pos, state);
  console.log(matedKingEscapeSquares + " are the escape squares");
  var allMaterPieceLocs = allPieces(matingColor, pos);
  var matedKingCombinedSquares = [matedKingLoc].concat(matedKingEscapeSquares);
  var threatensKingOrEscapeSquareLocs = allMaterPieceLocs.filter(function(square) {
    return(arrayIntersect(matedKingCombinedSquares, threatenedSquares(square, pos[square], pos, state)).length > 0);
  });
  console.log(threatensKingOrEscapeSquareLocs + "is the array of direct king escape threateners")
  var pinnersNecessaryToMate = $.map(allMaterPieceLocs, function(materPieceLoc) {
    var pinnedPieces = piecesPinnedBy(materPieceLoc, pos, state);
    if(pinnedPieces.length == 0) {
      return null;
    }
    var criticalPinnedPieces = pinnedPieces.filter(function(pinnedPieceLoc) {
      var posCopy = deepCopy(pos);
      delete posCopy[materPieceLoc];
      return mustMovePiece(pinnedPieceLoc, posCopy, state);
    });
    return(criticalPinnedPieces.length > 0) ? materPieceLoc : null;
  });
  console.log(pinnersNecessaryToMate + " is the array of pinners ");
  return ({direct: threatensKingOrEscapeSquareLocs, pinners: pinnersNecessaryToMate});
}
