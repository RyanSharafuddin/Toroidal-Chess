var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var util = require('util'); //see nodejs.org documentation on this; very helpful
var port = process.env.PORT || 8000;


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); //necesary to handle post requests
app.use(cookieParser());
//app.use(session({ secret: '$#%!@#@@#SSDASASDVV@@@@', key: 'sid'})); //???
app.use(express.static(path.join(__dirname, '/public')));

/* See https://stackoverflow.com/questions/5924072/express-js-cant-get-my-static-files-why
   specifically the second answer for an explanation of how express.static works */
app.get('/', function(req, res) {
  console.log("Got request for login page");
  res.render('login', {unique: ""});
});

app.get('/rules', function(req, res) {
  res.render('rules');
});

app.post('/login', function(req, res, next) {
  var user_nickname = req.body.user_nickname;
  console.log("Someone attempted to log in with nickname '" + user_nickname + "'");
  if(onlinePlayers[user_nickname] == undefined) { //this is a unique nickname
    console.log("This is a unique nickname");
    res.render('lobby', {user_nickname: user_nickname});
  }
  else {
    //nickname already taken
    console.log("This nickname is already taken");
    res.render('login', {unique: "not_unique"})
  }
  next();
});

app.post('/gameStart', function(req, res) {
  //console.log("typeof req.body.roomNamer is: " + typeof(req.body.roomNamer)); //only takes strings for some reason
  //roomNamer is either "0" or "1"
  res.render('board.ejs', {myName: req.body.myName, enemyName: req.body.enemyName, roomNamer: req.body.roomNamer});
});

app.post('/lobbyReturn', function(req, res) {
  console.log("got post request for lobby return");
  var user_nickname = req.body.myName;
  res.render('lobby.ejs', {user_nickname: user_nickname});
});


