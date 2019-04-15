import $ from 'jquery';

class GameLogic {
  constructor() {
    this.initialize();
  }
  initialize() {
    this.field = Array(9).fill(null);
    this._player = GameLogic.X;
  }
  changePlayer() {
    const isX = this._player === GameLogic.X;
    this._player = isX ?
      GameLogic.O
      : GameLogic.X;
  }
  fillCell(cellIndx) {
    this.field[cellIndx] = this._player;
  }
  verifyField() {
    /**
    * Methods' contract:
    * in case of draw returns -1 ;
    * in case of some players' win
    *    returns index of victory combination ;
    * in other cases returns null ;
    */
    let result = null;
    // First check if there is winner:
    let isWinner = false;
    for (let [n1, n2, n3] of GameLogic.victoryPositions) {
      if (this.field[n1] !== null
          && this.field[n1] === this.field[n2]
         && this.field[n2] === this.field[n3]) {
        isWinner = true;
        result = [n1, n2, n3];
        break;
      }
    }
    // Then check if it's a draw:
    if (!isWinner && this.field.every(item => item !== null)) {
      result = -1;
    }
    // ..and the work is done:
    return result;
  }

  get currentPlayer() {
    return this._player;
  }
}
// Players marking:
GameLogic.X = 'x';
GameLogic.O = 'o';
// Indexes of winner positions:
GameLogic.victoryPositions = [
  // horyzontal:
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // vertical:
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // diagonal:
  [0, 4, 8],
  [2, 4, 6]
];

class GameView {
  /**
  * Class agreements:
  * 1. Variables with '$' at the names' beginning
  * will contain jQuery objects;
  * 2. Cause of a bunch of required animation
  * the class methods will returns a Promises;
  */
  static smoothAppear(jQueryObj, callback) {
    jQueryObj.hide(0, function() {
      jQueryObj.fadeIn(GameView.fadeInDuration, callback);
    });
  }

  constructor() {
    this.$gameArea = $('#game-area');
    this.$cells = $('#game-area td');
  }
  renderPlayerLine(firstPlayer) {
    return new Promise((resolve, reject) => {
      let line = document.createElement('h3');
      line.innerHTML = "A current player is: <b>" + firstPlayer.toUpperCase() + "</b>";
      line.style.display = "none"; // This prevents visible frame after appending element

      this.$gameArea.append(line);
      this.$playerLine = $(line);
      GameView.smoothAppear(this.$playerLine, resolve);
    });
  }
  renderField() {
    return new Promise((resolve, reject) => {
      let table = document.createElement('table');
      for (let i = 0; i < 3; i++) {
        let row = document.createElement('tr');
        for (let j = 0; j < 3; j++) {
          let cell = document.createElement('td');
          cell.index = i * 3 + j; // indexes for dom-elements will be helpful next
          row.appendChild(cell)
        }
        table.appendChild(row)
      }
      table.style.display = "none"; // This prevents visible frame after appending element
      this.$gameArea.append(table);
      this.$field = this.$gameArea.find('table');
      GameView.smoothAppear(this.$field, resolve);
    });
  }
  renderButton() {
    return new Promise((resolve, reject) => {
      let button = document.createElement('button');
      button.textContent = "Play Again";
      button.style.display = "none";
      this.$gameArea.append(button);
      this.$button = this.$gameArea.find('button');
      this.$button.hide(0, resolve);
    });
  }

  updatePlayer(player) {
    let text = "A current player is: <b>" + player.toUpperCase() + "</b>";
    this.$playerLine.html(text);
  }
  showResult(result, currentUser) {
    /**
    * Takes game session result, what in case of someones' win
    * is an array of winner cells indexes, and in case of a draw
    * is a negative one.
    */
    if (result === -1) this.$playerLine.html("Draw!");
    else {
      this.$playerLine.html("<b>" + currentUser.toUpperCase() + "</b> won.");
      let $cells = this.$field.find('td');
      // In case of win let's mark cells-winners via CSS class "cell-winner":
      result.forEach(index => $cells.get(index).className += " cell-winner");
    }
  }

  clear() {
    this.$gameArea.find('td').removeClass().text('');
  }
}
GameView.fadeInDuration = 1500 /* msec */
GameView.slideDownDuration = 500 /* msec */

class GameController {
  /**
  * Class agreements:
  * 1. Variables with '$' at the names' beginning
  * will contain jQuery objects;
  * 2. Constructor takes first model, then view;
  */
  constructor(gameLogic, gameView) {
    this.gameLogic = gameLogic;
    this.gameView = gameView;
  }

  renderComponents() {
    return Promise.all([
      this.gameView.renderPlayerLine(this.gameLogic.currentPlayer),
      this.gameView.renderField(),
      this.gameView.renderButton()
    ]);
  }

  start() {
    this.gameLogic.initialize();
    this.gameView.updatePlayer(this.gameLogic.currentPlayer);
  }

  accomplishSession() {
    /**
    * This method will mark each cell via CSS class "active-cell"
    * as able to be marked by one of players
    * and will listen on a cells' click and detach active status
    * until it will be draw or someones' win.
    */
    return new Promise((resolve, reject) => {
      let $cells = this.gameView.$field.find('td');

      const handleClick = (event) => {
        let cell = event.currentTarget;
        cell.textContent = this.gameLogic.currentPlayer;

        this.gameLogic.fillCell(cell.index);
        let result = this.gameLogic.verifyField();
        if (result !== null) {
          $cells.removeClass("active-cell").off('click', handleClick);
          resolve(result);
        } else {
          $(cell).removeClass("active-cell");
          this.gameLogic.changePlayer();
          this.gameView.updatePlayer(this.gameLogic.currentPlayer);
        }
      }
      $cells.addClass("active-cell").one('click', handleClick);
    });
  }

  end(result) {
    return new Promise((resolve, reject) => {
      this.gameView.showResult(result, this.gameLogic.currentPlayer);
      // At the end of a game session will appear 'Play Again' button:
      this.gameView.$button.show(GameController.buttonAnimationDuration, () => {
        // Click on button is a trigger that starts a new game session:
        this.gameView.$button.one('click', resolve);
      });
    });
  }
  playAgain() {
    return new Promise((resolve, reject) => {
      this.gameView.clear();
      this.gameView.$button.hide(GameController.buttonAnimationDuration, resolve);
    });
  }
}
GameController.buttonAnimationDuration = 800 /* msec */;

function startLoop($button, delayTime = 1000 /* msec */) {
  /**
  * Click on button will be a trigger which
  * initiate a work of a game loop.
  */
  return new Promise((resolve, reject) => {
    $button.click(function() {
      $button.fadeOut(delayTime, function() {
        $button.remove();
        resolve();
      });
    })
  });
}

async function main() {
  // Let's prepare games' parts objects:
  const gameLogic = new GameLogic();
  const gameView = new GameView();
  const game = new GameController(gameLogic, gameView);
  // Then they will be reusable in the main loop.
  // On start button click let's render a field:
  const $startButton = $("#start-game");
  await startLoop($startButton, 900)
    .then(game.renderComponents.bind(game));
  // And finally let's run the main loop:
  while (true) {
    game.start();
    let result = await game.accomplishSession();
    await game.end(result)
      .then(game.playAgain.bind(game));
  }
}

$(document).ready(main);
