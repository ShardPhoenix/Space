var Renderer;
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
    if (ship.selected || ship.targeted) {
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = ship.selected ? colors.GREEN : colors.RED;
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
  Renderer.prototype.renderStar = function(star, viewport) {
    this.ctx.save();
    this.ctx.translate(star.coord.x - viewport.x, star.coord.y - viewport.y);
    this.drawRect(0, 0, 1, 1, star.color);
    return this.ctx.restore();
  };
  Renderer.prototype.renderExplosion = function(explosion, viewport) {
    this.ctx.save();
    this.ctx.translate(explosion.coord.x - viewport.x, explosion.coord.y - viewport.y);
    if (explosion.radius > 0) {
      this.drawCircle(0, 0, explosion.radius, explosion.color);
    }
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
    var bullet, explosion, leftPress, planet, ship, star, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _ref5;
    $("#screenCoord").text("Screen X: " + viewport.x + " Screen Y: " + viewport.y);
    this.clear();
    _ref = model.stars;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      star = _ref[_i];
      if (this.nearViewport(star.coord, viewport)) {
        this.renderStar(star, viewport);
      }
    }
    _ref2 = model.planets;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      planet = _ref2[_j];
      if (this.nearViewport(planet.coord, viewport)) {
        this.renderPlanet(planet, viewport);
      }
    }
    _ref3 = model.ships;
    for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
      ship = _ref3[_k];
      if (this.nearViewport(ship.coord, viewport)) {
        this.renderShip(ship, viewport);
      }
    }
    _ref4 = model.bullets;
    for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
      bullet = _ref4[_l];
      if (this.nearViewport(bullet.coord, viewport)) {
        this.renderShip(bullet, viewport);
      }
    }
    _ref5 = model.explosions;
    for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
      explosion = _ref5[_m];
      if (this.nearViewport(explosion.coord, viewport)) {
        this.renderExplosion(explosion, viewport);
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