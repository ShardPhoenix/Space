var GameModel, Planet, Player, Rocket, RocketLauncher, Ship;
var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
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
  function Ship(owner, coord, heading) {
    this.hp = 50;
    this.speed = 300;
    this.heading = heading;
    this.coord = coord;
    this.targetCoord = coord;
    this.width = 20;
    this.length = 40;
    this.color = colors.forPlayer(owner);
    this.state = state.ACTIVE;
    this.selected = false;
    this.order;
    this.orderType;
    this.owner = owner;
  }
  Ship.prototype.update = function(dt) {
    var dist, dx, dx2, dy, dy2, theta;
    if (this.order) {
      this.targetCoord = this.order.targetCoord;
      this.orderType = this.order.orderType;
    }
    if (this.orderType === orders.MOVE && (this.coord.x !== this.targetCoord.x || this.coord.y !== this.targetCoord.y)) {
      dx = this.targetCoord.x - this.coord.x;
      dy = this.targetCoord.y - this.coord.y;
      theta = Math.atan2(dy, dx);
      this.heading = utils.radToDeg(theta);
      $("#debug").text("Heading: " + this.heading);
      dist = this.speed * dt / 1000.0;
      dx2 = dist * Math.cos(theta);
      dy2 = dist * Math.sin(theta);
      this.coord.x += utils.abs(dx) > utils.abs(dx2) ? dx2 : dx;
      return this.coord.y += utils.abs(dy) > utils.abs(dy2) ? dy2 : dy;
    }
  };
  return Ship;
})();
Planet = (function() {
  function Planet(coord, radius) {
    this.coord = coord;
    this.heading = 0.0;
    this.radius = radius;
    this.color = colors.randomColor();
  }
  return Planet;
})();
GameModel = (function() {
  function GameModel() {
    var i;
    this.viewport = {
      x: 0,
      y: 0
    };
    this.model = {
      ships: (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = constants.NUM_SHIPS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          _results.push(new Ship((Math.random() > 0.5 ? players.COMPUTER : players.HUMAN), {
            x: Math.round(Math.random() * constants.GAME_WIDTH),
            y: Math.round(Math.random() * constants.GAME_HEIGHT)
          }, Math.round(Math.random() * 360.0)));
        }
        return _results;
      })(),
      planets: (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = constants.NUM_PLANETS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          _results.push(new Planet({
            x: Math.round(Math.random() * constants.GAME_WIDTH),
            y: Math.round(Math.random() * constants.GAME_HEIGHT)
          }, 20 + Math.round(Math.random() * 100)));
        }
        return _results;
      })(),
      selected: [],
      bullets: []
    };
  }
  GameModel.prototype.gameCoord = function(screenCoord) {
    return {
      x: screenCoord.x + this.viewport.x,
      y: screenCoord.y + this.viewport.y
    };
  };
  GameModel.prototype.update = function(dt) {
    var bullet, leftClick, mapDrag, measure, realCoord, rightClick, ship, toBeSelected, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    if (input.keysHeld[keys.LEFT]) {
      this.viewport.x -= Math.round(constants.KEY_SCROLL_RATE * dt / 1000.0);
      if (this.viewport.x < 0) {
        this.viewport.x = 0;
      }
    }
    if (input.keysHeld[keys.RIGHT]) {
      this.viewport.x += Math.round(constants.KEY_SCROLL_RATE * dt / 1000.0);
      if (this.viewport.x > (constants.GAME_WIDTH - constants.CANVAS_WIDTH)) {
        this.viewport.x = constants.GAME_WIDTH - constants.CANVAS_WIDTH;
      }
    }
    if (input.keysHeld[keys.UP]) {
      this.viewport.y -= Math.round(constants.KEY_SCROLL_RATE * dt / 1000.0);
      if (this.viewport.y < 0) {
        this.viewport.y = 0;
      }
    }
    if (input.keysHeld[keys.DOWN]) {
      this.viewport.y += Math.round(constants.KEY_SCROLL_RATE * dt / 1000.0);
      if (this.viewport.y > (constants.GAME_HEIGHT - constants.CANVAS_HEIGHT)) {
        this.viewport.y = constants.GAME_HEIGHT - constants.CANVAS_HEIGHT;
      }
    }
    rightClick = input.mouseClicked[mouseButtons.RIGHT];
    if ((rightClick != null) && !rightClick.handled) {
      realCoord = this.gameCoord(rightClick.coord);
      _ref = this.model.ships;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ship = _ref[_i];
        if (ship.selected) {
          ship.order = {
            targetCoord: realCoord,
            orderType: orders.MOVE
          };
        }
      }
      rightClick.handled = true;
    }
    if (input.keysHeld[keys.S]) {
      _ref2 = this.model.ships;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        ship = _ref2[_j];
        if (ship.selected) {
          ship.order = {
            targetCoord: {},
            orderType: orders.STOP
          };
        }
      }
    }
    leftClick = input.mouseClicked[mouseButtons.LEFT];
    if ((leftClick != null) && !leftClick.handled) {
      realCoord = this.gameCoord(leftClick.coord);
      toBeSelected = null;
      _ref3 = this.model.ships;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        ship = _ref3[_k];
        if (ship.owner === players.HUMAN) {
          measure = ship.length > ship.width ? ship.length : ship.width;
          if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
            toBeSelected = ship;
          }
        }
      }
      if (toBeSelected != null) {
        _ref4 = this.model.ships;
        for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
          ship = _ref4[_l];
          ship.selected = false;
        }
        toBeSelected.selected = true;
      }
      leftClick.handled = true;
    }
    if (!input.selectBox.handled) {
      toBeSelected = [];
      _ref5 = this.model.ships;
      for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
        ship = _ref5[_m];
        if (ship.owner === players.HUMAN) {
          if (input.isInBox({
            x: ship.coord.x - this.viewport.x,
            y: ship.coord.y - this.viewport.y
          })) {
            toBeSelected.push(ship);
          }
        }
      }
      if (toBeSelected.length > 0) {
        _ref6 = this.model.ships;
        for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
          ship = _ref6[_n];
          ship.selected = __indexOf.call(toBeSelected, ship) >= 0;
        }
      }
      input.selectBox.handled = true;
    }
    mapDrag = minimapInput.mouseHeld[mouseButtons.LEFT];
    if (mapDrag) {
      this.viewport.x = Math.round(mapDrag.x * constants.GAME_WIDTH / constants.MINIMAP_WIDTH - constants.CANVAS_WIDTH / 2);
      this.viewport.y = Math.round(mapDrag.y * constants.GAME_HEIGHT / constants.MINIMAP_HEIGHT - constants.CANVAS_HEIGHT / 2);
    }
    _ref7 = this.model.ships;
    for (_o = 0, _len7 = _ref7.length; _o < _len7; _o++) {
      ship = _ref7[_o];
      ship.update(dt);
    }
    _ref8 = this.model.bullets;
    for (_p = 0, _len8 = _ref8.length; _p < _len8; _p++) {
      bullet = _ref8[_p];
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