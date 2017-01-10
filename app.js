const express = require('express'),
      app = express(),
      http = require('http'),
      server = http.createServer(app),
      io = require('socket.io').listen(server);

const SOCKETS = {};
const PLAYERS = {};

const SHIPS = { "A": {code: "AAAAA", name: "carrier", length: 5, count: 1},
                "B": {code: "BBBB", name: "battleship", length: 4, count: 1},
                "C": {code: "CCC", name: "cruiser", length: 3, count: 1},
                "D": {code: "DD", name: "destroyer", length: 2, count: 1},
                "S": {code: "S", name: "submarine", length: 1, count: 1} };

const Game = require('./battleship.js');
const numPlayers = 2;

app.set('port', (process.env.PORT || 5000));

// public is directory for all static files
app.use(express.static(__dirname + '/public'));
// views is directory for all template files
app.set('views', __dirname + '/views');
// set the view engine to ejs
app.set('view engine', 'ejs');

// index page
app.get('/', function(request, response) {
    response.render('pages/index');
});

// about page 
app.get('/game', function(request, response) {
    response.render('pages/game');
});

// listens on port, already set
server.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

// handle socket connections
io.on('connection', function(socket) {
    console.log('Socket Connected...');
    assignSocket(socket);

    const game = new Game(numPlayers);
    game.startGame();

    socket.on('disconnect', function() {
        console.log('Socket ' + socket.id + ' Disconnected...');
        delete SOCKETS[socket.id];
        io.emit('gameover');
    });

    socket.on('newgame', function(data) {
        let playerCount = Object.keys(PLAYERS).length;
        PLAYERS[socket.id] = {
            userid: playerCount,
            username: data.username};
        if (playerCount === 1) {
            io.emit('waiting');
        } else if (playerCount === 2) {
            io.emit('alert');
        }
    });

    socket.on('setup', function() {
        let playerID = PLAYERS[socket.id].userid;
        var html = '';
        for (let key in SHIPS) {
            if (!('key' in game.players[playerID].playerShips)) {
                html += '<img class="ship-image" id="'+SHIPS[key].code+'" src="/'+SHIPS[key].name+'-'+SHIPS[key].length+'.png" /><p>'+SHIPS[key].name.toUpperCase()+': '+SHIPS[key].length+'</p>';
            }
        }
        io.emit('refresh', html);
    });

    socket.on('place', function(data) {
        let playerID = PLAYERS[socket.id].userid;
        game.players[playerID].placeShip(data.ship,data.column,data.row,data.direction);
        console.log("Placing ship: " + data.ship, data.row, data.column, data.direction);
    });

});


// broadcast updates to client
setInterval(() => io.emit('time', new Date().toTimeString()), 1000);


function assignSocket(socket) {
    socket.id = Math.random();
    SOCKETS[socket.id] = socket;
    console.log(socket.id);
}





// function awesome() {
//     ctx.font = '30px Impact';
//     ctx.rotate(.1);
//     ctx.fillText("Awesome!", 50, 100);

//     let textMeasure = ctx.measureText('Awesome!');
//     ctx.strokeStyle = 'rgba(0,0,0,0.5)';
//     ctx.beginPath();
//     ctx.lineTo(50, 102);
//     ctx.lineTo(50 + textMeasure.width, 102);
//     ctx.stroke();
// }
