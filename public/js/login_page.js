//use this to make a socket to check if nickname is unique
$( document ).ready(function() {
  if($("#not_unique").length > 0) { //if the number of elements with id "not_unique" is > 0
    alert("Sorry, that nickname is currently taken. Please choose a unique nickname.");
  }
});
