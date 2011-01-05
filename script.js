(function() {
  var Controller, Model, Player, Renderer, constants, controller, gameTick, input, keys;
  constants = {
    WIDTH: 1024,
    HEIGHT: 768,
    MILLIS_PER_TICK: 30
  };
  keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
  };
  input = {
    keysHeld: []
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
      this.clear();
      this.ctx.save();
      this.ctx.translate(model.player.pos[0], model.player.pos[1]);
      this.ctx.rotate(0.0174532925 * model.player.heading);
      this.drawRect(-model.player.width / 2, -model.player.length / 2, model.player.width, model.player.length, "rgba(255,0,0,1.0)");
      return this.ctx.restore();
    };
    return Renderer;
  })();
  Player = (function() {
    function Player() {
      this.hp = 100;
      this.heading = 135.0;
      this.pos = [200, 200];
      this.speed = 3.0;
      this.rot_speed = 90.0;
      this.width = 20;
      this.length = 40;
    }
    Player.prototype.update = function() {
      var theta;
      if (input.keysHeld[keys.UP]) {
        theta = 0.0174532925 * this.heading;
        this.pos[0] += this.speed * Math.sin(theta);
        this.pos[1] -= this.speed * Math.cos(theta);
      }
      if (input.keysHeld[keys.LEFT]) {
        this.heading -= 5.0;
      }
      if (input.keysHeld[keys.RIGHT]) {
        return this.heading += 5.0;
      }
    };
    return Player;
  })();
  Model = (function() {
    function Model() {
      this.player = new Player;
    }
    Model.prototype.update = function() {
      return this.player.update();
    };
    return Model;
  })();
  Controller = (function() {
    function Controller() {
      this.model = new Model;
      this.renderer = new Renderer;
    }
    Controller.prototype.tick = function() {
      this.model.update();
      return this.renderer.render(this.model);
    };
    return Controller;
  })();
  controller = new Controller;
  document.onkeydown = function(event) {
    return input.keysHeld[event.keyCode] = true;
  };
  document.onkeyup = function(event) {
    return input.keysHeld[event.keyCode] = false;
  };
  gameTick = function() {
    return controller.tick();
  };
  window.onload = function() {
    return setInterval(gameTick, constants.MILLIS_PER_TICK);
  };
}).call(this);
