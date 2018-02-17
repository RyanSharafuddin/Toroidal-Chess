
  //to be used when someone enters the lobby
function addPlayer(nickname) {
    /* what the button HTML should come out to be in the end
    <li id='playerNICKNAME'><input type='button' id='playerNICKNAMEbutton' class='challengeButton' value='NICKNAME' /></li>
    */
    var buttonHTML = "<li id='player" + nickname + "'><input type='button' id='player" + nickname + "button'";
    buttonHTML += " class='challengeButton' value='" + nickname + "' /></li>";
    $("#playerList").append(buttonHTML);
    var buttonSelector = "#player" + nickname + "button";
    $(buttonSelector).on('click', function() {
      challengePlayer($(buttonSelector).attr("value"));
    });
}

//to be used when someone challenges player by clicking their button
function challengePlayer(nickname) {
  if(!validTime()) {
    prettyAlert("Cannot challenge", "You cannot challenge with invalid time parameters.", [OK_BUTTON], true, "failChallenge");
    return;
  }
  lobbyState.busy = true;
  console.log("Currently busy");
  lobbyState.showValid = $("#validMovesSlide").prop("checked");
  lobbyState.showThreat = $("#enemyThreatSlide").prop("checked");

  socket.emit('send_challenge', {nickname: nickname,
                                showValid: lobbyState.showValid,
                                showThreat: lobbyState.showThreat,
                                timed: $("#timedSlide").prop("checked"),
                                minutes: $("#minutes").val(),
                                bonus: $("#bonus").val()});
  //put up a waiting for response dialogue
  var timeLeft = lobbyState.WAIT_TIME;
  var waitHTML = "Waiting for a response from '" + nickname + "'."
  waitHTML += "<br> Will wait " + timeLeft + " more seconds.";
  $("#waitText").html(waitHTML);
  /* Note: To figure out how to hide the x button, see this site:
  https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
  $("#waitBox").dialog({
    closeOnEscape: false,
    open: function(event, ui) {
      $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
    },
    modal: true, //be careful when converting to pretty dialog function. The timer function needs to match up
    buttons: [],
    title: "Waiting . . ."
  });
  var decrementTime = function() {
    timeLeft -= 1;
    var waitHTML = "Waiting for a response from '" + nickname + "'."
    waitHTML += "<br> Will wait " + timeLeft + " more seconds.";
    $("#waitText").html(waitHTML);
    if(timeLeft == 0) {
      lobbyState.busy = false;
      console.log("Free again");
      clearInterval(lobbyState.closeInvitation);
      $("#waitBox").dialog("close");
    }
  }
  lobbyState.closeInvitation = setInterval(decrementTime, 1000);
}

function displayOnlinePlayers(onlinePlayers) {
  console.log("Players already here: ")
  console.log(JSON.stringify(onlinePlayers, null, 4));
  for(var player in onlinePlayers) {
    if(onlinePlayers.hasOwnProperty(player)) {
      if(onlinePlayers[player]["inLobby"] && (player != lobbyState.myNickname)) {
        addPlayer(player);
      }
    }
  }
}

function otherPlayerLeft(nickname) {
  console.log(nickname + " left");
  $("#player" + nickname).remove();
}

function makeChallengeHTML(challenge, timeLeft) {
  console.log("Making challengeHTML! First, printing out challenge object");
  console.log(JSON.stringify(challenge));
  console.log("typeof challenge.timed is " + typeof(challenge.timed));
  var offerValid = challenge.showValid
  var offerThreat = challenge.showThreat;
  var offerValidStr = (offerValid) ? "Yes." : "No.";
  var offerThreatStr = (offerThreat) ? "Yes." : "No.";
  var challengeHTML = "<p>You have been challenged by '" + challenge.challenger + "'!<br>" +
                      "<p style='text-align: center;margin:0px'><strong>Game Options</strong></p>" +
                      "Show valid moves: " + offerValidStr +
                      "<br>Show enemy threats: " + offerThreatStr +
                      ((challenge.timed) ? ("") : ("<br>Timed: No.")) +
                      ((challenge.timed) ? ("<br>Time: " + challenge.minutes  + " minute" + ((challenge.minutes == 1) ? "" : "s") + ".<br>Bonus: " + challenge.bonus + " second" + ((challenge.bonus == 1) ? "" : "s") + ".") : "") +
                      "<br><br>You have " + timeLeft + " seconds before the challenge times out.</p>";
  console.log(challengeHTML);
  return challengeHTML;
}

function receivedChallenge(challenge) {
  if(lobbyState.busy) {
    //emit busy tone & return
    socket.emit('busyTone', challenge.challenger);
    return;
  }

  var timeLeft = lobbyState.INVITE_TIME;
  var challengeHTML = makeChallengeHTML(challenge, timeLeft);
  console.log(challengeHTML);
  lobbyState.busy = true;
  console.log("busy now");
  var buttons = [];
  var acceptButton = {
    text: "Accept",
    click: function() {
      clearInterval(lobbyState.closeInvitation);
      socket.inLobby = false;
      $(this).dialog( "close" );
      //emit to challenger that you've accepted the challenge
      socket.emit('acceptChallenge', challenge.challenger);
      //make POST request
      var timed = challenge.timed;
      var minutes = challenge.minutes;
      var seconds = challenge.bonus;
      var offerValidStr = (challenge.showValid) ? "Yes" : "No";
      var offerThreatStr = (challenge.showThreat) ? "Yes" : "No";
      challengeStartAJAX(challenge.challenger, "0", offerValidStr, offerThreatStr, timed, minutes, seconds);
      console.log("Have accepted the challenge!");
      lobbyState.busy = false;
    }
  };
  var declineButton = {
    text: "Decline",
    click: function() {
      clearInterval(lobbyState.closeInvitation);
      //emit that you've declined
      socket.emit('declineChallenge', challenge.challenger);
      lobbyState.busy = false;
      console.log("Free again");
      $(this).dialog( "close" );
    }
  };
  buttons.push(acceptButton);
  buttons.push(declineButton);
  $("#challengeText").text(challengeHTML);
  /* Note: To figure out how to hide the x button, see this site:
  https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
  $("#challengeBox").dialog({
    closeOnEscape: false,
    open: function(event, ui) {
      $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
    },
    modal: true, //ditto from above
    buttons: buttons,
    title: "Challenge!"
  });
  var decrementTime = function() {
    timeLeft -= 1;
    var challengeHTML = makeChallengeHTML(challenge, timeLeft);
    $("#challengeText").html(challengeHTML);
    if(timeLeft == 0) {
      clearInterval(lobbyState.closeInvitation);
      lobbyState.busy = false;
      console.log("Free again");
      $("#challengeBox").dialog("close");
    }
  }
  lobbyState.closeInvitation = setInterval(decrementTime, 1000);
}

function myChallengeDeclined(decliner) {
 clearInterval(lobbyState.closeInvitation);
 $("#waitBox").dialog("close"); //necessary
 var reasonStr = (decliner.reason == "busy") ? " is currently busy deciding on another invitation." : " has declined your challenge.";
 prettyAlert("Declined", "'" + decliner.name + "'" + reasonStr, [OK_BUTTON], false, "challengeDeclined");
 lobbyState.busy = false;
 console.log("Free again");
}

function myChallengeAccepted(accepter) {
  var offerValidStr = (lobbyState.showValid) ? "Yes." : "No.";
  var offerThreatStr = (lobbyState.showThreat) ? "Yes." : "No.";
  var timed = ($("#timedSlide").prop("checked")) ? "1" : "0";
  var minutes = $("#minutes").val();
  var seconds = $("#bonus").val();
  console.log(accepter + " has accepted your challenge!");
  socket.inLobby = false;
  $("#waitBox").dialog("close");
  clearInterval(lobbyState.closeInvitation);
  //make POST request
  //data that needs to be included: myName, enemyName, challenge parameters such as show moves, threats, time
  challengeStartAJAX(accepter, "1", offerValidStr, offerThreatStr, timed, minutes, seconds);
  lobbyState.busy = false;
}

function validateMinutes() {
  var re = /^[0-9]*$/;
  var val = $("#minutes").val();
  console.log("minutes val is '" + val +"'");
  console.log("Regex test is " + re.test(val));
  if(!(re.test(val) && val > 0 && val <= 120)) {
    $("#minutes").css("background", "#e35152");
    prettyAlert("Invalid Time", "The amount of time must be an integer between 1 and 120, inclusive.", [OK_BUTTON], true, "minutesValidator");
    return false;
  }
  else {
    $("#minutes").css("background", "#ffffff");
    if(val == 1) {
      $("#minutesPar").text("minute");
    }
    else {
      $("#minutesPar").text("minutes");
    }
    return true;
  }
}

function validateBonus() {
  var re = /^[0-9]*$/;
  var val = $("#bonus").val();
  if(!(re.test(val) && val >= 0 && val <= 60)) {
    $("#bonus").css("background", "#e35152");
    prettyAlert("Invalid Bonus", "The bonus must be an integer between 0 and 60, inclusive.", [OK_BUTTON], true, "bonusValidator");
    return false;
  }
  else {
    $("#bonus").css("background", "#ffffff");
    if(val == 1) {
      $("#bonusPar").text("second");
    }
    else {
      $("#bonusPar").text("seconds");
    }
    return true;
  }
}

function validTime() {
  return  (!($("#timedSlide").prop("checked")) || (validateMinutes() && validateBonus()));
}

//roomNamer is either string "1" or "0"
//ditto timed
function challengeStartAJAX(enemyName, roomNamer, offerValidStr, offerThreatStr, timed, minutes, seconds) {
  $.ajax({
    url: "gameStart",
    type: 'POST',
    data: {
      myName: lobbyState.myNickname,
      enemyName: enemyName,
      roomNamer: roomNamer,
      showValid: offerValidStr,
      showThreat: offerThreatStr,
      timed: timed,
      minutes: minutes,
      seconds: seconds
    },
    success: function(page) {
      document.open();
      document.write(page);
    }
  });
}

//main
lobbyState = {
  myNickname: $("#nickname").text(),
  showValid: false,
  showThreat: false,
  WAIT_TIME: 60,
  INVITE_TIME: 58,
  closeInvitation: undefined,
  busy: false
}
var CHAT_NAME = lobbyState.myNickname;
//https://github.com/davidmerfield/randomColor
var CHAT_COLOR = (CHAT_COLOR === undefined) ? randomColor({alpha: 1, luminosity: "bright"}) : CHAT_COLOR;
initSocketEvents("lobby_page.js", initLobbyEvents);
socket.emit('lobby', lobbyState.myNickname);
socket.inLobby = true;
$("#timedSlide").on("click", function() {
  if($("#timedSlide").prop("checked")) {
    $("#timeOptionsContainer").css("visibility", "visible");
  }
  else {
    //remove them
    $("#timeOptionsContainer").css("visibility", "hidden");
  }
});
//ways to leave the lobby - accept a challenge, or have your challenge accepted
