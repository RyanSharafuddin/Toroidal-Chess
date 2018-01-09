$( document ).ready(function() {
  var socket = io();
  var nickname = $("#nickname").text();
  socket.emit('lobby', nickname);
});
