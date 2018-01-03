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
var num_users = 0;

io.on('connection', function(socket){
   console.log('A client has connected to the server');
   num_users += 1;
   console.log("There are " + num_users + " users");
   socket.emit('assign', num_users);
   socket.on('move', function(totalState){
     console.log("Move made: " + totalState.moveString);
     socket.broadcast.emit('oppMove', totalState);
  //   io.emit('chat message', msg);
   });
  socket.on('disconnect', function(){
    console.log('A client has disconnected from the server');
    num_users -= 1;
    console.log("There are " + num_users + " users");
  });
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
