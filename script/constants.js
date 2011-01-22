var colors, constants, keys, mouseButtons, orders, players, state;
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
  CTRL: 17,
  SHIFT: 16,
  S: 83,
  A: 65
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