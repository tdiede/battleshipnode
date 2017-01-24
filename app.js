const express = require('express'),
      app = express(),
      http = require('http'),
      server = http.createServer(app),
      io = require('socket.io').listen(server);

const SOCKETS = {};
const PLAYERS = {};
PLAYERS['waiting'] = {};

const SHIPS = { "A": {code: "AAAAA", name: "carrier", length: 5, count: 1},
                "B": {code: "BBBB", name: "battleship", length: 4, count: 1},
                "C": {code: "CCC", name: "cruiser", length: 3, count: 1},
                "D": {code: "DD", name: "destroyer", length: 2, count: 1},
                "S": {code: "S", name: "submarine", length: 1, count: 1} };

const Game = require('./battleship.js').game;
const Player = require('./battleship.js').player;

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

    socket.on('disconnect', function() {
        console.log('Socket ' + socket.id + ' Disconnected...');
        delete SOCKETS[socket.id];
        io.emit('gameover');
    });

    // starting a new game
    socket.on('newgame', function(data) {
        const game = new Game();
        player = initializePlayer(socket,data.username,data.avatar);

        PLAYERS['waiting'][player.id] = player;
        console.log(PLAYERS);

        let playerCount = Object.keys(PLAYERS['waiting']).length;
        if (playerCount === 1) {
            io.emit('waiting', PLAYERS['waiting']);
        } else if (playerCount === 2) {
            game.initializeGame(PLAYERS['waiting']);
            PLAYERS['playing'] = PLAYERS['waiting'];
            io.emit('alert', PLAYERS['playing']);
            PLAYERS['waiting'] = {};
            console.log(PLAYERS);
        }

        console.log(game);
        setupShips({});
    });

    // // players place ships
    // socket.on('setup', function() {
    //     if (!('key' in game.players[playerID].playerShips)) {}
    // });

    socket.on('place', function(data) {
        game.grids[id].placeShip(data.ship,data.column,data.row,data.direction);
        console.log("Placing ship: " + data.ship, data.row, data.column, data.direction);
        setupShips(game.grids[id].playerShips);
    });

});


// broadcast updates to client
setInterval(() => io.emit('time', new Date().toTimeString()), 1000);


function assignSocket(socket) {
    socket.id = Math.random();
    SOCKETS[socket.id] = socket;
}

function initializePlayer(socket,username,avatar) {
    let id = Object.keys(PLAYERS['waiting']).length;
    let player = new Player(id,socket.id,username,avatar);
    return player;
}

function setupShips(playerShips) {
    var html = '';
    for (let key in SHIPS) {
        if (!(SHIPS[key] in playerShips))
            html += '<img class="ship-image" id="'+SHIPS[key].code+'" src="/'+SHIPS[key].name+'-'+SHIPS[key].length+'.png" /><p>'+SHIPS[key].name.toUpperCase()+': '+SHIPS[key].length+'</p>';
    }
    io.emit('ships', html);
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


// TODO: user authentication, ideally into database

