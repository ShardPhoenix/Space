(function() {
  var Controller, GameModel, Player, Renderer, Rocket, RocketLauncher, Ship, colors, constants, controller, gameTick, input, keys, state, utils;
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
    BLUE: "rgba(0,0,255,1.0)",
    GREEN: "rgba(0,255,0,1.0)",
    BACKGROUND: "rgba(0,0,0,1.0)"
  };
  state = {
    ACTIVE: 0,
    DYING: 1,
    DEAD: 2
  };
  utils = {
    degToRad: function(degrees) {
      return 0.0174532925 * degrees;
    },
    currentTimeMillis: function() {
      var d;
      d = new Date();
      return d.getTime();
    },
    max: function(a, b) {
      if (a > b) {
        return a;
      } else {
        return b;
      }
    },
    min: function(a, b) {
      if (a > b) {
        return b;
      } else {
        return a;
      }
    }
  };
  input = {
    xOffset: 0,
    yOffset: 0,
    keysHeld: {},
    mouseHeld: {},
    mouseClicked: {},
    boxDrawn: {
      handled: true
    },
    isInBox: function(coord) {
      return coord.x > this.boxDrawn.topLeft.x && coord.x < this.boxDrawn.bottomRight.x && coord.y > this.boxDrawn.topLeft.y && coord.y < this.boxDrawn.bottomRight.y;
    }
  };
  document.onkeydown = function(event) {
    return input.keysHeld[event.keyCode] = true;
  };
  document.onkeyup = function(event) {
    return input.keysHeld[event.keyCode] = false;
  };
  document.captureEvents(Event.ONCONTEXTMENU);
  document.oncontextmenu = function(event) {
    return false;
  };
  $("html").mousedown(function(event) {
    event.preventDefault();
    event.stopPropagation();
    $("#debug").text("Mouse button " + event.button + " down at: " + event.clientX + " left " + event.clientY + " down");
    return input.mouseHeld[event.button] = {
      x: event.clientX - input.xOffset,
      y: event.clientY - input.yOffset
    };
  });
  $("#canvas").mousedown(function(event) {
    input.xOffset = this.offsetLeft;
    return input.yOffset = this.offsetTop;
  });
  $("html").mouseup(function(event) {
    var startPos, upX, upY;
    event.preventDefault();
    event.stopPropagation();
    startPos = input.mouseHeld[event.button];
    upX = event.pageX - input.xOffset;
    upY = event.pageY - input.yOffset;
    if (startPos) {
      input.boxDrawn = {
        topLeft: {
          x: utils.min(startPos.x, upX),
          y: utils.min(startPos.y, upY)
        },
        bottomRight: {
          x: utils.max(startPos.x, upX),
          y: utils.max(startPos.y, upY)
        },
        handled: false
      };
    }
    $("#debug").text("Mouse button " + event.button + " up at: " + event.clientX + " left " + event.clientY + " down");
    return input.mouseHeld[event.button] = false;
  });
  Renderer = (function() {
    function Renderer() {
      this.ctx = document.getElementById("canvas").getContext("2d");
    }
    Renderer.prototype.drawRect = function(x, y, width, height, color) {
      this.ctx.fillStyle = color;
      return this.ctx.fillRect(x, y, width, height);
    };
    Renderer.prototype.clear = function() {
      return this.drawRect(0, 0, constants.WIDTH, constants.HEIGHT, colors.BACKGROUND);
    };
    Renderer.prototype.renderShip = function(ship) {
      this.ctx.save();
      this.ctx.translate(ship.coord.x, ship.coord.y);
      this.ctx.rotate(0.0174532925 * ship.heading);
      this.drawRect(-ship.width / 2, -ship.length / 2, ship.width, ship.length, ship.color);
      if (ship.selected) {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = colors.GREEN;
        this.ctx.strokeRect(-ship.width / 2, -ship.length / 2, ship.width, ship.length);
      }
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
      this.speed = 600.0;
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
  RocketLauncher = (function() {
    function RocketLauncher() {
      this.cooldown = 250;
      this.bulletClass = Rocket;
      this.lastFired = utils.currentTimeMillis();
    }
    RocketLauncher.prototype.readyToFire = function() {
      return (utils.currentTimeMillis() - this.lastFired) > this.cooldown;
    };
    RocketLauncher.prototype.tryFire = function(coord, heading, list) {
      if (this.readyToFire()) {
        list.push(new this.bulletClass(coord, heading));
        return this.lastFired = utils.currentTimeMillis();
      }
    };
    return RocketLauncher;
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
      this.rocketLauncher = new RocketLauncher;
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
        return this.rocketLauncher.tryFire({
          x: this.coord.x,
          y: this.coord.y
        }, this.heading, model.bullets);
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
      this.selected = false;
    }
    Ship.prototype.update = function(dt) {};
    return Ship;
  })();
  GameModel = (function() {
    function GameModel() {
      var i;
      this.model = {
        player: new Player,
        ships: (function() {
          var _results;
          _results = [];
          for (i = 1; i <= 10; i++) {
            _results.push(new Ship({
              x: Math.random() * constants.WIDTH,
              y: Math.random() * constants.HEIGHT
            }));
          }
          return _results;
        })(),
        selected: [],
        bullets: []
      };
    }
    GameModel.prototype.update = function(dt) {
      var bullet, ship, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      if (!input.boxDrawn.handled) {
        _ref = this.model.ships;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ship = _ref[_i];
          ship.selected = input.isInBox(ship.coord);
        }
        input.boxDrawn.handled = true;
      }
      this.model.player.update(dt, this.model);
      _ref2 = this.model.ships;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        ship = _ref2[_j];
        ship.update(dt);
      }
      _ref3 = this.model.bullets;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        bullet = _ref3[_k];
        bullet.update(dt);
      }
      this.model.ships = (function() {
        var _i, _len, _ref, _results;
        _ref = this.model.ships;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ship = _ref[_i];
          if (ship.state !== state.DEAD) {
            _results.push(ship);
          }
        }
        return _results;
      }).call(this);
      return this.model.bullets = (function() {
        var _i, _len, _ref, _results;
        _ref = this.model.bullets;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bullet = _ref[_i];
          if (bullet.state !== state.DEAD) {
            _results.push(bullet);
          }
        }
        return _results;
      }).call(this);
    };
    return GameModel;
  })();
  Controller = (function() {
    function Controller() {
      this.gameModel = new GameModel;
      this.renderer = new Renderer;
      this.lastTime = (new Date).getTime();
    }
    Controller.prototype.tick = function() {
      var d, dt, time;
      d = new Date();
      time = d.getTime();
      dt = time - this.lastTime;
      this.lastTime = time;
      this.gameModel.update(dt);
      return this.renderer.render(this.gameModel.model);
    };
    return Controller;
  })();
  controller = new Controller;
  gameTick = function() {
    return controller.tick();
  };
  window.onload = function() {
    return setInterval(gameTick, constants.MILLIS_PER_TICK);
  };
}).call(this);
