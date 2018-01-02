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
var express = require('express');
var app = express();
var portNum = 8000;

// app.get('/', function(req, res) {
//   res.send("This is the root page");
// });

app.use(express.static('static_files'));

app.listen(portNum);
