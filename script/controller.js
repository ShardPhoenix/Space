var Controller, controller, input, minimapInput, utils;
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
$("#minimap").mousedown(function(event) {
  event.preventDefault();
  event.stopPropagation();
  minimapInput.xOffset = this.offsetLeft;
  minimapInput.yOffset = this.offsetTop;
  return minimapInput.mouseHeld[event.button] = {
    x: event.clientX - minimapInput.xOffset,
    y: event.clientY - minimapInput.yOffset
  };
});
$("#minimap").mousemove(function(event) {
  if (minimapInput.mouseHeld[event.button]) {
    minimapInput.mouseHeld[event.button].x = event.clientX - minimapInput.xOffset;
    return minimapInput.mouseHeld[event.button].y = event.clientY - minimapInput.yOffset;
  }
});
$("#minimap").mouseup(function(event) {
  return minimapInput.mouseHeld[event.button] = false;
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
$("#canvas").mousedown(function(event) {
  input.xOffset = this.offsetLeft;
  return input.yOffset = this.offsetTop;
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
        x: upX,
        y: upY
      },
      handled: false
    };
  }
  return $("#debug").text("Mouse button " + event.button + " up at: " + event.clientX + " left " + event.clientY + " down");
});
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
    var dt, time;
    time = (new Date()).getTime();
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