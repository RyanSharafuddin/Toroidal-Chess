var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var port = process.env.PORT || 8000;

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
//app.use(session({ secret: '$#%!@#@@#SSDASASDVV@@@@', key: 'sid'})); //???
app.use(express.static(path.join(__dirname, '/public')));



app.get('/', function(req, res) {
  res.render('login');
  console.log("Got request for login page");
});

app.get('/main', function(req, res) {
  console.log("Got request for main page!");
  res.render('main');
});




//example room format: {1: {hasBlack: false, hasWhite: false, fill: 0}}
var rooms = {};

io.on('connection', function(socket) {
   var foundVacancy = false;

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

  socket.on('disconnect', function(){
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
