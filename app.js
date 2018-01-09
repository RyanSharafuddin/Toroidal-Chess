var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
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

app.get('/main', function(req, res) {
  console.log("Got request for main page!");
  res.render('main');
});

app.post('/', function(req, res) {
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
});


//example room format: {1: {hasBlack: false, hasWhite: false, fill: 0}}
var rooms = {};
var onlinePlayers = {}; //{nickname: {id: id, inLobby: true or false, inGame: true or false}}
//lobby room name is lobby for now
io.on('connection', function(socket) {

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
    socket.on('send_challenge', function(nickname) {
      socket.broadcast.to(onlinePlayers[nickname]["id"]).emit('challenged', {challenger: socket.nickname});
    });
    /////////////////////////////////////////////////
    socket.on('enter', function(requestedRoom) {
      if((rooms[requestedRoom] == undefined) || (rooms[requestedRoom]["fill"] == 0)) {
        console.log("A client has created room " + requestedRoom);
        rooms[requestedRoom] = {hasBlack: false, hasWhite: true, fill: 1};
        socket.join(requestedRoom);
        var color = "white";
        socket.emit('roomAssignment', {roomID: requestedRoom, color: color, full: false});
        socket.roomID = requestedRoom;
        socket.color = color;
        console.log(JSON.stringify(rooms, null, 4));
      }
      else if (rooms[requestedRoom]["fill"] == 1) {
          console.log("A client has joined room " + requestedRoom);
          rooms[requestedRoom]["fill"] += 1;
          socket.join(requestedRoom);
          var color = rooms[requestedRoom]["hasWhite"] ? "black" : "white";
          rooms[requestedRoom]["hasWhite"] = true;
          rooms[requestedRoom]["hasBlack"] = true;
          socket.emit('roomAssignment', {roomID: requestedRoom, color: color, fill: true});
          socket.roomID = requestedRoom;
          socket.color = color;
          io.in(requestedRoom).emit('fullPresence', "dummy data"); //alert other player you've arrived
          console.log(JSON.stringify(rooms, null, 4));
          console.log("Sent fullPresence to everyone in room: " + requestedRoom);
      }
      else if(rooms[requestedRoom]["fill"] == 2) {
        console.log("A client has attempted to join a full room: " + requestedRoom);
        socket.emit('roomAssignment', null);
        console.log(JSON.stringify(rooms, null, 4));
      }
    });

   socket.on('move', function(totalState){
     /* Remember, this could also be the reset button, so if reset on first move, don't
         be alarmed by undefined */
     console.log("Move made by " + socket.color + " in room " + socket.roomID);
     console.log("Move is: " + totalState.state.moves[totalState.state.moves.length - 1]);
     socket.broadcast.to(socket.roomID).emit('oppMove', totalState);
   });

  socket.on('disconnect', function() {
    if(onlinePlayers[socket.nickname] == undefined) {
      //login page
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
    }
    if(!onlinePlayers[socket.nickname]["inGame"] && !onlinePlayers[socket.nickname]["inLobby"]) {
      delete onlinePlayers[socket.nickname];
    }
    console.log(JSON.stringify(onlinePlayers, null, 4));
    //////////////////////////////////////////////////////////
    if(socket.roomID == undefined) {
      return;
    }
    console.log('A client has disconnected from room ' + socket.roomID);
    if(rooms[socket.roomID] == undefined) {
      return;
    }
    rooms[socket.roomID]["fill"] -= 1;
    (socket.color == "white") ? rooms[socket.roomID]["hasWhite"] = false : rooms[socket.roomID]["hasBlack"] = false;
    io.in(socket.roomID).emit('oppLeft', "dummy data");
    if(rooms[socket.roomID]["fill"] == 0) {
      delete(rooms[socket.roomID]);
    }
    console.log(JSON.stringify(rooms, null, 4));
  });
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
