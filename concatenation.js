(function() {
  var Controller, GameModel, Planet, Player, Renderer, Rocket, RocketLauncher, Ship, colors, constants, controller, input, keys, minimapInput, mouseButtons, orders, players, state, utils;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  constants = {
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 768,
    MINIMAP_WIDTH: 384,
    MINIMAP_HEIGHT: 288,
    GAME_WIDTH: 5000,
    GAME_HEIGHT: 5000,
    MILLIS_PER_TICK: 20,
    KEY_SCROLL_RATE: 600,
    VIEWPORT_MARGIN: 200,
    NUM_SHIPS: 250,
    NUM_PLANETS: 25
  };
  players = {
    COMPUTER: 0,
    HUMAN: 1
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
    WHITE: "rgba(255,255,255,1.0)",
    BACKGROUND: "rgba(0,0,0,1.0)",
    randomColor: function() {
      return "rgba(" + (Math.round(Math.random() * 255)) + "," + (Math.round(Math.random() * 255)) + "," + (Math.round(Math.random() * 255)) + ",1.0)";
    },
    forPlayer: function(player) {
      switch (player) {
        case players.COMPUTER:
          return colors.BLUE;
        case players.HUMAN:
          return colors.RED;
        default:
          return colors.GREEN;
      }
    }
  };
  state = {
    ACTIVE: 0,
    DYING: 1,
    DEAD: 2
  };
  orders = {
    MOVE: 0,
    ATTACK: 1,
    STOP: 2
  };
  mouseButtons = {
    LEFT: 0,
    RIGHT: 2,
    WHEEL: 1
  };
  utils = {
    degToRad: function(degrees) {
      return 0.0174532925 * degrees;
    },
    radToDeg: function(radians) {
      return 57.295779578 * radians;
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
    },
    abs: function(a) {
      if (a < 0) {
        return -1 * a;
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
    mousePos: {
      x: 0,
      y: 0
    },
    selectBox: {
      handled: true
    },
    isInBox: function(coord) {
      return coord.x > this.selectBox.topLeft.x && coord.x < this.selectBox.bottomRight.x && coord.y > this.selectBox.topLeft.y && coord.y < this.selectBox.bottomRight.y;
    }
  };
  minimapInput = {
    xOffset: 0,
    yOffset: 0,
    mouseHeld: {},
    mouseClicked: {}
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
  $("#canvas").mousedown(function(event) {
    input.xOffset = this.offsetLeft;
    return input.yOffset = this.offsetTop;
  });
  $("#minimap").mousedown(function(event) {
    minimapInput.xOffset = this.offsetLeft;
    return minimapInput.yOffset = this.offsetTop;
  });
  $("#minimap").click(function(event) {
    return minimapInput.mouseClicked[event.button] = {
      coord: {
        x: event.clientX - minimapInput.xOffset,
        y: event.clientY - minimapInput.yOffset
      },
      handled: false
    };
  });
  $("#minimap").mousedown(function(event) {
    event.preventDefault();
    event.stopPropagation();
    return minimapInput.mouseHeld[event.button] = {
      x: event.clientX - minimapInput.xOffset,
      y: event.clientY - minimapInput.yOffset
    };
  });
  $("#minimap").mousemove(function(event) {
    minimapInput.mouseHeld[event.button].x = event.clientX - minimapInput.xOffset;
    return minimapInput.mouseHeld[event.button].y = event.clientY - minimapInput.yOffset;
  });
  $("#minimap").mouseup(function(event) {
    return minimapInput.mouseHeld[event.button] = false;
  });
  $("html").mousemove(function(event) {
    input.mousePos.x = event.clientX - input.xOffset;
    input.mousePos.y = event.clientY - input.yOffset;
    return $("#mousePos").text("X: " + input.mousePos.x + ", Y: " + input.mousePos.y);
  });
  $("html").mousedown(function(event) {
    event.preventDefault();
    event.stopPropagation();
    $("#debug").text("Mouse button " + event.button + " down at: " + event.clientX + " left " + event.clientY + " down");
    return input.mouseHeld[event.button] = {
      x: event.clientX - input.xOffset,
      y: event.clientY - input.yOffset
    };
  });
  $("html").mouseup(function(event) {
    var startPos, upX, upY;
    event.preventDefault();
    event.stopPropagation();
    startPos = input.mouseHeld[event.button];
    upX = event.pageX - input.xOffset;
    upY = event.pageY - input.yOffset;
    if (startPos && event.button === mouseButtons.LEFT && (startPos.x !== upX || startPos.y !== upY)) {
      input.selectBox = {
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
    input.mouseHeld[event.button] = false;
    if (startPos) {
      input.mouseClicked[event.button] = {
        coord: {
          x: event.clientX - input.xOffset,
          y: event.clientY - input.yOffset
        },
        handled: false
      };
    }
    return $("#debug").text("Mouse button " + event.button + " up at: " + event.clientX + " left " + event.clientY + " down");
  });
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
      var bullet, leftClick, mapDrag, measure, realCoord, rightClick, ship, toBeSelected, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
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
      leftClick = input.mouseClicked[mouseButtons.LEFT];
      if ((leftClick != null) && !leftClick.handled) {
        realCoord = this.gameCoord(leftClick.coord);
        toBeSelected = null;
        _ref2 = this.model.ships;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          ship = _ref2[_j];
          if (ship.owner === players.HUMAN) {
            measure = ship.length > ship.width ? ship.length : ship.width;
            if (utils.abs(realCoord.x - ship.coord.x) < measure / 2 && utils.abs(realCoord.y - ship.coord.y) < measure / 2) {
              toBeSelected = ship;
            }
          }
        }
        if (toBeSelected != null) {
          _ref3 = this.model.ships;
          for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
            ship = _ref3[_k];
            ship.selected = false;
          }
          toBeSelected.selected = true;
        }
        leftClick.handled = true;
      }
      if (!input.selectBox.handled) {
        toBeSelected = [];
        _ref4 = this.model.ships;
        for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
          ship = _ref4[_l];
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
          _ref5 = this.model.ships;
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            ship = _ref5[_m];
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
      _ref6 = this.model.ships;
      for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
        ship = _ref6[_n];
        ship.update(dt);
      }
      _ref7 = this.model.bullets;
      for (_o = 0, _len7 = _ref7.length; _o < _len7; _o++) {
        bullet = _ref7[_o];
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
      this.frames = 0;
      this.startTime = utils.currentTimeMillis();
      this.fpsIndicator = $("#fps");
    }
    Controller.prototype.tick = function() {
      var d, dt, time;
      d = new Date();
      time = d.getTime();
      dt = time - this.lastTime;
      this.lastTime = time;
      this.gameModel.update(dt);
      this.renderer.render(this.gameModel.model, this.gameModel.viewport);
      this.fpsIndicator.text(Math.round(1000 * this.frames / (utils.currentTimeMillis() - this.startTime)) + " fps");
      if ((utils.currentTimeMillis() - this.startTime) > 5000) {
        this.startTime = utils.currentTimeMillis();
        this.frames = 0;
      }
      return this.frames++;
    };
    return Controller;
  })();
  controller = new Controller;
  $(setInterval((function() {
    return controller.tick();
  }), constants.MILLIS_PER_TICK));
  Renderer = (function() {
    function Renderer() {
      this.ctx = document.getElementById("canvas").getContext("2d");
      this.minimap = document.getElementById("minimap").getContext("2d");
    }
    Renderer.prototype.drawRect = function(x, y, width, height, color) {
      this.ctx.fillStyle = color;
      return this.ctx.fillRect(x, y, width, height);
    };
    Renderer.prototype.drawCircle = function(x, y, radius, color) {
      this.ctx.strokeStyle = color;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      this.ctx.closePath();
      this.ctx.stroke();
      return this.ctx.fill();
    };
    Renderer.prototype.clear = function() {
      return this.drawRect(0, 0, constants.CANVAS_WIDTH, constants.CANVAS_HEIGHT, colors.BACKGROUND);
    };
    Renderer.prototype.renderShip = function(ship, viewport) {
      this.ctx.save();
      this.ctx.translate(ship.coord.x - viewport.x, ship.coord.y - viewport.y);
      this.ctx.rotate(utils.degToRad(ship.heading) - Math.PI / 2);
      this.drawRect(-ship.width / 2, -ship.length / 2, ship.width, ship.length, ship.color);
      if (ship.selected) {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = colors.GREEN;
        this.ctx.strokeRect(-ship.width / 2, -ship.length / 2, ship.width, ship.length);
      }
      return this.ctx.restore();
    };
    Renderer.prototype.renderPlanet = function(planet, viewport) {
      this.ctx.save();
      this.ctx.translate(planet.coord.x - viewport.x, planet.coord.y - viewport.y);
      this.ctx.rotate(utils.degToRad(planet.heading) - Math.PI / 2);
      this.drawCircle(0, 0, planet.radius, planet.color);
      return this.ctx.restore();
    };
    Renderer.prototype.nearViewport = function(coord, viewport) {
      return coord.x > (viewport.x - constants.VIEWPORT_MARGIN) && coord.x < (viewport.x + constants.CANVAS_WIDTH + constants.VIEWPORT_MARGIN) && coord.y > (viewport.y - constants.VIEWPORT_MARGIN) && coord.y < (viewport.y + constants.CANVAS_HEIGHT + constants.VIEWPORT_MARGIN);
    };
    Renderer.prototype.renderMinimap = function(model, viewport) {
      var boxHeight, boxWidth, boxX, boxY, fractionHeight, fractionWidth, leftDrag, planet, ship, _i, _j, _len, _len2, _ref, _ref2;
      this.minimap.fillStyle = colors.BACKGROUND;
      this.minimap.fillRect(0, 0, constants.MINIMAP_WIDTH, constants.MINIMAP_HEIGHT);
      _ref = model.planets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        planet = _ref[_i];
        this.minimap.fillStyle = colors.WHITE;
        this.minimap.fillRect(planet.coord.x * (constants.MINIMAP_WIDTH / constants.GAME_WIDTH), planet.coord.y * (constants.MINIMAP_HEIGHT / constants.GAME_HEIGHT), 3, 3);
      }
      _ref2 = model.ships;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        ship = _ref2[_j];
        this.minimap.fillStyle = ship.color;
        this.minimap.fillRect(ship.coord.x * (constants.MINIMAP_WIDTH / constants.GAME_WIDTH), ship.coord.y * (constants.MINIMAP_HEIGHT / constants.GAME_HEIGHT), 2, 2);
      }
      fractionWidth = constants.CANVAS_WIDTH / constants.GAME_WIDTH;
      fractionHeight = constants.CANVAS_HEIGHT / constants.GAME_HEIGHT;
      boxWidth = fractionWidth * constants.MINIMAP_WIDTH;
      boxHeight = fractionHeight * constants.MINIMAP_HEIGHT;
      boxX = viewport.x * constants.MINIMAP_WIDTH / constants.GAME_WIDTH;
      boxY = viewport.y * constants.MINIMAP_HEIGHT / constants.GAME_HEIGHT;
      leftDrag = minimapInput.mouseHeld[mouseButtons.LEFT];
      if (leftDrag) {
        boxX = leftDrag.x - (constants.CANVAS_WIDTH / constants.GAME_WIDTH * constants.MINIMAP_WIDTH) / 2;
        boxY = leftDrag.y - (constants.CANVAS_HEIGHT / constants.GAME_HEIGHT * constants.MINIMAP_WIDTH) / 2 + 7;
      }
      this.minimap.lineWidth = 1;
      this.minimap.strokeStyle = colors.GREEN;
      return this.minimap.strokeRect(boxX, boxY, boxWidth, boxHeight);
    };
    Renderer.prototype.render = function(model, viewport) {
      var bullet, leftPress, planet, ship, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      $("#screenCoord").text("Screen X: " + viewport.x + " Screen Y: " + viewport.y);
      this.clear();
      _ref = model.planets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        planet = _ref[_i];
        if (this.nearViewport(planet.coord, viewport)) {
          this.renderPlanet(planet, viewport);
        }
      }
      _ref2 = model.ships;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        ship = _ref2[_j];
        if (this.nearViewport(ship.coord, viewport)) {
          this.renderShip(ship, viewport);
        }
      }
      _ref3 = model.bullets;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        bullet = _ref3[_k];
        if (this.nearViewport(ship.coord, viewport)) {
          this.renderShip(bullet, viewport);
        }
      }
      leftPress = input.mouseHeld[mouseButtons.LEFT];
      if (leftPress) {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = colors.GREEN;
        this.ctx.strokeRect(leftPress.x, leftPress.y, input.mousePos.x - leftPress.x, input.mousePos.y - leftPress.y);
      }
      return this.renderMinimap(model, viewport);
    };
    return Renderer;
  })();
}).call(this);
