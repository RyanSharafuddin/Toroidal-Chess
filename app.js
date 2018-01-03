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

io.on('connection', function(socket){
   console.log('A client has connected to the server');
   socket.on('move', function(moveString){
     console.log("Move made: " + moveString);
  //   io.emit('chat message', msg);
   });
  socket.on('disconnect', function(){
    console.log('A client has disconnected from the server');
  });
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
