var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 8000;

app.use(express.static('public'));
// app.get('/', function(req, res) {
//   res.sendFile(__dirname + '/public/index.html');
//   console.log("Got request for homepage");
// });


var highest_used = 1;
var rooms = {1: {hasBlack: false, hasWhite: false, fill: 0}};

io.on('connection', function(socket) {
   var foundVacancy = false;

   for(var roomID in rooms) {
     if(rooms.hasOwnProperty(roomID)) {
       if (rooms[roomID]["fill"] == 1) {
         console.log("A client has joined room " + roomID);
         rooms[roomID]["fill"] += 1;
         foundVacancy = true;
         socket.join("room" + roomID);
         var color = rooms[roomID]["hasWhite"] ? "black" : "white";
         rooms[roomID]["hasWhite"] = true;
         rooms[roomID]["hasBlack"] = true;
         socket.emit('roomAssignment', {roomID: roomID, color: color, full: true});
         io.in("room" + roomID).emit('fullPresence', "dummy data"); //alert other player you've arrived
         socket.roomID = roomID;
         socket.color = color;
         break;
       }
     }
   }

   if(!foundVacancy) {
     for(var roomID in rooms) {
       if(rooms.hasOwnProperty(roomID)) {
         if (rooms[roomID]["fill"] == 0) {
           console.log("A client has joined room " + roomID);
           rooms[roomID]["fill"] += 1;
           foundVacancy = true;
           socket.join("room" + roomID);
           var color = "white";
           rooms[roomID]["hasWhite"] = true;
           socket.emit('roomAssignment', {roomID: roomID, color: color, full: false});
           socket.roomID = roomID;
           socket.color = color;
           break;
         }
       }
     }
   }

   if(!foundVacancy) {
     highest_used += 1;
     roomID = highest_used;
     console.log("A client has joined room " + roomID);
     rooms[roomID] = {hasBlack: false, hasWhite: true, fill: 1};
     foundVacancy = true;
     socket.join("room" + roomID);
     var color = "white";
     socket.emit('roomAssignment', {roomID: roomID, color: color, full: false});
     socket.roomID = roomID;
     socket.color = color;
   }
   //socket.emit('assign', next_id);
   socket.on('move', function(totalState){
     /* Remember, this could also be the reset button, so if reset on first move, don't
         be alarmed by undefined */
     console.log("Move made by " + socket.color + " in room " + socket.roomID);
     console.log("Move is: " + totalState.state.moves[totalState.state.moves.length - 1]);
     socket.broadcast.to("room" + socket.roomID).emit('oppMove', totalState);
  //   io.emit('chat message', msg);
   });
  socket.on('disconnect', function(){
    console.log('A client has disconnected from room ' + socket.roomID);
    rooms[socket.roomID]["fill"] -= 1;
    if(socket.color == "white") {
      rooms[socket.roomID]["hasWhite"] = false;
    }
    else {
      rooms[socket.roomID]["hasBlack"] = false;
    }
    io.in("room" + socket.roomID).emit('oppLeft', "dummy data");
    console.log(JSON.stringify(rooms, null, 4));
  });
  console.log(JSON.stringify(rooms, null, 4));
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
