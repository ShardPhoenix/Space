/*
 Weapon Ideas (Mechwarrior-like combat):

 - Rocket (explodes at point)
 - Homing missile & anti-missle guns (or missile swarms)
 - Std. laser
 - Beam laser - closer == more damage
 - Rail gun - high damage at all distances, but dodgeable
 - Weapon weights and sizes to fit slots, affect speed + fuel usage
 - Energy vs. shields, missile vs. hull?
 - location-based damage?

 - armor + shield types
 - stealth
 - extra speed


Also other customization (colors, appearance)

Ideas:
    - Move and shoot with keys, target with mouse (Mech/WoW style)
    - Slots of varying sizes (different per ship model) for weapons, defenses, engines, misc comms + scanning, etc
    - Objects - black holes (dungeons?), stars (recharge), stations (bases/shops), planets (mining?), asteroids, wormholes
    - Players can do stuff with bases they control - scanning, manufacturing, player-owned shop, etc
    - Ships have a cargo limit and ammo has weight etc
    - Metal + energy as resources
    - Ship energy - used to fire, for shields, for fast travel. Like mana.


*/var GameModel, HomingMissile, HomingMissileLauncher, Planet, PlasmaBolt, PlasmaGun, Player, Rocket, RocketExplosion, RocketLauncher, Ship, Star;
var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
RocketExplosion = (function() {
  function RocketExplosion(world, coord) {
    this.world = world;
    this.coord = coord;
    this.damagePerSecond = 100.0;
    this.secondsToLive = 2.0;
    this.radius = 100;
    this.color = colors.YELLOW;
    this.state = state.ACTIVE;
  }
  RocketExplosion.prototype.collided = function(ship) {
    return utils.abs(ship.coord.x - this.coord.x) < this.radius && utils.abs(ship.coord.y - this.coord.y) < this.radius;
  };
  RocketExplosion.prototype.update = function(dt) {
    var damage, seconds, ship, _i, _len, _ref;
    seconds = dt / 1000.0;
    if (this.secondsToLive > 0) {
      _ref = this.world.model.ships;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ship = _ref[_i];
        if (this.collided(ship)) {
          damage = this.damagePerSecond * seconds;
          ship.effects.push({
            done: false,
            apply: function(target) {
              target.hp -= damage;
              return this.done = true;
            }
          });
        }
      }
      this.secondsToLive -= seconds;
      return this.radius *= this.secondsToLive / 2.0;
    } else {
      return this.state = state.DEAD;
    }
  };
  return RocketExplosion;
})();
Rocket = (function() {
  function Rocket(world, coord, target) {
    var dx, dy, theta;
    this.distTravelled = 0;
    this.maxDist = utils.dist(coord, target.coord);
    this.damage = 100;
    this.radius = 100;
    this.speed = 200.0;
    this.coord = {
      x: coord.x,
      y: coord.y
    };
    this.color = colors.RED;
    this.width = 10;
    this.length = 5;
    this.state = state.ACTIVE;
    this.world = world;
    dx = target.coord.x - this.coord.x;
    dy = target.coord.y - this.coord.y;
    theta = Math.atan2(dy, dx);
    this.heading = utils.radToDeg(theta + Math.PI / 2);
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
      this.state = state.DEAD;
      return this.world.model.explosions.push(new RocketExplosion(this.world, this.coord));
    }
  };
  return Rocket;
})();
RocketLauncher = (function() {
  function RocketLauncher(world) {
    this.world = world;
    this.cooldown = 500;
    this.bulletClass = Rocket;
    this.lastFired = utils.currentTimeMillis();
    this.targetRange = 400.0;
    this.ammo = 9999;
  }
  RocketLauncher.prototype.readyToFire = function() {
    return (utils.currentTimeMillis() - this.lastFired) > this.cooldown;
  };
  RocketLauncher.prototype.inRange = function(coord1, coord2) {
    return utils.dist(coord1, coord2) < this.targetRange;
  };
  RocketLauncher.prototype.tryFire = function(coord, target) {
    if (this.readyToFire() && this.inRange(coord, target.coord) && this.ammo > 0) {
      this.world.model.bullets.push(new this.bulletClass(this.world, coord, target));
      this.lastFired = utils.currentTimeMillis();
      return this.ammo--;
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
  function HomingMissile(coord, target) {
    this.target = target;
    this.damage = 100;
    this.distTravelled = 0;
    this.maxDist = 1000.0;
    this.damage = 100;
    this.radius = 100;
    this.speed = 200.0;
    this.coord = {
      x: coord.x,
      y: coord.y
    };
    this.heading = 90.0;
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
HomingMissileLauncher = (function() {
  function HomingMissileLauncher(world) {
    this.world = world;
    this.cooldown = 2000;
    this.bulletClass = HomingMissile;
    this.lastFired = utils.currentTimeMillis();
    this.targetRange = 500.0;
    this.ammo = 9999;
  }
  HomingMissileLauncher.prototype.readyToFire = function() {
    return (utils.currentTimeMillis() - this.lastFired) > this.cooldown;
  };
  HomingMissileLauncher.prototype.inRange = function(coord1, coord2) {
    return utils.dist(coord1, coord2) < this.targetRange;
  };
  HomingMissileLauncher.prototype.tryFire = function(coord, target) {
    if (this.readyToFire() && this.inRange(coord, target.coord) && this.ammo > 0) {
      this.world.model.bullets.push(new this.bulletClass(coord, target));
      this.lastFired = utils.currentTimeMillis();
      return this.ammo--;
    }
  };
  return HomingMissileLauncher;
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
    this.rotSpeed = 180;
    this.heading = heading;
    this.coord = coord;
    this.targetCoord = coord;
    this.width = 40;
    this.length = 20;
    this.color = colors.forPlayer(owner);
    this.state = state.ACTIVE;
    this.selected = false;
    this.targeted = false;
    this.owner = owner;
    this.plasmaGun = new PlasmaGun(world);
    this.slots = [new HomingMissileLauncher(world), new RocketLauncher(world), new PlasmaGun(world), new PlasmaGun(world)];
    this.effects = [];
    this.orders = {};
  }
  Ship.prototype.moveToward = function(targetCoord, dt) {
    var dist, dx, dx2, dy, dy2, theta;
    dx = targetCoord.x - this.coord.x;
    dy = targetCoord.y - this.coord.y;
    theta = Math.atan2(dy, dx);
    if (utils.abs(dx) > 0 || utils.abs(dy) > 0) {
      this.heading = utils.radToDeg(theta - Math.PI / 2);
    }
    dist = this.speed * dt / 1000.0;
    dx2 = dist * Math.cos(theta);
    dy2 = dist * Math.sin(theta);
    this.coord.x += utils.abs(dx) > utils.abs(dx2) ? dx2 : dx;
    this.coord.y += utils.abs(dy) > utils.abs(dy2) ? dy2 : dy;
    return dist;
  };
  Ship.prototype.update = function(dt) {
    var anyInRange, attackTargetOrder, backwardOrder, dist, effect, forwardOrder, moveOrder, newCoord, randomMoveOrder, rotLeftOrder, rotRightOrder, shootSlotOrder, slot, stopOrder, theta, _i, _j, _len, _len2, _ref, _ref2;
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
    moveOrder = this.orders[orders.MOVE];
    attackTargetOrder = this.orders[orders.ATTACK_TARGET];
    shootSlotOrder = this.orders[orders.SHOOT_SLOT];
    randomMoveOrder = this.orders[orders.RANDOM_MOVE];
    stopOrder = this.orders[orders.STOP];
    forwardOrder = this.orders[orders.ACCEL_FORWARD];
    backwardOrder = this.orders[orders.ACCEL_BACKWARD];
    rotLeftOrder = this.orders[orders.ROTATE_LEFT];
    rotRightOrder = this.orders[orders.ROTATE_RIGHT];
    if (forwardOrder) {
      dist = this.speed * dt / 1000.0;
      theta = utils.degToRad(this.heading + Math.PI / 2);
      this.coord.x -= dist * Math.sin(theta);
      this.coord.y += dist * Math.cos(theta);
    }
    if (backwardOrder) {
      dist = this.speed * 0.5 * dt / 1000.0;
      theta = utils.degToRad(this.heading + Math.PI / 2);
      this.coord.x += dist * Math.sin(theta);
      this.coord.y -= dist * Math.cos(theta);
    }
    if (rotLeftOrder) {
      this.heading -= this.rotSpeed * dt / 1000.0;
    }
    if (rotRightOrder) {
      this.heading += this.rotSpeed * dt / 1000.0;
    }
    if (forwardOrder || backwardOrder || rotLeftOrder || rotRightOrder) {
      this.orders[orders.MOVE] = false;
      this.orders[orders.ATTACK_TARGET] = false;
    }
    if (stopOrder) {
      this.orders = {};
      return;
    }
    if (moveOrder && (this.coord.x !== moveOrder.targetCoord.x || this.coord.y !== moveOrder.targetCoord.y)) {
      this.moveToward(moveOrder.targetCoord, dt);
      this.orders[orders.SHOOT_SLOT] = false;
      this.orders[orders.ATTACK_TARGET] = false;
    }
    if (attackTargetOrder) {
      if (attackTargetOrder.target && attackTargetOrder.target.state === state.ACTIVE) {
        if (this.plasmaGun.targetRange > utils.dist(this.coord, attackTargetOrder.target.coord)) {
          this.plasmaGun.tryFire(this.coord, attackTargetOrder.target);
        } else {
          this.moveToward(attackTargetOrder.target.coord, dt);
        }
      } else {
        this.orders[orders.ATTACK_TARGET] = false;
      }
    }
    if (shootSlotOrder) {
      if (shootSlotOrder.target && shootSlotOrder.target.state === state.ACTIVE) {
        anyInRange = false;
        _ref2 = shootSlotOrder.slots;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          slot = _ref2[_j];
          if (this.slots[slot]) {
            if (this.slots[slot].targetRange > utils.dist(this.coord, shootSlotOrder.target.coord)) {
              anyInRange = true;
              this.slots[slot].tryFire(this.coord, shootSlotOrder.target);
              this.orders[orders.SHOOT_SLOT] = false;
            }
          }
        }
        if (!anyInRange) {
          this.moveToward(shootSlotOrder.target.coord, dt);
        }
      }
    }
    if (randomMoveOrder) {
      if (randomMoveOrder.distTravelled < randomMoveOrder.distToMove) {
        return randomMoveOrder.distTravelled += this.moveToward(randomMoveOrder.targetCoord, dt / 4);
      } else {
        newCoord = {
          x: this.coord.x - 100 + Math.round(Math.random() * 200),
          y: this.coord.y - 100 + Math.round(Math.random() * 200)
        };
        randomMoveOrder.distTravelled = 0;
        randomMoveOrder.distToMove = Math.round(Math.random() * 150) + 75;
        return randomMoveOrder.targetCoord = newCoord;
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
    var i, playerStart, ship, startingShips, thePlayerShip, _i, _len;
    this.viewport = {
      x: 0,
      y: 0
    };
    startingShips = (function() {
      var _ref, _results;
      _results = [];
      for (i = 1, _ref = constants.NUM_SHIPS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
        _results.push(new Ship(this, players.COMPUTER, this.randomCoord(), Math.round(Math.random() * 360.0)));
      }
      return _results;
    }).call(this);
    playerStart = this.randomCoord();
    thePlayerShip = new Ship(this, players.HUMAN, playerStart, Math.round(Math.random() * 360.0));
    thePlayerShip.selected = true;
    startingShips.push(thePlayerShip);
    this.viewport = {
      x: playerStart.x - constants.CANVAS_WIDTH / 2,
      y: playerStart.y - constants.CANVAS_HEIGHT / 2
    };
    for (_i = 0, _len = startingShips.length; _i < _len; _i++) {
      ship = startingShips[_i];
      if (ship.owner === players.COMPUTER) {
        ship.orders[orders.RANDOM_MOVE] = {
          orderType: orders.RANDOM_MOVE,
          targetCoord: this.randomCoord(),
          distToMove: Math.round(Math.random() * 100) + 50,
          distTravelled: 0
        };
      }
    }
    this.model = {
      ships: startingShips,
      playerShip: thePlayerShip,
      planets: (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = constants.NUM_PLANETS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          _results.push(new Planet(this.randomCoord(), 20 + Math.round(Math.random() * 100)));
        }
        return _results;
      }).call(this),
      bullets: [],
      explosions: [],
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
    var bestDistance, bullet, distance, explosion, leftClick, mapDrag, measure, realCoord, rightClick, selected, ship, target, targeted, toBeSelected, toBeTargeted, _i, _j, _k, _l, _len, _len10, _len11, _len12, _len13, _len14, _len15, _len16, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _s, _t, _u, _v, _w, _x;
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
    this.model.playerShip.orders[orders.ACCEL_FORWARD] = input.keysHeld[keys.W];
    this.model.playerShip.orders[orders.ACCEL_BACKWARD] = input.keysHeld[keys.S];
    this.model.playerShip.orders[orders.ROTATE_LEFT] = input.keysHeld[keys.A];
    this.model.playerShip.orders[orders.ROTATE_RIGHT] = input.keysHeld[keys.D];
    if (input.keysHeld[keys.W] || input.keysHeld[keys.S] || input.keysHeld[keys.A] || input.keysHeld[keys.D]) {
      this.viewport = {
        x: this.model.playerShip.coord.x - constants.CANVAS_WIDTH / 2,
        y: this.model.playerShip.coord.y - constants.CANVAS_HEIGHT / 2
      };
    }
    if (input.keysHeld[keys.Q] || input.keysHeld[keys.E] || input.keysHeld[keys.R] || input.keysHeld[keys.F]) {
      target = null;
      targeted = (function() {
        var _i, _len, _ref, _results;
        _ref = this.model.ships;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ship = _ref[_i];
          if (ship.targeted) {
            _results.push(ship);
          }
        }
        return _results;
      }).call(this);
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
      if (targeted.length > 0) {
        bestDistance = utils.dist(targeted[0].coord, this.model.playerShip.coord);
        target = targeted[0];
        for (_i = 0, _len = targeted.length; _i < _len; _i++) {
          ship = targeted[_i];
          distance = utils.dist(ship.coord, this.model.playerShip.coord);
          if (distance < bestDistance) {
            target = ship;
            bestDistance = distance;
          }
        }
        for (_j = 0, _len2 = selected.length; _j < _len2; _j++) {
          ship = selected[_j];
          ship.orders[orders.SHOOT_SLOT] = {
            target: target,
            slots: utils.getSlots(),
            orderType: orders.SHOOT_SLOT
          };
        }
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
      for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
        ship = _ref[_k];
        if (ship.owner === players.COMPUTER) {
          measure = ship.length > ship.width ? ship.length : ship.width;
          if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
            target = ship;
          }
        }
      }
      if (target != null) {
        for (_l = 0, _len4 = selected.length; _l < _len4; _l++) {
          ship = selected[_l];
          ship.orders[orders.ATTACK_TARGET] = {
            target: target,
            orderType: orders.ATTACK_TARGET
          };
        }
      } else {
        for (_m = 0, _len5 = selected.length; _m < _len5; _m++) {
          ship = selected[_m];
          ship.orders[orders.MOVE] = {
            targetCoord: realCoord,
            orderType: orders.MOVE
          };
        }
      }
      rightClick.handled = true;
    }
    leftClick = input.mouseClicked[mouseButtons.LEFT];
    if ((leftClick != null) && !leftClick.handled) {
      realCoord = this.gameCoord(leftClick.coord);
      if (input.keysHeld[keys.TODO_NEW_ATTACK_KEY]) {
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
        _ref2 = this.model.ships;
        for (_n = 0, _len6 = _ref2.length; _n < _len6; _n++) {
          ship = _ref2[_n];
          if (ship.owner === players.COMPUTER) {
            measure = ship.length > ship.width ? ship.length : ship.width;
            if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
              target = ship;
            }
          }
        }
        if (target != null) {
          for (_o = 0, _len7 = selected.length; _o < _len7; _o++) {
            ship = selected[_o];
            ship.orders[orders.ATTACK_TARGET] = {
              target: target,
              orderType: orders.ATTACK_TARGET
            };
          }
        } else {
          for (_p = 0, _len8 = selected.length; _p < _len8; _p++) {
            ship = selected[_p];
            ship.orders[orders.ATTACK_AREA] = {
              targetCoord: realCoord,
              orderType: orders.ATTACK_AREA
            };
          }
        }
      } else {
        toBeSelected = null;
        toBeTargeted = null;
        _ref3 = this.model.ships;
        for (_q = 0, _len9 = _ref3.length; _q < _len9; _q++) {
          ship = _ref3[_q];
          measure = ship.length > ship.width ? ship.length : ship.width;
          if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
            if (ship.owner === players.HUMAN) {
              toBeSelected = ship;
            } else {
              toBeTargeted = ship;
            }
          }
        }
        if (toBeSelected != null) {
          _ref4 = this.model.ships;
          for (_r = 0, _len10 = _ref4.length; _r < _len10; _r++) {
            ship = _ref4[_r];
            ship.selected = false;
          }
          toBeSelected.selected = true;
        }
        if (toBeTargeted != null) {
          _ref5 = this.model.ships;
          for (_s = 0, _len11 = _ref5.length; _s < _len11; _s++) {
            ship = _ref5[_s];
            ship.targeted = false;
          }
          toBeTargeted.targeted = true;
        }
      }
      leftClick.handled = true;
    }
    if (!input.selectBox.handled) {
      toBeSelected = [];
      _ref6 = this.model.ships;
      for (_t = 0, _len12 = _ref6.length; _t < _len12; _t++) {
        ship = _ref6[_t];
        if (input.isInBox({
          x: ship.coord.x - this.viewport.x,
          y: ship.coord.y - this.viewport.y
        })) {
          if (ship.owner === players.HUMAN) {
            toBeSelected.push(ship);
          } else {
            ship.targeted = true;
          }
        }
      }
      if (toBeSelected.length > 0) {
        _ref7 = this.model.ships;
        for (_u = 0, _len13 = _ref7.length; _u < _len13; _u++) {
          ship = _ref7[_u];
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
    for (_v = 0, _len14 = _ref8.length; _v < _len14; _v++) {
      ship = _ref8[_v];
      ship.update(dt);
    }
    _ref9 = this.model.bullets;
    for (_w = 0, _len15 = _ref9.length; _w < _len15; _w++) {
      bullet = _ref9[_w];
      bullet.update(dt);
    }
    _ref10 = this.model.explosions;
    for (_x = 0, _len16 = _ref10.length; _x < _len16; _x++) {
      explosion = _ref10[_x];
      explosion.update(dt);
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
    this.model.bullets = (function() {
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
    return this.model.explosions = (function() {
      var _i, _len, _ref, _results;
      _ref = this.model.explosions;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        explosion = _ref[_i];
        if (explosion.state !== state.DEAD) {
          _results.push(explosion);
        }
      }
      return _results;
    }).call(this);
  };
  return GameModel;
})();