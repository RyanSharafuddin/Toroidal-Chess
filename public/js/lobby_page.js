
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
  lobbyState.busy = true;
  console.log("Currently busy");
  lobbyState.showValid = $("#validMovesSlide").prop("checked");
  lobbyState.showThreat = $("#enemyThreatSlide").prop("checked");

  socket.emit('send_challenge', {nickname: nickname, showValid: lobbyState.showValid, showThreat: lobbyState.showThreat});
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

function receivedChallenge(challenge) {
  if(lobbyState.busy) {
    //emit busy tone & return
    socket.emit('busyTone', challenge.challenger);
    return;
  }
  var timeLeft = lobbyState.INVITE_TIME;
  var offerValid = challenge.showValid
  var offerThreat = challenge.showThreat;
  var offerValidStr = (offerValid) ? "Yes." : "No.";
  var offerThreatStr = (offerThreat) ? "Yes." : "No.";
  var challengeHTML = "<p>You have been challenged by '" + challenge.challenger + "'!<br>"
  challengeHTML += "<p style='text-align: center;margin:0px'><strong>Game Options</strong></p>"
  challengeHTML += "Show valid moves: " + offerValidStr;
  challengeHTML += "<br>Show enemy threats: " + offerThreatStr;
  challengeHTML += "<br><br>You have " + timeLeft + " seconds before the challenge times out.</p>";
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
      $.ajax({
        url: "gameStart",
        type: 'POST',
        data: {myName: lobbyState.myNickname,
          enemyName: challenge.challenger,
          roomNamer: "0",
          showValid: offerValidStr,
          showThreat: offerThreatStr},
        success: function(page) {
          //necessary to open document before write
          document.open();
          document.write(page);
        }
      });
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
    var challengeHTML = "<p>You have been challenged by '" + challenge.challenger + "'!<br>"
    challengeHTML += "<p style='text-align: center;margin:0px'><strong>Game Options</strong></p>"
    challengeHTML += "Show valid moves: " + offerValidStr;
    challengeHTML += "<br>Show enemy threats: " + offerThreatStr;
    challengeHTML += "<br><br>You have " + timeLeft + " seconds before the challenge times out.</p>";
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
  console.log(accepter + " has accepted your challenge!");
  socket.inLobby = false;
  $("#waitBox").dialog("close");
  clearInterval(lobbyState.closeInvitation);
  //make POST request
  //data that needs to be included: myName, enemyName, challenge parameters such as show moves, threats, time
  $.ajax({
    url: "gameStart",
    type: 'POST',
    data: {myName: lobbyState.myNickname,
      enemyName: accepter,
      roomNamer: "1",
      showValid: offerValidStr,
      showThreat: offerThreatStr},
    success: function(page) {
      document.open();
      document.write(page);
    }
  });
  lobbyState.busy = false;
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
//ways to leave the lobby - accept a challenge, or have your challenge accepted
