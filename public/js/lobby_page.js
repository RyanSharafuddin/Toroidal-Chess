$( document ).ready(function() {
  var socket = io();
  var myNickname = $("#nickname").text();
  socket.emit('lobby', myNickname);

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
        $(this).dialog( "close" );
      }
    };
    var declineButton = {
      text: "Decline",
      click: function() {
        //emit that you've declined
        $(this).dialog( "close" );
      }
    };
    buttons.push(acceptButton);
    buttons.push(declineButton);
    console.log("You have been challenged by " + challenge.challenger);
    $("#challengeText").html("You have been challenged by '" + challenge.challenger + "'!")
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
    });
  });


});
