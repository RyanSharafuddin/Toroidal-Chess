var TOROIDAL_START = "r1b2b1r/pp4pp/n1pqkp1n/3pp3/3PP3/N1PQKP1N/PP4PP/R1B2B1R";
var cfg = {
  position: TOROIDAL_START,
  draggable: true
};
var board1 = ChessBoard('board1', cfg);

/*
   1) Only able to pick up your own pieces.
  2) Switches turns when make moves
  3) Can only make moves that that piece can make
  4) Can only make moves that that piece can make AND can't go through pieces
  5) Incorporate checking into account
  6) Incorporate en passant into account
*/
