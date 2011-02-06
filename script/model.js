var GameModel, HomingMissile, Planet, PlasmaBolt, PlasmaGun, Player, Rocket, RocketLauncher, Ship, Star;
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
    this.speed = 200.0;
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
PlasmaBolt = (function() {
  function PlasmaBolt(coord, target) {
    var dx, dy, theta;
    this.distTravelled = 0;
    this.maxDist = 1000.0;
    this.damage = 20;
    this.radius = 100;
    this.speed = 400.0;
    this.coord = {
      x: coord.x,
      y: coord.y
    };
    this.target = target;
    this.color = colors.RED;
    this.width = 6;
    this.length = 2;
    this.state = state.ACTIVE;
    dx = target.coord.x - coord.x;
    dy = target.coord.y - coord.y;
    theta = Math.atan2(dy, dx);
    this.heading = utils.radToDeg(theta + Math.PI / 2);
  }
  PlasmaBolt.prototype.collided = function(coord, target) {
    var measure;
    measure = target.length > target.width ? target.length : target.width;
    return utils.abs(coord.x - target.coord.x) < measure / 2 && utils.abs(coord.y - target.coord.y) < measure / 2;
  };
  PlasmaBolt.prototype.update = function(dt) {
    var dist, dx, dy, that, theta;
    if (this.state === state.ACTIVE) {
      dist = this.speed * dt / 1000.0;
      theta = utils.degToRad(this.heading);
      dx = dist * Math.sin(theta);
      dy = dist * Math.cos(theta);
      this.coord.x += dx;
      this.coord.y -= dy;
      this.distTravelled += Math.sqrt(dx * dx + dy * dy);
      if (this.collided(this.coord, this.target)) {
        that = this;
        this.target.effects.push({
          done: false,
          apply: function(target) {
            target.hp -= that.damage;
            return this.done = true;
          }
        });
        this.state = state.DEAD;
      }
      if (this.distTravelled > this.maxDist) {
        return this.state = state.DEAD;
      }
    }
  };
  return PlasmaBolt;
})();
PlasmaGun = (function() {
  function PlasmaGun(world) {
    this.world = world;
    this.cooldown = 500;
    this.bulletClass = PlasmaBolt;
    this.lastFired = utils.currentTimeMillis();
    this.targetRange = 500.0;
  }
  PlasmaGun.prototype.readyToFire = function() {
    return (utils.currentTimeMillis() - this.lastFired) > this.cooldown;
  };
  PlasmaGun.prototype.inRange = function(coord1, coord2) {
    return utils.dist(coord1, coord2) < this.targetRange;
  };
  PlasmaGun.prototype.tryFire = function(coord, target) {
    if (this.readyToFire() && this.inRange(coord, target.coord)) {
      this.world.model.bullets.push(new this.bulletClass(coord, target));
      return this.lastFired = utils.currentTimeMillis();
    }
  };
  return PlasmaGun;
})();
HomingMissile = (function() {
  function HomingMissile(coord, heading, target) {
    this.target = target;
    this.damage = 100;
    this.distTravelled = 0;
    this.maxDist = 1000.0;
    this.damage = 100;
    this.radius = 100;
    this.speed = 200.0;
    this.coord = coord;
    this.heading = heading;
    this.color = colors.WHITE;
    this.width = 5;
    this.length = 5;
  }
  HomingMissile.prototype.update = function(dt) {
    var dist, dx, dx2, dy, dy2, that, theta;
    if (this.distTravelled < this.maxDist && this.target) {
      dx = this.target.coord.x - this.coord.x;
      dy = this.target.coord.y - this.coord.y;
      theta = Math.atan2(dy, dx);
      this.heading = utils.radToDeg(theta);
      dist = this.speed * dt / 1000.0;
      dx2 = dist * Math.cos(theta);
      dy2 = dist * Math.sin(theta);
      this.coord.x += utils.abs(dx) > utils.abs(dx2) ? dx2 : dx;
      this.coord.y += utils.abs(dy) > utils.abs(dy2) ? dy2 : dy;
      if (this.coord.x === this.target.coord.x && this.coord.y === this.target.coord.y) {
        that = this;
        this.target.effects.push({
          done: false,
          apply: function(target) {
            target.hp -= that.damage;
            return this.done = true;
          }
        });
        return this.state = state.DEAD;
      }
    } else {
      return this.state = state.DEAD;
    }
  };
  return HomingMissile;
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
  function Ship(world, owner, coord, heading) {
    this.world = world;
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
    this.plasmaGun = new PlasmaGun(world);
    this.effects = [];
    this.order;
    this.orderType;
    this.target;
    this.owner = owner;
  }
  Ship.prototype.moveToward = function(targetCoord, dt) {
    var dist, dx, dx2, dy, dy2, theta;
    dx = targetCoord.x - this.coord.x;
    dy = targetCoord.y - this.coord.y;
    theta = Math.atan2(dy, dx);
    this.heading = utils.radToDeg(theta);
    $("#debug").text("Heading: " + this.heading);
    dist = this.speed * dt / 1000.0;
    dx2 = dist * Math.cos(theta);
    dy2 = dist * Math.sin(theta);
    this.coord.x += utils.abs(dx) > utils.abs(dx2) ? dx2 : dx;
    return this.coord.y += utils.abs(dy) > utils.abs(dy2) ? dy2 : dy;
  };
  Ship.prototype.update = function(dt) {
    var effect, _i, _len, _ref;
    if (this.effects.length > 0) {
      _ref = this.effects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        effect = _ref[_i];
        effect.apply(this, dt);
      }
    }
    this.effects = (function() {
      var _i, _len, _ref, _results;
      _ref = this.effects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        effect = _ref[_i];
        if (!effect.done) {
          _results.push(effect);
        }
      }
      return _results;
    }).call(this);
    if (this.hp <= 0) {
      this.state = state.DEAD;
    }
    if (this.order) {
      this.targetCoord = this.order.targetCoord;
      this.target = this.order.target;
      this.orderType = this.order.orderType;
    }
    if (this.orderType === orders.MOVE && (this.coord.x !== this.targetCoord.x || this.coord.y !== this.targetCoord.y)) {
      this.moveToward(this.targetCoord, dt);
    }
    if (this.orderType === orders.ATTACK_TARGET) {
      if (this.target && this.target.state === state.ACTIVE) {
        if (this.plasmaGun.targetRange > utils.dist(this.coord, this.order.target.coord)) {
          return this.plasmaGun.tryFire(this.coord, this.order.target);
        } else {
          return this.moveToward(this.target.coord, dt);
        }
      } else {
        return this.orderType = orders.STOP;
      }
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
Star = (function() {
  function Star(coord) {
    this.coord = coord;
    this.color = colors.WHITE;
  }
  return Star;
})();
GameModel = (function() {
  function GameModel() {
    var i, startingShips;
    this.viewport = {
      x: 0,
      y: 0
    };
    startingShips = (function() {
      var _ref, _results;
      _results = [];
      for (i = 1, _ref = constants.NUM_SHIPS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
        _results.push(new Ship(this, (Math.random() > 0.5 ? players.COMPUTER : players.HUMAN), this.randomCoord(), Math.round(Math.random() * 360.0)));
      }
      return _results;
    }).call(this);
    this.model = {
      ships: startingShips,
      planets: (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = constants.NUM_PLANETS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          _results.push(new Planet(this.randomCoord(), 20 + Math.round(Math.random() * 100)));
        }
        return _results;
      }).call(this),
      selected: [],
      bullets: [],
      stars: (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = constants.NUM_STARS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          _results.push(new Star(this.randomCoord()));
        }
        return _results;
      }).call(this)
    };
    /*
    for ship in @model.ships
        ship.effects.push({
            done: false
            apply: (target) ->
                target.color = colors.randomColor()
                @done = true
        })
    */
  }
  GameModel.prototype.randomCoord = function() {
    return {
      x: Math.round(Math.random() * constants.GAME_WIDTH),
      y: Math.round(Math.random() * constants.GAME_HEIGHT)
    };
  };
  GameModel.prototype.gameCoord = function(screenCoord) {
    return {
      x: screenCoord.x + this.viewport.x,
      y: screenCoord.y + this.viewport.y
    };
  };
  GameModel.prototype.update = function(dt) {
    var bullet, leftClick, mapDrag, measure, realCoord, rightClick, selected, ship, target, toBeSelected, _i, _j, _k, _l, _len, _len10, _len11, _len12, _len13, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _s, _t, _u;
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
      target = null;
      realCoord = this.gameCoord(rightClick.coord);
      selected = (function() {
        var _i, _len, _ref, _results;
        _ref = this.model.ships;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ship = _ref[_i];
          if (ship.selected) {
            _results.push(ship);
          }
        }
        return _results;
      }).call(this);
      _ref = this.model.ships;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ship = _ref[_i];
        if (ship.owner === players.COMPUTER) {
          measure = ship.length > ship.width ? ship.length : ship.width;
          if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
            target = ship;
          }
        }
      }
      if (target != null) {
        for (_j = 0, _len2 = selected.length; _j < _len2; _j++) {
          ship = selected[_j];
          ship.order = {
            target: target,
            orderType: orders.ATTACK_TARGET
          };
        }
      } else {
        for (_k = 0, _len3 = selected.length; _k < _len3; _k++) {
          ship = selected[_k];
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
      for (_l = 0, _len4 = _ref2.length; _l < _len4; _l++) {
        ship = _ref2[_l];
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
      if (input.keysHeld[keys.A]) {
        target = null;
        selected = (function() {
          var _i, _len, _ref, _results;
          _ref = this.model.ships;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ship = _ref[_i];
            if (ship.selected) {
              _results.push(ship);
            }
          }
          return _results;
        }).call(this);
        _ref3 = this.model.ships;
        for (_m = 0, _len5 = _ref3.length; _m < _len5; _m++) {
          ship = _ref3[_m];
          if (ship.owner === players.COMPUTER) {
            measure = ship.length > ship.width ? ship.length : ship.width;
            if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
              target = ship;
            }
          }
        }
        if (target != null) {
          for (_n = 0, _len6 = selected.length; _n < _len6; _n++) {
            ship = selected[_n];
            ship.order = {
              target: target,
              orderType: orders.ATTACK_TARGET
            };
          }
        } else {
          for (_o = 0, _len7 = selected.length; _o < _len7; _o++) {
            ship = selected[_o];
            ship.order = {
              targetCoord: realCoord,
              orderType: orders.ATTACK_AREA
            };
          }
        }
      } else {
        toBeSelected = null;
        _ref4 = this.model.ships;
        for (_p = 0, _len8 = _ref4.length; _p < _len8; _p++) {
          ship = _ref4[_p];
          if (ship.owner === players.HUMAN) {
            measure = ship.length > ship.width ? ship.length : ship.width;
            if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
              toBeSelected = ship;
            }
          }
        }
        if (toBeSelected != null) {
          _ref5 = this.model.ships;
          for (_q = 0, _len9 = _ref5.length; _q < _len9; _q++) {
            ship = _ref5[_q];
            ship.selected = false;
          }
          toBeSelected.selected = true;
        }
      }
      leftClick.handled = true;
    }
    if (!input.selectBox.handled) {
      toBeSelected = [];
      _ref6 = this.model.ships;
      for (_r = 0, _len10 = _ref6.length; _r < _len10; _r++) {
        ship = _ref6[_r];
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
        _ref7 = this.model.ships;
        for (_s = 0, _len11 = _ref7.length; _s < _len11; _s++) {
          ship = _ref7[_s];
          ship.selected = __indexOf.call(toBeSelected, ship) >= 0;
        }
      }
      input.selectBox.handled = true;
    }
    mapDrag = minimapInput.mouseHeld[mouseButtons.LEFT];
    if (mapDrag) {
      this.viewport.x = Math.round(mapDrag.x * constants.GAME_WIDTH / constants.MINIMAP_WIDTH - constants.CANVAS_WIDTH / 2);
      this.viewport.y = Math.round(mapDrag.y * constants.GAME_HEIGHT / constants.MINIMAP_HEIGHT - constants.CANVAS_HEIGHT / 2);
      if (this.viewport.x < 0) {
        this.viewport.x = 0;
      } else if (this.viewport.x > constants.GAME_WIDTH - constants.CANVAS_WIDTH) {
        this.viewport.x = constants.GAME_WIDTH - constants.CANVAS_WIDTH;
      }
      if (this.viewport.y < 0) {
        this.viewport.y = 0;
      } else if (this.viewport.y > constants.GAME_HEIGHT - constants.CANVAS_HEIGHT) {
        this.viewport.y = constants.GAME_HEIGHT - constants.CANVAS_HEIGHT;
      }
    }
    _ref8 = this.model.ships;
    for (_t = 0, _len12 = _ref8.length; _t < _len12; _t++) {
      ship = _ref8[_t];
      ship.update(dt);
    }
    _ref9 = this.model.bullets;
    for (_u = 0, _len13 = _ref9.length; _u < _len13; _u++) {
      bullet = _ref9[_u];
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