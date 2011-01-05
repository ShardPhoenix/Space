(function() {
  var GameController, GameModel, Renderer, constants, gameController, gameTick;
  constants = {
    WIDTH: 800,
    HEIGHT: 600
  };
  Renderer = (function() {
    function Renderer() {
      this.ctx = document.getElementById("canvas").getContext("2d");
    }
    Renderer.prototype.drawRect = function(x, y, width, height, color) {
      this.ctx.fillStyle = color;
      return this.ctx.fillRect(x, y, width, height);
    };
    Renderer.prototype.clear = function() {
      return this.drawRect(0, 0, constants.WIDTH, constants.HEIGHT, "rgba(255,255,255,1.0)");
    };
    Renderer.prototype.render = function(model) {
      return this.clear();
    };
    return Renderer;
  })();
  GameModel = (function() {
    function GameModel() {}
    GameModel.prototype.update = function() {};
    return GameModel;
  })();
  GameController = (function() {
    function GameController() {
      this.gameModel = new GameModel;
      this.renderer = new Renderer;
    }
    GameController.prototype.tick = function() {
      this.gameModel.update();
      return this.renderer.render(null);
    };
    return GameController;
  })();
  gameController = new GameController;
  gameTick = function() {
    return gameController.tick();
  };
  window.onload = function() {
    return setInterval(gameTick, 30);
  };
}).call(this);
