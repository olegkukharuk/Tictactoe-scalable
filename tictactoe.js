'use strict'

function Tictactoe (params) {
    this.bot = (params.bot === true) ? true : false;
    this.grid = params.grid;
    this.container = document.querySelectorAll(params.selector)[0];
    this.combinationNum = params.combinationNum;
    this.utmostCombinationPosition = this.grid - this.combinationNum + 1;
    this.players = ['X', 'O'];
    this.player = this.players[0];
    this.scoresObj = {};
    for (var i = 0; i < this.players.length; i++) {
        this.scoresObj[ this.players[ i ] ] = 0;
    }


    if (! this.container )
        alert('Not a valid selector');
    else if (this.grid < 3 || this.grid > 10)
        alert('Not a valid value: the size of the playing field');
    else if (this.combinationNum > this.grid || this.combinationNum < 3)
        alert('Not a valid value: the number of cells to win');
    else if (this.player !== this.players[0] && this.player !== this.players[1])
        alert('Not a valid value: must be only "' + this.players[0] + '" or "' + this.players[0] + '"');


    this.buildPlayground = function () {
        var scoresBox = document.createElement('div');
        scoresBox.setAttribute('class', 'scores');
        for (var i = 0; i < this.players.length; i++) {
            var scoresPlayerBox = document.createElement('div');
            scoresPlayerBox.setAttribute('class', 'player');
            scoresPlayerBox.innerHTML = 'Player ' + this.players[ i ] + ': ';
            scoresBox.appendChild(scoresPlayerBox);
            var scoresPlayerCounter = document.createElement('span');
            scoresPlayerCounter.setAttribute('id', 'scoresOfPlayer' + this.players[ i ]);
            scoresPlayerCounter.innerHTML = this.scoresObj[ this.players[ i ] ] ;
            scoresPlayerBox.appendChild(scoresPlayerCounter);
        }
        this.container.appendChild(scoresBox);
        for (var rowIndex = 1; rowIndex <= this.grid; rowIndex++) {
            var rowItem = document.createElement('div');
            rowItem.setAttribute('class', 'row');
            for (var cellIndex = 1; cellIndex <= this.grid; cellIndex++) {
                this.playgroundObj['available'].push(rowIndex + 'x' + cellIndex);
                var cellItem = document.createElement('div');
                if (cellItem.addEventListener) {
                    cellItem.addEventListener('click', this.clickHandler);
                } else if (cellItem.attachEvent)  {
                    cellItem.attachEvent('onclick', this.clickHandler);
                }
                cellItem.setAttribute('class', 'cell');
                cellItem.setAttribute('id', rowIndex + 'x' + cellIndex);
                cellItem.setAttribute('data-row', rowIndex);
                cellItem.setAttribute('data-cell', cellIndex);
                rowItem.appendChild(cellItem);
            }
            this.container.appendChild(rowItem);
        }

    };


    this.clickHandler = function () {
        var parent = TictatoeClickHelper();
        parent.step(parent.player , this.id);
        if (parent.bot === true) {
            parent.actionOfBot();
        } else {
            parent.player = (parent.player === parent.players[0]) ? parent.players[1] : parent.players[0] ;
        }
    };


    this.actionOfBot = function () {
        var player = this.players[1];
        var availableCells = this.playgroundObj['available'];
        var limit = availableCells.length;
        var randomValue = Math.floor((Math.random() * limit) + 1);
        return this.step(player, availableCells[randomValue]);
    };


    this.step = function (player, cellId) {
        var element = document.getElementById( cellId );
        if (element.removeEventListener) {
            element.removeEventListener('click', this.clickHandler);
        } else if (element.detachEvent)  {
            element.detachEvent('onclick', this.clickHandler);
        }
        this.playgroundObj['available'].splice(this.playgroundObj['available'].indexOf(cellId), 1);
        element.innerHTML = player;
        element.className += ' -closed' ;
        this.playgroundObj[ player ].push({
            id: element.id,
            row: element.getAttribute('data-row'),
            cell: element.getAttribute('data-cell')
        });
        return this.checking( player );
    };


    this.checking = function (player) {
        var parent = this;
        var win = false;
        var directions = ['horizontal', 'vertical', 'diagonalUp', 'diagonalDown'];
        parent.playgroundObj[ player ].forEach(function (item, index) {
            for (var i = 0; i < directions.length; i++) {
                var startCells = parent.startCells[ directions[i] ](item, parent.utmostCombinationPosition);
                if (startCells) {
                    var cells = parent.featuredCells.get(directions[i], item, parent.combinationNum);
                    if (parent.checkCombination(cells, player)) {
                        i = directions.length;
                        cells[ item.id ] = true;
                        parent.win(cells, player);
                        return false;
                    }
                }
            }
        });
        return true;
    };


    this.startCells = {
        horizontal: function (cellsObj, utmostCombinationPosition) {
            return (parseInt(cellsObj.cell, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        },
        vertical: function (cellsObj, utmostCombinationPosition) {
            return (parseInt(cellsObj.row, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        },
        diagonalUp: function (cellsObj, utmostCombinationPosition) {
            return (parseInt(cellsObj.row, 10) >= utmostCombinationPosition && parseInt(cellsObj.cell, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        },
        diagonalDown: function (cellsObj, utmostCombinationPosition) {
            return (parseInt(cellsObj.row, 10) <= utmostCombinationPosition && parseInt(cellsObj.cell, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        }
    };


    this.featuredCells = {
        horizontal: function (cellsObj, index) {
            return cellsObj.row + 'x' + (parseInt(cellsObj.cell, 10) + index);
        },
        vertical: function (cellsObj, index) {
            return (parseInt(cellsObj.row, 10) + index) + 'x' + cellsObj.cell;
        },
        diagonalUp: function (cellsObj, index) {
            return (parseInt(cellsObj.row, 10) - index) + 'x' + (parseInt(cellsObj.cell, 10) + index);
        },
        diagonalDown: function (cellsObj, index) {
            return (parseInt(cellsObj.row, 10) + index) + 'x' + (parseInt(cellsObj.cell, 10) + index);
        },
        get: function (direction, cellsObj, combinationNum) {
            var featuredItems = {};
            for (var i = 1; i < combinationNum; i++) {
                featuredItems[ this[direction](cellsObj, i) ] = true;
            }
            return featuredItems;
        }
    };


    this.checkCombination = function (cellsObj, player) {
        var count = 1;
        this.playgroundObj[ player ].forEach(function (item, i) {
            if(cellsObj[ item.id ] === true) {
                count++;
            }
        });
        return count >= this.combinationNum;
    };


    this.win = function (cellsObj, player) {
        var index = 0;
        for (var key  in cellsObj) {
            document.getElementById( key ).className += ' -win';
            index++;
        }
        for (var i = 0; i < this.playgroundObj['available'].length; i++) {
            document.getElementById( this.playgroundObj['available'][ i ] ).className += ' -closed' ;
        }
        this.updateScores(player);
        var parent = this;
        setTimeout(function() {
            if ( confirm('Do you want to start a new game?') ) {
                parent.newGame();
            }
        }, 1000);
    };


    this.updateScores = function (player) {
        var newValue = this.scoresObj[player] + 1;
        this.scoresObj[player] = newValue;
        document.getElementById('scoresOfPlayer' + player).innerHTML = newValue;
    };


    this.newGame = function () {
        this.container.innerHTML = '';
        this.playgroundObj = {
            'available': []
        };
        for (var i = 0; i < this.players.length; i++) {
            this.playgroundObj[ this.players[ i ] ] = [];
        }
        this.buildPlayground();
    };


    return this.newGame();
}


// Run
var TictactoeGame = new Tictactoe({
    selector: '#tictactoe',
    grid: 5,
    combinationNum: 5,
    bot: true
});

// Attach Click Helper
var TictatoeClickHelper = function () {
    return TictactoeGame; // TictactoeGame – is must be name of variable with game
};