//example room format: {1: {hasBlack: false, hasWhite: false, fill: 0}}
//var rooms = {}; //deprecated
var onlinePlayers = {}; //{nickname: {id: id, inLobby: true or false, inGame: true or false, color: "white" or "black" or undefined}}
//added attributes to socket: nickname, gameRoom (undefined when not in game), nickname always defined
//lobby room name is lobby for now
io.on('connection', function(socket) {
    //-----------------------------Lobby Functions------------------------------
    socket.on('lobby', function(nickname) {
      console.log(nickname + " has joined the lobby");
      socket.join("lobby");
      socket.emit('currentNicks', onlinePlayers); //notify of current nicknames
      onlinePlayers[nickname] = {id: socket.id, inLobby: true, inGame: false};
      socket.nickname = nickname;
      socket.broadcast.to("lobby").emit('lobby_enter', nickname); //notify everyone in lobby of entry
      console.log(JSON.stringify(onlinePlayers, null, 4));
    });

    /* Every socket automatically joins a room that has the same name as its id, which
       is unique */
    socket.on('send_challenge', function(data) {
      var nickname = data.nickname;
      var showValid = data.showValid;
      var showThreat = data.showThreat;
      socket.broadcast.to(onlinePlayers[nickname]["id"]).emit('challenged', {
        challenger: socket.nickname,
        showValid: showValid,
        showThreat: showThreat});
    });

    socket.on('declineChallenge', function(challenger) {
      socket.broadcast.to(onlinePlayers[challenger]["id"]).emit('challengeDeclined', {name: socket.nickname, reason: "want"});
    });

    socket.on('acceptChallenge', function(nickname) {
      //both players must leave lobby, then join their own private room, and then game happens
      onlinePlayers[socket.nickname]["inLobby"] = false;
      onlinePlayers[socket.nickname]["inGame"] = true;
      socket.broadcast.to("lobby").emit('lobby_leave', socket.nickname); //notify everyone in lobby of leaving
      socket.leave("lobby");
      socket.hereFlag = true;

      var challenger = io.sockets.connected[onlinePlayers[nickname]["id"]]; //the socket of the challenged player
      onlinePlayers[challenger.nickname]["inLobby"] = false;
      onlinePlayers[challenger.nickname]["inGame"] = true;
      challenger.broadcast.to("lobby").emit('lobby_leave', challenger.nickname); //notify everyone in lobby of leaving
      challenger.leave("lobby");
      //inform challenger that challenge accepted
      challenger.emit('challengeAccepted', socket.nickname);
      challenger.hereFlag = true;
      console.log("A challenge has been accepted and a game has been started. Here is the onlinePlayers structure: ");
      console.log(JSON.stringify(onlinePlayers, null, 4));
    });

    //socket telling callerNickName that they have a standing invitation
    socket.on('busyTone', function(callerNickName) {
      var callerSocket = io.sockets.connected[onlinePlayers[callerNickName]["id"]];
      callerSocket.emit('challengeDeclined', {name: socket.nickname, reason: "busy"});
    });
      //-----------------------------End Lobby Functions------------------------------
      //-----------------------------Board Functions ------------------------------
    socket.on('startGame', function(gameParameters) {
      var myName = gameParameters.myName;
      var enemyName = gameParameters.enemyName;
      var roomName = gameParameters.roomName;
      //update id in onlinePlayers object
      onlinePlayers[myName]["id"] = socket.id;
      var enemyColor = onlinePlayers[enemyName]["color"];
      var myColor = (enemyColor === undefined) ? ((Math.random() > .5) ? "white" : "black") : ((enemyColor === "white") ? "black" : "white");
      //update color in onlinePlayers object
      onlinePlayers[myName]["color"] = myColor;
      socket.join(roomName);
      console.log("onlinePlayers object:");
      socket.gameRoom = roomName;
      socket.nickname = myName;
      console.log(JSON.stringify(onlinePlayers, null, 4));
      socket.emit('start', {color: myColor});
    });

    socket.on('move', function(totalState) {
      console.log("Move made by " + socket.nickname + " in room " + socket.gameRoom);
      console.log("Move is: " + totalState.state.moves[totalState.state.moves.length - 1]);
      socket.broadcast.to(socket.gameRoom).emit('oppMove', totalState);
    });

    socket.on('resignation', function(resignData) {
      socket.broadcast.to(socket.gameRoom).emit('resigned', resignData);
    });

    socket.on('drawProposal', function() {
      socket.broadcast.to(socket.gameRoom).emit('drawOffer');
    });

    socket.on('drawResponse', function(answer) {
      socket.broadcast.to(socket.gameRoom).emit('drawReply', answer);
    });

    socket.on('lobbyReturn', function(data) {
      var nickname = socket.nickname;
      var id = socket.id;
      if(!data.gameOver) {
        socket.broadcast.to(socket.gameRoom).emit('oppLeft');
      }
      socket.leave(socket.gameRoom);
      socket.gameRoom = undefined;
      socket.hereFlag = true;
      onlinePlayers[nickname]["inLobby"] = true;
      onlinePlayers[nickname]["inGame"] = false;
      onlinePlayers[nickname]["color"] = undefined;
      console.log(nickname + " has gone from game to lobby");
    });
  //-----------------------------End Board Functions ------------------------------

  socket.on('disconnect', function() { //only use this for xing out of site, not disconnects caused by switching pages
    if(onlinePlayers[socket.nickname] == undefined) {
      //for some reason, whenever someone leaves game, an unknown socket also leaves. . .
      // console.log("logging before crash");
      // console.log(util.inspect(socket, {colors: true}));
      // throw "Socket left but has no data in onlinePlayers";
    }
    if(socket.hereFlag) {
      //in order to prevent this function from activating upon moving from lobby to game or game to lobby
      return;
    }
    if(onlinePlayers[socket.nickname] == undefined) {
      console.log("socket not present in onlinePlayers . . .");
      console.log("nickname: " + socket.nickname);
      return;
    }
    if(onlinePlayers[socket.nickname]["inLobby"]) {
      onlinePlayers[socket.nickname]["inLobby"] = false;
      console.log(socket.nickname + " has left the lobby");
      //update other lobby players
      socket.broadcast.to("lobby").emit('lobby_leave', socket.nickname); //notify everyone in lobby of leaving
    }
    if(onlinePlayers[socket.nickname]["inGame"]) {
      onlinePlayers[socket.nickname]["inGame"] = false;
      console.log(socket.nickname + " has left a game");
      //update the other player of that game
      socket.broadcast.to(socket.gameRoom).emit('oppLeft');
    }
    if(!onlinePlayers[socket.nickname]["inGame"] && !onlinePlayers[socket.nickname]["inLobby"]) {
      delete onlinePlayers[socket.nickname];
    }
    console.log(JSON.stringify(onlinePlayers, null, 4));
  });
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
