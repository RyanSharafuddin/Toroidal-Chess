$( document ).ready(function() {
  var socket = io();
  var myNickname = $("#nickname").text();
  socket.emit('lobby', myNickname);
  const WAIT_TIME = 60; //how many seconds to wait for someone to reply to invitation
  /* how many seconds someone has to reply to an invitation.
  Should be slightly less than WAIT_TIME, to ensure this times out first */
  const INVITE_TIME = WAIT_TIME - 2;
  var closeInvitation;  //set up a 'global' variable for future use

  function addPlayer(nickname) {
      /* what the button HTML should come out to be in the end
      <li id='playerNICKNAME'><input type='button' id='playerNICKNAMEbutton' class='challengeButton' value='NICKNAME' /></li>
      */
      var buttonHTML = "<li id='player" + nickname + "'><input type='button' id='player" + nickname + "button'";
      buttonHTML += " class='challengeButton' value='" + nickname + "' /></li>";
      $("#playerList").append(buttonHTML);
      var buttonSelector = "#player" + nickname + "button";
      $(buttonSelector).on('click', function() {
        console.log("Challenged " + $(buttonSelector).attr("value") + "!");
        socket.emit('send_challenge', $(buttonSelector).attr("value"));
        //put up a waiting for response dialogue
        var timeLeft = WAIT_TIME;
        var waitHTML = "Waiting for a response from '" + nickname + "'."
        waitHTML += "<br> Will wait " + timeLeft + " more seconds.";
        $("#waitText").html(waitHTML);
        $(function() {
          /* Note: To figure out how to hide the x button, see this site:
          https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
          $("#waitBox").dialog({
            closeOnEscape: false,
            open: function(event, ui) {
              $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
            },
            modal: true,
            buttons: [],
            title: "Waiting . . ."
          });
          var decrementTime = function() {
            timeLeft -= 1;
            var waitHTML = "Waiting for a response from '" + nickname + "'."
            waitHTML += "<br> Will wait " + timeLeft + " more seconds.";
            $("#waitText").html(waitHTML);
            if(timeLeft == 0) {
              clearInterval(closeInvitation);
              $("#waitBox").dialog("close");
            }
          }
          closeInvitation = setInterval(decrementTime, 1000);
        });

      })
  }

  socket.on('lobby_enter', function(nickname) { //upon other people entering lobby
    addPlayer(nickname);
    console.log(nickname + " entered");
  });

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

  socket.on('lobby_leave', function(nickname) {
    console.log(nickname + " left");
    $("#player" + nickname).remove();
  });

  socket.on('challenged', function(challenge) {
    var buttons = [];
    var acceptButton = {
      text: "Accept",
      click: function() {
        //emit to challenger that you've accepted the challenge
        socket.emit('acceptChallenge', challenge.challenger);
        $(this).dialog( "close" );
      }
    };
    var declineButton = {
      text: "Decline",
      click: function() {
        //emit that you've declined
        socket.emit('declineChallenge', challenge.challenger);
        $(this).dialog( "close" );
      }
    };
    buttons.push(acceptButton);
    buttons.push(declineButton);
    var timeLeft = INVITE_TIME;
    var challengeHTML = "You have been challenged by '" + challenge.challenger + "'!"
    challengeHTML += "<br>You have " + timeLeft + " seconds before the challenge times out.";
    $("#challengeText").html(challengeHTML);
    $(function() {
      /* Note: To figure out how to hide the x button, see this site:
      https://stackoverflow.com/questions/896777/how-to-remove-close-button-on-the-jquery-ui-dialog */
      $("#challengeBox").dialog({
        closeOnEscape: false,
        open: function(event, ui) {
          $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
        },
        modal: true,
        buttons: buttons,
        title: "Challenge!"
      });
      var decrementTime = function() {
        timeLeft -= 1;
        var challengeHTML = "You have been challenged by '" + challenge.challenger + "'!"
        challengeHTML += "<br>You have " + timeLeft + " seconds before the challenge times out.";
        $("#challengeText").html(challengeHTML);
        if(timeLeft == 0) {
          clearInterval(closeInvitation);
          $("#challengeBox").dialog("close");
        }
      }
      var closeInvitation = setInterval(decrementTime, 1000);

    });
  });
  socket.on('challengeDeclined', function(nickname) {
    var buttons = [];
    var ok = {
      text: "OK",
      click: function() {
        $(this).dialog( "close" );
      }
    };
    buttons.push(ok);
    clearInterval(closeInvitation);
    $("#waitBox").dialog("close");
    $("#declineBox").text("'" + nickname + "'" + " has declined your challenge.");
    $("#declineBox").dialog({
      modal: true,
      buttons: buttons,
      title: "Declined"
    });
  });

});
