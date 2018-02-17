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
  //ditto with timed
  console.log("got POST request");
  console.log("request body: " + JSON.stringify(req.body));
  res.render('board.ejs', {myName: req.body.myName,
                          enemyName: req.body.enemyName,
                          roomNamer: req.body.roomNamer,
                          showValid: req.body.showValid.charAt(0),
                          showThreat: req.body.showThreat.charAt(0)}); //since Jquery apparently can't deal with periods in ids
                          
});

app.post('/lobbyReturn', function(req, res) {
  console.log("got post request for lobby return");
  var user_nickname = req.body.myName;
  res.render('lobby.ejs', {user_nickname: user_nickname});
});



var onlinePlayers = {}; //{nickname: {id: id, inLobby: true or false, inGame: true or false, color: "white" or "black" or undefined}}
//added attributes to socket: nickname, gameRoom (undefined when not in game), nickname always defined
//lobby room name is lobby for now
var reconnecters = {}; //to be used to make sure game only resumes when both people reconnect
io.on('connection', function(socket) {
  function errorCheck(nickname, functionName) {
    if(onlinePlayers[nickname] === undefined) {
      console.log("errorCheck detected an error in " + functionName); //nickname of challenger/player unrecognized
      socket.emit("nameNotFound");
      return true;
    }
    return false;
  }
  function comparePreviousID(nickname, socket) {
    if(onlinePlayers[nickname]) {
      var previousID = onlinePlayers[nickname]["id"];
      var currentID = socket.id;
      console.log(nickname + ": previous ID = " + previousID);
      console.log(nickname + ": current ID = " + currentID);
      if(previousID != socket.id) {
        console.log("ERROR! There should only be one socket now");
      }
    }
  }
    //-----------------------------Lobby Functions------------------------------
    socket.on('lobby', function(nickname) {
      console.log(nickname + " has joined the lobby");
      socket.join("lobby");
      socket.emit('currentNicks', onlinePlayers); //notify of current nicknames
      comparePreviousID(nickname, socket);
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
      if(errorCheck(nickname, "send_challenge")) {
        return; //prevent crashing when people press back button and stuff
      }
      socket.broadcast.to(onlinePlayers[nickname]["id"]).emit('challenged', {
        challenger: socket.nickname,
        showValid: showValid,
        showThreat: showThreat,
        timed: data.timed,
        minutes: data.minutes,
        bonus: data.bonus
      });
    });

    socket.on('declineChallenge', function(challenger) {
      if(errorCheck(challenger, "declineChallenge")) {
        return; //prevent crashing when people press back button and stuff
      }
      socket.broadcast.to(onlinePlayers[challenger]["id"]).emit('challengeDeclined', {name: socket.nickname, reason: "want"});
    });

    socket.on('acceptChallenge', function(nickname) {
      if(errorCheck(nickname, "acceptChallenge")) {
        return; //prevent crashing when people press back button and stuff
      }
      //both players must leave lobby, then join their own private room, and then game happens
      onlinePlayers[socket.nickname]["inLobby"] = false;
      onlinePlayers[socket.nickname]["inGame"] = true;
      socket.broadcast.to("lobby").emit('lobby_leave', socket.nickname); //notify everyone in lobby of leaving
      socket.leave("lobby");

      var challenger = io.sockets.connected[onlinePlayers[nickname]["id"]]; //the socket of the challenged player
      onlinePlayers[challenger.nickname]["inLobby"] = false;
      onlinePlayers[challenger.nickname]["inGame"] = true;
      challenger.broadcast.to("lobby").emit('lobby_leave', challenger.nickname); //notify everyone in lobby of leaving
      challenger.leave("lobby");
      //inform challenger that challenge accepted
      challenger.emit('challengeAccepted', socket.nickname);
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
      //{nickname: {id: id, inLobby: true or false, inGame: true or false, color: "white" or "black" or undefined}}
      //added attributes to socket: nickname, gameRoom (undefined when not in game), nickname always defined
      //lobby room name is lobby for now

    socket.on("recon", function(data) {
      socket.join(data.roomName);
      onlinePlayers[data.name] = {id: socket.id, inLobby: false, inGame: true, color: data.color};
      socket.nickname = data.name;
      socket.gameRoom = data.roomName;
      if(reconnecters[data.roomName] === undefined) {
        reconnecters[data.roomName] = 1;
      }
      else {
        delete reconnecters[data.roomName];
        io.in(socket.gameRoom).emit("reconnectBoard");
      }
      console.log("Got reconnection from " + data.name + " in " + data.roomName);
    });

    socket.on("test", function() {
      console.log("Got test");
    });

    socket.on('startGame', function(gameParameters) {
      var myName = gameParameters.myName;
      var enemyName = gameParameters.enemyName;
      var roomName = gameParameters.roomName;
      if(errorCheck(myName, "startGame")) {
        return; //prevent crashing when people press back button and stuff
      }
      //update id in onlinePlayers object
      console.log("startGame received from: " + myName);
      comparePreviousID(myName, socket);
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
      if(errorCheck(socket.nickname, "move")) {
        return; //prevent crashing when people press back button and stuff
      }
      console.log("Move made by " + socket.nickname + " in room " + socket.gameRoom);
      console.log("Move is: " + totalState.state.moves[totalState.state.moves.length - 1]);
      socket.broadcast.to(socket.gameRoom).emit('oppMove', totalState);
    });

    socket.on('resignation', function(resignData) {
      if(errorCheck(socket.nickname, "resignation")) {
        return; //prevent crashing when people press back button and stuff
      }
      socket.broadcast.to(socket.gameRoom).emit('resigned', resignData);
    });

    socket.on('drawProposal', function() {
      if(errorCheck(socket.nickname, "drawProposal")) {
        return; //prevent crashing when people press back button and stuff
      }
      socket.broadcast.to(socket.gameRoom).emit('drawOffer');
    });

    socket.on('drawResponse', function(answer) {
      if(errorCheck(socket.nickname, "drawResponse")) {
        return; //prevent crashing when people press back button and stuff
      }
      socket.broadcast.to(socket.gameRoom).emit('drawReply', answer);
    });

    socket.on('lobbyReturn', function(data) {
      if(errorCheck(socket.nickname, "lobbyReturn")) {
        return; //prevent crashing when people press back button and stuff
      }
      var nickname = socket.nickname;
      var id = socket.id;
      if(!data.gameOver) {
        socket.broadcast.to(socket.gameRoom).emit('oppLeft');
      }
      socket.leave(socket.gameRoom);
      socket.gameRoom = undefined;
      onlinePlayers[nickname]["inLobby"] = true;
      onlinePlayers[nickname]["inGame"] = false;
      onlinePlayers[nickname]["color"] = undefined;
      console.log(nickname + " has gone from game to lobby");
    });

    socket.on('chatMessage', function(data) { //send to all, including self
      if(errorCheck(socket.nickname, "chatMessage")) {
        return; //prevent crashing when people press back button and stuff
      }
      if(onlinePlayers[socket.nickname]["inGame"]) {
        io.in(socket.gameRoom).emit('chatting', data);
      }
      else if (onlinePlayers[socket.nickname]["inLobby"]) {
        io.in("lobby").emit('chatting', data);
      }
    });
  //-----------------------------End Board Functions ------------------------------

  socket.on('disconnect', function() { //only use this for xing out of site, not disconnects caused by switching pages
    if(onlinePlayers[socket.nickname] == undefined) {
      console.log("disconnected socket not present in onlinePlayers . . ., may or may not be a bug");
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
