(function() {
  var Controller, Model, Player, Renderer, Rocket, Ship, colors, constants, controller, gameTick, input, keys, state, utils;
  constants = {
    WIDTH: 1024,
    HEIGHT: 768,
    MILLIS_PER_TICK: 30
  };
  keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    CTRL: 17
  };
  colors = {
    RED: "rgba(255,0,0,1.0)",
    BLUE: "rgba(0,0,255,1.0)"
  };
  input = {
    keysHeld: []
  };
  state = {
    ACTIVE: 0,
    DYING: 1,
    DEAD: 2
  };
  utils = {
    degToRad: function(degrees) {
      return 0.0174532925 * degrees;
    }
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
    Renderer.prototype.renderShip = function(ship) {
      this.ctx.save();
      this.ctx.translate(ship.coord.x, ship.coord.y);
      this.ctx.rotate(0.0174532925 * ship.heading);
      this.drawRect(-ship.width / 2, -ship.length / 2, ship.width, ship.length, ship.color);
      return this.ctx.restore();
    };
    Renderer.prototype.render = function(model) {
      var bullet, ship, _i, _j, _len, _len2, _ref, _ref2;
      this.clear();
      _ref = model.ships;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ship = _ref[_i];
        this.renderShip(ship);
      }
      _ref2 = model.bullets;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        bullet = _ref2[_j];
        this.renderShip(bullet);
      }
      return this.renderShip(model.player);
    };
    return Renderer;
  })();
  Rocket = (function() {
    function Rocket(coord, heading) {
      this.distTravelled = 0;
      this.maxDist = 300.0;
      this.damage = 100;
      this.radius = 100;
      this.speed = 400.0;
      this.coord = coord;
      this.heading = heading;
      this.color = colors.RED;
      this.width = 5;
      this.length = 10;
      this.state = state.ACTIVE;
    }
    Rocket.prototype.update = function(dt) {
      var dist, dx, dy, theta;
      if (this.distTravelled < this.maxDist) {
        dist = this.speed * dt / 1000.0;
        theta = utils.degToRad(this.heading);
        dx = dist * Math.sin(theta);
        dy = dist * Math.cos(theta);
        this.coord.x += dx;
        this.coord.y -= dy;
        return this.distTravelled += Math.sqrt(dx * dx + dy * dy);
      } else {
        return this.state = state.DEAD;
      }
    };
    return Rocket;
  })();
  Player = (function() {
    function Player() {
      this.hp = 100;
      this.heading = 135.0;
      this.coord = {
        x: 200,
        y: 200
      };
      this.speed = 200.0;
      this.rotSpeed = 180.0;
      this.width = 20;
      this.length = 40;
      this.color = colors.RED;
      this.state = state.ACTIVE;
    }
    Player.prototype.update = function(dt, model) {
      var dist, theta;
      if (input.keysHeld[keys.UP]) {
        dist = this.speed * dt / 1000.0;
        theta = utils.degToRad(this.heading);
        this.coord.x += dist * Math.sin(theta);
        this.coord.y -= dist * Math.cos(theta);
      }
      if (input.keysHeld[keys.LEFT]) {
        this.heading -= this.rotSpeed * dt / 1000.0;
      }
      if (input.keysHeld[keys.RIGHT]) {
        this.heading += this.rotSpeed * dt / 1000.0;
      }
      if (input.keysHeld[keys.CTRL]) {
        return model.bullets.push(new Rocket({
          x: this.coord.x,
          y: this.coord.y
        }, this.heading));
      }
    };
    return Player;
  })();
  Ship = (function() {
    function Ship(coord) {
      this.hp = 50;
      this.heading = 0.0;
      this.coord = coord;
      this.width = 20;
      this.length = 40;
      this.color = colors.BLUE;
      this.state = state.ACTIVE;
    }
    Ship.prototype.update = function(dt) {};
    return Ship;
  })();
  Model = (function() {
    function Model() {
      var i;
      this.player = new Player;
      this.ships = (function() {
        var _results;
        _results = [];
        for (i = 1; i <= 10; i++) {
          _results.push(new Ship({
            x: Math.random() * constants.WIDTH,
            y: Math.random() * constants.HEIGHT
          }));
        }
        return _results;
      })();
      this.bullets = [];
    }
    Model.prototype.update = function(dt) {
      var bullet, ship, _i, _j, _len, _len2, _ref, _ref2;
      this.player.update(dt, this);
      _ref = this.ships;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ship = _ref[_i];
        ship.update(dt);
      }
      _ref2 = this.bullets;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        bullet = _ref2[_j];
        if (bullet) {
          bullet.update(dt);
        }
      }
      this.ships = (function() {
        var _i, _len, _ref, _results;
        _ref = this.ships;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ship = _ref[_i];
          _results.push(ship.state !== state.DEAD ? ship : void 0);
        }
        return _results;
      }).call(this);
      return this.bullets = (function() {
        var _i, _len, _ref, _results;
        _ref = (function() {
          var _i, _len, _ref, _results;
          _ref = this.bullets;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            bullet = _ref[_i];
            if (bullet.state !== state.DEAD) {
              _results.push(bullet);
            }
          }
          return _results;
        }).call(this);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bullet = _ref[_i];
          if (bullet) {
            _results.push(bullet);
          }
        }
        return _results;
      }).call(this);
    };
    return Model;
  })();
  Controller = (function() {
    function Controller() {
      this.model = new Model;
      this.renderer = new Renderer;
      this.lastTime = (new Date).getTime();
    }
    Controller.prototype.tick = function() {
      var d, dt, time;
      d = new Date();
      time = d.getTime();
      dt = time - this.lastTime;
      this.lastTime = time;
      this.model.update(dt);
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
