# Toroidal-Chess

## The Game
If you want an explanation of the game toroidal chess, go [here](https://toroidal-chess.herokuapp.com/rules).

## The Project
This project started when I wanted a way to play my cousin in toroidal chess
over the web. It allows users to log in, see who else is currently logged in,
and challenge them to games. When someone goes to the website, they see a log in
page. At this point, they choose a nickname to be used for that session of
browsing, and enter the lobby, where they can see who
else is online and challenge them to games. They can also configure settings for
their challenges, such as whether the board
should show valid moves or not. Also, once a user is playing a game with someone
else, they can chat with them.

## Run Locally
To run this project locally, clone the repo, and then navigate to the repo and
run "node app.js" from the command line. You will then be running a server, and
anyone who navigates to http://YOUR_IP_ADDRESS:8000 will connect and be able to
play games with other users who've connected.

## Technical Details

There are 4 different areas users can navigate to. They are:

### 1. The Login Page.

#### Files
  1. views/login.ejs
  2. public/js/login_page.js
  3. public/cs/login_page.css


Users are led to here when they first enter the site. From here, they can either
log in, or navigate to the detailed rules page.

### 2. The Rules Page.

#### Files
  1. views/rules.ejs
  2. public/css/rules_page.css

A simple static page that explains the rules of toroidal chess.

### 3. The Lobby

#### Files
  1. views/lobby.ejs
  2. public/css/lobby_page.css
  3. public/js/lobby_page.js
  4. public/js/socket_events.js
  5. public/js/eventInitializer.js
  5. public/js/prettyDialog.js

On this page, users can see who else is online, challenge them to games, and
configure settings for the challenges, like whether or not they want the
computer to show enemy threats/valid moves.

### 4. The Game Page.
  #### Files
   1. views/board.ejs
   2. public/css/board.css - display the buttons and positioning of the board.
   3. public/css/chessboard-0.3.0.css - An unaltered file from [chessboard.js.com](http://chessboardjs.com/)
   4. public/css/chat.css - display the chat
   5. public/css/sample.css - display the page in general
   6. public/js/board.js - controls the chat, enforcing legal moves, showing move options (if selected)
                          sending moves back and forth, and move history.
   7. public/js/chessboard-0.3.0.js - A file from [chessboard.js.com](http://chessboardjs.com/)
                                      It was altered to allow the board to scroll
                                      forward and back, like a torus. 

 This is where users are led after accepting a game challenge or having one of their challenges accepted. This page
 has 3 columns. In the left column, the move history is displayed. The middle column contains the board and
 associated buttons. The right column contains the chat messages.


## Built With
* HTML
* CSS
* [Javascript](https://www.javascript.com/)
* [Node.js](https://nodejs.org/en/) - Javascript runtime for server-side code.
* [Express](http://expressjs.com/) - The web framework used.
* [Socket.io](https://socket.io/) - A Javascript library for realtime communication between a client and the server.
* [jQuery](https://jquery.com/) - A Javascript library.
* [EJS](http://www.embeddedjs.com/getting_started.html) - The template engine for Express to create HTML pages.

## Ideas For The Future
Some ideas I have for the future, in no particular order
* Lobby chat
* User authentication, so people can have persistent accounts.
* Storing game data and data about who's online in a database such as MongoDB.
* Improving site appearance on smartphones.

## Authors

* **Ryan Sharafuddin**

## Thanks

* http://chessboardjs.com/     -for providing the files public/css/chessboard-0.3.0.css, and public/js/board.js.
                                A super useful API for including a chessboard on the page.
* http://www.cssportal.com     -for generating a sample HTML/CSS template that I used to structure the board page.
* http://cssbuttoncreator.com/ -for generating most of the CSS for the buttons on the website.
