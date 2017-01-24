"use strict";

const GRID = 10;
const SHIPS = { "A": {code: "AAAAA", name: "carrier", length: 5, count: 1},
                "B": {code: "BBBB", name: "battleship", length: 4, count: 1},
                "C": {code: "CCC", name: "cruiser", length: 3, count: 1},
                "D": {code: "DD", name: "destroyer", length: 2, count: 1},
                "S": {code: "S", name: "submarine", length: 1, count: 1} };

class Ship {
    constructor(player,shipCode) {
        this.player = player;
        this.shipCode = shipCode;
        this.placed = true;
        this.hits = 0;
        this.sunk = false;
    }

    recordHits() {
        this.hits++;
    }

    checkSunk() {
        if (this.hits === SHIPS[this.shipCode].length) {
            console.log("sunk");
            this.sunk = true;
            return true;
        } else {
            console.log("not yet sunk");
            return false;
        }
    }
}

class Grid {
    constructor(player) {
        this.player = player;
        this.matrix = [];
        this.playerShips = {};
        this.sunk = 0;
        this.win = false;
    }

    setupGrid() {
        for (var row = 0; row < GRID; row++) {
            this.matrix.push([]);
            for (var column = 0; column < GRID; column++) {
                this.matrix[row][column] = null;
            }
        }
    }

    clearGrid() {
        this.matrix = [];
        this.playerShips = {};
    }

    checkConstraints(x,y,d,l) {
        if (d === 'right' && x + l > GRID) {
            // check for edge of board
            return false;
        } else if (d === 'right') {
            // check for collisions with existing ships
            for (var i = 0; i < l; i++ ) {
                let location = this.matrix[y][x+i];
                if (location !== null) {
                    return false;
                }
            }
            return true;
        } else if (d === 'down' && y + l > GRID) {
            // check for edge of board
            return false;
        } else if (d === 'down') {
            // check for collisions with existing ships
            for (var i = 0; i < l; i++) {
                let location = this.matrix[y+i][x];
                if (location !== null) {
                    return false;
                }
            }
            return true;
        }
    }

    placeShip(ship,x,y,d) {
        let fits = this.checkConstraints(x,y,d,ship.length);
        if (fits === true) {
            let label = ship[0];
            // record ships on board
            if (d === 'right') {
                for (var l = 0; l < ship.length; l++ ) {
                    this.matrix[y][x+l] = label;
                }
            } else if (d === 'down') {
                for (var l = 0; l < ship.length; l++) {
                    this.matrix[y+l][x] = label;
                }
            }
            // create ship instance, add to playerShips object
            let placedShip = new Ship(this.playerNumber,label);
            this.playerShips[label] = placedShip;
        } else {
            alert("Ship does not fit. Please enter new parameters.");
        }
    }

    fireMissile(x,y) {
        let target = this.matrix[y][x];
        if (target === null) {
            console.log("miss xx");
            this.matrix[y][x] = "M";
        } else if (target === "M") {
            console.log("already missed xx");
        } else if (target === "H") {
            console.log("already hit !!");
        } else if (target !== null) {
            console.log(SHIPS[target].name.toUpperCase() + ": HIT!");
            // record number of hits on ship instance
            let hitShip = this.playerShips[target];
            hitShip.recordHits();
            // update playerShips object and matrix labels
            this.playerShips[target] = hitShip;
            this.matrix[y][x] = "H";
            // check if this hit sunk the ship
            let sunk = hitShip.checkSunk();
            if (sunk === true) {
                this.recordSunk();
                this.checkWin();
            }
        }
    }

    recordSunk() {
        this.sunk++;
    }

    checkWin() {
        let shipCount = Object.keys(this.playerShips).length;
        if (this.sunk === shipCount) {
            console.log("ALL YOUR SHIPS HAVE SUNK! BUMMER...");
        } else {
            this.getStatus();
        }
    }

    getStatus() {
        for (let [ship, data] of Object.entries(this.playerShips)) {
            console.log(ship,data.sunk);
        }
    }

};

class Player {
    constructor(id,socket,username,avatar) {
        this.id = id;
        this.socket = socket;
        this.username = username;
        this.avatar = avatar;
    }
    initData() {
        return {
            id: this.id,
            username: this.username,
            avatar: this.avatar
        };
    }
}


class Game {
    constructor(numPlayers) {
        this.numPlayers = 2;
        this.grids = {};
    }
    initializeGame(players) {
        for (var key in players) {
            let player = players[key];
            let grid = new Grid(player=player);
            grid.setupGrid();
            this.grids[players[key].id] = grid;
        }
    }
}


// EXPORTS class Game and class Player
module.exports = {game:Game,player:Player};




// TESTING THE GAME

// testSetup();
// testPlay();
// testWin();

// console.table(testGrid.matrix);

function testSetup() {
    let testGrid = new Grid(playerNumber=99);
    testGrid.clearGrid();
    testGrid.setupGrid();
    testGrid.placeShip(SHIPS.A,0,0,"right");
    testGrid.placeShip(SHIPS.B,0,9,"right");
    testGrid.placeShip(SHIPS.C,8,3,"down");
    testGrid.placeShip(SHIPS.D,8,6,"right");
    testGrid.placeShip(SHIPS.S,4,9,"right");
    console.table(testGrid.matrix);
}

function testPlay() {
    testGrid.fireMissile(4,9);
    testGrid.fireMissile(8,3);
    testGrid.fireMissile(8,4);
    testGrid.fireMissile(8,5);
    testGrid.fireMissile(8,6);
    testGrid.fireMissile(9,9);
}

function testWin() {
    // both S and C are sunk
    // sink A
    testGrid.fireMissile(0,0);
    testGrid.fireMissile(1,0);
    testGrid.fireMissile(2,0);
    testGrid.fireMissile(3,0);
    testGrid.fireMissile(4,0);
    // sink B
    testGrid.fireMissile(0,9);
    testGrid.fireMissile(1,9);
    testGrid.fireMissile(2,9);
    testGrid.fireMissile(3,9);
    // finish out D
    testGrid.fireMissile(9,6);
}
