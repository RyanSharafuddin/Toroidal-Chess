// var express = require('express');
// var app = express();
// app.use(express.static('public'));
// var http = require('http').Server(app);
// var port = 3000;
//
// http.listen(port, function() {
//     console.log('listening on *: ' + port);
// });
console.log("Running app.js");
var http = require('http');
var portNum = 3000;
var server = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'}); //200 status code means everything okay
  res.end("This is the plaintext for the response body");

  console.log("Got request and sent response");
  console.log("Request URL is " + req.url);
});

server.listen(portNum); //listens on port portNum
console.log("Now listening to port: " + portNum);
