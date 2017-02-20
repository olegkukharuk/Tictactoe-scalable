'use strict'


function Tictactoe (params) {
    this.bot = (params.bot === true) ? true : false;    //
    this.grid = params.grid;    // Размер поля (сетка)
    this.container = document.querySelectorAll(params.selector)[0]; // HTML-Контейнер для игры
    this.combinationNum = params.combinationNum;    // Кол-во ячеек, чтоб собрать комбинацию
    this.utmostCombinationPosition = this.grid - this.combinationNum + 1;   // Максимальное положение ячейки, которая может быть начальной для комбинации
    this.players = ['X', 'O'];
    this.player = this.players[0];
    this.scoresObj = {};    // Объект, в котором ведется счет игры
    for (var i = 0; i < this.players.length; i++) {
        this.scoresObj[ this.players[ i ] ] = 0;    // Наполняем объект игроками
    }


    if (! this.container )  // Проверка на корректность селектора
        alert('Not a valid selector');
    else if (this.grid < 3 || this.grid > 10)   // Проверка: размер поля должен быть не менее 3 и не более 10 ячеек
        alert('Not a valid value: the size of the playing field');
    else if (this.combinationNum > this.grid || this.combinationNum < 3)    // Проверка: кол-во ячеек в комбинации должно быть не менее 3 не должно превышать размер поли
        alert('Not a valid value: the number of cells to win');


    // Постройка игрового поля
    this.buildPlayground = function () {
        // Блок счета игры
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

        // Сетка/Игровое поле
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


    // Обработчик кликов от пользователя
    this.clickHandler = function () {
        // Поскольку мы внутри функции, которая обрабатывает клик –  this = объект, по которому был клик, потому при помощи внешней ф-ции мы получаем ссылку в корень ф-ции с игрой.
        var parent = TictatoeClickHelper();

        // Отправляем пользователя и выбранную ячейку для дальнейшей обработки
        parent.step(parent.player , this.id);

        if (parent.bot === true) {
            // Если режим игры с ботом – тогда после выполнения действия пользователем, бот выполняет свое действие
            parent.actionOfBot();
        } else {
            // Если два пользователя играют т.е. бот выключен – активный игрок меняется. Возможно, в интерфейсе стоило отразить, кто делает ход.
            parent.player = (parent.player === parent.players[0]) ? parent.players[1] : parent.players[0] ;
        }
    };


    // Действия бота
    this.actionOfBot = function () {
        var player = this.players[1];

        // Массив с перечнем свободных ячеек
        var availableCells = this.playgroundObj['available'];

        // Кол-во свободных ячеек
        var limit = availableCells.length;

        // Случайно выбираем одну ячейку из свободных
        var randomValue = Math.floor((Math.random() * limit) + 1);

        // Отправляем пользователя и выбранную ячейку для дальнейшей обработки
        this.step(player, availableCells[randomValue]);
    };


    // Общие операции для бота и пользователя при выборе ячейки
    this.step = function (player, cellId) {
        // Ячейка по которой был клик
        var element = document.getElementById( cellId );

        // Удаляем обработчик клика с занятой ячейки
        if (element.removeEventListener) {
            element.removeEventListener('click', this.clickHandler);
        } else if (element.detachEvent)  {
            element.detachEvent('onclick', this.clickHandler);
        }

        // Удаляем ячейку из списка свободных ячеек
        this.playgroundObj['available'].splice(this.playgroundObj['available'].indexOf(cellId), 1);

        // Записываем в ячейку Х/О
        element.innerHTML = player;

        // Добавляем ячейке CSS-класс, который визуально обозначает, что она не доступна
        element.className += ' -closed' ;

        // Закрепляем эту ячейку за пользователем, который ее выбрал
        this.playgroundObj[ player ].push({
            id: element.id,
            row: element.getAttribute('data-row'),
            cell: element.getAttribute('data-cell')
        });

        // Выполняем проверку на наличие победных комбинаций за пользователем, который сделал ход
        return this.checking( player );
    };


    // Проверка на наличие победных комбинаций
    this.checking = function (player) {
        // Ниже forEach, внутри которого this имеет свое значение, потому заранее заботимся об этом
        var parent = this;

        // Возможные направления для комбинаций
        var directions = ['horizontal', 'vertical', 'diagonalUp', 'diagonalDown'];

        // Перебираем в цикле все ячейки, которые занял игрок
        parent.playgroundObj[ player ].forEach(function (item, index) {
            // Перебор ячеек по направлениям
            for (var i = 0; i < directions.length; i++) {
                // Из ячеек закрепленных за пользователем выбираем те, которые могут начинать комбинацию
                var startCells = parent.startCells[ directions[i] ](item, parent.utmostCombinationPosition);
                if (startCells) {
                    // Ганерация ячеек, которые должны продолжить комбинацию
                    var cells = parent.featuredCells.get(directions[i], item, parent.combinationNum);

                    // Выполняем проверку на наличие комбинации, которую сгенерировали и если проверка оказалась успешной...
                    if (parent.checkCombination(cells, player)) {
                        i = directions.length;  // Останавливаем цикл
                        cells[ item.id ] = true;    // Добавляем стартовую ячейку к объекту с перспективными ячейками
                        parent.win(cells, player);  // Объявляем победу
                        return false;   // Останавливаем выполнение ф-ции
                    }
                }
            }
        });
        if (parent.playgroundObj['available'].length === 0) {
            // Если все ячейки заняты и не нашлось победителя
            alert('Game over!');
            return false;
        }
        return true;
    };


    // Выбор ячеек, которые могут начинать комбинацию
    this.startCells = {
        horizontal: function (cellsObj, utmostCombinationPosition) {
            // Выбор ячеек, которые могут начинать горизонтальные комбинации
            return (parseInt(cellsObj.cell, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        },
        vertical: function (cellsObj, utmostCombinationPosition) {
            // Выбор ячеек, которые могут начинать вертикальные комбинации
            return (parseInt(cellsObj.row, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        },
        diagonalUp: function (cellsObj, utmostCombinationPosition) {
            // Выбор ячеек, которые могут начинать комбинации по диагонали направо вверх
            return (parseInt(cellsObj.row, 10) >= utmostCombinationPosition && parseInt(cellsObj.cell, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        },
        diagonalDown: function (cellsObj, utmostCombinationPosition) {
            // Выбор ячеек, которые могут начинать комбинации по диагонали направо вниз
            return (parseInt(cellsObj.row, 10) <= utmostCombinationPosition && parseInt(cellsObj.cell, 10) <= utmostCombinationPosition) ? cellsObj : false ;
        }
    };


    // Рассчет ячеек, которые могут продолжить комбинацию
    this.featuredCells = {
        // Внутри каждого направления "паттерн" для генерации имен "перспективных" ячеек по этому направлению
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
            // Объект для результатов
            var featuredItems = {};

            // В цикле генерируем кол-во ячеек, чтоб собрать комбинацию (минус стартовая ячейка)
            for (var index = 1; index < combinationNum; index++) {
                // Записываем в объект "перспективные" ячейки, где ID ячейки – это ключ, а true – значение
                featuredItems[ this[direction](cellsObj, index) ] = true;
            }
            return featuredItems;
        }
    };


    // Проверка комбинации на корректность
    this.checkCombination = function (cellsObj, player) {
        // Чтоб собрать комбинацию у нас уже есть одна ячейка – стартовая
        var count = 1;

        // Перебираем в цикле ячейки, которые занял игрок
        this.playgroundObj[ player ].forEach(function (item, i) {
            // Сравниваем ячейку занятую пользователем с ячейкой из перечня "перспективных"
            if(cellsObj[ item.id ] === true) {
                // Если совпадает – добавляем ячейку в счетчик комбинации
                count++;
            }
        });
        // Если комбинация собрана – true
        return count >= this.combinationNum;
    };


    // Объявляем о победе
    this.win = function (cellsObj, player) {
        var index = 0;

        // Визуально отмечаем ячейки из комбинации
        for (var key  in cellsObj) {
            document.getElementById( key ).className += ' -win';
            index++;
        }

        // Вызуально "закрываем" оставшиеся ячейки тем самым давая понять, что игра окончена
        for (var i = 0; i < this.playgroundObj['available'].length; i++) {
            document.getElementById( this.playgroundObj['available'][ i ] ).className += ' -closed' ;
        }

        // Обновляем счетчик игры
        this.updateScores(player);
        var parent = this;  // Внутри ф-ции ниже this имеет свое значение, потому страхуемся
        setTimeout(function() {
            if ( confirm('Do you want to start a new game?') ) {
                // Предлагаем пользователю начать новый раунд через секунду после объявления победы
                parent.newGame();
            }
        }, 1000);
    };


    // Обновляем счетчик игры
    this.updateScores = function (player) {
        var newValue = this.scoresObj[player] + 1;
        this.scoresObj[player] = newValue;
        document.getElementById('scoresOfPlayer' + player).innerHTML = newValue;
    };


    // Запуск новой игры
    this.newGame = function () {
        // Очищаем HTML-контейнера с игрой
        this.container.innerHTML = '';

        // Создаем или очищаем объект с информацией о ситуации на игровом поле
        this.playgroundObj = {
            'available': []
        };
        for (var i = 0; i < this.players.length; i++) {
            this.playgroundObj[ this.players[ i ] ] = [];
        }

        // Вызываем ф-цию для постройки игрового поля
        this.buildPlayground();
    };


    // Запускаем игру
    return this.newGame();
}


// Run
var TictactoeGame = new Tictactoe({
    selector: '#tictactoe', // Селектор контейнера с игрой
    grid: 5,    // Размер игрового поля
    combinationNum: 5,  // Кол-во ячеек, чтоб собрать комбинацию
    bot: true   // Бот вкл/выкл.
});

// Эта ф-ция нужна для работы переменных parent, которые я выше много раз описывал зачем нужны
var TictatoeClickHelper = function () {
    return TictactoeGame; // TictactoeGame – is must be name of variable with game
};
