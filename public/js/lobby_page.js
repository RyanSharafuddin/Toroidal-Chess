function onLoad() {
  if(loaded) {
    return;
  }
  loaded = true;
  var socket = io();
  var myNickname = $("#nickname").text();
  socket.emit('lobby', myNickname);

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
    busy = true;
    console.log("Currently busy");
    showValid = $("#validMovesSlide").prop("checked");
    showThreat = $("#enemyThreatSlide").prop("checked");

    socket.emit('send_challenge', {nickname: nickname, showValid: showValid, showThreat: showThreat});
    //put up a waiting for response dialogue
    var timeLeft = WAIT_TIME;
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
        busy = false;
        console.log("Free again");
        clearInterval(closeInvitation);
        $("#waitBox").dialog("close");
      }
    }
    closeInvitation = setInterval(decrementTime, 1000);
  }

  socket.on('lobby_enter', function(nickname) { //upon other people entering lobby
    addPlayer(nickname);
    console.log(nickname + " entered");
  });

  //when first enter lobby, find out who's here
  socket.on('currentNicks', function(onlinePlayers) {
    console.log("Players already here: ")
    console.log(JSON.stringify(onlinePlayers, null, 4));
    for(var player in onlinePlayers) {
      if(onlinePlayers.hasOwnProperty(player)) {
        if(onlinePlayers[player]["inLobby"] && (player != myNickname)) {
          addPlayer(player);
        }
      }
    }
  });
  //when other people leave the lobby
  socket.on('lobby_leave', function(nickname) {
    console.log(nickname + " left");
    $("#player" + nickname).remove();
  });

  socket.on('challenged', function(challenge) {
    if(busy) {
      //emit busy tone & return
      socket.emit('busyTone', challenge.challenger);
      return;
    }
    var timeLeft = INVITE_TIME;
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
    busy = true;
    console.log("busy now");
    var buttons = [];
    var acceptButton = {
      text: "Accept",
      click: function() {
        clearInterval(closeInvitation);
        $(this).dialog( "close" );
        //emit to challenger that you've accepted the challenge
        socket.emit('acceptChallenge', challenge.challenger);
        //make POST request
        $.ajax({
          url: "gameStart",
          type: 'POST',
          data: {myName: myNickname,
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
        busy = false;
      }
    };
    var declineButton = {
      text: "Decline",
      click: function() {
        clearInterval(closeInvitation);
        //emit that you've declined
        socket.emit('declineChallenge', challenge.challenger);
        busy = false;
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
        clearInterval(closeInvitation);
        busy = false;
        console.log("Free again");
        $("#challengeBox").dialog("close");
      }
    }
    closeInvitation = setInterval(decrementTime, 1000);
  });

  socket.on('challengeDeclined', function(decliner) {
    clearInterval(closeInvitation);
    $("#waitBox").dialog("close"); //necessary
    var reasonStr = (decliner.reason == "busy") ? " is currently busy deciding on another invitation." : " has declined your challenge.";
    prettyAlert("Declined", "'" + decliner.name + "'" + reasonStr, [OK_BUTTON], false, "challengeDeclined");
    busy = false;
    console.log("Free again");
  });

  socket.on('challengeAccepted', function(accepter) {
    var offerValidStr = (showValid) ? "Yes." : "No.";
    var offerThreatStr = (showThreat) ? "Yes." : "No.";
    console.log(accepter + " has accepted your challenge!");
    $("#waitBox").dialog("close");
    clearInterval(closeInvitation);
    //make POST request
    //data that needs to be included: myName, enemyName, challenge parameters such as show moves, threats, time
    $.ajax({
      url: "gameStart",
      type: 'POST',
      data: {myName: myNickname,
        enemyName: accepter,
        roomNamer: "1",
        showValid: offerValidStr,
        showThreat: offerThreatStr},
      success: function(page) {
        document.open();
        document.write(page);
      }
    });
    busy = false;
  });

  socket.on('disconnect', function() {
    prettyAlert("Connection Lost", "FROM LOBBY The connection has been lost. " //TODO erase FROM BOARD
        + " Sorry about that! You should return to the <a href='https://toroidal-chess.herokuapp.com/'>login page</a>. "
        + "This could just be bad luck. However, if it keeps happening, "
        + " it is probably a bug.", [OK_BUTTON], true, "disconnect");
  });

  socket.on('nameNotFound', function() {
    prettyAlert("Error", "There has been some sort of error. The server does not recognize this nickname "
   + "as being logged in. You should return to the <a href='https://toroidal-chess.herokuapp.com/'> login page</a>"
  + ". This could just be bad luck, but if this keeps happening, it is probably some sort of bug.", [OK_BUTTON], true, "nameNotFound");
  });
}

var showValid;
var showThreat; //global variables to be set everytime you challenge someone
var loaded = false;
var WAIT_TIME = 60; //how many seconds to wait for someone to reply to invitation
/* how many seconds someone has to reply to an invitation.
Should be slightly less than WAIT_TIME, to ensure this times out first */
var INVITE_TIME = WAIT_TIME - 2;
var closeInvitation;  //set up a 'global' variable for future use
var busy = false; //waiting on invitation or have standing invitation
// $( document ).ready(function() { //don't need document.ready b/c script at bottom
//   onLoad();
// });
onLoad();
